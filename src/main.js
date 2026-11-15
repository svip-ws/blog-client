import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router, { startIdlePrefetch } from "./router";

// 按需注册实际使用的 Element Plus 组件、样式与图标（置于全局样式之前，使自定义主题自然生效）
import { setupElementPlus } from "./plugins/elementPlus";
import { prefetchHomeBootstrap } from "./api/request";

import "./style.css";

// 引入图片懒加载指令 & 全息交互微倾指令
import { lazy as lazyDirective } from "./directives/lazy";
import "./directives/lazy.css";
import { holoTilt } from "./directives/holoTilt";

const app = createApp(App);

if (typeof window !== "undefined" && window.location.pathname === "/") {
  prefetchHomeBootstrap();
}

// 注册全局指令
app.directive("lazy", lazyDirective);
app.directive("holo", holoTilt);

app.use(createPinia());
app.use(router);
setupElementPlus(app);

app.mount("#app");

// 首屏挂载完成后在浏览器空闲时段预热高频路由 chunk
startIdlePrefetch();
