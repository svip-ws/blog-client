import axios from "axios";
import { ElMessage } from "element-plus";
import { useUserStore } from "../stores/user";

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
});

// 从本地存储取 token 并生成标准 Authorization 头
export function authHeader(key = "client_token") {
  const raw = localStorage.getItem(key) || "";
  const clean = raw.replace(/^(?:Bearer\s+)+/i, "");
  return clean ? `Bearer ${clean}` : "";
}

// 2-Tier 高速缓存：L1 内存 (45s) + L2 sessionStorage SWR 暖缓存 (90s) + 同键并发合并
const clientCache = new Map();
const inflightGets = new Map();
const L1_TTL_MS = 45 * 1000;
const L2_STALE_MS = 25 * 1000;
const L2_EXPIRE_MS = 90 * 1000;
const L2_PREFIX = "miku_api_v1:";

const NO_CACHE_PREFIXES = ["/user/info", "/user/profile", "/ai/conversations", "/comment/"];
const L2_WARM_PREFIXES = ["/category", "/tag", "/banner", "/article/recommend", "/article/hot", "/stats/summary", "/comment/latest", "/music/playlist"];

function shouldCacheGet(config) {
  if (config?._skipCache) return false;
  if (config.method?.toLowerCase() !== "get") return false;
  const url = String(config.url || "");
  if (url.startsWith("/comment/latest")) return true;
  if (NO_CACHE_PREFIXES.some((p) => url.startsWith(p))) return false;
  if (/^\/article\/\d+\/stats$/.test(url)) return false;
  return true;
}

function shouldUseL2WarmCache(config) {
  const url = String(config.url || "");
  if (L2_WARM_PREFIXES.some((p) => url.startsWith(p))) return true;
  // 首页首屏文章列表也纳入短效 L2 暖缓存，实现秒开 + 后台静默更新
  if (url === "/article" && (!config.params?.page || Number(config.params.page) === 1)) {
    return true;
  }
  return false;
}

function generateReqKey(config) {
  const { method, url, params } = config;
  const authScope = authHeader() ? "auth" : "anon";
  const serializedData =
    typeof config.data === "string" ? config.data : JSON.stringify(config.data);
  return [authScope, method, url, JSON.stringify(params), serializedData].join("&");
}

function readL2Cache(cacheKey) {
  try {
    const raw = sessionStorage.getItem(L2_PREFIX + cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== "number") return null;
    const age = Date.now() - parsed.ts;
    if (age > L2_EXPIRE_MS) {
      sessionStorage.removeItem(L2_PREFIX + cacheKey);
      return null;
    }
    return { data: parsed.data, stale: age > L2_STALE_MS };
  } catch {
    return null;
  }
}

