<template>
    <div class="banner-wrapper" v-if="banners.length > 0">
        <div class="banner-track" ref="trackRef" :class="{ 'is-paused': isPaused, 'is-dragging': dragging, 'is-reduced': reducedMotion }"
            :style="{ '--interval': INTERVAL / 1000 + 's' }"
            @mouseenter="onTrackEnter" @mouseleave="onTrackLeave"
            @mousemove="handleParallax"
            @mousedown="onDragStart"
            @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd">

            <!-- 轮播项 -->
            <div v-for="(item, index) in banners" :key="item.id" class="banner-slide"
                :class="{ active: currentIndex === index }">

                <!-- 媒体背景（带视差缩放） -->
                <div class="slide-media" :style="mediaParallaxStyle">
                    <img v-if="item.media_type === 'image'" :src="item.media_signed_url || item.media_url" :alt="item.title" class="slide-img"
                        draggable="false" :decoding="index === currentIndex ? 'sync' : 'async'" :loading="index === currentIndex ? 'eager' : 'lazy'"
                        :fetchpriority="index === currentIndex ? 'high' : 'low'" />
                    <video v-else-if="item.media_type === 'video'" :src="item.media_signed_url || item.media_url" class="slide-video" muted loop playsinline
                        :ref="el => videoRefs[index] = el" />
                </div>

                <!-- 氛围层：极光光晕（动态背景） -->
                <div class="slide-aurora" aria-hidden="true">
                    <span class="aurora-blob blob-teal"></span>
                    <span class="aurora-blob blob-pink"></span>
                </div>

                <!-- 色调渐变 + 暗角 + 颗粒（层次与氛围） -->
                <div class="slide-overlay"></div>
                <div class="slide-vignette"></div>
                <div class="slide-grain"></div>

                <!-- 文字侧局部压暗，保证文字清晰的同时不牺牲画面右侧的锐度 -->
                <div class="slide-scrim"></div>

                <!-- 切场扫光动效 -->
                <div class="slide-sweep"></div>

                <!-- 文字与主交互区 (MIKU TEAL Hero Column) -->
                <div class="slide-content" :style="contentParallaxStyle">
                    <div class="hero-kicker">♪ MIKU × CODE × LIFE</div>

                    <h1 class="slide-title">
                        {{ item.title || '探索技术前沿' }}
                    </h1>

                    <div class="hero-en-subtitle">EXPLORE THE FRONTIER</div>

                    <p class="slide-subtitle">
                        {{ item.subtitle || '记录前端、数据库与底层技术的学习轨迹，也收藏生活里的光。用代码写歌，用文字存档时光。' }}
                    </p>

                    <div class="slide-actions">
                        <button class="cta-primary tactile-btn shine-effect" @click="handleClick(item.link || '/articles')">
                            <span>开始阅读</span>
                            <span class="btn-arrow">→</span>
                        </button>
                        <button class="cta-secondary tactile-btn" @click="handleAbout">
                            <span>关于我</span>
                        </button>
                    </div>

                </div>
            </div>

            <!-- 左右切换箭头（全局，不随 slide 复制） -->
            <button type="button" class="arrow arrow-left tactile-btn" @click.stop="prev" aria-label="上一张">‹</button>
            <button type="button" class="arrow arrow-right tactile-btn" @click.stop="next" aria-label="下一张">›</button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getActiveBanners } from '../api/banner';

const props = defineProps({
    stats: {
        type: Object,
        default: () => ({ articles: 0, categories: 0, tags: 0, comments: 0, totalViews: 0 }),
    },
});

const router = useRouter();
const banners = ref([]);
const currentIndex = ref(0);
const trackRef = ref(null);
const videoRefs = ref({});

let autoTimer = null;
const INTERVAL = 5500;

// 暂停状态：悬停暂停 or 用户手动暂停
const hovering = ref(false);
const manualPause = ref(false);
const reducedMotion = ref(false);
const isPaused = computed(() => hovering.value || manualPause.value);

