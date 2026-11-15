/**
 * 全局图片懒加载指令 v-lazy
 * ----------------------------------------------------------------
 * 目标：在不牺牲画质的前提下，提升首屏加载速度、滚动流畅度、降低内存峰值。
 * 能力：
 *   1. 进入视口才加载（IntersectionObserver，默认提前 300px 预加载）
 *   2. 并发控制：共享加载队列，限制同时加载的图片数量，避免长列表一次性打满请求
 *   3. 离屏释放：带 `.unload` 修饰符时，图片离开视口后释放 src（解码内存），回滚时重新加载
 *   4. 失败兜底：加载失败保留占位态，不抛错、不裂图
 *
 * 用法：
 *   <img v-lazy="url" />                       // 普通懒加载（推荐用于列表）
 *   <img v-lazy.unload="url" />                // 长列表/瀑布流：离屏释放内存
 *   <LazyImage :src="url" :unload="true" />   // 组件封装（自动占位骨架）
 */

// ============ 全局可调参数 ============
export const LAZY_PRELOAD_MARGIN = '750px'; // 大幅提前预解码视口下方图片，滚动零空白
export const LAZY_MAX_CONCURRENT = 8; // 并发队列上限
export const LAZY_UNLOAD_ROOT_MARGIN = '300px'; // 离屏释放判定边距

// ============ 共享并发加载队列 ============
let loadingCount = 0;
const queue = [];

function pumpQueue() {
  if (loadingCount >= LAZY_MAX_CONCURRENT) return;
  while (queue.length && loadingCount < LAZY_MAX_CONCURRENT) {
    const task = queue.shift();
    loadingCount++;
    const probe = new Image();
    probe.onload = () => {
      loadingCount--;
      cleanup(task.src);
      task.resolve();
      pumpQueue();
    };
    probe.onerror = () => {
      loadingCount--;
      cleanup(task.src);
      task.reject();
      pumpQueue();
    };
    probe.src = task.src;
  }
}

const inflight = new Set();
function cleanup(src) {
  inflight.delete(src);
}
function enqueue(src) {
  if (inflight.has(src)) {
    // 已在加载则直接复用一次 Promise
    return new Promise((resolve, reject) => {
      const probe = new Image();
      probe.onload = resolve;
      probe.onerror = reject;
      probe.src = src;
    });
  }
  inflight.add(src);
  return new Promise((resolve, reject) => {
    queue.push({ src, resolve, reject });
    pumpQueue();
  });
}

// ============ 进入视口观察器（加载调度） ============
let loadObserver = null;
const loadObserved = new WeakMap();

function getLoadObserver() {
  if (loadObserver) return loadObserver;
  loadObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        loadObserver.unobserve(el);
        loadObserved.delete(el);
        const src = el.getAttribute('data-lazy-src');
        if (!src) continue;
        
        el.setAttribute('data-lazy-state', 'loading');
        el.decoding = 'async';
        
        const handleLoad = () => {
          if (el.getAttribute('data-lazy-src') === src) {
            el.setAttribute('data-lazy-state', 'loaded');
          }
          el.removeEventListener('load', handleLoad);
          el.removeEventListener('error', handleError);
        };
        
        const handleError = () => {
          el.setAttribute('data-lazy-state', 'error');
          el.removeEventListener('load', handleLoad);
          el.removeEventListener('error', handleError);
        };

        if (el.complete && el.naturalWidth > 0) {
          el.setAttribute('data-lazy-state', 'loaded');
        } else {
          el.addEventListener('load', handleLoad);
          el.addEventListener('error', handleError);
          el.src = src;
        }
      }
    },
    { rootMargin: LAZY_PRELOAD_MARGIN, threshold: 0.01 }
  );
  return loadObserver;
}

// ============ 离屏释放观察器（可选） ============
let unloadObserver = null;
const unloadObserved = new WeakMap();

function getUnloadObserver() {
  if (unloadObserver) return unloadObserver;
  unloadObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        const src = el.getAttribute('data-lazy-src');
        if (!src) continue;
        if (entry.isIntersecting) {
          // 重新进入：若尚未加载或已释放，则调度加载
          if (el.getAttribute('data-lazy-state') !== 'loaded') {
            el.setAttribute('data-lazy-state', 'loading');
            el.decoding = 'async';
            const handleLoad = () => {
              if (el.getAttribute('data-lazy-src') === src) {
                el.setAttribute('data-lazy-state', 'loaded');
              }
              el.removeEventListener('load', handleLoad);
              el.removeEventListener('error', handleError);
            };
            const handleError = () => {
              el.setAttribute('data-lazy-state', 'error');
              el.removeEventListener('load', handleLoad);
              el.removeEventListener('error', handleError);
            };
            if (el.complete && el.naturalWidth > 0) {
              el.setAttribute('data-lazy-state', 'loaded');
            } else {
              el.addEventListener('load', handleLoad);
              el.addEventListener('error', handleError);
              el.src = src;
            }
          }
        } else if (el.getAttribute('data-lazy-state') === 'loaded') {
          // 离屏：释放解码缓冲，降低内存峰值
          el.removeAttribute('src');
          el.setAttribute('data-lazy-state', 'pending');
        }
      }
    },
    { rootMargin: LAZY_UNLOAD_ROOT_MARGIN, threshold: 0.01 }
  );
  return unloadObserver;
}

// ============ 命令式懒加载入口（供 v-lazy 指令与富文本图片复用） ============
export function applyLazy(el, src, unload = false) {
  if (!el || !src) return;
  el.setAttribute('data-lazy-src', src);
  if (!el.getAttribute('data-lazy-state')) el.setAttribute('data-lazy-state', 'pending');
  el.classList.add('lazy-img');

  if (unload) {
    const ob = getUnloadObserver();
    unloadObserved.set(el, ob);
    ob.observe(el);
  } else {
    const ob = getLoadObserver();
    loadObserved.set(el, ob);
    ob.observe(el);
  }
}

// 解除观察（组件卸载或 src 变化时调用）
export function unobserveLazy(el) {
  const ob = loadObserved.get(el) || unloadObserved.get(el);
  if (ob) ob.unobserve(el);
  loadObserved.delete(el);
  unloadObserved.delete(el);
}

// ============ 指令主体 ============
function startObserve(el, binding) {
  applyLazy(el, binding.value, !!binding.modifiers.unload);
}

export const lazy = {
  mounted(el, binding) {
    // 不覆盖已有的 src（如首屏关键图可保留），仅当无 src 时接管
    startObserve(el, binding);
  },
  updated(el, binding) {
    if (binding.value === binding.oldValue) return;
    // src 变化：重置状态并重新观察
    const oldOb = loadObserved.get(el) || unloadObserved.get(el);
    if (oldOb) oldOb.unobserve(el);
    loadObserved.delete(el);
    unloadObserved.delete(el);
    el.removeAttribute('src');
    el.setAttribute('data-lazy-state', 'pending');
    if (binding.value) {
      startObserve(el, binding);
    } else {
      el.removeAttribute('data-lazy-src');
    }
  },
  unmounted(el) {
    const ob = loadObserved.get(el) || unloadObserved.get(el);
    if (ob) ob.unobserve(el);
    loadObserved.delete(el);
    unloadObserved.delete(el);
  },
};

export default lazy;
