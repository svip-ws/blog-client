<template>
    <div class="page-container">
        <MikuPageHero motif="tags" title="标签" subtitle="聚焦具体技术细节与关键词，发现相互关联的精选内容。"
            banner="/images/miku/miku_tags_banner.jpg" :stats="heroStats" />

        <!-- 加载骨架 -->
        <div v-if="loading" class="tag-grid">
            <div v-for="i in 8" :key="i" class="tag-card glass-miku-card skeleton">
                <div class="tag-body">
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="tags.length === 0" class="empty-state-box glass-miku-card">
            <div class="empty-icon">🎧</div>
            <p class="empty-text">暂无标签数据，去后台给文章加个标签吧！</p>
            <span class="empty-note">✦ ♪ ♫ ♪ ✦</span>
        </div>

        <!-- 标签网格 · 音符频谱卡 -->
        <div v-else class="tag-grid">
            <div v-for="(tag, index) in tags" :key="tag.id"
                v-holo="{ tilt: 2 }"
                class="tag-card glass-miku-card tactile-btn"
                :class="['theme-' + (index % 5), { 'no-articles': !tag.article_count }]"
                :style="{ animationDelay: index * 0.05 + 's' }" @click="handleTagClick(tag)">
                <!-- Q版初音立绘 / 主题插画背景区 -->
                <div class="tag-illus-wrap">
                    <img
                        v-if="getTagIllustration(tag, index)"
                        :src="getTagIllustration(tag, index)"
                        :alt="tag.name"
                        class="tag-illus-img"
                        loading="lazy"
                        decoding="async"
                        @error="onTagImgError(index)"
                    />
                    <div class="tag-scrim-mask"></div>
                </div>

                <div class="tag-body">
                    <div class="tag-top">
                        <span class="tag-name">{{ cleanTagName(tag.name) }}</span>
                    </div>
                    <div class="tag-bottom">
                        <span class="tag-count">
                            <el-icon><Document /></el-icon>
                            {{ tag.article_count || 0 }} 篇
                        </span>
                        <span class="tag-arrow">→</span>
                    </div>
                </div>

                <!-- 左下角音符水印 -->
                <span class="card-corner-note">♪</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '../../api/request';
import MikuPageHero from '../../components/common/MikuPageHero.vue';
import { Document } from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(false);
const tags = ref([]);

