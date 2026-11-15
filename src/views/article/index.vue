<template>
    <div class="detail-container" v-loading="loading">
        <!-- 漂浮二次元音符与光斑全息星空背景 -->
        <div class="bg-particles-container" aria-hidden="true">
            <!-- 赛博音符与星光 -->
            <span class="floating-note note-1">♪</span>
            <span class="floating-note note-2">♫</span>
            <span class="floating-note note-3">♬</span>
            <span class="floating-note note-4">♩</span>
            <span class="floating-note note-5">✨</span>
            <span class="floating-note note-6">🌟</span>
            <span class="floating-note note-7">✦</span>

            <div class="miku-twintail-bg-light left">༄</div>
            <div class="miku-twintail-bg-light right">༄</div>

            <span class="floating-orb orb-1"></span>
            <span class="floating-orb orb-2"></span>
            <span class="floating-orb orb-3"></span>
            <span class="floating-orb orb-4"></span>
        </div>

        <!-- 返回顶部按钮：Q版初音人偶（纯无装饰） -->
        <el-backtop :right="24" :bottom="32" class="miku-backtop-chibi" title="返回顶部">
            <img src="/images/miku/miku_chibi_main.png" alt="返回顶部" class="chibi-backtop-img" />
        </el-backtop>

        <!-- 标志性二次元互动：初音阅读进度陪伴吉祥物 -->
        <ReadingProgress />

        <!-- 文章目录（PC 端右侧悬浮毛玻璃） -->
        <ArticleToc :headings="tocHeadings" />

        <!-- 文章主体 -->
        <template v-if="article">
            <ArticleHero :article="article" :comment-count="commentCount" />

            <div class="article-main-card glass-miku-card">
                <ArticleContent :content="article.content" @headings-ready="onHeadingsReady" />

                <div class="article-footer-actions">
                    <LikeButton
                        :article-id="articleId"
                        :initial-liked="isLiked"
                        :initial-count="likeCount"
                        :is-logged-in="userStore.isLoggedIn"
                        @need-login="goToLogin"
                        ref="likeRef"
                    />
                </div>

                <!-- 底部音效频谱线过渡 -->
                <div class="bottom-spectrum-line">
                    <span v-for="n in 36" :key="n" class="spectrum-bar" :style="{ '--delay': (n * 0.06) + 's' }"></span>
                </div>
            </div>

            <!-- 上下篇任务导航 -->
            <ArticleNav :prev="prevArticle" :next="nextArticle" @navigate="goToArticle" />

            <!-- 研讨交流区 -->
            <CommentSection
                :article-id="articleId"
                :is-logged-in="userStore.isLoggedIn"
                :user-avatar="userStore.userInfo?.avatar_url"
                :user-name="userStore.userInfo?.nickname"
                @need-login="goToLogin"
                @comment-added="onCommentAdded"
                ref="commentRef"
            />
        </template>

        <div v-else-if="!loading" class="empty-panel glass-miku-card">
            <h3 class="empty-title">未找到该文章</h3>
            <p class="empty-desc">该文章可能已被删除或地址已变更，请返回文章列表继续浏览。</p>
            <button class="back-btn tactile-btn" @click="router.push('/articles')">返回文章列表</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '../../api/request';
import { getLikeStatus, getArticleStats } from '../../api/article';
import { useUserStore } from '../../stores/user';
import { usePolling } from '../../composables/usePolling';

import ReadingProgress from '../../components/article/ReadingProgress.vue';
import ArticleHero from '../../components/article/ArticleHero.vue';
import ArticleContent from '../../components/article/ArticleContent.vue';
import LikeButton from '../../components/article/LikeButton.vue';
import CommentSection from '../../components/article/CommentSection.vue';
import ArticleToc from '../../components/article/ArticleToc.vue';
import ArticleNav from '../../components/article/ArticleNav.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const article = ref(null);
const isLiked = ref(false);
const likeCount = ref(0);
const commentCount = ref(0);
const tocHeadings = ref([]);
const prevArticle = ref(null);
const nextArticle = ref(null);
const likeRef = ref(null);
const commentRef = ref(null);

const articleId = ref(route.params.id);

const fetchArticleDetail = async () => {
    loading.value = true;
    try {
        const res = await request.get(`/article/${articleId.value}`);
        article.value = res.data;
        likeCount.value = res.data.like_count || 0;
        commentCount.value = res.data.comment_count || 0;

        fetchNavArticles();
    } catch (error) {
        console.error('获取文章详情失败:', error);
    } finally {
        loading.value = false;
    }
};

const fetchLikeStatus = async () => {
    if (!userStore.isLoggedIn) return;
    try {
        const res = await getLikeStatus(articleId.value);
        isLiked.value = res.data.liked;
        likeCount.value = res.data.like_count;
        if (likeRef.value) {
            likeRef.value.updateLike(res.data.liked, res.data.like_count);
        }
    } catch (error) {
        console.error('获取点赞状态失败:', error);
    }
};

