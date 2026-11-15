<template>
    <div class="main-left">
        <!-- 栏目头部 -->
        <div class="section-header">
            <div class="header-left">
                <h2 class="header-title gradient-text-shine">最新文章 <span class="header-count">{{ totalCount || displayArticles.length }}</span></h2>
            </div>

            <!-- 最新 / 最热 切换 -->
            <div class="sort-tabs">
                <button
                    class="sort-tab-btn tactile-btn"
                    :class="{ active: sort === 'latest' }"
                    @click="handleSort('latest')"
                >
                    最新
                </button>
                <button
                    class="sort-tab-btn tactile-btn"
                    :class="{ active: sort === 'hot' }"
                    @click="handleSort('hot')"
                >
                    最热
                </button>
            </div>
        </div>

        <!-- 1. 骨架屏加载状态 (Initial Loading) -->
        <div class="articles-stack" v-if="loading && (!displayArticles || displayArticles.length === 0)">
            <div v-for="n in 3" :key="'skel-' + n" class="article-card skeleton-card">
                <div class="skeleton-cover skeleton-pulse"></div>
                <div class="article-content">
                    <div class="skeleton-line short skeleton-pulse"></div>
                    <div class="skeleton-line title skeleton-pulse"></div>
                    <div class="skeleton-line skeleton-pulse"></div>
                    <div class="skeleton-line footer skeleton-pulse"></div>
                </div>
            </div>
        </div>

        <!-- 2. 文章列表 (有数据时) -->
        <div class="articles-stack" v-else-if="displayArticles && displayArticles.length > 0">
            <div
                v-for="(article, index) in displayArticles"
                :key="article.id"
                v-holo
                class="article-card card-tier-elevated tactile-btn stagger-enter"
                :style="{ animationDelay: (index % 6) * 0.06 + 's' }"
                @click="$emit('goArticle', article.id)"
            >
                <!-- 初音舞台装饰层：常驻右渐隐底图 + 漂浮音符葱叶 + Q 版立绘 -->
                <MikuCardDecor :variant="index" />

                <!-- 封面图 (200×140 场景壁纸 + 遮罩) -->
                <div class="article-cover">
                    <img
                        :src="getArticleCover(article, index)"
                        :alt="article.title"
                        class="cover-img"
                        loading="lazy"
                        decoding="async"
                        @error="onCoverError(article.id)"
                    />
                    <div class="cover-dark-scrim"></div>
                </div>

                <!-- 内容区 -->
                <div class="article-content">
                    <!-- 顶部标签与发布时间 -->
                    <div class="article-top">
                        <span class="category-chip" v-if="article.category_name">
                            {{ article.category_name }}
                        </span>
                        <span class="article-time">{{ formatTime(article.create_time || article.date_str) }}</span>
                    </div>

                    <!-- 标题 -->
                    <h3 class="article-title hover-underline-miku">
                        <span class="title-dot" aria-hidden="true"></span>{{ article.title }}
                    </h3>

                    <!-- 摘要 -->
                    <p class="article-desc" v-if="article.description">{{ article.description }}</p>

                    <!-- 标签：初音葱绿色小药丸（最多 3 个，多的收进 +N） -->
                    <div class="article-tags" v-if="article.tag_names && article.tag_names.length">
                        <span v-for="t in article.tag_names.slice(0, 3)" :key="t" class="tag-pill">{{ cleanTagName(t) }}</span>
                        <span v-if="article.tag_names.length > 3" class="tag-more">+{{ article.tag_names.length - 3 }}</span>
                    </div>

                    <!-- 底部作者与互动量 -->
                    <div class="article-footer">
                        <div class="author-group">
                            <span class="author-name">{{ article.author_name || '初音小帅' }}</span>
                        </div>

                        <div class="stats-group">
                            <span class="stat-item" title="浏览量">
                                <el-icon><View /></el-icon>
                                <span>{{ article.view_count ?? article.views ?? 0 }}</span>
                            </span>
                            <span class="stat-item" title="评论数">
                                <el-icon><ChatDotRound /></el-icon>
                                <span>{{ article.comment_count ?? article.comments ?? 0 }}</span>
                            </span>
                            <span class="stat-item like" title="点赞数">
                                <el-icon><Pointer /></el-icon>
                                <span>{{ article.like_count ?? article.likes ?? 0 }}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 3. 空状态提示 (无文章数据) -->
        <div class="empty-panel glass-sakura-card" v-else>
            <div class="empty-icon">♪ ( > ▽ < )</div>
            <h3 class="empty-title">暂无相关文章记录</h3>
            <p class="empty-desc">该分类或检索条件下尚无存档，更换分类或清空检索试试吧！</p>
            <button class="retry-btn crystal-pill" @click="$emit('retry')">重置分类筛选</button>
        </div>

        <!-- 4. 自动无限滚动加载区 (无需手动点击) -->
        <div class="infinite-scroll-section" v-if="displayArticles && displayArticles.length > 0">
            <!-- 哨兵监视点：滚动到达附近时自动触发加载 -->
            <div ref="sentinelRef" class="scroll-sentinel" aria-hidden="true"></div>

            <!-- 加载中状态指示器 -->
            <div v-if="loading" class="infinite-loading-pill glass-sakura-card">
                <el-icon class="is-loading ic-spin"><Loading /></el-icon>
                <span>正在自动解锁新文章 ♪ ...</span>
            </div>

            <!-- 全部加载完成提示 -->
            <div v-else-if="!hasMore" class="no-more-pill">
                <span>✦ 已加载全部文章 ✦</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { formatTime } from '../../utils/format';
