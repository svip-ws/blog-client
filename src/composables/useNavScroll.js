import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";

/**
 * 导航栏滚动形态：灵动岛胶囊 / 完整吸顶栏 / 首页顶部隐藏
 * 跨页复用同一实例，路由变化时自动重算。
 */
export function useNavScroll(route) {
  const isScrolled = ref(true); // 完整吸顶栏；false = 灵动岛胶囊
  const navHidden = ref(false); // 整体上移隐藏（首页顶部）

  const SCROLL_THRESHOLD = 40;
  const HOME_REVEAL_AT = 80;
  let lastY = 0;
  const isHome = computed(() => route.path === "/");

  function handleScroll() {
    const y = window.scrollY || 0;
    const delta = y - lastY;
    lastY = y;

    if (isHome.value) {
      isScrolled.value = false;
      navHidden.value = y <= HOME_REVEAL_AT;
      return;
    }

    navHidden.value = false;
    if (y <= SCROLL_THRESHOLD) { isScrolled.value = true; return; }
    if (delta > 0) { isScrolled.value = false; return; }
    if (delta < 0) isScrolled.value = true;
  }

  // 路由变化 / 需要时复位方向基准并重算形态
  function rebase() {
    lastY = window.scrollY || 0;
    nextTick(handleScroll);
  }

  watch(() => route.fullPath, rebase);

  onMounted(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    lastY = window.scrollY || 0;
    handleScroll();
  });
  onUnmounted(() => window.removeEventListener("scroll", handleScroll));

  return { isScrolled, navHidden, rebase };
}
