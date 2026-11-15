/**
 * 全局动效降级：把「减弱动效」偏好落到 <html>.reduce-motion
 *
 * 为什么要有这个类，而不是只用 CSS 媒体查询：
 *   - 每个组件的动效停用规则都是**双写**的（`html.reduce-motion .foo` + `@media (prefers-reduced-motion) .foo`）。
 *   - 其中 JS 侧也需要知道该偏好：HomeBanner 要据此**停掉自动轮播**，这是 CSS 做不到的。
 *   所以用一个 <html> 上的类作为跨组件信号，比每个组件各自调 matchMedia 更集中。
 *
 * 偏好来源 = 操作系统 / 浏览器的「减弱动效」设置（`prefers-reduced-motion`）。
 * 入口（App.vue 的 setup）调用一次即可：落类后任意组件都能读到；
 * 系统设置变化时同步落类并派发 `motion-mode-change`，供需要 JS 联动处订阅。
 */

const QUERY = '(prefers-reduced-motion: reduce)';

let initialized = false;
let mediaQuery = null;

const applyReduceMotion = (reduced) => {
    document.documentElement.classList.toggle('reduce-motion', reduced);
    window.dispatchEvent(
        new CustomEvent('motion-mode-change', { detail: { reduced } })
    );
};

/**
 * 初始化并落类。幂等，重复调用只返回当前状态。
 * @returns {boolean} 当前是否处于「减弱动效」状态
 */
export const initReducedMotion = () => {
    if (initialized) return mediaQuery ? mediaQuery.matches : false;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
    }
    initialized = true;
    mediaQuery = window.matchMedia(QUERY);

    const sync = () => applyReduceMotion(mediaQuery.matches);
    sync();

    // 现代浏览器用 addEventListener；Safari < 14 只有已废弃的 addListener
    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', sync);
    } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(sync);
    }

    return mediaQuery.matches;
};
