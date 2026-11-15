/**
 * 滚动活动信号：滚动进行中给 <html> 挂 `is-scrolling`，停滚后自动摘除。
 *
 * 用途：让「主题滚动条」的滑块在滚动时点亮光效（见 style.css 的
 * `html.is-scrolling::-webkit-scrollbar-thumb`），同时驱动全局动画暂停
 * 以提升滚动流畅度（见 style.css 的 `html.is-scrolling *` 规则）。
 *
 * 入口（App.vue 的 setup）调用一次即可，幂等；
 * 监听为 passive，不阻塞滚动；停滚 IDLE_DELAY 后摘类，避免状态常驻。
 * 使用 RAF 节流，确保每帧最多操作一次 DOM。
 */

const IDLE_DELAY = 400;

let initialized = false;
let idleTimer = null;
let rafPending = false;
let isScrolling = false;

const markScrolling = () => {
    if (!isScrolling) {
        isScrolling = true;
        document.documentElement.classList.add('is-scrolling');
    }
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        isScrolling = false;
        document.documentElement.classList.remove('is-scrolling');
        idleTimer = null;
    }, IDLE_DELAY);
};

const onScroll = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
        rafPending = false;
        markScrolling();
    });
};

/**
 * 初始化滚动活动监听。幂等，重复调用不会重复绑定。
 */
export const initScrollActivity = () => {
    if (initialized) return;
    if (typeof window === 'undefined') return;
    initialized = true;
    window.addEventListener('scroll', onScroll, { passive: true });
};
