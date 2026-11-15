<template>
    <div class="home-page">
        <!-- 1. 二次元学园 Hero 轮播 -->
        <HomeBanner :stats="siteStats" />

        <!-- 2. 学园研讨室分类导航 -->
        <QuickNav
            :categories="categoryList"
            :active-id="activeCategoryId"
            :categories-count="siteStats.categories"
            :articles-count="siteStats.articles"
            @change="handleCategoryChange"
        />

        <!-- 3. 特选知识任务推荐 -->
        <FeaturedGrid :articles="hotArticles" :editable="isAdmin" @go-article="goToArticle" @view-more="router.push('/articles')" @edit-featured="openEditFeatured" />

        <!-- 编辑精选管理（仅管理员可见，写入回管理端推荐文章列表） -->
        <EditFeaturedDialog v-model:visible="editFeaturedVisible" :featured="hotArticles" @saved="onFeaturedSaved" />

        <!-- 4. 主内容区 (任务文库 + 侧边助理信息面板) -->
        <section class="section section-main">
            <div class="section-inner">
                <div class="main-layout">
                    <!-- 左侧文章列表 -->
                    <LatestArticles
                        v-model:sort="currentSort"
                        :articles="latestArticles"
                        :loading="loadingMore"
                        :has-more="hasMoreArticles"
                        :total-count="totalArticlesCount"
                        @go-article="goToArticle"
                        @load-more="handleLoadMore"
                        @sort-change="handleSortChange"
                        @retry="handleRetry"
                    />

                    <!-- 右侧边栏 -->
                    <aside class="main-right">
                        <SidebarStats :stats="siteStats" />
                        <SidebarCalendar />
                        <SidebarTags :tags="tagList" @go-tag="goToTag" />
                        <SidebarMusic />
                        <SidebarRank :articles="rankArticles" @go-article="goToArticle" />
                        <SidebarComments :comments="latestComments" @go-article="goToArticle" />
                    </aside>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import request, { prefetchHomeBootstrap } from '../../api/request';
import { getRecommendArticles, getHotArticles } from '../../api/article';
import { getLatestComments } from '../../api/comment';
import { useStatsSync } from '../../composables/useStatsSync';

import HomeBanner from '../../components/HomeBanner.vue';
import QuickNav from '../../components/home/QuickNav.vue';
import FeaturedGrid from '../../components/home/FeaturedGrid.vue';
const EditFeaturedDialog = defineAsyncComponent(() => import('../../components/home/EditFeaturedDialog.vue'));
import LatestArticles from '../../components/home/LatestArticles.vue';
import SidebarStats from '../../components/home/SidebarStats.vue';
import SidebarCalendar from '../../components/home/SidebarCalendar.vue';
import SidebarTags from '../../components/home/SidebarTags.vue';
import SidebarMusic from '../../components/home/SidebarMusic.vue';
import SidebarRank from '../../components/home/SidebarRank.vue';
import SidebarComments from '../../components/home/SidebarComments.vue';

const router = useRouter();

// 只补齐展示字段，不再用首页图片覆盖文章真实封面
const normalizeFeatured = (articles) =>
  (articles || []).map((a) => ({
    ...a,
    date_str: a.date_str || '',
    read_time: a.read_time || '',
  }));

// 仅当管理端 token 存在时，首页展示「编辑精选」入口（同源 localStorage 可读）
const isAdmin = computed(() => !!localStorage.getItem('admin_token'));
const editFeaturedVisible = ref(false);
const openEditFeatured = () => { editFeaturedVisible.value = true; };
const onFeaturedSaved = () => {
  editFeaturedVisible.value = false;
  fetchHotArticles();
};

// 数据
const categoryList = ref([]);
const tagList = ref([]);
const hotArticles = ref([]);
const latestArticles = ref([]);
const rankArticles = ref([]);
const latestComments = ref([]);
const activeCategoryId = ref(null);
const currentSort = ref('latest');

// 分页与加载状态
const currentPage = ref(1);
const pageSize = ref(6);
const loadingMore = ref(false);
const hasMoreArticles = ref(true);
const totalArticlesCount = ref(0);

// 首页初始化前立即触发单请求聚合预取，消除 9 个并发 API 排队
prefetchHomeBootstrap();