const refreshArticleStats = async () => {
    try {
        const res = await getArticleStats(articleId.value);
        if (!res?.data) return;
        const { view_count, like_count, comment_count } = res.data;
        if (article.value && typeof view_count === 'number') {
            article.value.view_count = view_count;
        }
        if (typeof like_count === 'number') {
            likeCount.value = like_count;
            if (likeRef.value) likeRef.value.updateLike(isLiked.value, like_count);
        }
        if (typeof comment_count === 'number' && comment_count >= commentCount.value) {
            commentCount.value = comment_count;
        }
    } catch (error) {}
};

const fetchNavArticles = async () => {
    try {
        const res = await request.get(`/article/${articleId.value}/nav`);
        prevArticle.value = res.data.prev;
        nextArticle.value = res.data.next;
    } catch (error) {}
};

const onHeadingsReady = (headings) => {
    tocHeadings.value = headings;
};

const onCommentAdded = (count) => {
    commentCount.value = count;
};

const goToLogin = () => {
    router.push('/login');
};

const goToArticle = (id) => {
    router.push(`/article/${id}`);
    nextTick(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

onMounted(() => {
    fetchArticleDetail();
    fetchLikeStatus();
    usePolling(refreshArticleStats, 30000);
});

watch(() => route.params.id, (newId) => {
    if (newId && newId !== articleId.value) {
        articleId.value = newId;
        fetchArticleDetail();
        fetchLikeStatus();
    }
});
</script>

<style scoped>
.detail-container {
    max-width: 880px;
    margin: 0 auto 60px;
    padding: var(--navbar-clearance) 20px 0;
    position: relative;
}

/* 漂浮粒子与全息二次元初音光斑背景 */
.bg-particles-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
    background-image: radial-gradient(rgba(57, 197, 187, 0.08) 1.2px, transparent 1.2px);
    background-size: 32px 32px;
}

.miku-bg-watermark {
    position: absolute;
    top: 14%;
    right: 4%;
    font-family: 'Outfit', monospace;
    font-size: 80px;
    font-weight: 900;
    color: rgba(57, 197, 187, 0.04);
    letter-spacing: 4px;
    user-select: none;
    pointer-events: none;
}

.miku-twintail-bg-light {
    position: absolute;
    font-size: 140px;
    color: rgba(57, 197, 187, 0.05);
    user-select: none;
    pointer-events: none;
}
.miku-twintail-bg-light.left { top: 25%; left: 2%; transform: rotate(-20deg); }
.miku-twintail-bg-light.right { bottom: 20%; right: 2%; transform: rotate(20deg); color: rgba(255, 126, 157, 0.05); }

.floating-note {
    position: absolute;
    color: rgba(57, 197, 187, 0.35);
    font-size: 24px;
    user-select: none;
    animation: floatNote 12s infinite ease-in-out;
}

.note-1 { top: 12%; left: 4%; animation-duration: 14s; font-size: 28px; }
.note-2 { top: 32%; right: 5%; animation-duration: 18s; animation-delay: -4s; color: rgba(255, 126, 157, 0.35); }
.note-3 { top: 58%; left: 6%; animation-duration: 16s; animation-delay: -7s; font-size: 26px; }
.note-4 { top: 76%; right: 7%; animation-duration: 13s; animation-delay: -3s; font-size: 22px; color: rgba(57, 197, 187, 0.4); }
.note-5 { top: 22%; left: 18%; animation-duration: 15s; animation-delay: -5s; font-size: 20px; color: rgba(0, 243, 255, 0.4); }
.note-6 { top: 68%; right: 14%; animation-duration: 17s; animation-delay: -8s; font-size: 22px; color: rgba(255, 0, 127, 0.4); }
.note-7 { top: 88%; left: 12%; animation-duration: 20s; animation-delay: -9s; font-size: 18px; color: rgba(255, 126, 157, 0.35); }

.floating-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.45;
    animation: floatOrb 16s infinite alternate ease-in-out;
}

.orb-1 {
    width: 380px;
    height: 380px;
    background: radial-gradient(circle, rgba(57, 197, 187, 0.28) 0%, rgba(57, 197, 187, 0) 70%);
    top: 5%;
    left: -100px;
}

.orb-2 {
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, rgba(255, 126, 157, 0.22) 0%, rgba(255, 126, 157, 0) 70%);
    top: 45%;
    right: -120px;
    animation-delay: -6s;
}

.orb-3 {
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(0, 243, 255, 0.22) 0%, rgba(0, 243, 255, 0) 70%);
    bottom: 5%;
    left: 15%;
    animation-delay: -10s;
}

