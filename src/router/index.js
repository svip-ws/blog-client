import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Index",
    component: () => import("../views/index/index.vue"), // 路由懒加载首页
  },
  {
    path: "/article/:id", // 动态路由传参：精准捕获文章 ID
    name: "ArticleDetail",
    component: () => import("../views/article/index.vue"),
  },
  {
    path: "/login",
    name: "UserLogin",
    component: () => import("../views/login/index.vue"),
  },
  // ====== 下面是刚刚追加的 5 大极简高奢页面路由 ======
  {
    path: "/articles",
    name: "Articles",
    component: () => import("../views/articles/index.vue"),
  },
  {
    path: "/categories",
    name: "Categories",
    component: () => import("../views/categories/index.vue"),
  },
  {
    path: "/tags",
    name: "Tags",
    component: () => import("../views/tags/index.vue"),
  },
  {
    path: "/archives",
    name: "Archives",
    component: () => import("../views/archives/index.vue"),
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../views/about/index.vue"),
  },
  {
    path: "/tag/:id",
    name: "TagArticles",
    component: () => import("../views/tag-articles/index.vue"),
  },
  {
    path: "/register",
    name: "ClientRegister",
    component: () => import("../views/register/index.vue"),
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("../views/profile/index.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/search",
    name: "Search",
    component: () => import("../views/search/index.vue"),
  },
  {
    path: "/publish",
    name: "Publish",
    component: () => import("../views/publish/index.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/article/edit/:id",
    name: "EditArticle",
    component: () => import("../views/publish/index.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/messages",
    name: "Messages",
    component: () => import("../views/messages/index.vue"),
  },
  {
    path: "/snapshots",
    name: "Snapshots",
    component: () => import("../views/snapshots/index.vue"),
  },
  {
    path: "/ai",
    name: "AiWorkshop",
    component: () => import("../views/ai/index.vue"),
  },
  // 这个必须放在所有路由的最后面
  {
    path: "/404",
    name: "NotFound",
    component: () => import("../views/404.vue"),
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: "/404",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 路由切换的滚动策略：
  // - 浏览器后退/前进：恢复原滚动位置
  // - 仅 query 变化（筛选、搜索词）：不动滚动
  // - 进入新页面：回到顶部（回到顶部会触发 scroll 事件，NavBar 的胶囊/吸顶形态随之复位）
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.path === from.path) return {};
    return { top: 0 };
  },
});

// 客户端鉴权守卫：路由表里标注了 meta.requiresAuth 的页面，未登录一律回登录页，
// 并带上 redirect；登录成功后回跳原目标（views/login/index.vue 已读取该参数）。
router.beforeEach((to) => {
  if (to.meta?.requiresAuth && !localStorage.getItem("client_token")) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  return true;
});

// 路由 chunk 智能预加载（悬停/空闲时提前拉取 JS/CSS，切换零等待）
const prefetchedPaths = new Set();

export function prefetchRoute(path) {
  if (!path || prefetchedPaths.has(path)) return;
  try {
    const resolved = router.resolve(path);
    for (const record of resolved.matched || []) {
      const comp = record.components?.default;
      if (typeof comp === "function" && !prefetchedPaths.has(record.path)) {
        prefetchedPaths.add(record.path);
        Promise.resolve(comp()).catch(() => {});
      }
    }
    prefetchedPaths.add(path);
  } catch {
    // 忽略未匹配路由
  }
}

export function startIdlePrefetch() {
  const hotRoutes = ["/articles", "/categories", "/tags", "/archives", "/messages", "/snapshots", "/about", "/article/1"];
  const run = () => {
    let idx = 0;
    const step = () => {
      if (idx >= hotRoutes.length) return;
      prefetchRoute(hotRoutes[idx++]);
      if (idx < hotRoutes.length) {
        setTimeout(step, 180);
      }
    };
    step();
  };
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 800);
  }
}

export default router;