// 站点统计：统一由 statsStore 提供并以 useStatsSync 周期刷新，
// HomeBanner / SidebarStats / QuickNav 等同页组件自动响应式同步
const statsStore = useStatsSync();
const siteStats = computed(() => statsStore.stats);

// 获取数据
const fetchCategories = async () => {
    try {
        const res = await request.get('/category');
        categoryList.value = res.data;
    } catch (error) { console.error('获取分类失败:', error); }
};

const fetchTags = async () => {
    try {
        const res = await request.get('/tag');
        tagList.value = res.data;
    } catch (error) { console.error('获取标签失败:', error); }
};

const fetchHotArticles = async () => {
  try {
    const res = await getRecommendArticles(5);
    hotArticles.value = normalizeFeatured(res.data);
  } catch (error) { console.error('获取推荐文章失败:', error); }
};

// 首页文章按页加载（追加模式）
const fetchArticlesList = async (isLoadMore = false) => {
    if (isLoadMore) {
        if (loadingMore.value || !hasMoreArticles.value) return;
        loadingMore.value = true;
        currentPage.value += 1;
    } else {
        currentPage.value = 1;
        loadingMore.value = false;
        hasMoreArticles.value = true;
    }

    try {
        const params = {
            page: currentPage.value,
            pageSize: pageSize.value,
            sort: currentSort.value
        };
        if (activeCategoryId.value) {
            params.category_id = activeCategoryId.value;
        }

        const res = await request.get('/article', { params });
        const list = res.data.list || [];
        const total = res.data.total || 0;

        totalArticlesCount.value = total;

        if (isLoadMore) {
            const existingIds = new Set(latestArticles.value.map(a => a.id));
            const uniqueNewArticles = list.filter(a => !existingIds.has(a.id));
            latestArticles.value = [...latestArticles.value, ...uniqueNewArticles];
        } else {
            latestArticles.value = list;
        }

        hasMoreArticles.value = latestArticles.value.length < total;
    } catch (error) {
        console.error('获取文章列表失败:', error);
        hasMoreArticles.value = false;
    } finally {
        loadingMore.value = false;
    }
};

const handleLoadMore = () => {
    fetchArticlesList(true);
};

const handleSortChange = (sortType) => {
    currentSort.value = sortType;
    fetchArticlesList(false);
};

const handleRetry = () => {
    activeCategoryId.value = null;
    fetchArticlesList(false);
};

const fetchRank = async () => {
    try {
        const res = await getHotArticles(8);
        rankArticles.value = res.data;
    } catch (error) { console.error('获取排行失败:', error); }
};

const fetchComments = async () => {
    try {
        const res = await getLatestComments(5);
        latestComments.value = res.data;
    } catch (error) { console.error('获取评论失败:', error); }
};

// 事件处理
const handleCategoryChange = (id) => {
    activeCategoryId.value = id;
    fetchArticlesList(false);
};

const goToArticle = (id) => router.push(`/article/${id}`);
const goToTag = (id) => router.push({ path: '/articles', query: { tag_id: id } });

onMounted(() => {
    fetchCategories();
    fetchTags();
    fetchArticlesList(false);
    fetchRank();
    fetchComments();
    fetchHotArticles();
});
</script>

<style scoped>
.home-page {
    min-height: 100vh;
}

.section {
    padding: 24px 0 60px;
}

.section-inner {
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 24px;
}

/* 主布局 */
.main-layout {
    display: flex;
    gap: 28px;
    align-items: flex-start;
}

/* 左侧主内容 */
.main-layout > :first-child {
    flex: 1;
    min-width: 0;
}

/* 右侧边栏 */
.main-right {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* 性能优化：侧边栏卡片离屏布局跳过 */
.main-right > * {
    content-visibility: auto;
    contain-intrinsic-size: auto 300px;
}

/* 响应式适配 */
@media screen and (max-width: 992px) {
    .main-layout {
        flex-direction: column;
    }
    .main-right {
        width: 100%;
        margin-top: 20px;
    }
}

@media screen and (max-width: 768px) {
    .section {
        padding: 16px 0 40px;
    }
    .section-inner {
        padding: 0 16px;
    }
    .main-layout {
        gap: 16px;
    }
}
</style>