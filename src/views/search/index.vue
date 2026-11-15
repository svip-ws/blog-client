<template>
    <div class="search-page">
        <!-- 初音赛博 Hero 检索头部 -->
        <div class="search-hero">
            <div class="hero-miku-bg-wrap" aria-hidden="true">
                <img src="/images/miku/miku_wp_8.jpg" alt="Miku Search Background" class="hero-miku-bg-img" />
                <div class="hero-scrim-overlay"></div>
                <div class="hero-orb orb-cyan"></div>
                <div class="hero-orb orb-teal"></div>
                <div class="hero-orb orb-blue"></div>
            </div>

            <div class="hero-content">
                <h1 class="hero-title">全站检索</h1>
                <p class="hero-sub">搜索站内技术文章、学习笔记与关键词标签</p>

                <!-- 赛博胶囊搜索框 (无红色) -->
                <div class="search-bar-container">
                    <div class="miku-search-capsule">
                        <el-input
                            v-model="keyword"
                            size="large"
                            placeholder="搜索初音音律、知识档案、标签话题... ♪"
                            clearable
                            @keyup.enter="doSearch"
                            @clear="keyword = ''"
                        >
                            <template #prefix>
                                <el-icon class="search-input-icon"><Search /></el-icon>
                            </template>
                            <template #append>
                                <button class="miku-search-submit-btn tactile-btn shine-effect" @click="doSearch" :disabled="loading">
                                    <el-icon v-if="!loading"><Search /></el-icon>
                                    <el-icon v-else class="is-loading"><Loading /></el-icon>
                                    <span>{{ loading ? '检索中...' : '检索' }}</span>
                                </button>
                            </template>
                        </el-input>
                    </div>

                    <!-- 快捷标签推荐 (初音热搜) -->
                    <div class="hero-hot-tags">
                        <span class="hot-label">🎵 热热搜话题：</span>
                        <span
                            v-for="tag in hotTags"
                            :key="tag"
                            class="miku-hot-tag-chip"
                            @click="quickSearch(tag)"
                        >
                            {{ tag }}
                        </span>
                    </div>

                    <p class="search-summary" v-if="searched">
                        共找到 <strong>{{ articleList.length }}</strong> 篇关于「<span class="kw-text">{{ searchedKeyword }}</span>」的档案记录
                    </p>
                </div>
            </div>
        </div>

        <!-- 搜索结果列表区 -->
        <div class="results-section" v-loading="loading">
            <div
                v-for="(article, index) in articleList"
                :key="article.id"
                v-holo
                class="miku-article-card glass-miku-card"
                :style="{ animationDelay: index * 0.05 + 's' }"
                @click="goToDetail(article.id)"
            >
                <div class="card-top-miku-line"></div>
                
                <div class="card-cover">
                    <img :src="getArticleCover(article, index)" class="cover-img" @error="onCoverError(article.id)" />
                </div>

                <div class="card-content">
                    <div class="card-header">
                        <span class="miku-card-index">#{{ String(index + 1).padStart(2, '0') }}</span>
                        <span class="card-category" v-if="article.category_name">{{ article.category_name }}</span>
                        <span class="card-time">{{ formatTime(article.create_time) }}</span>
                    </div>

                    <h3 class="card-title">
                        <span v-html="highlightKeyword(article.title)"></span>
                    </h3>

                    <p class="card-desc" v-if="article.description">
                        <span v-html="highlightKeyword(article.description)"></span>
                    </p>

                    <div class="card-footer">
                        <div class="card-author">
                            <div class="miku-author-avatar-ring">
                                <div class="author-avatar">{{ article.author_name?.charAt(0) || '初' }}</div>
                            </div>
                            <span>{{ article.author_name }}</span>
                        </div>

                        <div class="card-tags" v-if="article.tag_names && article.tag_names.length">
                            <span v-for="(name, i) in article.tag_names.slice(0, 3)" :key="i" class="miku-tag-pill">
                                {{ name }}
                            </span>
                        </div>

                        <span class="meta-item">
                            <el-icon :size="13"><View /></el-icon>
                            {{ article.view_count }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div class="miku-empty-box glass-miku-card" v-if="!loading && searched && articleList.length === 0">
                <div class="empty-icon-ring">🎵</div>
                <h3 class="empty-title">未找到相关初音档案</h3>
                <p class="empty-sub">没有检索到与「{{ searchedKeyword }}」相关的文章，试着更换关键词吧 ♪</p>
            </div>

            <!-- 初始占位提示 -->
            <div class="miku-placeholder-box glass-miku-card" v-if="!searched && !loading">
                <div class="miku-pulse-icon">♪</div>
                <p class="placeholder-text">输入关键词，解锁初音未来知识库与音律笔记</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { searchArticles } from '../../api/article';
import { formatTime } from '../../utils/format';
import { escapeHtml } from '../../utils/sanitize';
import { Search, View, Picture, Loading } from '@element-plus/icons-vue';
import { getMikuWallpaper } from '../../utils/mikuImage';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const keyword = ref('');
const searchedKeyword = ref('');
const searched = ref(false);
const articleList = ref([]);

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

const hotTags = ['初音未来', 'VOCALOID', '千本樱', '电子歌姬', '音乐创作', '美学笔记'];

const quickSearch = (tag) => {
    keyword.value = tag;
    doSearch();
};

const doSearch = async () => {
    if (!keyword.value.trim()) return;
    router.replace({ path: '/search', query: { keyword: keyword.value.trim() } });
    loading.value = true;
    searched.value = true;
    searchedKeyword.value = keyword.value.trim();
    try {
        const res = await searchArticles(keyword.value.trim());
        articleList.value = res.data.list;
    } catch (error) {
        console.error('搜索失败:', error);
        articleList.value = [];
    } finally {
        loading.value = false;
    }
};

const highlightKeyword = (text) => {
    if (!text || !searchedKeyword.value) return escapeHtml(text);
    const escaped = searchedKeyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text
        .split(new RegExp(`(${escaped})`, 'gi'))
        .map((part, i) =>
            i % 2 === 1
                ? `<span class="miku-highlight">${escapeHtml(part)}</span>`
                : escapeHtml(part)
        )
        .join('');
};

const goToDetail = (id) => { router.push(`/article/${id}`); };

onMounted(() => {
    const q = route.query.keyword;
    if (q) { keyword.value = q; doSearch(); }
});

watch(() => route.query.keyword, (newVal) => {
    if (newVal && newVal !== keyword.value) { keyword.value = newVal; doSearch(); }
});
</script>

<style scoped>
.search-page {
    background: transparent;
    min-height: 100vh;
}

/* ==================== 初音赛博 Search Hero ==================== */
.search-hero {
    position: relative;
    padding: calc(var(--navbar-clearance) + 20px) 20px 60px;
    text-align: center;
    overflow: hidden;
    isolation: isolate;
    border-bottom: 1.5px solid rgba(57, 197, 187, 0.35);
}

.hero-miku-bg-wrap {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
}

.hero-miku-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.22;
    filter: blur(4px) saturate(1.2);
    transition: all 0.6s ease;
}

