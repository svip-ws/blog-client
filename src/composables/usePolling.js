import { onMounted, onUnmounted } from "vue";

/**
 * 通用轻量轮询组合式：组件挂载期间按固定间隔调用 fetchFn；
 * 默认开启「标签页可见性感知」—— 标签页隐藏时跳过本轮调用，
 * 切回前台立即补一次，确保不浪费带宽也不影响系统性能。
 *
 * @param {Function} fetchFn - 异步拉取函数，可返回 Promise；内部已捕获异常
 * @param {number} interval - 轮询间隔毫秒数，默认 30s
 * @param {Object} options
 * @param {boolean} options.immediate - 挂载后立即拉一次，默认 true
 * @param {boolean} options.visibilityAware - 标签页隐藏时跳过调用 + 切回前台补一次，默认 true
 */
export function usePolling(fetchFn, interval = 30000, options = {}) {
    const { immediate = true, visibilityAware = true } = options;
    let timer = null;
    let visibilityHandler = null;

    const tick = async () => {
        if (visibilityAware && typeof document !== "undefined" && document.hidden) return;
        try {
            await fetchFn();
        } catch (error) {
            // 调用方 / 请求拦截器处理错误提示，轮询自身静默吞掉避免日志刷屏
        }
    };

    const start = () => {
        stop();
        if (immediate) tick();
        timer = setInterval(tick, interval);
    };

    const stop = () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    };

    onMounted(() => {
        start();
        if (visibilityAware && typeof document !== "undefined") {
            visibilityHandler = () => {
                if (!document.hidden) tick();
            };
            document.addEventListener("visibilitychange", visibilityHandler);
        }
    });

    onUnmounted(() => {
        stop();
        if (visibilityHandler && typeof document !== "undefined") {
            document.removeEventListener("visibilitychange", visibilityHandler);
            visibilityHandler = null;
        }
    });

    return { start, stop };
}