.orb-4 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 0, 127, 0.2) 0%, rgba(255, 0, 127, 0) 70%);
    top: 25%;
    right: 25%;
    animation-delay: -3s;
}

@keyframes floatNote {
    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.25; }
    50% { transform: translateY(-28px) rotate(15deg); opacity: 0.65; }
}

@keyframes floatOrb {
    0% { transform: translateY(0) scale(1); }
    100% { transform: translateY(-40px) scale(1.12); }
}

/* 主文章阅读卡片：舒适的内边距与舒缓的温度色调 */
.article-main-card {
    position: relative;
    padding: 44px 48px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(240, 252, 249, 0.98) 100%);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 18px 48px rgba(57, 197, 187, 0.14);
    border: none;
    transition: all 0.3s ease;
    z-index: 1;
}

.article-main-card:hover {
    box-shadow: 0 22px 54px rgba(57, 197, 187, 0.2), 0 0 24px rgba(255, 126, 157, 0.18);
}

.hud-corner {
    position: absolute;
    font-family: monospace;
    font-size: 14px;
    font-weight: 900;
    color: rgba(57, 197, 187, 0.6);
    pointer-events: none;
    z-index: 3;
    line-height: 1;
}
.top-left { top: 6px; left: 8px; }
.top-right { top: 6px; right: 8px; }

.article-footer-actions {
    padding: 0 40px 24px;
    display: flex;
    justify-content: center;
}

/* 底部音效频谱线 */
.bottom-spectrum-line {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
    height: 16px;
    padding: 0 30px 14px;
    opacity: 0.75;
}

.spectrum-bar {
    width: 3px;
    height: 4px;
    background: linear-gradient(180deg, #39C5BB 0%, #FF7E9D 100%);
    border-radius: 3px;
    animation: spectrumPulse 1.4s infinite ease-in-out alternate;
    animation-delay: var(--delay);
}

@keyframes spectrumPulse {
    0% { height: 3px; opacity: 0.3; }
    100% { height: 14px; opacity: 0.95; }
}

.empty-panel {
    text-align: center;
    padding: 60px 24px;
    background: rgba(255, 255, 255, 0.96);
    border-radius: 24px;
    border: none;
    box-shadow: 0 10px 32px rgba(57, 197, 187, 0.14);
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.empty-title {
    font-size: 20px;
    font-weight: 900;
    color: #0E2926;
    margin-bottom: 8px;
}

.empty-desc {
    font-size: 14px;
    color: #00687d;
    margin-bottom: 24px;
}

.back-btn {
    padding: 10px 28px;
    border-radius: 50px;
    background: linear-gradient(135deg, #39C5BB, #00687d);
    color: #ffffff;
    border: none;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(57, 197, 187, 0.35);
    transition: all 0.3s ease;
}

.back-btn:hover {
    box-shadow: 0 6px 20px rgba(255, 126, 157, 0.45), 0 0 15px rgba(57, 197, 187, 0.4);
    transform: translateY(-2px);
}

/* 悬浮初音常驻助理 (右下角) */
.miku-floating-assistant {
    position: fixed;
    bottom: 90px;
    right: 28px;
    z-index: 990;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.assistant-chibi-box {
    position: relative;
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s ease;
}

.assistant-img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    filter: none;
    animation: assistantBounce 3s ease-in-out infinite alternate;
}

.miku-floating-assistant:hover .assistant-chibi-box {
    transform: scale(1.15) rotate(6deg);
}

.pulse-aura {
    display: none;
}

@keyframes vinylSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes assistantBounce {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(-5px) rotate(-4deg); }
}

/* 返回顶部按钮：Q版初音人偶纯净无装饰版 */
:deep(.el-backtop),
.miku-backtop-chibi {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    width: 54px !important;
    height: 54px !important;
    overflow: visible !important;
}

.chibi-backtop-img {
    width: 50px;
    height: 50px;
    object-fit: contain;
    filter: none;
    transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.miku-backtop-chibi:hover .chibi-backtop-img {
    transform: scale(1.18) translateY(-4px);
}

@media (max-width: 768px) {
    .detail-container {
        margin: 0 auto 30px;
        padding: calc(var(--navbar-clearance, 64px) + 8px) 10px 0;
    }
    .article-main-card {
        padding: 24px 16px 20px;
        border-radius: 18px;
        border-width: 1px;
        box-shadow: 0 8px 24px rgba(57, 197, 187, 0.12);
    }
    .article-footer-actions {
        padding: 0 10px 16px;
    }
    .bottom-spectrum-line {
        padding: 0 10px 10px;
    }
    .miku-backtop-chibi {
        right: 14px !important;
        bottom: 74px !important;
        width: 44px !important;
        height: 44px !important;
    }
    .chibi-backtop-img {
        width: 42px;
        height: 42px;
    }
}
</style>