const cleanTagName = (name) => String(name || '').replace(/^#+/, '');

const totalArticles = computed(() => {
    return tags.value.reduce((sum, t) => sum + (t.article_count || 0), 0);
});

const maxCount = computed(() => {
    return Math.max(...tags.value.map(t => t.article_count || 0), 1);
});

/* Hero 统计胶囊：加载中或空数据时不渲染 */
const heroStats = computed(() => {
    if (loading.value || tags.value.length === 0) return [];
    return [
        { glyph: '✦', value: tags.value.length, label: '个标签' },
        { glyph: '🎧', value: totalArticles.value, label: '篇关联' }
    ];
});

/* 频谱波形比例（固定抖动序列，保证同一标签高度稳定可复现） */
const WAVE = [1, 0.58, 0.86, 0.44, 0.76, 0.52, 0.9];

const eqHeights = (count) => {
    const base = Math.max(16, Math.round(((count || 0) / maxCount.value) * 100));
    return WAVE.map(w => Math.max(14, Math.round(base * w)));
};

const fetchTags = async () => {
    loading.value = true;
    try {
        const res = await request.get('/tag');
        tags.value = res.data;
    } catch (error) {
        console.error('获取标签失败:', error);
    } finally {
        loading.value = false;
    }
};

const handleTagClick = (tag) => {
    router.push({ path: '/articles', query: { tag_id: tag.id } });
};

/* Q版初音立绘与主题插画库 */
const MIKU_TAG_ILLUSTRATIONS = [
    '/images/miku/miku_chibi_main.png',
    '/images/miku/miku_wp_2.jpg',
    '/images/miku/miku_wp_3.jpg',
    '/images/miku/miku_wp_4.jpg',
    '/images/miku/miku_wp_5.jpg',
    '/images/miku/miku_wp_8.jpg'
];

const imgBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');

const brokenTagImgs = ref([]);
const onTagImgError = (idx) => {
    if (!brokenTagImgs.value.includes(idx)) brokenTagImgs.value.push(idx);
};
const getTagIllustration = (tag, index) => {
    if (brokenTagImgs.value.includes(index)) return '';
    const customCover = tag?.cover_url || tag?.cover || tag?.bg_image;
    if (customCover) {
        if (customCover.startsWith('http://') || customCover.startsWith('https://')) return customCover;
        if (customCover.startsWith('/uploads/')) return imgBase ? `${imgBase}${customCover}` : customCover;
        return customCover;
    }
    return MIKU_TAG_ILLUSTRATIONS[index % MIKU_TAG_ILLUSTRATIONS.length];
};

onMounted(() => {
    fetchTags();
});
</script>

<style scoped>
.page-container {
    max-width: 1040px;
    margin: 0 auto;
    padding: var(--navbar-clearance) 20px 60px;
}

/* ==================== 卡片基座 ==================== */
.glass-miku-card {
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: none;
    box-shadow: 0 10px 30px rgba(57, 197, 187, 0.1);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.tag-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 20px;
}

/* ==================== 标签卡片 ==================== */
.tag-card {
    --tilt: 0deg;
    --card-accent: var(--miku-teal);
    position: relative;
    padding: 20px;
    cursor: pointer;
    overflow: hidden;
    /* backwards：延迟期显示 from 态，结束后交还常态样式，避免锁死 hover 位移 */
    animation: cardRiseIn 0.62s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    transform: rotate(var(--tilt, 0deg));
}

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

.tag-card:nth-child(3n+1) {
    --tilt: -0.5deg;
}

.tag-card:nth-child(3n+2) {
    --tilt: 0.5deg;
}

.tag-card:nth-child(3n+3) {
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

.tag-card:hover {
    transform: rotate(0deg) translateY(-8px) scale(1.02) !important;
    border-color: color-mix(in srgb, var(--card-accent) 55%, transparent);
    box-shadow: 0 16px 36px rgba(57, 197, 187, 0.22), 0 0 22px color-mix(in srgb, var(--card-accent) 32%, transparent);
    z-index: 5;
}

.tag-illus-wrap {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    border-radius: 20px;
}

.tag-illus-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 22%;
    opacity: 0.16;
    filter: saturate(1.05) blur(1.8px);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease;
}

.tag-scrim-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(125deg, rgba(255, 255, 255, 0.72) 0%, rgba(238, 253, 250, 0.56) 55%, rgba(255, 238, 246, 0.44) 100%);
    transition: background 0.3s ease, opacity 0.3s ease;
}

.tag-card:hover .tag-illus-img {
    transform: scale(1.08) rotate(1deg);
    opacity: 0.92;
    filter: saturate(1.28) contrast(1.06) blur(0px);
}

.tag-card:hover .tag-scrim-mask {
    background: linear-gradient(125deg, rgba(255, 255, 255, 0.42) 0%, rgba(238, 253, 250, 0.28) 55%, rgba(255, 238, 246, 0.20) 100%);
}

.tag-card.no-articles {
    opacity: 0.72;
}


/* 左下角音符水印 */
.card-corner-note {
    position: absolute;
    left: 14px;
    bottom: 10px;
    font-size: 13px;
    color: var(--card-accent);
    opacity: 0.4;
    pointer-events: none;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}

.tag-card:hover .card-corner-note {
    opacity: 0.9;
    transform: translateY(-3px) rotate(-12deg);
}

.tag-body {
    position: relative;
    z-index: 2;
}

.tag-top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    padding-right: 68px;
}

.tag-hash {
    font-family: 'Audiowide', sans-serif;
    font-size: 16px;
    font-weight: 900;
    color: var(--card-accent);
    text-shadow: 0 1px 3px rgba(255, 255, 255, 0.95);
    transition: text-shadow 0.3s ease;
}

