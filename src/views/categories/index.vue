<template>
    <div class="page-container">
        <MikuPageHero motif="categories" title="分类"
            subtitle="按主题模块归类整理，快速探索感兴趣的内容方向与文章。" banner="/images/miku/miku_categories_banner.jpg"
            :stats="heroStats" />

        <!-- 加载骨架屏 -->
        <div v-if="loading" class="category-grid">
            <div v-for="i in 6" :key="i" class="category-card glass-miku-card skeleton">
                <div class="skeleton-circle"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium"></div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="categories.length === 0" class="empty-state-box glass-miku-card">
            <div class="empty-icon">🎧</div>
            <p class="empty-text">暂无分类数据，去后台添加第一个分类吧！</p>
            <span class="empty-note">♪ ♫ ♬</span>
        </div>

        <!-- 分类网格 · 专辑卡片（每张一个主题色 + 曲目编号） -->
        <div v-else class="category-grid">
            <div v-for="(item, index) in categories" :key="item.id" v-holo="{ tilt: 2 }" class="category-card glass-miku-card tactile-btn"
                :class="'theme-' + (index % 5)" :style="{ animationDelay: index * 0.06 + 's' }"
                @click="handleCategoryClick(item.id)">
                <!-- Q版初音立绘 / 主题插画背景区 -->
                <div class="cat-illus-wrap">
                    <img v-if="getCatIllustration(item, index)" :src="getCatIllustration(item, index)" :alt="item.name"
                        class="cat-illus-img" loading="lazy" decoding="async" @error="onCatImgError(index)" />
                    <div class="cat-scrim-mask"></div>
                </div>

                <!-- 右上角音符 + 曲目编号水印 -->
                <div class="card-corner-note">♪</div>
                <span class="card-no">{{ String(index + 1).padStart(2, '0') }}</span>

                <div class="card-icon-box">
                    <span class="icon-vinyl"></span>
                    <el-icon :size="26">
                        <component :is="getIcon(item, index)" />
                    </el-icon>
                </div>
                <h3 class="card-name">{{ item.name }}</h3>
                <span class="card-count">{{ item.article_count || 0 }} 篇文章</span>

                <span class="card-action">
                    <span>探索分类</span>
                    <el-icon>
                        <ArrowRight />
                    </el-icon>
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '../../api/request';
import MikuPageHero from '../../components/common/MikuPageHero.vue';
import {
    FolderOpened,
    Collection,
    Notebook,
    Reading,
    Files,
    ArrowRight,
    MagicStick,
    DataLine,
    TrendCharts,
    Cpu,
    Connection,
    Grid,
    DataBoard,
    Monitor,
    Timer,
    Film,
    Sunny,
    Promotion,
    Medal,
    Headset,
    Histogram
} from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(false);
const categories = ref([]);

/* 关键词 → 图标：让符号与分类语义相符，而非按序机械轮转。
   命中第一条即返回；未命中才回落到基础图标轮转。 */
const ICON_RULES = [
    { re: /数据结构|算法/i, icon: DataLine },
    { re: /ai|人工智能|大模型|机器学习/i, icon: MagicStick },
    { re: /大数据|数据|数仓|爬虫/i, icon: TrendCharts },
    { re: /操作系统|linux|内核|cpu/i, icon: Cpu },
    { re: /网络|通信|http/i, icon: Connection },
    { re: /架构|设计模式|工程化|重构/i, icon: Grid },
    { re: /mysql|mongo|sql|数据库/i, icon: DataBoard },
    { re: /编程|开发|前端|后端|vue|react|c语言|c\+\+|java|python|全栈|代码/i, icon: Monitor },
    { re: /期末|考试|复习|不挂科/i, icon: Timer },
    { re: /剧评|影评|电影|影视/i, icon: Film },
    { re: /生活|日常|日志|随笔/i, icon: Sunny },
    { re: /资源|分享|工具|神器/i, icon: Promotion },
    { re: /自我|提升|成长|励志/i, icon: Medal },
    { re: /音乐|歌单|音频|电台/i, icon: Headset },
    { re: /读书|笔记|书/i, icon: Notebook },
    { re: /统计|报表|分析/i, icon: Histogram }
];

const FALLBACK_ICONS = [FolderOpened, Collection, Notebook, Reading, Files];

const getIcon = (item, index) => {
    const name = String(item?.name || '');
    const hit = ICON_RULES.find(r => r.re.test(name));
    return hit ? hit.icon : FALLBACK_ICONS[index % FALLBACK_ICONS.length];
};

const totalArticles = computed(() => {
    return categories.value.reduce((sum, c) => sum + (c.article_count || 0), 0);
});

/* Hero 统计胶囊：加载中或空数据时不渲染 */
const heroStats = computed(() => {
    if (loading.value || categories.value.length === 0) return [];
    return [
        { glyph: '✦', value: categories.value.length, label: '个主题' },
        { glyph: '🎧', value: totalArticles.value, label: '篇收录' }
    ];
});