// 视差坐标
const mouseX = ref(0);
const mouseY = ref(0);

// 缩放留出视差余量即可，过大的 upscale 会牺牲锐度 → 由 1.05 收敛到 1.035
const mediaParallaxStyle = computed(() => {
    const tx = (mouseX.value - 0.5) * -18;
    const ty = (mouseY.value - 0.5) * -12;
    return {
        transform: `scale(1.035) translate(${tx}px, ${ty}px)`
    };
});

const contentParallaxStyle = computed(() => {
    const tx = (mouseX.value - 0.5) * 12;
    const ty = (mouseY.value - 0.5) * 8;
    return {
        transform: `translate(${tx}px, ${ty}px)`
    };
});

let parallaxRaf = null;
const handleParallax = (e) => {
    if (reducedMotion.value || !trackRef.value) return;
    if (parallaxRaf) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    parallaxRaf = requestAnimationFrame(() => {
        parallaxRaf = null;
        if (!trackRef.value) return;
        const rect = trackRef.value.getBoundingClientRect();
        mouseX.value = (clientX - rect.left) / rect.width;
        mouseY.value = (clientY - rect.top) / rect.height;
    });
};

// 触摸状态
const touchState = {
    startX: 0,
    startY: 0,
    moveX: 0,
    moveY: 0,
    startTime: 0,
    swiping: false,
};

// 鼠标拖拽状态（桌面端滑动切换）
const dragState = { active: false, startX: 0, deltaX: 0, moved: false };
const dragging = ref(false);
// 拖拽结束后的那次 click 需要被吞掉，否则会误触 CTA / 缩略图
let suppressNextClick = false;

// 精选初音插画与思考主题
const fallbackBanners = [
    {
        id: 'f1',
        media_type: 'image',
        media_url: '/images/miku/miku_wp_1.jpg',
        title: '探索技术前沿',
        subtitle: '记录前端、数据库与底层技术的学习轨迹，也收藏生活里的光。用代码写歌，用文字存档时光。',
        link: '/articles'
    },
    {
        id: 'f2',
        media_type: 'image',
        media_url: '/images/miku/miku_wp_8.jpg',
        title: '从零搭建高可用前端组件库',
        subtitle: '基于 Vue3 组合式 API 与 Vite，构建规范统一、轻量优雅的现代 UI 组件体系。',
        link: '/articles'
    },
    {
        id: 'f3',
        media_type: 'image',
        media_url: '/images/miku/miku_wp_9.jpg',
        title: 'MySQL 索引与数仓分层实战',
        subtitle: '深入探讨 B+Tree 索引底层原理、覆盖索引优化与数据仓库分层架构设计。',
        link: '/articles'
    }
];

const fetchBanners = async () => {
    try {
        const res = await getActiveBanners();
        if (res && res.data && res.data.length > 0) {
            banners.value = res.data;
        } else {
            banners.value = fallbackBanners;
        }
    } catch (error) {
        console.error('获取轮播图失败:', error);
        banners.value = fallbackBanners;
    } finally {
        await nextTick();
        if (!reducedMotion.value) startAuto();
        playCurrentVideo();
    }
};

const next = () => {
    currentIndex.value = (currentIndex.value + 1) % banners.value.length;
    playCurrentVideo();
};

const prev = () => {
    currentIndex.value = (currentIndex.value - 1 + banners.value.length) % banners.value.length;
    playCurrentVideo();
};

const goToSlide = (idx) => {
    currentIndex.value = idx;
    playCurrentVideo();
};

const startAuto = () => {
    stopAuto();
    autoTimer = setInterval(next, INTERVAL);
};

const stopAuto = () => {
    if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
    }
};

// 悬停暂停 / 离开恢复（用户手动暂停时不自动恢复）
const onTrackEnter = () => {
    hovering.value = true;
    stopAuto();
};

const onTrackLeave = () => {
    hovering.value = false;
    if (!manualPause.value) startAuto();
};

