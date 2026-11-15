import { defineStore } from "pinia";
import { ref } from "vue";
import request from "../api/request";

// 站点统计全局状态：单一聚合接口 /stats/summary 支撑首页、关于页、侧边栏等多处实时同步
// 写入防重锁防止并发轮询叠加；由 usePolling 在 useStatsSync 中驱动周期刷新
export const useStatsStore = defineStore("siteStats", () => {
    const stats = ref({
        articles: 0,
        categories: 0,
        tags: 0,
        comments: 0,
        totalViews: 0,
    });
    const loading = ref(false);
    const lastUpdatedAt = ref(0);

    const fetchStats = async () => {
        if (loading.value) return;
        loading.value = true;
        try {
            const res = await request.get("/stats/summary");
            const data = res?.data;
            if (data) {
                stats.value = {
                    articles: data.articles || 0,
                    categories: data.categories || 0,
                    tags: data.tags || 0,
                    comments: data.comments || 0,
                    totalViews: data.totalViews || 0,
                };
                lastUpdatedAt.value = Date.now();
            }
        } catch (error) {
            // 请求拦截器已统一处理错误提示，轮询静默吞掉避免刷屏
            console.error("获取站点统计失败:", error);
        } finally {
            loading.value = false;
        }
    };

    return { stats, loading, lastUpdatedAt, fetchStats };
});