const maxCount = computed(() => {
    return Math.max(...categories.value.map(c => c.article_count || 0), 1);
});

const getPercent = (count) => {
    return Math.round(((count || 0) / maxCount.value) * 100);
};

const fetchCategories = async () => {
    loading.value = true;
    try {
        const res = await request.get('/category');
        categories.value = res.data;
    } catch (error) {
        console.error('获取分类失败:', error);
    } finally {
        loading.value = false;
    }
};

const handleCategoryClick = (id) => {
    router.push({ path: '/articles', query: { category_id: id } });
};

/* Q版初音唱片与主题插画库 */
const MIKU_CAT_ILLUSTRATIONS = [
    '/images/miku/miku_chibi_main.png',
    '/images/miku/miku_wp_1.jpg',
    '/images/miku/miku_wp_8.jpg',
    '/images/miku/miku_wp_9.jpg',
    '/images/miku/miku_wp_10.jpg',
    '/images/miku/miku_wp_11.jpg'
];

const imgBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');

const brokenCatImgs = ref([]);
const onCatImgError = (idx) => {
    if (!brokenCatImgs.value.includes(idx)) brokenCatImgs.value.push(idx);
};
const getCatIllustration = (item, index) => {
    if (brokenCatImgs.value.includes(index)) return '';
    const customCover = item?.cover_url || item?.cover || item?.bg_image;
    if (customCover) {
        if (customCover.startsWith('http://') || customCover.startsWith('https://')) return customCover;
        if (customCover.startsWith('/uploads/')) return imgBase ? `${imgBase}${customCover}` : customCover;
        return customCover;
    }
    return MIKU_CAT_ILLUSTRATIONS[index % MIKU_CAT_ILLUSTRATIONS.length];
};

onMounted(() => {
    fetchCategories();
});
</script>

<style scoped>
.page-container {
    max-width: 1040px;
    margin: 0 auto;
    padding: var(--navbar-clearance) 20px 60px;
}

/* ==================== 卡片基座 ==================== */
/* 列表卡片：去掉 backdrop-filter（多卡随滚动累积逐帧重模糊）；开 content-visibility 让离屏卡跳过渲染 */
.glass-miku-card {
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.92);
    content-visibility: auto;
    contain-intrinsic-size: auto 300px;
    border: none;
    box-shadow: 0 10px 30px rgba(57, 197, 187, 0.1);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
}

/* ==================== 专辑卡片 ==================== */
.category-card {
    --tilt: 0deg;
    /* 默认主题色，确保 color-mix 始终有效（骨架卡无 theme-N） */
    --card-accent: var(--miku-teal);
    position: relative;
    padding: 24px;
    cursor: pointer;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    /* backwards：延迟期显示 from 态，结束后交还常态样式，避免锁死 hover 位移 */
    animation: cardRiseIn 0.62s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    transform: rotate(var(--tilt, 0deg));
}

/* 五个主题色，替换原先无样式的 theme-N 死类 */
.theme-0 {
    --card-accent: #39C5BB;
}

.theme-1 {
    --card-accent: #FF7E9D;
}

.theme-2 {
    --card-accent: #4ECDC4;
}

.theme-3 {
    --card-accent: #12A79C;
}

.theme-4 {
    --card-accent: #7B8CFF;
}

/* 错落倾斜：通过 --tilt 参与进场与常态 transform，避免被动画覆盖而失效 */
.category-card:nth-child(3n+1) {
    --tilt: -0.5deg;
}

.category-card:nth-child(3n+2) {
    --tilt: 0.5deg;
}

.category-card:nth-child(3n+3) {
    --tilt: -0.3deg;
}

@keyframes cardRiseIn {
    from {
        opacity: 0;
        transform: rotate(var(--tilt, 0deg)) translateY(20px);
    }

    to {
        opacity: 1;
        transform: rotate(var(--tilt, 0deg)) translateY(0);
    }
}

.category-card:hover {
    transform: rotate(0deg) translateY(-8px) scale(1.02) !important;
    border-color: color-mix(in srgb, var(--card-accent) 55%, transparent);
    box-shadow: 0 16px 36px rgba(57, 197, 187, 0.22), 0 0 22px color-mix(in srgb, var(--card-accent) 32%, transparent);
    z-index: 5;
}

.cat-illus-wrap {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    border-radius: 20px;
}

.cat-illus-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 20%;
    opacity: 0.16;
    filter: saturate(1.05) blur(1.8px);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease;
}

.cat-scrim-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(125deg, rgba(255, 255, 255, 0.72) 0%, rgba(235, 252, 249, 0.56) 55%, rgba(255, 236, 246, 0.44) 100%);
    transition: background 0.3s ease, opacity 0.3s ease;
}

.category-card:hover .cat-illus-img {
    transform: scale(1.08) rotate(1deg);
    opacity: 0.92;
    filter: saturate(1.28) contrast(1.06) blur(0px);
}

.category-card:hover .cat-scrim-mask {
    background: linear-gradient(125deg, rgba(255, 255, 255, 0.42) 0%, rgba(235, 252, 249, 0.28) 55%, rgba(255, 236, 246, 0.20) 100%);
}

