<template>
    <div class="page-container">
        <MikuPageHero
            motif="tags"
            :title="cleanTagName(tagName) || '标签文章'"
            :subtitle="`探索「${cleanTagName(tagName) || '当前标签'}」关联的所有精选内容与灵感笔记。`"
            banner="/images/miku/miku_tags_banner.jpg"
            :stats="heroStats"
        />

        <!-- 文章列表 -->
        <div class="section-block">
            <div class="section-title">
                <span>相关文章列表</span>
            </div>

            <div class="article-list" v-loading="loading">
                <div
                    v-for="(article, index) in articleList"
                    :key="article.id"
                    v-holo
                    class="article-card tactile-btn stagger-enter"
                    :style="{ animationDelay: (index % 8) * 0.06 + 's' }"
                    @click="goToDetail(article.id)"
                >
                    <MikuCardDecor :variant="index" />

                    <div class="card-cover">
                        <img
                            v-lazy.unload="getArticleCover(article, index)"
                            :alt="article.title"
                            class="cover-img"
                            decoding="async"
                            @error="onCoverError(article.id)"
                        />
                        <div class="cover-dark-scrim"></div>
                        <div class="cover-holo-overlay"></div>
                    </div>

                    <div class="card-body">
                        <div class="card-top">
                            <span class="category-chip" v-if="article.category_name">{{ article.category_name }}</span>
                            <span class="card-time">{{ formatTime(article.create_time) }}</span>
                        </div>
                        <h3 class="card-title hover-underline-miku">
                            <span class="title-dot" aria-hidden="true"></span>{{ article.title }}
                        </h3>
                        <p class="card-desc">{{ article.description || '暂无详细摘要，点击进入阅读全文...' }}</p>
                        <div class="card-bottom">
                            <span class="author-name">{{ article.author_name || '米库尤' }}</span>
                            <div class="card-stats">
                                <span class="stat-item" title="浏览量">
                                    <el-icon><View /></el-icon>
                                    <span>{{ article.view_count || 0 }}</span>
                                </span>
                                <span class="stat-item" title="评论数">
                                    <el-icon><ChatDotRound /></el-icon>
                                    <span>{{ article.comment_count || 0 }}</span>
                                </span>
                                <span class="stat-item like" title="点赞数">
                                    <el-icon><Pointer /></el-icon>
                                    <span>{{ article.like_count || 0 }}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="!loading && articleList.length === 0" class="empty-state-box glass-miku-card">
                    <div class="empty-icon">🎧</div>
                    <p class="empty-text">该标签下暂无收录文章</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { View, ChatDotRound, Pointer } from '@element-plus/icons-vue';
import { getTagDetail, getArticlesByTag } from '../../api/tag';
import { getMikuWallpaper } from '../../utils/mikuImage';
import { formatDate } from '../../utils/format';
import MikuPageHero from '../../components/common/MikuPageHero.vue';
import MikuCardDecor from '../../components/article/MikuCardDecor.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const tagName = ref('');
const articleList = ref([]);