const playCurrentVideo = () => {
    nextTick(() => {
        Object.keys(videoRefs.value).forEach((key) => {
            const video = videoRefs.value[key];
            if (!video) return;
            if (parseInt(key) === currentIndex.value) {
                video.currentTime = 0;
                video.play().catch(() => { });
            } else {
                video.pause();
            }
        });
    });
};

const handleAbout = () => {
    if (suppressNextClick) return;
    router.push('/about');
};

// ==================== 触摸滑动 ====================
const onTouchStart = (e) => {
    const t = e.touches[0];
    touchState.startX = t.clientX;
    touchState.startY = t.clientY;
    touchState.moveX = 0;
    touchState.moveY = 0;
    touchState.startTime = Date.now();
    touchState.swiping = false;
    stopAuto();
};

const onTouchMove = (e) => {
    const t = e.touches[0];
    touchState.moveX = t.clientX - touchState.startX;
    touchState.moveY = t.clientY - touchState.startY;

    if (!touchState.swiping && Math.abs(touchState.moveX) > 10) {
        if (Math.abs(touchState.moveX) > Math.abs(touchState.moveY)) {
            touchState.swiping = true;
        }
    }

    if (touchState.swiping) {
        if (e.cancelable) {
            e.preventDefault();
        }
    }
};

const onTouchEnd = () => {
    const elapsed = Date.now() - touchState.startTime;
    const distance = touchState.moveX;

    if (touchState.swiping) {
        const isQuickSwipe = elapsed < 300 && Math.abs(distance) > 30;
        const isLongSwipe = Math.abs(distance) > 50;

        if (isQuickSwipe || isLongSwipe) {
            if (distance < 0) {
                next();
            } else {
                prev();
            }
        }
    }

    if (!manualPause.value) startAuto();
};

// ==================== 鼠标拖拽滑动（桌面端） ====================
const onDragStart = (e) => {
    if (e.button !== 0) return;
    dragState.active = true;
    dragState.startX = e.clientX;
    dragState.deltaX = 0;
    dragState.moved = false;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
};

const onDragMove = (e) => {
    if (!dragState.active) return;
    dragState.deltaX = e.clientX - dragState.startX;
    if (Math.abs(dragState.deltaX) > 8) {
        dragState.moved = true;
        dragging.value = true;
    }
};

const onDragEnd = () => {
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    const distance = dragState.deltaX;
    const moved = dragState.moved;
    dragState.active = false;
    dragging.value = false;

    if (moved) {
        // 吞掉拖拽后紧跟的那次 click
        suppressNextClick = true;
        setTimeout(() => { suppressNextClick = false; }, 60);
        if (distance < -60) {
            next();
        } else if (distance > 60) {
            prev();
        }
    }
};

const handleClick = (link) => {
    if (suppressNextClick || touchState.swiping) return;
    if (link.startsWith('http')) {
        window.open(link, '_blank');
    } else {
        router.push(link);
    }
};

const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
};

const handleMotionChange = (e) => {
    reducedMotion.value = !!e.detail?.reduced;
    if (reducedMotion.value) {
        stopAuto();
    } else if (!isPaused.value) {
        startAuto();
    }
};

onMounted(() => {
    reducedMotion.value = document.documentElement.classList.contains('reduce-motion');
    fetchBanners();
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('motion-mode-change', handleMotionChange);
});

onUnmounted(() => {
    stopAuto();
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('motion-mode-change', handleMotionChange);
});
</script>

<style scoped>
.banner-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
}

.banner-track {
    position: relative;
    width: 100%;
    height: 100vh;
    min-height: 600px;
    overflow: hidden;
    background: #071426;
    touch-action: pan-y;
    cursor: grab;
    user-select: none;
}

.banner-track.is-dragging {
    cursor: grabbing;
}

/* ==================== 轮播项 ==================== */
.banner-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.8s;
    z-index: 1;
}

.banner-slide.active {
    opacity: 1;
    visibility: visible;
    z-index: 2;
}

