<template>
    <div class="page-container">
        <!-- Header 区域 (强化右侧初音未来插画与赛博 HUD 音频频宽) -->
        <div class="page-header miku-hero-banner">
            <!-- 专属初音插画背景覆盖层 -->
            <div class="hero-artwork-bg" style="background-image: url('/images/miku/miku_articles_banner.jpg')"></div>

            <!-- 动态背景光斑与全息粒子 -->
            <div class="hero-bg-shapes">
                <div class="hero-circle c1"></div>
                <div class="hero-circle c2"></div>
                <div class="sound-wave-top">
                    <span v-for="n in 12" :key="n" class="wave-bar" :style="{ animationDelay: (n * 0.08) + 's' }"></span>
                </div>
                <span class="hero-music-note n1">♪</span>
                <span class="hero-music-note n2">♫</span>
            </div>

            <div class="hero-inner">
                <!-- 左侧标题区 -->
                <div class="hero-left-content">
                    <h1 class="hero-title">技术文库</h1>
                    <p class="hero-subtitle">用代码写歌，用文字存档时光中的探索与收获。</p>
                    <div class="hero-stats" v-if="!loading && totalCount > 0">
                        <div class="stat-pill">
                            <span class="stat-num">{{ totalCount }}</span>
                            <span class="stat-text">篇文章</span>
                        </div>
                    </div>
                </div>

                <!-- 右侧初音专属插画 -->
                <div class="hero-cyber-panel">
                    <div class="hero-miku-illustration-card">
                        <img src="/images/miku/miku_articles_banner.jpg" alt="初音未来文库插画" class="miku-banner-img" />
                    </div>
                </div>
            </div>
        </div>

        <!-- 筛选提示 (初音青发光胶囊) -->
        <div class="filter-tip glass-miku-card" v-if="currentCategory || currentTag">
            <div class="filter-text">
                <span class="filter-badge-icon">🔍</span>
                <span v-if="currentCategory">分类：<strong class="highlight-cyan">{{ currentCategory }}</strong></span>
                <span v-if="currentCategory && currentTag" class="filter-dot">·</span>
                <span v-if="currentTag">标签：<strong class="highlight-pink">{{ currentTag }}</strong></span>
            </div>
            <button class="clear-filter-btn tactile-btn" @click="clearFilter">
                <span>✕ 清除筛选</span>
            </button>
        </div>

        <!-- 加载骨架屏 -->
        <div v-if="loading" class="article-list">
            <div v-for="i in 3" :key="i" class="article-card skeleton-card">
                <div class="card-cover skeleton-cover"></div>
                <div class="card-body">
                    <div class="skeleton-line short skeleton-pulse"></div>
                    <div class="skeleton-line title skeleton-pulse"></div>
                    <div class="skeleton-line skeleton-pulse"></div>
                    <div class="skeleton-line footer skeleton-pulse"></div>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="articles.length === 0" class="empty-state-box glass-miku-card">
            <div class="empty-icon">🎧</div>
            <p class="empty-text">空空如也，快去后台写第一篇文章吧！</p>
        </div>

        <!-- 文章列表 (首页同款浅色卡片 + 初音舞台装饰层) -->
        <div v-else class="article-list">
            <div v-for="(item, index) in articles" :key="item.id" v-holo class="article-card tactile-btn stagger-enter"
                :style="{ animationDelay: index * 0.05 + 's' }" @click="goToDetail(item.id)">
                <!-- 初音舞台装饰层：右渐隐底图 + 漂浮音符葱叶 + Q 版立绘（纯装饰，z-index:0） -->
                <MikuCardDecor :variant="index" />

                <div class="card-cover">
                    <img v-lazy.unload="getArticleCover(item, index)" :alt="item.title" class="cover-img"
                        decoding="async" @error="onCoverError(item.id)" />
                    <div class="cover-dark-scrim"></div>
                    <div class="cover-holo-overlay"></div>
                </div>
                <div class="card-body">
                    <div class="card-top">
                        <span class="category-chip" v-if="item.category_name">{{ item.category_name }}</span>
                        <span class="card-time">{{ formatDate(item.create_time) }}</span>
                    </div>
                    <h3 class="card-title hover-underline-miku"><span class="title-dot" aria-hidden="true"></span>{{ item.title }}</h3>
                    <p class="card-desc">{{ item.description || '暂无详细摘要，点击进入探索全篇文字...' }}</p>
                    <!-- 标签：初音葱绿色小药丸（最多 3 个，多的收进 +N；无标签时保留占位高度，卡片高度统一） -->
                    <div class="card-tags">
                        <span v-for="t in (item.tag_names || []).slice(0, 3)" :key="t" class="tag-pill">{{ cleanTagName(t) }}</span>
                        <span v-if="item.tag_names && item.tag_names.length > 3" class="tag-more">+{{ item.tag_names.length - 3 }}</span>
                    </div>
                    <div class="card-bottom">
                        <span class="author-name">{{ item.author_name || '孤勇者' }}</span>
                        <div class="card-stats">
                            <span class="stat-item" title="浏览量">
                                <el-icon><View /></el-icon>
                                <span>{{ item.view_count || 0 }}</span>
                            </span>
                            <span class="stat-item" title="评论数">
                                <el-icon><ChatDotRound /></el-icon>
                                <span>{{ item.comment_count || 0 }}</span>
                            </span>
                            <span class="stat-item like" title="点赞数">
                                <el-icon><Pointer /></el-icon>
                                <span>{{ item.like_count || 0 }}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 39 风格初音分页器 -->
        <div class="pagination-box" v-if="totalCount > pageSize">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[6, 10, 20, 50]"
                :pager-count="5" layout="total, sizes, prev, pager, next" :total="totalCount"
                class="miku-pagination" @size-change="handleSizeChange" @current-change="handlePageChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '../../api/request';