const cleanTagName = (name) => String(name || '').replace(/^#+/, '');

const heroStats = computed(() => [
    { icon: '✦', value: articleList.value.length, label: '篇关联文章' }
]);

const brokenCovers = ref([]);
const onCoverError = (id) => {
    if (!brokenCovers.value.includes(id)) brokenCovers.value = [...brokenCovers.value, id];
};
const getArticleCover = (article, index) => {
    if (article && article.cover_url && !brokenCovers.value.includes(article.id)) {
        return article.cover_url;
    }
    return getMikuWallpaper(article?.id || index);
};

const fetchData = async () => {
    const tagId = route.params.id;
    loading.value = true;
    try {
        const [tagRes, articleRes] = await Promise.all([
            getTagDetail(tagId),
            getArticlesByTag(tagId)
        ]);
        tagName.value = tagRes.data?.name || '';
        articleList.value = Array.isArray(articleRes.data) ? articleRes.data : [];
    } catch (error) {
        console.error('获取数据失败:', error);
    } finally {
        loading.value = false;
    }
};

const goToDetail = (id) => {
    router.push(`/article/${id}`);
};

const formatTime = (timeStr) => formatDate(timeStr);

onMounted(() => {
    fetchData();
});

watch(() => route.params.id, () => {
    fetchData();
});
</script>

<style scoped>
.page-container {
    max-width: 1040px;
    margin: 0 auto;
    padding: var(--navbar-clearance) 20px 60px;
}

.section-block {
    margin-top: 8px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 900;
    color: var(--miku-text, #14322F);
    margin-bottom: 20px;
}

.article-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.article-card {
    position: relative;
    display: flex;
    align-items: stretch;
    gap: 20px;
    min-height: 196px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(235, 250, 248, 0.88) 100%);
    border: none;
    border-radius: 22px;
    padding: 18px;
    cursor: pointer;
    overflow: hidden;
    box-shadow: 0 10px 28px rgba(8, 90, 87, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
    opacity: 1;
    animation: fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
}

.article-card:hover {
    transform: translateY(-4px);
    border-color: rgba(57, 197, 187, 0.68);
    box-shadow: 0 16px 36px rgba(57, 197, 187, 0.22), inset 0 1px 0 #FFFFFF;
}

.card-cover,
.card-body {
    position: relative;
    z-index: 1;
}

.card-cover {
    position: relative;
    flex: 0 0 268px;
    width: 268px;
    height: 166px;
    align-self: center;
    border-radius: 18px;
    overflow: hidden;
    background: #ffffff;
    border: none;
    box-shadow: 0 10px 26px rgba(14, 79, 74, 0.14);
}

.cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 25%;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.article-card:hover .cover-img {
    transform: scale(1.05);
}

.cover-dark-scrim {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, transparent 45%);
}

.cover-holo-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(105deg, rgba(255, 255, 255, 0) 35%, rgba(255, 255, 255, 0.42) 50%, rgba(255, 255, 255, 0) 65%);
    transform: translateX(-120%);
    transition: transform 0.6s ease;
}

.article-card:hover .cover-holo-overlay {
    transform: translateX(120%);
}

.card-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.card-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.category-chip {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    color: var(--miku-deep, #12A79C);
    background: rgba(57, 197, 187, 0.14);
    border: none;
}

.card-time {
    font-size: 12px;
    color: var(--text-muted, #5C837F);
    font-variant-numeric: tabular-nums;
}

.card-title {
    font-size: 17.5px;
    font-weight: 800;
    color: #0B2724;
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.75);
    margin: 0 0 6px;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease;
}

.article-card:hover .card-title {
    color: #0E9389;
}

.title-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    margin-right: 8px;
    vertical-align: 2px;
    background: linear-gradient(135deg, #39C5BB 20%, #FF7E9D 90%);
    box-shadow: 0 0 8px rgba(57, 197, 187, 0.45);
}

.card-desc {
    padding-right: 68px;
}

.card-desc {
    font-size: 13px;
    color: #1D4440;
    font-weight: 500;
    line-height: 1.6;
    margin: 0 0 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: auto;
    margin-right: 64px;
    padding: 7px 14px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.68);
    border: none;
    box-shadow: 0 2px 10px rgba(8, 90, 87, 0.05);
}

.author-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--miku-text, #14322F);
}

.card-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--text-muted, #5C837F);
}

.stat-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.stat-item .el-icon {
    font-size: 13px;
}

.stat-item.like {
    color: var(--miku-pink, #FF7E9D);
}

.empty-state-box {
    padding: 56px 20px;
    text-align: center;
    border-radius: 22px;
}

.empty-icon {
    font-size: 44px;
    margin-bottom: 10px;
}

.empty-text {
    font-size: 15px;
    color: #4B6B66;
    font-weight: 700;
}

@media (max-width: 680px) {
    .article-card {
        flex-direction: column;
        gap: 12px;
        padding: 14px;
    }

    .card-cover {
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;
    }

    .card-desc {
        padding-right: 0;
    }

    .card-bottom {
        margin-right: 48px;
        padding: 6px 10px;
    }
}
</style>
