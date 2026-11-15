<template>
    <section class="section-featured">
        <div class="section-inner">
            <!-- 栏目头部 -->
            <div class="section-header">
                <div class="header-main-row">
                    <div class="header-badge-row" style="align-items: baseline; gap: 12px;">
                        <h2 class="header-title gradient-text-shine">编辑精选</h2>
                        <span class="header-sub">精选 {{ displayArticles.length }} 篇 · 按推荐排序</span>
                    </div>
                    <div class="header-actions">
                        <button v-if="editable" class="edit-capsule-btn crystal-pill tactile-btn" @click="$emit('editFeatured')">
                            <span>编辑精选</span>
                        </button>
                        <button class="more-capsule-btn crystal-pill tactile-btn shine-effect" @click="$emit('viewMore')">
                            <span>查看更多</span>
                            <span class="arrow">→</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 4 栏等宽卡片网格 -->
            <div class="featured-grid" v-if="displayArticles && displayArticles.length > 0">
                <div
                    v-for="(article, index) in displayArticles.slice(0, 4)"
                    :key="article.id"
                    v-holo="{ tilt: 2.5 }"
                class="featured-card card-tier-elevated tactile-btn stagger-enter"
                    :style="{ animationDelay: index * 0.08 + 's' }"
                    @click="$emit('goArticle', article.id)"
                >
                    <!-- 封面与遮罩 -->
                    <div class="card-cover-wrap">
                        <img
                            v-if="coverUrl(article)"
                            :src="coverUrl(article)"
                            :alt="article.title"
                            class="card-img"
                            loading="lazy"
                            decoding="async"
                        />
                        <div v-else class="cover-fallback" :style="fallbackStyle(index)">
                            <span class="cover-initial">{{ initialOf(article.title) }}</span>
                            <span class="cover-hint">未设置封面</span>
                        </div>
                        <div class="card-top-badges">
                            <span v-if="article.category_name" class="category-pill">
                                {{ article.category_name }}
                            </span>
                        </div>
                    </div>

                    <!-- 内容区域 -->
                    <div class="card-content">
                        <h3 class="card-title hover-underline-miku">{{ article.title }}</h3>
                        <div v-if="article.date_str || article.create_time || article.read_time" class="card-meta">
                            <span v-if="article.date_str || article.create_time" class="meta-date">{{ formatDate(article.date_str || article.create_time) }}</span>
                            <span v-if="(article.date_str || article.create_time) && article.read_time" class="meta-dot">·</span>
                            <span v-if="article.read_time" class="meta-read">{{ normalizeReadTime(article.read_time) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <el-empty v-else description="暂无精选文章" :image-size="80" />
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue';
import { formatDate } from '../../utils/format';

const normalizeReadTime = (val) => {
    if (!val) return '';
    return String(val).replace(/\s*min read/i, ' 分钟阅读');
};

const props = defineProps({
    articles: {
        type: Array,
        default: () => []
    },
    editable: {
        type: Boolean,
        default: false
    }
});

defineEmits(['goArticle', 'viewMore', 'editFeatured']);

// 封面缺失时用分类色渐变 + 标题首字做占位，避免所有卡片共用同一张无关配图
const fallbackPalettes = [
    ['#0f766e', '#39c5bb'],
    ['#1e3a8a', '#3b82f6'],
    ['#7c2d12', '#f97316'],
    ['#4c1d95', '#a855f7'],
    ['#831843', '#ec4899'],
    ['#365314', '#84cc16']
];

// 只接受可直接访问的地址；裸存储 key（如 article/xxx.webp）视为无封面，避免出现破图
const coverUrl = (article) => {
    const url = article.cover_url || article.cover || '';
    if (!url) return '';
    return url.startsWith('/') || /^https?:\/\//i.test(url) ? url : '';
};
const initialOf = (title) => (title || '文').trim().slice(0, 1);
const fallbackStyle = (index) => {
    const [from, to] = fallbackPalettes[index % fallbackPalettes.length];
    return { background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` };
};

// 只展示后端返回的真实精选；没有数据时走空状态，不再用示例文章冒充
const displayArticles = computed(() => props.articles || []);

</script>

<style scoped>
.section-featured {
    padding: 48px 0 32px;
}

.section-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
}

/* 栏目头部 */
.section-header {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 24px;
}

.header-badge-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-badge {
    font-size: 11px;
    font-weight: 800;
    color: #39C5BB;
    letter-spacing: 2px;
}

.header-sub {
    font-size: 12px;
    color: #5C837F;
    font-weight: 500;
}

.header-main-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    flex-wrap: nowrap;
}

.header-actions {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-wrap: nowrap;
    flex-shrink: 0;
}

.edit-capsule-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 18px;
    border-radius: var(--radius-pill, 9999px);
    background: rgba(57, 197, 187, 0.12);
    border: none;
    color: #12A79C;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
    flex-shrink: 0;
}

.edit-capsule-btn:hover {
    background: #39C5BB;
    color: #FFFFFF;
    border-color: transparent;
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.4);
}

.header-title {
    font-size: 26px;
    font-weight: 800;
    color: #14322F;
    margin: 0;
    letter-spacing: 0.5px;
}

.more-capsule-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 18px;
    border-radius: var(--radius-pill, 9999px);
    background: #E3F7F4;
    border: none;
    color: #12A79C;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
    flex-shrink: 0;
}

.more-capsule-btn .arrow {
    transition: transform 0.2s ease;
}

.more-capsule-btn:hover {
    background: #39C5BB;
    color: #FFFFFF;
    border-color: transparent;
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.4);
}

.more-capsule-btn:hover .arrow {
    transform: translateX(4px);
}

/* ==================== 4 栏等宽网格 (306px × 320px) ==================== */
.featured-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.featured-card {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    cursor: pointer;
    background: linear-gradient(160deg, #FFFFFF 0%, rgba(239, 251, 249, 0.92) 100%);
    border: none;
    box-shadow: 0 10px 28px rgba(8, 90, 87, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
}

.featured-card:hover {
    transform: translateY(-4px);
    border-color: rgba(57, 197, 187, 0.5);
    box-shadow: 0 14px 36px rgba(8, 90, 87, 0.16);
}

/* 封面图 16:9 */
.card-cover-wrap {
    width: 100%;
    aspect-ratio: 16 / 9;
    position: relative;
    overflow: hidden;
    background: #f1f5f9;
}

.card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: none;
    opacity: 1;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
}

.featured-card:hover .card-img {
    transform: scale(1.05);
    filter: brightness(1.05);
}

.cover-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: rgba(255, 255, 255, 0.94);
}

.cover-initial {
    font-size: 38px;
    font-weight: 800;
    letter-spacing: 2px;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
}

.cover-hint {
    font-size: 11px;
    letter-spacing: 1px;
    opacity: 0.82;
}

.card-top-badges {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
}

.category-pill {
    padding: 3px 10px;
    border-radius: var(--radius-pill, 9999px);
    background: rgba(20, 50, 47, 0.88);
    border: none;
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 700;
}

/* 内容区 */
.card-content {
    padding: 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    gap: 10px;
}

.card-title {
    font-size: 15px;
    font-weight: 700;
    color: #14322F;
    margin: 0;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease;
}

.featured-card:hover .card-title {
    color: #39C5BB;
}

.card-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #5C837F;
    font-weight: 500;
}

@media (max-width: 1024px) {
    .featured-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }
}

@media (max-width: 640px) {
    .section-featured {
        padding: 24px 0 16px;
    }

    .section-inner {
        padding: 0 16px;
    }

    .section-header {
        gap: 2px;
        margin-bottom: 16px;
    }

    .header-badge-row {
        gap: 6px;
        flex-wrap: wrap;
    }

    .header-badge {
        font-size: 10px;
        letter-spacing: 1px;
    }

    .header-sub {
        font-size: 11px;
    }

    .header-main-row {
        gap: 6px;
        flex-wrap: nowrap;
        align-items: center;
    }

    .header-title {
        font-size: 19px;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .header-actions {
        gap: 6px;
        flex-wrap: nowrap;
        flex-shrink: 0;
        margin-left: auto;
    }

    .edit-capsule-btn,
    .more-capsule-btn {
        padding: 4px 10px;
        font-size: 11.5px;
    }

    .featured-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }
}

@media (max-width: 480px) {
    .header-main-row {
        gap: 4px;
    }

    .header-title {
        font-size: 17px;
    }

    .edit-capsule-btn,
    .more-capsule-btn {
        padding: 4px 8px;
        font-size: 11px;
        gap: 3px;
    }

    .featured-grid {
        grid-template-columns: 1fr;
        gap: 14px;
    }
}
</style>