.tag-card:hover .tag-hash {
    text-shadow: 0 0 12px var(--card-accent);
}

.tag-name {
    font-size: 16px;
    font-weight: 900;
    color: #0E2926;
    text-shadow: 0 1px 4px rgba(255, 255, 255, 0.95);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 迷你频谱（按文章数归一化） */
.tag-eq {
    position: absolute;
    right: 0;
    top: -3px;
    width: 46px;
    height: var(--eq-h-sm);
    display: flex;
    align-items: flex-end;
    gap: var(--eq-gap);
    opacity: 0.42;
    transition: opacity 0.3s ease;
}

.tag-eq i {
    flex: 1;
    border-radius: 2px 2px 0 0;
    background: linear-gradient(180deg, var(--card-accent) 0%, #FF7E9D 100%);
    transform-origin: bottom;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.tag-card:hover .tag-eq {
    opacity: 1;
}

.tag-card:hover .tag-eq i {
    animation: eqPulse 1.1s ease-in-out infinite alternate;
}

@keyframes eqPulse {
    from {
        transform: scaleY(0.42);
    }

    to {
        transform: scaleY(1);
    }
}

.tag-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12.5px;
    color: #7A9E99;
    padding-left: 18px;
}

.tag-count {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-weight: 700;
    color: #00687d;
    text-shadow: 0 1px 4px rgba(255, 255, 255, 0.95);
}

.tag-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-weight: 800;
    font-size: 13px;
    color: #085A57;
    background: rgba(255, 255, 255, 0.88);
    border: none;
    box-shadow: 0 2px 6px rgba(8, 90, 87, 0.12);
    transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.tag-card:hover .tag-arrow {
    transform: translateX(4px);
    color: #FFFFFF;
    background: linear-gradient(135deg, #39C5BB, #FF7E9D);
    border-color: transparent;
}

/* ==================== 骨架屏（原先无样式，加载态不可见） ==================== */
.skeleton {
    pointer-events: none;
}

.skeleton-line {
    border-radius: 8px;
    height: 14px;
    margin-bottom: 10px;
    background: linear-gradient(90deg,
            rgba(57, 197, 187, 0.10) 25%,
            rgba(57, 197, 187, 0.24) 37%,
            rgba(57, 197, 187, 0.10) 63%);
    background-size: 400% 100%;
    animation: shimmerSweep 1.4s ease infinite;
}

.skeleton-line.medium {
    width: 62%;
    height: 18px;
}

.skeleton-line.short {
    width: 34%;
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
    font-family: 'Audiowide', sans-serif;
    font-size: 13px;
    letter-spacing: 6px;
    color: var(--miku-teal);
    opacity: 0.6;
}

/* ==================== 响应式 ==================== */
@media (max-width: 640px) {
    .tag-grid {
        grid-template-columns: 1fr;
        gap: 14px;
    }

    .tag-card {
        padding: 16px 18px;
    }

    .tag-card:hover {
        transform: translateY(-4px) scale(1.01) !important;
    }

    .tag-eq {
        width: 40px;
        height: var(--eq-h-xs);
    }
}

/* ==================== 动效克制 ==================== */
@media (prefers-reduced-motion: reduce) {

    .tag-card,
    .skeleton-line,
    .tag-eq i {
        animation: none !important;
    }

    .tag-card {
        opacity: 1;
        transform: rotate(var(--tilt, 0deg));
    }

    .tag-card,
    .tag-eq,
    .tag-eq i,
    .tag-hash,
    .tag-arrow,
    .card-corner-note {
        transition: none;
    }
}

html.reduce-motion .tag-card,
html.reduce-motion .skeleton-line,
html.reduce-motion .tag-eq i {
    animation: none !important;
}

html.reduce-motion .tag-card {
    opacity: 1;
    transform: rotate(var(--tilt, 0deg));
}

html.reduce-motion .tag-card,
html.reduce-motion .tag-eq,
html.reduce-motion .tag-eq i,
html.reduce-motion .tag-hash,
html.reduce-motion .tag-arrow,
html.reduce-motion .card-corner-note {
    transition: none;
}
</style>