.search-hero:hover .hero-miku-bg-img {
    opacity: 0.42;
    filter: blur(0px) brightness(1.05) saturate(1.25);
}

.hero-scrim-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(14, 34, 32, 0.78) 0%, rgba(10, 26, 25, 0.92) 100%);
}

.hero-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    pointer-events: none;
}

.orb-cyan {
    width: 220px;
    height: 220px;
    background: #39C5BB;
    top: -50px;
    left: 15%;
}

.orb-teal {
    width: 180px;
    height: 180px;
    background: #12A79C;
    bottom: -40px;
    right: 15%;
}

.orb-blue {
    width: 140px;
    height: 140px;
    background: #0B7A73;
    top: 30%;
    right: 30%;
}

.hero-content {
    position: relative;
    z-index: 2;
    max-width: 760px;
    margin: 0 auto;
}

.miku-hud-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 18px;
    background: rgba(18, 42, 40, 0.65);
    border: none;
    color: #39C5BB;
    font-size: 11px;
    font-weight: 800;
    border-radius: 9999px;
    letter-spacing: 2px;
    margin-bottom: 20px;
    box-shadow: 0 4px 20px rgba(57, 197, 187, 0.25);
    backdrop-filter: blur(12px);
}

.hud-tag {
    background: linear-gradient(135deg, #0B7A73, #08635D);
    color: #FFFFFF;
    font-family: monospace;
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 9999px;
}

.hero-title {
    font-size: 36px;
    font-weight: 900;
    margin: 0 0 6px;
    color: #FFFFFF;
    letter-spacing: 1px;
    text-shadow: 0 4px 18px rgba(57, 197, 187, 0.4);
}

.hero-sub {
    font-family: monospace;
    font-size: 11px;
    font-weight: 800;
    color: #39C5BB;
    letter-spacing: 2.5px;
    margin: 0 0 28px;
}

/* 赛博胶囊搜索框 */
.search-bar-container {
    max-width: 620px;
    margin: 0 auto;
}

.miku-search-capsule :deep(.el-input__wrapper) {
    border-radius: 40px 0 0 40px;
    padding: 6px 16px;
    background: rgba(255, 255, 255, 0.95);
    border: none;
    box-shadow: 0 6px 24px rgba(8, 90, 87, 0.14);
    transition: all 0.3s ease;
}

.miku-search-capsule :deep(.el-input__wrapper:focus-within) {
    background: #FFFFFF;
    box-shadow: 0 0 24px rgba(57, 197, 187, 0.45);
}

.miku-search-capsule :deep(.el-input-group__append) {
    border-radius: 0 40px 40px 0;
    background: transparent;
    padding: 0;
    border: none;
}

.search-input-icon {
    font-size: 16px;
    color: #12A79C;
}

.miku-search-submit-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 44px;
    padding: 0 24px;
    background: linear-gradient(135deg, #0B7A73 0%, #08635D 100%);
    color: #FFFFFF;
    font-size: 13.5px;
    font-weight: 800;
    border: none;
    border-radius: 0 40px 40px 0;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.3);
}