import { formatDate } from '../../utils/format';
import { Pointer, View, ChatDotRound } from '@element-plus/icons-vue';
import MikuCardDecor from '../../components/article/MikuCardDecor.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const articles = ref([]);
const currentCategory = ref('');
const currentTag = ref('');
const currentPage = ref(1);
const pageSize = ref(6);
const totalCount = ref(0);

const cleanTagName = (name) => String(name || '').replace(/^#+/, '');

const fetchCategoryName = async (id) => {
    if (!id) { currentCategory.value = ''; return; }
    try {
        const res = await request.get(`/category/${id}`);
        currentCategory.value = res.data.name;
    } catch { currentCategory.value = '未知分类'; }
};

const fetchTagName = async (id) => {
    if (!id) { currentTag.value = ''; return; }
    try {
        const res = await request.get(`/tag/${id}`);
        currentTag.value = res.data.name;
    } catch { currentTag.value = '未知标签'; }
};

const fetchAllArticles = async () => {
    loading.value = true;
    try {
        const params = { page: currentPage.value, pageSize: pageSize.value };
        if (route.query.category_id) params.category_id = route.query.category_id;
        if (route.query.tag_id) params.tag_id = route.query.tag_id;
        const res = await request.get('/article', { params });
        articles.value = res.data.list || res.data;
        totalCount.value = res.data.total || 0;
    } catch (e) {
        console.error('拉取文章失败:', e);
    } finally {
        loading.value = false;
    }
};

const clearFilter = () => router.push('/articles');
const goToDetail = (id) => router.push(`/article/${id}`);

/* ==================== 封面图 ==================== */
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

/** 加载失败的封面（记录并回退到 Miku 场景壁纸） */
const brokenCovers = ref([]);
const isCoverBroken = (id) => brokenCovers.value.includes(id);
const onCoverError = (id) => {
    if (!brokenCovers.value.includes(id)) brokenCovers.value = [...brokenCovers.value, id];
};

const getArticleCover = (item, index) => {
    if (item.cover_url && !isCoverBroken(item.id)) return item.cover_url;
    return MIKU_SCENE_WALLPAPERS[index % MIKU_SCENE_WALLPAPERS.length];
};

const handleSizeChange = (size) => {
    pageSize.value = size;
    currentPage.value = 1;
    fetchAllArticles();
};

const handlePageChange = (page) => {
    currentPage.value = page;
    fetchAllArticles();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => {
    if (route.query.category_id) fetchCategoryName(route.query.category_id);
    if (route.query.tag_id) fetchTagName(route.query.tag_id);
    fetchAllArticles();
});

watch(() => route.query, (q) => {
    currentPage.value = 1;
    q.category_id ? fetchCategoryName(q.category_id) : (currentCategory.value = '');
    q.tag_id ? fetchTagName(q.tag_id) : (currentTag.value = '');
    fetchAllArticles();
}, { deep: true });
</script>

<style scoped>
.page-container {
    max-width: 1040px;
    margin: 0 auto;
    padding: var(--navbar-clearance) 20px 60px;
}

/* ==================== HERO 看板 ==================== */
.page-header.miku-hero-banner {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    margin-bottom: 32px;
    background: linear-gradient(135deg, #12A79C 0%, #39C5BB 60%, #4ECDC4 100%);
    color: #ffffff;
    padding: 40px 32px;
    text-align: left;
    box-shadow: 0 14px 40px rgba(18, 167, 156, 0.2);
    border: none;
}

.hero-bg-shapes {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.hero-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
}

.hero-circle.c1 { width: 200px; height: 200px; top: -50px; right: 20%; }
.hero-circle.c2 { width: 300px; height: 300px; bottom: -120px; right: -50px; }

.sound-wave-top {
    position: absolute;
    top: 20px;
    right: 40px;
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 20px;
}

.wave-bar {
    width: 3px;
    height: 100%;
    background: #ffffff;
    border-radius: 2px;
    animation: topWavePulse 1.2s ease-in-out infinite alternate;
}

@keyframes topWavePulse {
    0% { height: 20%; opacity: 0.3; }
    100% { height: 100%; opacity: 1; background: #FF7E9D; }
}

.hero-music-note {
    position: absolute;
    font-size: 24px;
    color: rgba(255, 255, 255, 0.7);
    animation: noteFloat 4s ease-in-out infinite;
}

.n1 { top: 25%; right: 28%; }
.n2 { top: 55%; right: 32%; color: #FF7E9D; animation-delay: 1.5s; }

@keyframes noteFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

.hero-inner {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
}

.hero-left-content {
    flex: 1;
}

.badge-tag {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #ffffff;
}

.miku-hero-banner .hero-title {
    font-size: clamp(32px, 5vw, 44px);
    font-weight: 900;
    margin: 0 0 12px;
    color: #ffffff;
    letter-spacing: 0.5px;
    text-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
}

.miku-hero-banner .hero-subtitle {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.94);
    line-height: 1.6;
    margin: 0 0 22px;
    max-width: none;
}

.miku-hero-banner .hero-stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.miku-hero-banner .stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: 9999px;
    background: rgba(11, 56, 52, 0.32);
    border: none;
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
}

.miku-hero-banner .stat-num {
    font-weight: 900;
    font-size: 16px;
    color: #ffffff;
}

.stat-icon {
    color: #FF7E9D;
}

/* 右侧初音专属插画与赛博 HUD 看板 */
.hero-artwork-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center right;
    opacity: 0.18;
    mix-blend-mode: overlay;
    pointer-events: none;
}

.hero-cyber-panel {
    width: 270px;
    flex-shrink: 0;
}

.hero-miku-illustration-card {
    position: relative;
    width: 100%;
    height: 145px;
    border-radius: 20px;
    overflow: hidden;
    border: none;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-miku-illustration-card:hover {
    transform: translateY(-4px) scale(1.02);
}

.miku-banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.illustration-hud-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(18, 167, 156, 0.35) 0%, rgba(14, 34, 32, 0.75) 100%);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none;
}

