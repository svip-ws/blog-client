import { useStatsStore } from "../stores/stats";
import { usePolling } from "./usePolling";

/**
 * 站点统计实时同步组合式：
 * 在页面级（index.vue / about.vue）调用一次即可，
 * 站点计数变化时同一页内的 HomeBanner / SidebarStats / QuickNav 等组件
 * 通过共享 statsStore 自动同步刷新，避免每个组件各自开轮询。
 *
 * @param {number} interval - 轮询间隔毫秒数，默认 30s
 */
export function useStatsSync(interval = 30000) {
    const store = useStatsStore();
    usePolling(() => store.fetchStats(), interval);
    return store;
}