import { Loading, View, ChatDotRound, Pointer } from '@element-plus/icons-vue';
import MikuCardDecor from '../../components/article/MikuCardDecor.vue';

const cleanTagName = (name) => String(name || '').replace(/^#+/, '');

const props = defineProps({
    articles: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    hasMore: {
        type: Boolean,
        default: true
    },
    totalCount: {
        type: Number,
        default: 0
    },
    sort: {
        type: String,
        default: 'latest'
    }
});

const emit = defineEmits(['goArticle', 'loadMore', 'retry', 'sortChange', 'update:sort']);

const handleSort = (sortType) => {
    if (props.sort === sortType) return;
    emit('update:sort', sortType);
    emit('sortChange', sortType);
};

const displayArticles = computed(() => {
    return props.articles || [];
});

/* 初音未来场景壁纸库（场景壁纸 + 不重复分配） */
const MIKU_SCENE_WALLPAPERS = [
    '/images/miku/miku_wp_1.jpg',
    '/images/miku/miku_wp_2.jpg',
    '/images/miku/miku_wp_3.jpg',
    '/images/miku/miku_wp_4.jpg',
    '/images/miku/miku_wp_5.jpg',
    '/images/miku/miku_wp_6.jpg',
    '/images/miku/miku_wp_7.jpg',
    '/images/miku/miku_wp_8.jpg',
    '/images/miku/miku_wp_9.jpg',
    '/images/miku/miku_wp_10.jpg',
    '/images/miku/miku_wp_11.jpg'
];

const brokenCovers = ref([]);
const onCoverError = (id) => {
    if (!brokenCovers.value.includes(id)) brokenCovers.value = [...brokenCovers.value, id];
};

const getArticleCover = (article, index) => {
    if (article.cover_url && !brokenCovers.value.includes(article.id)) return article.cover_url;
    return MIKU_SCENE_WALLPAPERS[index % MIKU_SCENE_WALLPAPERS.length];
};

/* 无限滚动 (IntersectionObserver 哨兵自动加载) */
const sentinelRef = ref(null);
let observer = null;

const initObserver = () => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (!sentinelRef.value) return;

    observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && props.hasMore && !props.loading) {
            emit('loadMore');
        }
    }, {
        root: null,
        rootMargin: '250px', // 距离底部 250px 时提前静默触发加载
        threshold: 0
    });

    observer.observe(sentinelRef.value);
};

onMounted(() => {
    nextTick(() => {
        initObserver();
    });
});

onUnmounted(() => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
});

watch([() => props.hasMore, () => props.loading, () => props.articles.length], () => {
    nextTick(() => {
        initObserver();
    });
});
</script>

<style scoped>
.main-left {
    width: 100%;
    min-width: 0;
}

/* 栏目头部 */
.section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 20px;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.header-badge {
    font-size: 11px;
    font-weight: 800;
    color: #39C5BB;
    letter-spacing: 2px;
}

