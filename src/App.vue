<template>
  <div class="client-app">
    <div
      class="route-progress-bar"
      :class="{ active: routeProgressVisible, finishing: routeProgressFinishing }"
      :style="{ transform: `scaleX(${routeProgressScale})` }"
      aria-hidden="true"
    ></div>
    <GlobalBackground />
    <NavBar v-if="showLayout" />

    <main :class="isMainContent ? 'main-content' : 'main-full'">
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="currentRoute.path" />
        </transition>
      </router-view>
    </main>

    <AppFooter v-if="showLayout && route.path !== '/ai'" />
    <BottomTabBar v-if="showLayout && route.path !== '/ai'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from './stores/user';
import GlobalBackground from './components/GlobalBackground.vue';
import NavBar from './components/NavBar.vue';
import AppFooter from './components/AppFooter.vue';
import BottomTabBar from './components/BottomTabBar.vue';
import { initReducedMotion } from './composables/reducedMotion';
import { initScrollActivity } from './composables/scrollActivity';

// 动效降级偏好来自系统设置，且是整站级的：在入口就把 <html>.reduce-motion 落好，
// 这样 /login、/register 这类不套布局的页面也能继承（HomeBanner 也据此停掉自动轮播）。
initReducedMotion();

// 滚动活动信号同样是整站级的：滚动时给 <html> 挂 is-scrolling，驱动主题滚动条滑块的点亮光效。
initScrollActivity();

const route = useRoute();
const router = useRouter();
const transitionName = ref('fade');

// 顶部轻量化路由切换进度条
const routeProgressVisible = ref(false);
const routeProgressFinishing = ref(false);
const routeProgressScale = ref(0);
let progressTimer = null;
let finishTimer = null;

router.beforeEach(() => {
  clearTimeout(progressTimer);
  clearTimeout(finishTimer);
  routeProgressFinishing.value = false;
  routeProgressVisible.value = true;
  routeProgressScale.value = 0.25;
  progressTimer = setTimeout(() => {
    if (routeProgressVisible.value) routeProgressScale.value = 0.72;
  }, 60);
});

router.afterEach(() => {
  clearTimeout(progressTimer);
  routeProgressScale.value = 1;
  routeProgressFinishing.value = true;
  finishTimer = setTimeout(() => {
    routeProgressVisible.value = false;
    routeProgressFinishing.value = false;
    routeProgressScale.value = 0;
  }, 220);
});

// 已登录则静默刷新用户信息，更新 COS 预签名（2 小时过期），避免头像裂图
const userStore = useUserStore();
if (userStore.isLoggedIn) {
  userStore.refreshUserInfo();
}

// /login、/register、/404、/ai、/messages 是独立整屏页，不套导航栏 / 页脚 / 底部标签栏
const noLayoutPages = ['/login', '/register', '/404', '/ai', '/messages'];

const showLayout = computed(() => {
  return !noLayoutPages.includes(route.path);
});

const isMainContent = computed(() => {
  if (!showLayout.value) return false;
  if (route.path.startsWith('/article/')) return false;
  return true;
});

// 过渡方向在「导航确认后」再判定：beforeEach 阶段导航仍可能被守卫中止或重定向，
// 此时改写 transitionName 会残留与本次实际切换不匹配的过渡动画。
router.beforeResolve((to, from) => {
  if (noLayoutPages.includes(to.path) || noLayoutPages.includes(from.path)) {
    transitionName.value = 'fade';
    return;
  }

  const toDepth = to.path.split('/').filter(Boolean).length;
  const fromDepth = from.path.split('/').filter(Boolean).length;

  if (toDepth > fromDepth) {
    transitionName.value = 'slide-left';
  } else if (toDepth < fromDepth) {
    transitionName.value = 'slide-right';
  } else {
    transitionName.value = 'fade';
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  overflow-x: clip;
}

body {
  background: var(--bg-page);
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.main-content {
  /* 视口高度减去页脚占位（token 见 style.css :root），短页面时页脚仍贴视口底部 */
  min-height: calc(100vh - var(--footer-reserve));
  box-sizing: border-box;
}

.main-full {
  min-height: 100vh;
  box-sizing: border-box;
}

/* 顶部极速切换进度光轨 */
.route-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 2.5px;
  z-index: 9999;
  transform-origin: left center;
  background: linear-gradient(90deg, #39C5BB 0%, #00F3FF 55%, #FF7E9D 100%);
  box-shadow: 0 0 10px rgba(57, 197, 187, 0.75);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease;
}

.route-progress-bar.active {
  opacity: 1;
}

.route-progress-bar.finishing {
  opacity: 0;
  transition: transform 0.14s ease-out, opacity 0.18s ease 0.06s;
}

/* ==================== fade（极速无缝切场） ==================== */
.fade-enter-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ==================== slide-left ==================== */
.slide-left-enter-active {
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-left-leave-active {
  transition: opacity 0.11s ease, transform 0.11s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translate3d(18px, 0, 0);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translate3d(-12px, 0, 0);
}

/* ==================== slide-right ==================== */
.slide-right-enter-active {
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-right-leave-active {
  transition: opacity 0.11s ease, transform 0.11s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translate3d(-18px, 0, 0);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translate3d(12px, 0, 0);
}
</style>