.miku-search-submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #39C5BB 0%, #12A79C 100%);
    box-shadow: 0 6px 20px rgba(57, 197, 187, 0.5);
}

.miku-search-submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.hero-hot-tags {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
}

.hot-label {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
}

.miku-hot-tag-chip {
    padding: 4px 12px;
    border-radius: 9999px;
    background: rgba(57, 197, 187, 0.16);
    border: none;
    color: #A3F3ED;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s ease;
}

.miku-hot-tag-chip:hover {
    background: #39C5BB;
    color: #0E2220;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.4);
}

.search-summary {
    font-size: 13.5px;
    color: rgba(255, 255, 255, 0.9);
    margin-top: 20px;
}

.kw-text {
    color: #39C5BB;
    font-weight: 800;
}

/* ==================== 搜索结果区 ==================== */
.results-section {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 20px 80px;
}

/* 搜索结果卡：开 content-visibility 让离屏结果跳过渲染；transition 仅过渡 hover 实际改动的属性 */
.miku-article-card {
    position: relative;
    display: flex;
    gap: 0;
    align-items: center;
    margin-bottom: 18px;
    background: rgba(255, 255, 255, 0.94);
    border-radius: 20px;
    border: none;
    cursor: pointer;
    overflow: hidden;
    content-visibility: auto;
    contain-intrinsic-size: auto 160px;
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.35s ease;
    box-shadow: 0 8px 24px rgba(8, 90, 87, 0.08);
}

.card-top-miku-line {
    display: none;
}

.miku-article-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 34px rgba(57, 197, 187, 0.22);
}

.card-cover {
    width: 180px;
    height: 140px;
    flex-shrink: 0;
    overflow: hidden;
    position: relative;
}

.cover-img {
    width: 100%;
    height: 100%;
    transition: transform 0.4s ease;
}

.miku-article-card:hover .cover-img {
    transform: scale(1.06);
}

.cover-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(57, 197, 187, 0.08);
    color: #12A79C;
}

.card-content {
    flex: 1;
    padding: 20px 24px;
    min-width: 0;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.miku-card-index {
    font-family: monospace;
    font-size: 13px;
    font-weight: 900;
    color: #39C5BB;
    background: rgba(57, 197, 187, 0.12);
    padding: 2px 8px;
    border-radius: 6px;
}

.card-category {
    font-size: 11.5px;
    font-weight: 700;
    padding: 3px 12px;
    border-radius: 9999px;
    background: rgba(18, 167, 156, 0.12);
    color: #12A79C;
}

.card-time {
    font-size: 12px;
    color: #64748B;
}

.card-title {
    font-size: 17.5px;
    font-weight: 800;
    color: #0F3B37;
    margin: 0 0 8px;
    line-height: 1.4;
}

.card-desc {
    font-size: 13.5px;
    color: #475569;
    margin: 0 0 14px;
    line-height: 1.6;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

:deep(.miku-highlight) {
    color: #0B7A73;
    font-weight: 900;
    background: rgba(57, 197, 187, 0.25);
    padding: 1px 5px;
    border-radius: 4px;
}

.card-footer {
    display: flex;
    align-items: center;
    gap: 14px;
}

.card-author {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    font-weight: 700;
    color: #334155;
}

.miku-author-avatar-ring {
    padding: 1.5px;
    border-radius: 50%;
    background: linear-gradient(135deg, #39C5BB, #12A79C);
}

.author-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #FFFFFF;
    color: #0B7A73;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
}

.miku-tag-pill {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 9999px;
    background: rgba(57, 197, 187, 0.1);
    color: #0F4F49;
    border: none;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #64748B;
    margin-left: auto;
}

/* 空状态 */
.miku-empty-box,
.miku-placeholder-box {
    text-align: center;
    padding: 60px 20px;
    border-radius: 24px;
    border: none;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 10px 30px rgba(8, 90, 87, 0.08);
}

.empty-icon-ring,
.miku-pulse-icon {
    font-size: 42px;
    color: #39C5BB;
    margin-bottom: 12px;
}

.empty-title {
    font-size: 18px;
    font-weight: 800;
    color: #0F3B37;
    margin: 0 0 6px;
}

.empty-sub,
.placeholder-text {
    font-size: 14px;
    color: #64748B;
    margin: 0;
}
</style>