.hud-top-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.miku-badge-code {
    font-family: monospace;
    font-size: 11px;
    font-weight: 800;
    color: #ffffff;
    background: rgba(255, 126, 157, 0.4);
    padding: 2px 6px;
    border-radius: 4px;
}

.miku-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #FF7E9D;
    box-shadow: 0 0 8px #FF7E9D;
}

.miku-status-text {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.9);
}

.miku-visual-equalizer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: 32px;
    margin-bottom: 12px;
}

.eq-bar {
    width: 3.5px;
    background: linear-gradient(180deg, #FF7E9D 0%, #ffffff 100%);
    border-radius: 3px;
    animation: hudEqPulse 1.4s ease-in-out infinite alternate;
}

@keyframes hudEqPulse {
    0% { height: 15%; opacity: 0.4; }
    100% { height: 100%; opacity: 1; }
}

@media (max-width: 768px) {
    .hero-cyber-panel { display: none; }
}

/* ==================== 筛选提示 ==================== */
.filter-tip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    margin-bottom: 24px;
}

.filter-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #14322F;
}

.highlight-cyan { color: #12A79C; }
.highlight-pink { color: #FF7E9D; }

.clear-filter-btn {
    padding: 6px 14px;
    border-radius: 12px;
    border: none;
    background: #ffffff;
    color: #12A79C;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.clear-filter-btn:hover {
    background: #39C5BB;
    color: #ffffff;
}

/* ==================== 初音风毛玻璃卡片（筛选提示 / 空状态用） ==================== */
.glass-miku-card {
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.96);
    border: none;
    box-shadow: 0 10px 30px rgba(57, 197, 187, 0.1);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ==================== 文章列表（首页同款卡片视觉） ==================== */
.article-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* 文章列表卡：开 content-visibility 让离屏卡跳过渲染；transition 仅过渡 hover 实际改动的属性 */
.article-card {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 20px;
    min-height: 196px;
    padding: 18px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    box-shadow: 0 10px 28px rgba(8, 90, 87, 0.08);
    cursor: pointer;
    overflow: hidden;
    content-visibility: auto;
    contain-intrinsic-size: auto 200px;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                border-color 0.3s ease,
                box-shadow 0.3s ease;
}

/* 进场动画 forwards 会锁死 transform → 让 hover 位移失效；
   这里改为 backwards + 基础态（opacity:1 / 无 transform），动画结束后交还给 hover */
.article-card.stagger-enter {
    opacity: 1;
    animation-fill-mode: backwards;
}

.article-card:hover {
    transform: translateY(-4px);
    border-color: rgba(57, 197, 187, 0.5);
    box-shadow: 0 14px 36px rgba(8, 90, 87, 0.16);
    z-index: 5;
}

/* 右上角：耳机 + 音符（二次元点缀） */
.card-corner-deco {
    position: absolute;
    top: 10px;
    right: 14px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 5px;
    pointer-events: none;
}

.card-headset {
    width: 15px;
    height: 15px;
    color: var(--miku-teal, #39C5BB);
    filter: drop-shadow(0 0 4px rgba(57, 197, 187, 0.45));
    opacity: 0.85;
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.card-corner-note {
    font-size: 14px;
    font-weight: 900;
    color: var(--miku-teal, #39C5BB);
    text-shadow: 0 0 8px rgba(57, 197, 187, 0.45);
    opacity: 0.9;
}

.article-card:hover .card-headset {
    transform: rotate(-8deg) scale(1.08);
    opacity: 1;
}

/* ---------- 封面：固定 16:10 黄金比例，垂直居中 + 晶透双环框 ---------- */
.card-cover {
    position: relative;
    flex: 0 0 268px;
    width: 268px;
    height: 166px;
    flex-shrink: 0;
    align-self: center;
    border-radius: 18px;
    overflow: hidden;
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

/* 悬停全息扫光 */
.cover-holo-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(105deg,
            rgba(255, 255, 255, 0) 35%,
            rgba(255, 255, 255, 0.42) 50%,
            rgba(255, 255, 255, 0) 65%);
    transform: translateX(-120%);
    transition: transform 0.7s ease;
}

.article-card:hover .cover-holo-overlay {
    transform: translateX(120%);
}

.cover-placeholder {
    position: relative;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #E3F7F4 0%, #39C5BB 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
}

.ph-letter {
    font-size: 34px;
    font-weight: 900;
    line-height: 1;
    text-shadow: 0 3px 10px rgba(14, 79, 74, 0.25);
}

.ph-twintail {
    position: absolute;
    top: 8px;
    right: 10px;
    font-size: 14px;
    opacity: 0.7;
}

/* 正文列：占满剩余宽度，min-width:0 保证长标题/长摘要能正常截断而不撑破卡片 */
.card-body {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.card-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
}

/* 分类药丸：与首页 category-chip 同款 */
.category-chip {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: var(--radius-pill, 9999px);
    background: var(--miku-tag-bg, #E3F7F4);
    border: none;
    color: var(--miku-deep, #12A79C);
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
}

.card-time {
    flex: 0 0 auto;
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
    transition: color 0.2s ease;
    /* 最多两行：保证各卡片标题占高一致，列表右边界整齐 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.article-card:hover .card-title {
    color: #0E9389;
}

.card-desc {
    font-size: 13px;
    color: #1D4440;
    font-weight: 500;
    line-height: 1.6;
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 标签：初音葱绿色系小药丸（无标签时保留占位高度，底栏基线统一） */
.card-tags {
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
    color: var(--text-muted, #5C837F);
}

/* 底栏贴底：磨砂玻璃胶囊条 + 作者左 / 数据右 */
.card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 0 0 auto;
    font-size: 12px;
    color: var(--text-muted, #5C837F);
    font-variant-numeric: tabular-nums;
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

/* ==================== 初音舞台卡片装饰（配合 MikuCardDecor） ==================== */
/* 内容层抬到装饰层之上：舞台底图 / 立绘 / 点缀都是 z-index:0 的纯装饰 */
.card-cover,
.card-body {
    position: relative;
    z-index: 1;
}

/* 右侧给 Q 版立绘留出停靠位，避免压到摘要 */
.card-desc {
    padding-right: 68px;
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

/* 浏览量 / 评论数图标尺寸已由 .el-icon 统一 */

/* ---------- 加载骨架屏：与真实卡片同尺寸，数据到位时不跳动（首页同款脉冲） ---------- */
.skeleton-card {
    pointer-events: none;
    opacity: 0.85;
}

.skeleton-cover {
    background: rgba(57, 197, 187, 0.15);
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

@media (prefers-reduced-motion: reduce) {
    .skeleton-pulse {
        animation: none !important;
    }
}

html.reduce-motion .skeleton-pulse {
    animation: none !important;
}

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
    .article-card {
        gap: 16px;
        padding: 16px;
    }

    .card-cover {
        flex: 0 0 210px;
        width: 210px;
        height: 118px;
    }
}

@media (max-width: 680px) {
    .article-list {
        gap: 14px;
    }

    .article-card {
        flex-direction: column;
        min-height: auto;
        gap: 12px;
        padding: 14px;
    }

    /* 纵向排布：封面占满宽度、固定 16:9，所有原图统一裁成同宽高矩形 */
    .card-cover {
        flex: 0 0 auto;
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;
    }

    .card-title {
        font-size: 16px;
    }

    .card-bottom {
        gap: 8px;
    }

    .card-stats {
        gap: 10px;
    }

    /* 移动端：立绘已由组件缩小到 42px，只需给底部统计让位 */
    .card-desc {
        padding-right: 0;
    }

    .card-bottom {
        margin-right: 48px;
        padding: 6px 10px;
    }
}

/* 空状态 */
.empty-state-box {
    padding: 60px 20px;
    text-align: center;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.empty-text {
    font-size: 15px;
    color: #4B6B66;
    font-weight: 700;
}

/* 39 初音分页器 */
.pagination-box {
    margin-top: 36px;
    display: flex;
    justify-content: center;
}

.miku-pagination :deep(.el-pager li.is-active) {
    background: linear-gradient(135deg, #39C5BB, #12A79C) !important;
    color: #ffffff !important;
    border-radius: 12px !important;
    font-weight: 800 !important;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.3) !important;
}

.miku-pagination :deep(.el-pager li) {
    border-radius: 12px !important;
    background: rgba(255, 255, 255, 0.85) !important;
    border: 1px solid rgba(57, 197, 187, 0.25) !important;
    color: #285450 !important;
}
</style>