.header-title {
    font-size: 26px;
    font-weight: 800;
    color: #14322F;
    margin: 0;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-count {
    font-size: 13px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: var(--radius-pill);
    background: #E3F7F4;
    color: #12A79C;
}

/* 最新/最热 切换按键 */
.sort-tabs {
    display: inline-flex;
    padding: 3px;
    background: #E3F7F4;
    border-radius: var(--radius-pill);
    border: none;
}

.sort-tab-btn {
    padding: 5px 16px;
    border-radius: var(--radius-pill);
    font-size: 12.5px;
    font-weight: 600;
    color: #285450;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.sort-tab-btn.active {
    background: #39C5BB;
    color: #FFFFFF;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.35);
}

/* 文章堆叠列表 */
.articles-stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* 单个文章卡片 (初音未来 Miku Teal + Sakura Glassmorphism 玻璃质感)
   性能优化：去掉每卡 backdrop-filter（滚动时逐帧重模糊页面背景 = 卡顿主因），
   改用更不透明的渐变保持玻璃质感；开 content-visibility 让离屏卡片跳过渲染/绘制 */
.article-card {
    position: relative;
    overflow: hidden;
    display: flex;
    gap: 20px;
    min-height: 206px;
    padding: 18px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(232, 247, 244, 0.84) 100%);
    /* 离屏卡片直接跳过布局与绘制：无限滚动累积几十张卡时，仅视口内卡片参与合成 */
    content-visibility: auto;
    contain-intrinsic-size: auto 200px;
    border-radius: 24px;
    border: none;
    box-shadow: 0 10px 28px rgba(8, 90, 87, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    cursor: pointer;
    /* 仅过渡会被 hover 改变的具体属性，避免 transition:all 引发多余重算/重绘 */
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                border-color 0.3s ease,
                box-shadow 0.3s ease;
    /* backwards：进场后仍可被 :hover 的 translateY 接管（forwards 会锁死 transform 使 hover 失效）
       关键：全局 .stagger-enter 把 base opacity 设为 0，backwards 结束后会回退到该 base；
       此处显式 opacity:1 覆盖，否则卡片进场后永久透明、文章"消失" */
    opacity: 1;
    animation: fadeInUp 0.4s ease backwards;
}

.article-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 42px rgba(8, 90, 87, 0.14);
    box-shadow: 0 16px 36px rgba(57, 197, 187, 0.2), inset 0 1px 0 #FFFFFF;
}

/* 内容层抬到装饰层之上：舞台底图 / 立绘 / 点缀都是 z-index:0 的纯装饰 */
.article-cover,
.article-content {
    position: relative;
    z-index: 1;
}

/* 右侧给 Q 版立绘留出停靠位，避免压到摘要 */
.article-desc {
    padding-right: 68px;
}

/* 封面图 (268×166 16:10 黄金比例 + 晶透双环框) */
.article-cover {
    width: 268px;
    height: 166px;
    align-self: center;
    border-radius: 18px;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    background: #ffffff;
    border: none;
    box-shadow: 0 10px 26px rgba(14, 79, 74, 0.14);
}

.cover-dark-scrim {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, transparent 45%);
    transition: opacity 0.4s ease;
}

.cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 25%;
    filter: none;
    opacity: 1;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
}

.article-card:hover .cover-img {
    transform: scale(1.05);
    filter: brightness(1.05);
}

.article-card:hover .cover-dark-scrim {
    opacity: 0.15;
}

/* 内容区 */
.article-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.article-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
}

.category-chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: var(--radius-pill, 9999px);
    background: #E3F7F4;
    border: none;
    color: #12A79C;
    font-size: 11px;
    font-weight: 700;
}

.article-time {
    font-size: 12px;
    color: #5C837F;
}

.article-title {
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

.article-card:hover .article-title {
    color: #0E9389;
}

.article-desc {
    font-size: 13px;
    color: #1D4440;
    font-weight: 500;
    margin: 0 0 8px;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 标题前的青粉光点 */
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

/* 标签：初音葱绿色系小药丸（无标签时整块不渲染，不影响布局） */
.article-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-height: 21px;
    margin: 0 0 8px;
}

.tag-pill {
    font-size: 11px;
    font-weight: 700;
    color: #2E7D5B;
    background: rgba(97, 197, 143, 0.14);
    border: none;
    padding: 2px 9px;
    border-radius: var(--radius-pill, 999px);
    transition: background 0.22s ease, color 0.22s ease;
}

.tag-pill:hover {
    background: rgba(97, 197, 143, 0.28);
    color: #1F5C43;
}

.tag-more {
    font-size: 11px;
    font-weight: 700;
    color: #5C837F;
}

/* 底部元数据磨砂玻璃胶囊条 */
.article-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    margin-right: 64px;
    padding: 7px 14px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.68);
    border: none;
    box-shadow: 0 2px 10px rgba(8, 90, 87, 0.05);
}

.author-group {
    display: flex;
    align-items: center;
    gap: 6px;
}

.author-name {
    font-size: 12px;
    font-weight: 700;
    color: #14322F;
}

.stats-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.stat-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #5C837F;
}

.stat-item .el-icon {
    font-size: 13px;
}

.stat-item.like {
    color: #FF7E9D;
}

/* 加载更多 */
.load-more-section {
    text-align: center;
    margin-top: 32px;
    margin-bottom: 24px;
}