function writeL2Cache(cacheKey, data) {
  try {
    sessionStorage.setItem(
      L2_PREFIX + cacheKey,
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    // 隐私模式或存储配额满时静默忽略
  }
}

function clearAllCaches() {
  clientCache.clear();
  try {
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(L2_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

function resolveFromAdapter(config, data) {
  config._fromCache = true;
  config.adapter = () =>
    Promise.resolve({
      data,
      status: 200,
      statusText: "OK",
      headers: config.headers,
      config,
    });
  return config;
}

function triggerBackgroundRevalidate(config, cacheKey) {
  if (inflightGets.has(cacheKey)) return;
  service
    .request({
      ...config,
      _skipCache: true,
      _silentRevalidate: true,
      _revalidateKey: cacheKey,
      adapter: undefined,
    })
    .catch(() => {});
}

// 请求拦截器：Token 注入 + L1/L2 SWR 秒级命中 + 同键并发合并
service.interceptors.request.use(
  (config) => {
    const method = config.method?.toLowerCase();
    const header = authHeader();
    if (header) {
      config.headers["Authorization"] = header;
    }

    if (method && method !== "get") {
      clearAllCaches();
      return config;
    }

    if (shouldCacheGet(config)) {
      const cacheKey = generateReqKey(config);

      // 1. L1 内存直出
      const cachedL1 = clientCache.get(cacheKey);
      if (cachedL1 && Date.now() < cachedL1.expireAt) {
        return resolveFromAdapter(config, cachedL1.data);
      }

      // 2. L2 sessionStorage 秒开 + Stale-While-Revalidate 后台无感刷新
      if (shouldUseL2WarmCache(config)) {
        const cachedL2 = readL2Cache(cacheKey);
        if (cachedL2) {
          clientCache.set(cacheKey, {
            data: cachedL2.data,
            expireAt: Date.now() + (cachedL2.stale ? 10000 : L1_TTL_MS),
          });
          if (cachedL2.stale) {
            setTimeout(() => triggerBackgroundRevalidate(config, cacheKey), 0);
          }
          return resolveFromAdapter(config, cachedL2.data);
        }
      }

      // 3. 合并同键并发 GET 请求，避免重复打后端或误取消兄弟组件请求
      const shared = inflightGets.get(cacheKey);
      if (shared) {
        config._fromCache = true;
        config.adapter = () =>
          shared.promise.then((data) => ({
            data,
            status: 200,
            statusText: "OK",
            headers: config.headers,
            config,
          }));
        return config;
      }

      let resolveFn;
      let rejectFn;
      const promise = new Promise((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      });
      // 防止没有第二监听者时产生未捕获 rejection 告警
      promise.catch(() => {});
      inflightGets.set(cacheKey, { promise, resolve: resolveFn, reject: rejectFn });
      config._inflightKey = cacheKey;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const cfg = response.config || {};
    const inflightKey = cfg._inflightKey;
    const revalidateKey = cfg._revalidateKey;
    const cacheTargetKey = inflightKey || revalidateKey;

    if (cacheTargetKey && response.data) {
      clientCache.set(cacheTargetKey, {
        data: response.data,
        expireAt: Date.now() + L1_TTL_MS,
      });
      if (shouldUseL2WarmCache(cfg)) {
        writeL2Cache(cacheTargetKey, response.data);
      }
    }

    if (inflightKey && inflightGets.has(inflightKey)) {
      const entry = inflightGets.get(inflightKey);
      inflightGets.delete(inflightKey);
      entry.resolve(response.data);
    }

    const res = response.data;
    if (res && typeof res.code === "number" && res.code !== 200 && res.code !== 201) {
      if (!cfg._silentRevalidate) {
        ElMessage.error(res.message || "系统异常");
      }
      return Promise.reject(new Error(res.message || "Error"));
    }
    return res;
  },
  (error) => {
    const cfg = error.config || {};
    if (cfg._inflightKey && inflightGets.has(cfg._inflightKey)) {
      const entry = inflightGets.get(cfg._inflightKey);
      inflightGets.delete(cfg._inflightKey);
      entry.reject(error);
    }

    if (cfg._silentRevalidate) {
      return Promise.reject(error);
    }

    if (axios.isCancel(error)) {
      return Promise.reject(Object.assign(error, { isCanceled: true, silent: true }));
    }

    const status = error.response?.status;
    const msg = error.response?.data?.message || "网络或服务器异常";
    const reqUrl = String(cfg.url || "");

    if (status === 401 || status === 403 || status === 429) {
      if (status === 401) {
        try {
          useUserStore().logout();
        } catch {
          localStorage.removeItem("client_token");
          localStorage.removeItem("client_user");
        }
        clearAllCaches();
        if (!reqUrl.includes("/user/info")) {
          ElMessage.error(msg);
        }
      } else {
        ElMessage.error(msg);
      }
    } else {
      ElMessage.error(msg);
    }
    return Promise.reject(error);
  },
);

const HOME_BOOTSTRAP_ENDPOINTS = [
  { url: "/banner/active", dataKey: "banners" },
  { url: "/stats/summary", dataKey: "stats" },
  { url: "/category", dataKey: "categories" },
  { url: "/tag", dataKey: "tags" },
  { url: "/article/recommend", params: { limit: 5 }, dataKey: "recommend" },
  { url: "/article/hot", params: { limit: 8 }, dataKey: "hot" },
  { url: "/article", params: { page: 1, pageSize: 6, sort: "latest" }, dataKey: "latest" },
  { url: "/comment/latest", params: { limit: 5 }, dataKey: "comments" },
  { url: "/music/playlist", dataKey: "playlist" },
];

let homeBootstrapPromise = null;

/**
 * 首页单次往返聚合预取：用 1 次 /stats/bootstrap 填充所有 9 个首屏接口的 L1/L2 与 inflight 占位，
 * 消除浏览器的 6 连接并发排队瀑布流。
 */
export function prefetchHomeBootstrap() {
  if (homeBootstrapPromise) return homeBootstrapPromise;

  const sampleCfg = { method: "get", url: "/article", params: { page: 1, pageSize: 6, sort: "latest" } };
  const sampleKey = generateReqKey(sampleCfg);
  const sampleL1 = clientCache.get(sampleKey);
  if ((sampleL1 && Date.now() < sampleL1.expireAt) || readL2Cache(sampleKey)) {
    return Promise.resolve(null);
  }

  const resolvers = [];
  for (const ep of HOME_BOOTSTRAP_ENDPOINTS) {
    const cfg = { method: "get", url: ep.url, params: ep.params };
    const cacheKey = generateReqKey(cfg);
    if (!inflightGets.has(cacheKey)) {
      let resolveFn;
      let rejectFn;
      const promise = new Promise((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      });
      promise.catch(() => {});
      inflightGets.set(cacheKey, { promise, resolve: resolveFn, reject: rejectFn });
      resolvers.push({ ep, cfg, cacheKey, resolveFn, rejectFn });
    }
  }

  homeBootstrapPromise = service
    .get("/stats/bootstrap", { _skipCache: true })
    .then((res) => {
      const payload = res?.data;
      if (!payload) throw new Error("Empty bootstrap payload");
      const now = Date.now();
      for (const item of resolvers) {
        const sliceData = payload[item.ep.dataKey];
        const wrapped = { code: 200, message: "获取成功", data: sliceData };
        clientCache.set(item.cacheKey, { data: wrapped, expireAt: now + L1_TTL_MS });
        writeL2Cache(item.cacheKey, wrapped);
        inflightGets.delete(item.cacheKey);
        item.resolveFn(wrapped);
      }
      return payload;
    })
    .catch((err) => {
      for (const item of resolvers) {
        if (inflightGets.has(item.cacheKey)) {
          inflightGets.delete(item.cacheKey);
          item.rejectFn(err);
        }
      }
      return null;
    })
    .finally(() => {
      homeBootstrapPromise = null;
    });

  return homeBootstrapPromise;
}

export default service;