/* 媒体层：GPU 合成 + 轻微提锐，换取更清晰的画面 */
.slide-media {
    position: absolute;
    inset: 0;
    z-index: 0;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform;
    backface-visibility: hidden;
}

.slide-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 25%;
    display: block;
    transform: translateZ(0);
    backface-visibility: hidden;
    filter: saturate(1.05) contrast(1.04);
    transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease;
}

/* 悬停反馈：画面轻微推近并提亮（配合视差形成「景深呼吸」） */
.banner-track:hover .banner-slide.active .slide-img {
    transform: translateZ(0) scale(1.028);
    filter: saturate(1.12) contrast(1.06) brightness(1.04);
}

.slide-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* ==================== 氛围层 ==================== */
/* 动态极光光晕：以 screen 混合叠加在画面上，形成青/粉灯光氛围 */
.slide-aurora {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    pointer-events: none;
    mix-blend-mode: screen;
    opacity: 0.5;
}

.aurora-blob {
    position: absolute;
    width: 46vw;
    height: 46vw;
    min-width: 320px;
    min-height: 320px;
    border-radius: 50%;
    will-change: transform;
    transform: translateZ(0);
}

.blob-teal {
    top: -14%;
    left: -8%;
    background: radial-gradient(circle, rgba(57, 197, 187, 0.45) 0%, rgba(57, 197, 187, 0.15) 45%, transparent 70%);
    animation: auroraDrift 17s ease-in-out infinite alternate;
}

.blob-pink {
    right: -10%;
    bottom: -18%;
    background: radial-gradient(circle, rgba(255, 126, 157, 0.4) 0%, rgba(255, 126, 157, 0.12) 45%, transparent 70%);
    animation: auroraDrift 23s ease-in-out infinite alternate-reverse;
}

@keyframes auroraDrift {
    from { transform: translate3d(0, 0, 0) scale(1); }
    to { transform: translate3d(7%, 9%, 0) scale(1.18); }
}

/* 色调渐变遮罩（保留原有结构，均值下调暗度以提升画面清晰度） */
.slide-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background:
        linear-gradient(180deg,
            rgba(9, 18, 34, 0.34) 0%,
            rgba(9, 18, 34, 0.06) 40%,
            rgba(9, 18, 34, 0.18) 72%,
            rgba(7, 20, 38, 0.62) 100%),
        linear-gradient(90deg,
            rgba(10, 26, 40, 0.5) 0%,
            rgba(10, 26, 40, 0.12) 46%,
            transparent 100%);
}

/* 暗角：聚焦中心、加深景深 */
.slide-vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: radial-gradient(ellipse 118% 88% at 50% 42%, transparent 46%, rgba(3, 10, 22, 0.5) 100%);
}

/* 胶片颗粒：极细噪点，消除渐变断层、增加质感 */
.slide-grain {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.055;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 160px 160px;
}

/* 文字侧局部压暗：只压左下角，右侧画面保持全锐度 */
.slide-scrim {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 64%;
    height: 82%;
    z-index: 2;
    pointer-events: none;
    background: radial-gradient(ellipse 96% 82% at 10% 98%,
            rgba(5, 18, 32, 0.72) 0%,
            rgba(5, 18, 32, 0.34) 52%,
            transparent 76%);
}

/* 切场扫光 */
.slide-sweep {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    opacity: 0;
    background: linear-gradient(105deg, transparent 32%, rgba(255, 255, 255, 0.16) 48%, transparent 64%);
}