.load-all-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 32px;
    border-radius: var(--radius-pill, 9999px);
    background: #E3F7F4;
    color: #12A79C;
    border: none;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.25);
    transition: all 0.25s ease;
}

.load-all-btn .arrow {
    transition: transform 0.2s ease;
}

.load-all-btn:hover:not(:disabled) {
    background: #39C5BB;
    color: #FFFFFF;
    border-color: transparent;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(57, 197, 187, 0.45);
}

.load-all-btn:disabled {
    opacity: 0.75;
    cursor: not-allowed;
    transform: none;
}

.no-more-pill {
    display: inline-block;
    padding: 8px 24px;
    border-radius: var(--radius-pill, 9999px);
    background: rgba(57, 197, 187, 0.08);
    border: 1px dashed rgba(57, 197, 187, 0.35);
    color: #8BA8A5;
    font-size: 13px;
    font-weight: 700;
}

.load-all-btn:hover .arrow {
    transform: translateX(4px);
}

/* 骨架屏 Skeleton Styles */
.skeleton-card {
    pointer-events: none;
    opacity: 0.85;
}

.skeleton-cover {
    width: 200px;
    height: 140px;
    border-radius: 18px;
    background: rgba(57, 197, 187, 0.15);
    flex-shrink: 0;
}

.skeleton-line {
    height: 14px;
    border-radius: 8px;
    background: rgba(57, 197, 187, 0.15);
    margin-bottom: 10px;
    width: 100%;
}

.skeleton-line.short { width: 30%; height: 12px; }
.skeleton-line.title { width: 85%; height: 20px; }
.skeleton-line.footer { width: 60%; margin-top: 12px; margin-bottom: 0; }

.skeleton-pulse {
    animation: mikuPulse 1.5s ease-in-out infinite;
}

@keyframes mikuPulse {
    0% { opacity: 0.4; }
    50% { opacity: 0.85; }
    100% { opacity: 0.4; }
}

/* 空状态 Panel */
.empty-panel {
    padding: 48px 24px;
    text-align: center;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24px;
    border: 1px dashed rgba(57, 197, 187, 0.4);
    box-shadow: 0 8px 24px rgba(8, 90, 87, 0.06);
    margin: 20px 0;
}

.empty-icon {
    font-size: 32px;
    font-family: 'Audiowide', sans-serif;
    color: #39C5BB;
    margin-bottom: 12px;
    text-shadow: 0 0 12px rgba(57, 197, 187, 0.4);
}

.empty-title {
    font-size: 18px;
    font-weight: 800;
    color: #14322F;
    margin: 0 0 8px;
}

.empty-desc {
    font-size: 13px;
    color: #5C837F;
    margin: 0 0 20px;
}

.retry-btn {
    padding: 8px 24px;
    background: linear-gradient(135deg, #39C5BB 0%, #12A79C 100%);
    color: #FFFFFF;
    border: none;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(57, 197, 187, 0.35);
    transition: all 0.25s ease;
}

.retry-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(57, 197, 187, 0.5);
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}

/* 4. 自动无限滚动加载区域 */
.infinite-scroll-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 0 16px;
    position: relative;
    width: 100%;
}

.scroll-sentinel {
    height: 10px;
    width: 100%;
    pointer-events: none;
    visibility: hidden;
}

.infinite-loading-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border-radius: var(--radius-pill, 9999px);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(227, 247, 244, 0.95) 100%);
    border: none;
    color: #12A79C;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 8px 24px rgba(57, 197, 187, 0.15);
    animation: pulseInfinite 1.8s ease-in-out infinite alternate;
}

.infinite-loading-pill .ic-spin {
    font-size: 16px;
    color: #39C5BB;
}

.no-more-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 22px;
    border-radius: var(--radius-pill, 9999px);
    background: rgba(57, 197, 187, 0.08);
    border: 1px dashed rgba(57, 197, 187, 0.35);
    color: #5C837F;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 1px;
}

@keyframes pulseInfinite {
    from { transform: scale(0.98); opacity: 0.88; }
    to { transform: scale(1.02); opacity: 1; }
}

@media (max-width: 768px) {
    .article-card {
        flex-direction: column;
        min-height: auto;
        padding: 14px;
    }
    .article-cover, .skeleton-cover {
        width: 100%;
        height: 170px;
    }
    .article-title {
        font-size: 16px;
    }
    /* 移动端立绘缩小到 ~42px，仅给底部统计让位，摘要回正避免过度缩进 */
    .article-desc {
        padding-right: 0;
    }
    .article-footer {
        margin-right: 48px;
        padding: 6px 10px;
    }
}
</style>