.card-corner-note {
    position: absolute;
    top: 12px;
    right: 14px;
    font-size: 14px;
    color: var(--card-accent);
    opacity: 0.85;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-card:hover .card-corner-note {
    transform: translateY(-3px) rotate(14deg) scale(1.2);
}


/* 曲目编号水印（Audiowide，呼应唱片集叙事） */
.card-no {
    position: absolute;
    bottom: 12px;
    right: 16px;
    font-family: 'Audiowide', sans-serif;
    font-size: 26px;
    font-weight: 400;
    line-height: 1;
    color: var(--card-accent);
    opacity: 0.14;
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
}

.category-card:hover .card-no {
    opacity: 0.3;
    transform: translateY(-2px);
}

/* 图标框 + 唱片环 */
.card-icon-box {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--card-accent) 14%, #ffffff);
    border: none;
    color: var(--card-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
}

.icon-vinyl {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1.5px dashed color-mix(in srgb, var(--card-accent) 55%, transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.category-card:hover .card-icon-box {
    transform: rotate(-6deg) scale(1.06);
    box-shadow: 0 0 18px color-mix(in srgb, var(--card-accent) 40%, transparent);
}

.category-card:hover .icon-vinyl {
    opacity: 1;
    animation: vinylSpin 6s linear infinite;
}

@keyframes vinylSpin {
    to {
        transform: rotate(360deg);
    }
}

.card-name {
    font-size: 20px;
    font-weight: 900;
    color: #0E2926;
    margin: 0 0 6px;
    position: relative;
    z-index: 2;
    text-shadow: 0 1px 4px rgba(255, 255, 255, 0.9);
}

.card-count {
    font-size: 13px;
    color: #135D57;
    font-weight: 700;
    margin-bottom: 16px;
    position: relative;
    z-index: 2;
    text-shadow: 0 1px 3px rgba(255, 255, 255, 0.95);
}

.card-bar {
    height: 6px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--card-accent) 15%, transparent);
    overflow: hidden;
    margin-bottom: 18px;
}

.bar-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--card-accent), #FF7E9D);
    transition: width 0.6s ease;
}

.card-action {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.94);
    border: none;
    box-shadow: 0 2px 8px rgba(14, 41, 38, 0.08);
    font-size: 12.5px;
    font-weight: 800;
    color: #0B7A73;
    margin-top: auto;
    transition: color 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}

.category-card:hover .card-action {
    color: #D94873;
    border-color: rgba(255, 126, 157, 0.48);
    transform: translateX(2px);
}

/* ==================== 骨架屏（原先无样式，加载态不可见） ==================== */
.skeleton {
    pointer-events: none;
}

.skeleton-circle,
.skeleton-line,
.skeleton-bar {
    border-radius: 8px;
    background: linear-gradient(90deg,
            rgba(57, 197, 187, 0.10) 25%,
            rgba(57, 197, 187, 0.24) 37%,
            rgba(57, 197, 187, 0.10) 63%);
    background-size: 400% 100%;
    animation: shimmerSweep 1.4s ease infinite;
}

.skeleton-circle {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    margin-bottom: 16px;
}

.skeleton-line {
    height: 14px;
    margin-bottom: 10px;
}

.skeleton-line.short {
    width: 58%;
    height: 18px;
}

.skeleton-line.medium {
    width: 34%;
}

.skeleton-bar {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    margin-top: auto;
}

@keyframes shimmerSweep {
    0% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0 50%;
    }
}

/* ==================== 空状态 ==================== */
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

.empty-note {
    display: block;
    margin-top: 10px;
    font-size: 14px;
    letter-spacing: 6px;
    color: var(--miku-teal);
    opacity: 0.6;
}

/* ==================== 响应式 ==================== */
@media (max-width: 640px) {
    .category-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .category-card {
        padding: 20px;
    }

    .category-card:hover {
        transform: translateY(-4px) scale(1.01) !important;
    }
}

/* ==================== 动效克制 ==================== */
@media (prefers-reduced-motion: reduce) {

    .skeleton-circle,
    .skeleton-line,
    .skeleton-bar,
    .icon-vinyl,
    .category-card {
        animation: none !important;
    }

    .category-card {
        opacity: 1;
        transform: rotate(var(--tilt, 0deg));
    }

    .category-card,
    .card-icon-box,
    .card-corner-note,
    .card-no {
        transition: none;
    }
}

html.reduce-motion .category-card,
html.reduce-motion .skeleton-circle,
html.reduce-motion .skeleton-line,
html.reduce-motion .skeleton-bar,
html.reduce-motion .icon-vinyl {
    animation: none !important;
}

html.reduce-motion .category-card {
    opacity: 1;
    transform: rotate(var(--tilt, 0deg));
}

html.reduce-motion .category-card,
html.reduce-motion .card-icon-box,
html.reduce-motion .card-corner-note,
html.reduce-motion .card-no {
    transition: none;
}
</style>