.banner-slide.active .slide-sweep {
    animation: sweepAcross 1.5s 0.12s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes sweepAcross {
    0% { opacity: 0; transform: translateX(-42%); }
    28% { opacity: 0.9; }
    100% { opacity: 0; transform: translateX(42%); }
}

/* ==================== 文字内容 ==================== */
.slide-content {
    position: absolute;
    left: 80px;
    bottom: 60px;
    z-index: 3;
    max-width: clamp(340px, 42vw, 560px);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform;
}

/* 切场时的内容逐级上浮（层级动效） */
.hero-kicker,
.slide-title,
.hero-en-subtitle,
.slide-subtitle,
.slide-actions {
    opacity: 0;
}

.banner-slide.active .hero-kicker { animation: riseIn 0.6s 0.04s cubic-bezier(0.16, 1, 0.3, 1) both; }
.banner-slide.active .slide-title { animation: riseIn 0.7s 0.12s cubic-bezier(0.16, 1, 0.3, 1) both; }
.banner-slide.active .hero-en-subtitle { animation: riseIn 0.7s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
.banner-slide.active .slide-subtitle { animation: riseIn 0.7s 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }
.banner-slide.active .slide-actions { animation: riseIn 0.7s 0.38s cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes riseIn {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
}

.hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 4px 14px;
    border-radius: var(--radius-pill);
    background: rgba(57, 197, 187, 0.22);
    border: 1px solid rgba(57, 197, 187, 0.45);
    font-size: 11px;
    font-weight: 700;
    color: #EAF9F8;
    letter-spacing: 2px;
    margin-bottom: 14px;
    box-shadow: 0 0 18px rgba(57, 197, 187, 0.25);
}

.hero-kicker::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #39C5BB;
    box-shadow: 0 0 10px #39C5BB;
    animation: kickerPulse 2s ease-in-out infinite;
}

@keyframes kickerPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.45; transform: scale(0.7); }
}

/* 标题：中性黑阴影比彩色阴影更锐利，配合禁用字距挤压提升清晰度 */
.slide-title {
    font-size: clamp(32px, 4.2vw, 54px);
    font-weight: 900;
    color: #ffffff;
    margin: 0 0 6px;
    line-height: 1.18;
    letter-spacing: -0.5px;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    text-shadow:
        0 1px 2px rgba(0, 0, 0, 0.5),
        0 6px 22px rgba(0, 0, 0, 0.42);
}

.hero-en-subtitle {
    font-family: 'Audiowide', cursive, sans-serif;
    font-size: clamp(14px, 1.8vw, 20px);
    color: #8BE9E0;
    letter-spacing: 2.5px;
    margin-bottom: 14px;
    text-shadow: 0 2px 12px rgba(57, 197, 187, 0.55);
}

.slide-subtitle {
    font-size: clamp(13.5px, 1.4vw, 15.5px);
    color: rgba(255, 255, 255, 0.94);
    margin: 0 0 24px;
    line-height: 1.7;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
}

.slide-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;
}

.cta-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 32px;
    background: linear-gradient(135deg, #39C5BB 0%, #12A79C 100%);
    border: none;
    border-radius: var(--radius-pill);
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    letter-spacing: 0.5px;
    box-shadow: 0 8px 20px rgba(57, 197, 187, 0.5);
    transition: all 0.25s ease;
}

.cta-primary:hover {
    background: linear-gradient(135deg, #45D6CB 0%, #12A79C 100%);
    box-shadow: 0 12px 32px rgba(57, 197, 187, 0.68), 0 0 26px rgba(57, 197, 187, 0.4);
    transform: translateY(-2px);
}

.btn-arrow {
    font-size: 15px;
    transition: transform 0.2s ease;
}

.cta-primary:hover .btn-arrow {
    transform: translateX(4px);
}

.cta-secondary {
    display: inline-flex;
    align-items: center;
    padding: 12px 26px;
    background: rgba(255, 255, 255, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: var(--radius-pill);
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cta-secondary:hover {
    background: rgba(255, 255, 255, 0.35);
    border-color: #FFFFFF;
    transform: translateY(-2px);
}



/* ==================== 左右切换箭头 ==================== */
.arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 11;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(9, 20, 34, 0.65);
    color: #ffffff;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 0.55;
}

.banner-track:hover .arrow {
    opacity: 1;
}

.arrow:hover {
    background: rgba(57, 197, 187, 0.85);
    border-color: #39C5BB;
    box-shadow: 0 0 24px rgba(57, 197, 187, 0.6);
    transform: translateY(-50%) scale(1.08);
}

.arrow:active {
    transform: translateY(-50%) scale(0.94);
}

.arrow-left { left: 28px; }
.arrow-right { right: 28px; }

/* ==================== 响应式适配 ==================== */
@media (max-width: 1024px) {
    .slide-content {
        left: 40px;
        bottom: 70px;
        max-width: 460px;
    }
    .arrow-left { left: 16px; }
    .arrow-right { right: 16px; }
}

@media (max-width: 768px) {
    .banner-track {
        height: clamp(340px, 52vh, 460px);
        min-height: 340px;
        cursor: default;
    }

    .slide-img {
        object-position: center 25%;
    }

    .slide-scrim {
        width: 100%;
        height: 90%;
        background: linear-gradient(to top,
            rgba(5, 18, 32, 0.94) 0%,
            rgba(5, 18, 32, 0.65) 50%,
            rgba(5, 18, 32, 0.15) 80%,
            transparent 100%);
    }

    .slide-content {
        left: 20px;
        right: 20px;
        bottom: 32px;
        max-width: none;
        padding-top: calc(var(--navbar-clearance, 76px) + 12px);
    }

    .hero-kicker {
        font-size: 10px;
        padding: 3px 10px;
        margin-bottom: 8px;
        letter-spacing: 1px;
    }

    .slide-title {
        font-size: clamp(22px, 5.5vw, 28px);
        line-height: 1.2;
        margin-bottom: 4px;
    }

    .hero-en-subtitle {
        font-size: 11px;
        letter-spacing: 1.5px;
        margin-bottom: 8px;
    }

    .slide-subtitle {
        font-size: 12.5px;
        line-height: 1.55;
        margin-bottom: 16px;
        -webkit-line-clamp: 2;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .slide-actions {
        gap: 10px;
        margin-bottom: 0;
    }

    .cta-primary {
        padding: 8px 22px;
        font-size: 12.5px;
    }

    .cta-secondary {
        padding: 8px 18px;
        font-size: 12.5px;
    }

    .arrow { display: none; }
    .aurora-blob { filter: blur(56px); opacity: 0.8; }
}

@media (max-width: 480px) {
    .banner-track {
        height: clamp(300px, 46vh, 380px);
        min-height: 300px;
    }

    .slide-content {
        left: 14px;
        right: 14px;
        bottom: 24px;
    }

    .slide-title {
        font-size: 20px;
    }

    .hero-en-subtitle {
        font-size: 10px;
        margin-bottom: 6px;
    }

    .slide-subtitle {
        font-size: 12px;
        margin-bottom: 12px;
    }

    .cta-primary {
        padding: 7px 16px;
        font-size: 12px;
    }

    .cta-secondary {
        padding: 7px 14px;
        font-size: 12px;
    }
}

/* ==================== 动效克制（跟随全局 reduce-motion 与系统偏好） ==================== */
@media (prefers-reduced-motion: reduce) {
    .aurora-blob,
    .hero-kicker::before {
        animation: none;
    }
    .slide-grain,
    .slide-sweep {
        display: none;
    }
    .banner-slide.active .hero-kicker,
    .banner-slide.active .slide-title,
    .banner-slide.active .hero-en-subtitle,
    .banner-slide.active .slide-subtitle,
    .banner-slide.active .slide-actions {
        animation: none;
        opacity: 1;
    }
}

html.reduce-motion .aurora-blob,
html.reduce-motion .hero-kicker::before {
    animation: none;
}

html.reduce-motion .slide-grain,
html.reduce-motion .slide-sweep {
    display: none;
}

html.reduce-motion .hero-kicker,
html.reduce-motion .slide-title,
html.reduce-motion .hero-en-subtitle,
html.reduce-motion .slide-subtitle,
html.reduce-motion .slide-actions {
    animation: none;
    opacity: 1;
}

html.reduce-motion .slide-media,
html.reduce-motion .slide-content,
html.reduce-motion .slide-img {
    transition: none;
}
</style>
