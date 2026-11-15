<template>
    <section class="quick-nav-section">
        <div class="nav-bg-decor" aria-hidden="true"></div>

        <div class="nav-inner">
            <!-- 行 1：Q 版初音 3D Mascot 玩偶舞台 Header -->
            <div class="nav-header-row">
                <div class="nav-title-group">
                    <!-- Q 版初音 3D Mascot 完整立绘舞台 -->
                    <div class="miku-chibi-stage tactile-btn" @click="triggerChibiBounce" title="点击 Q 版初音互动！">
                        <div class="chibi-doll-figure" :class="{ 'is-bouncing': isChibiBouncing }">
                            <img src="/images/miku/miku_chibi_main.png" alt="Q版初音" class="chibi-full-img" loading="lazy" decoding="async" />
                        </div>
                        
                        <transition name="speech-pop">
                            <div class="chibi-speech-bubble" v-if="chibiSpeech">
                                <span class="speech-arrow"></span>
                                {{ chibiSpeech }}
                            </div>
                        </transition>
                    </div>

                    <div class="title-text-box">
                        <div class="title-main-row">
                            <h3 class="nav-header-title">分类筛选</h3>
                        </div>
                        <span class="nav-subtitle-tech">按主题分类浏览全部内容</span>
                    </div>

                    <!-- 动态声波律动柱 -->
                    <div class="audio-spectrum-hud" aria-hidden="true">
                        <i v-for="n in 8" :key="n" :style="{ animationDelay: (n * 0.12) + 's' }"></i>
                    </div>
                </div>

                <!-- 右侧分类与文章数据统计 -->
                <div class="nav-header-meta">
                    <span class="meta-pill">
                        <i class="meta-dot"></i>
                        <b>{{ displayCategoriesCount }}</b> 个分类
                    </span>
                    <span class="meta-pill">
                        <i class="meta-dot cyan"></i>
                        <b>{{ displayArticlesCount }}</b> 篇文章
                    </span>
                </div>
            </div>

            <!-- 行 2：高对比度晶透 3D 分类按钮 -->
            <div class="nav-tags-row">
                <button v-show="showArrows && canScrollLeft" class="scroll-arrow left tactile-btn" type="button"
                    aria-label="向左滚动" @click="scrollByStep(-1)">‹</button>

                <div ref="scrollerRef" class="nav-scroll-container"
                    :class="{ 'at-start': !canScrollLeft, 'at-end': !canScrollRight }"
                    role="group" aria-label="分类列表，可左右滑动查看全部"
                    @scroll="updateScrollState" @mousedown="onDragStart" @wheel="onWheel">

                    <!-- 「全部」分类按钮 -->
                    <button type="button" class="miku-art-card"
                        :class="{ active: isAllActive, popping: poppingKey === 'all' }"
                        @click="handleSelect(null, $event)">
                        <div class="card-bg-layer" :style="{ backgroundImage: `url(${getMikuWpImage(0)})` }"></div>
                        <div class="card-overlay-layer"></div>
                        <div class="card-content">
                            <span class="note-icon">♫</span>
                            <span class="card-name">全部</span>
                            <span v-if="isAllActive" class="card-active-badge">已选中</span>
                        </div>
                    </button>

                    <!-- 各独立分类按钮 -->
                    <button v-for="(cat, idx) in normalizedCategories" :key="cat.id ?? cat.name" type="button"
                        class="miku-art-card" :class="{ active: isCatActive(cat), popping: poppingKey === (cat.id ?? cat.name) }"
                        @click="handleSelect(cat, $event)">
                        <div class="card-bg-layer" :style="{ backgroundImage: `url(${getMikuWpImage(idx + 1)})` }"></div>
                        <div class="card-overlay-layer"></div>
                        <div class="card-content">
                            <span class="note-icon">♪</span>
                            <span class="card-name">{{ cat.name }}</span>
                            <span v-if="isCatActive(cat)" class="card-active-badge">已选中</span>
                        </div>
                    </button>
                </div>

                <button v-show="showArrows && canScrollRight" class="scroll-arrow right tactile-btn" type="button"
                    aria-label="向右滚动" @click="scrollByStep(1)">›</button>
            </div>
        </div>

        <!-- 点击爆发的音符粒子容器 -->
        <div class="particle-stage" pointer-events="none">
            <span v-for="p in floatingNotes" :key="p.id" class="floating-note-particle"
                :style="{ left: p.x + 'px', top: p.y + 'px' }">
                {{ p.char }}
            </span>
        </div>
    </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    categories: {
        type: Array,
        default: () => []
    },
    activeId: {
        type: [Number, String, null],
        default: null
    },
    categoriesCount: {
        type: Number,
        default: 0
    },
    articlesCount: {
        type: Number,
        default: 0
    }
});

const emit = defineEmits(['change']);

const fallbackCategories = [
    { id: 1, name: '前端不掉链' },
    { id: 2, name: 'C语言' },
    { id: 3, name: 'MySQL' },
    { id: 4, name: '数据结构' },
    { id: 5, name: '计算机操作系统' },
    { id: 6, name: '软件架构' },
    { id: 7, name: '大数据技术' },
    { id: 8, name: '评测' },
    { id: 9, name: '计算机网络教程' },
    { id: 10, name: '自我提升' },
    { id: 11, name: '生活日志' }
];

// Q 版初音 Mascot 交互与语录
const isChibiBouncing = ref(false);
const chibiSpeech = ref('');
let speechTimer = null;

const MIKU_QUOTES = [
    '点击上方分类标签即可筛选对应文章',
    '左右滑动或使用箭头可查看更多分类',
    '欢迎探索感兴趣的技术专题与笔记'
];

const triggerChibiBounce = () => {
    isChibiBouncing.value = true;
    const randomQuote = MIKU_QUOTES[Math.floor(Math.random() * MIKU_QUOTES.length)];
    chibiSpeech.value = randomQuote;
    
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => {
        chibiSpeech.value = '';
    }, 3200);

    setTimeout(() => {
        isChibiBouncing.value = false;
    }, 600);
};

// 音符粒子爆发特效
const floatingNotes = ref([]);
let noteId = 0;

const spawnParticle = (e) => {
    if (!e) return;
    const rect = e.currentTarget?.getBoundingClientRect?.();
    const x = rect ? rect.left + rect.width / 2 : e.clientX;
    const y = rect ? rect.top - 10 : e.clientY;

    const chars = ['♪', '♫', '♬', '✦', '39'];
    const char = chars[Math.floor(Math.random() * chars.length)];
    const pId = ++noteId;

    floatingNotes.value.push({ id: pId, x, y, char });

    setTimeout(() => {
        floatingNotes.value = floatingNotes.value.filter(p => p.id !== pId);
    }, 900);
};

// 数据清洗
const sanitizeName = (raw) =>
    String(raw ?? '')
        .replace(/[\u200B-\u200D\uFEFF\u2060]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

const normalizedCategories = computed(() => {
    const source = props.categories && props.categories.length > 0 ? props.categories : fallbackCategories;
    const seen = new Set();
    const list = [];
    for (const cat of source) {
        const name = sanitizeName(cat?.name);
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ ...cat, name });
    }
    return list;
});

// 官方初音未来 1080P 高清动漫壁纸库，鼠标悬停时透明模糊消除变清晰
const MIKU_WP_IMAGES = [
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

const getMikuWpImage = (idx) => {
    const index = typeof idx === 'number' ? Number(idx) : 0;
    return MIKU_WP_IMAGES[index % MIKU_WP_IMAGES.length];
};

const displayCategoriesCount = computed(() => {
    const fromProps = Number(props.categoriesCount) || 0;
    return fromProps > 0 ? fromProps : normalizedCategories.value.length;
});

const displayArticlesCount = computed(() => Number(props.articlesCount) || 0);

const isAllActive = computed(() => props.activeId === null || props.activeId === undefined);

const isCatActive = (cat) => {
    if (isAllActive.value) return false;
    return String(props.activeId) === String(cat.id) || props.activeId === cat.name;
};

// 选中逻辑
const poppingKey = ref(null);
let popTimer = null;
let suppressClick = false;

const popIt = (key) => {
    poppingKey.value = key;
    clearTimeout(popTimer);
    popTimer = setTimeout(() => { poppingKey.value = null; }, 480);
};

const handleSelect = (cat, e) => {
    if (suppressClick) return;
    spawnParticle(e);
    if (!cat) {
        popIt('all');
        emit('change', null);
    } else {
        popIt(cat.id ?? cat.name);
        emit('change', cat.id !== undefined ? cat.id : cat.name);
    }
};

// 60FPS 极速 rAF 节流横向滚动与拖拽逻辑
const scrollerRef = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const showArrows = ref(false);

let scrollRafId = null;
const updateScrollState = () => {
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        const el = scrollerRef.value;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        canScrollLeft.value = el.scrollLeft > 4;
        canScrollRight.value = el.scrollLeft < max - 4;
        showArrows.value = max > 4;
    });
};

const scrollActiveIntoView = (behavior = 'smooth') => {
    const el = scrollerRef.value;
    if (!el) return;
    const active = el.querySelector('.miku-art-card.active');
    if (!active) return;
    const box = el.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.left < box.left || item.right > box.right) {
        el.scrollBy({ left: item.left - box.left - 12, behavior });
    }
};

const scrollByStep = (dir) => {
    const el = scrollerRef.value;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.7), behavior: 'smooth' });
};

// 拖拽（使用 rAF 节流防抖）
const dragState = { active: false, startX: 0, startLeft: 0, moved: false };
let dragRafId = null;

const onDragStart = (e) => {
    const el = scrollerRef.value;
    if (!el || e.button !== 0) return;
    dragState.active = true;
    dragState.startX = e.clientX;
    dragState.startLeft = el.scrollLeft;
    dragState.moved = false;
    document.addEventListener('mousemove', onDragMove, { passive: true });
    document.addEventListener('mouseup', onDragEnd);
};

const onDragMove = (e) => {
    const el = scrollerRef.value;
    if (!dragState.active || !el) return;
    if (dragRafId) cancelAnimationFrame(dragRafId);
    dragRafId = requestAnimationFrame(() => {
        const dx = e.clientX - dragState.startX;
        if (Math.abs(dx) > 6) {
            dragState.moved = true;
            el.classList.add('dragging');
        }
        el.scrollLeft = dragState.startLeft - dx;
    });
};

const onDragEnd = () => {
    const el = scrollerRef.value;
    dragState.active = false;
    if (dragRafId) cancelAnimationFrame(dragRafId);
    if (el) el.classList.remove('dragging');
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    if (dragState.moved) {
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 60);
    }
};

const onWheel = (e) => {
    const el = scrollerRef.value;
    if (!el) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const next = el.scrollLeft + e.deltaY;
    if (next < 0 || next > max) return;
    if (e.cancelable) {
        e.preventDefault();
    }
    el.scrollLeft = next;
};

let resizeObserver = null;

onMounted(() => {
    nextTick(() => {
        updateScrollState();
        scrollActiveIntoView('auto');
    });
    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(updateScrollState);
        if (scrollerRef.value) resizeObserver.observe(scrollerRef.value);
    }
    window.addEventListener('resize', updateScrollState);
});

onUnmounted(() => {
    clearTimeout(popTimer);
    clearTimeout(speechTimer);
    if (resizeObserver) resizeObserver.disconnect();
    window.removeEventListener('resize', updateScrollState);
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
});

watch(normalizedCategories, () => nextTick(updateScrollState));
watch(() => props.activeId, () => nextTick(() => scrollActiveIntoView('smooth')));
</script>

<style scoped>
.quick-nav-section {
    position: relative;
    z-index: 2;
    padding: 12px 0 10px;
    background: rgba(240, 252, 250, 0.75);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border-bottom: 1px solid rgba(57, 197, 187, 0.3);
    box-shadow: 0 8px 32px rgba(8, 90, 87, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7);
    overflow: hidden;
}

/* 背景壁纸与科技纹理遮罩层 */
.nav-bg-decor {
    position: absolute;
    inset: 0;
    background-image: url('/images/miku/miku_wp_1.jpg');
    background-size: cover;
    background-position: center 30%;
    opacity: 0.15;
    filter: saturate(1.2) contrast(1.1);
    mix-blend-mode: multiply;
    pointer-events: none;
    z-index: 0;
}

.nav-bg-decor::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.85) 0%, 
        rgba(225, 248, 246, 0.6) 50%, 
        rgba(255, 255, 255, 0.85) 100%
    );
    z-index: 1;
}

.nav-inner {
    position: relative;
    z-index: 2;
    max-width: var(--layout-max-width, 1280px);
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* ==================== 行 1：Q 版初音 3D Mascot 玩偶舞台 Header ==================== */
.nav-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.nav-title-group {
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
}

/* Q 版初音 3D Mascot 完整立绘舞台 */
.miku-chibi-stage {
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
}

.chibi-doll-figure {
    position: relative;
    height: 52px;
    width: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.miku-chibi-stage:hover .chibi-doll-figure {
    transform: scale(1.15) translateY(-3px);
}

.chibi-doll-figure.is-bouncing {
    animation: chibiFigureJump 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes chibiFigureJump {
    0% { transform: scale(1); }
    30% { transform: scale(1.3) translateY(-10px) rotate(-10deg); }
    60% { transform: scale(0.95) translateY(2px) rotate(4deg); }
    100% { transform: scale(1) translateY(0) rotate(0deg); }
}

.chibi-full-img {
    height: 50px;
    width: auto;
    object-fit: contain;
    filter: none;
    z-index: 2;
}

/* 气泡对话 */
.chibi-speech-bubble {
    position: absolute;
    left: 58px;
    top: 2px;
    white-space: nowrap;
    background: linear-gradient(135deg, #0A1E1C 0%, #16433E 100%);
    border: none;
    box-shadow: 0 6px 18px rgba(57, 197, 187, 0.14);
    color: #39C5BB;
    font-family: 'Audiowide', monospace;
    font-size: 11px;
    font-weight: 800;
    padding: 5px 14px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 14px rgba(57, 197, 187, 0.5);
    z-index: 20;
    letter-spacing: 0.5px;
    text-shadow: 0 0 10px rgba(57, 197, 187, 0.95);
}

.speech-arrow {
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: #0A1E1C;
    border-left: 1.8px solid #39C5BB;
    border-bottom: 1.8px solid #39C5BB;
}

.speech-pop-enter-active,
.speech-pop-leave-active {
    transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.speech-pop-enter-from,
.speech-pop-leave-to {
    opacity: 0;
    transform: scale(0.7) translateX(-12px);
}

.title-text-box {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.title-main-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.nav-header-title {
    font-size: 16px;
    font-weight: 900;
    color: #0E2926;
    letter-spacing: 1px;
    margin: 0;
}

.miku-01-badge {
    font-family: 'Audiowide', monospace;
    font-size: 9px;
    font-weight: 900;
    color: #39C5BB;
    background: #0E2926;
    border: none;
    padding: 1px 6px;
    border-radius: 6px;
    letter-spacing: 0.8px;
    box-shadow: 0 0 8px rgba(57, 197, 187, 0.4);
}

.nav-subtitle-tech {
    font-family: 'Audiowide', monospace;
    font-size: 9px;
    color: #12A79C;
    letter-spacing: 1.2px;
    opacity: 0.85;
}

/* 声波律动柱 */
.audio-spectrum-hud {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 18px;
}

.audio-spectrum-hud i {
    width: 3px;
    height: 100%;
    background: #39C5BB;
    border-radius: 2px;
    animation: hudBarPulse 1.1s ease-in-out infinite alternate;
}

@keyframes hudBarPulse {
    0% { height: 20%; opacity: 0.4; }
    100% { height: 100%; opacity: 1; background: #00F3FF; box-shadow: 0 0 6px #00F3FF; }
}

.nav-header-meta {
    display: flex;
    align-items: center;
    gap: 10px;
}

.meta-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #0E7A73;
    background: rgba(57, 197, 187, 0.12);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: none;
    padding: 3px 12px;
    border-radius: 20px;
    font-weight: 700;
    box-shadow: 0 2px 10px rgba(8, 90, 87, 0.08);
}

.meta-pill b {
    color: #0B7A73;
    font-weight: 900;
}

.meta-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #39C5BB;
    box-shadow: 0 0 6px #39C5BB;
}

.meta-dot.cyan {
    background: #00F3FF;
    box-shadow: 0 0 6px #00F3FF;
}

/* ==================== 单行左右滑动分类轨 (.nav-tags-row) ==================== */
.nav-tags-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.nav-scroll-container {
    display: flex;
    align-items: center;
    flex-wrap: nowrap !important;
    gap: 10px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 6px 4px 8px 4px;
    scroll-behavior: smooth;
    user-select: none;
    box-sizing: border-box;
    width: 100%;
    transform: translateZ(0);
    will-change: scroll-position;
    -webkit-overflow-scrolling: touch;
}

.nav-scroll-container::-webkit-scrollbar {
    display: none;
}

/* ==================== 初音原画卡片 (.miku-art-card) 60FPS 极速 GPU 加速版 ==================== */
.miku-art-card {
    position: relative;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 42px;
    padding: 0 18px;
    border-radius: 21px;
    background: #0E2926;
    border: none;
    cursor: pointer;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(8, 90, 87, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease;
    user-select: none;
    contain: layout paint style;
}

/* 1. 背景美图层：GPU 硬件加速过渡 (opacity & transform) */
.card-bg-layer {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center 30%;
    opacity: 0.75;
    filter: brightness(0.9);
    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 1;
}

/* 2. 赛博质感渐变遮罩：保障文字高清易读，同时保留初音美图亮色 */
.card-overlay-layer {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(10, 32, 29, 0.55) 0%, rgba(18, 55, 50, 0.35) 100%);
    transition: background 0.3s ease, opacity 0.3s ease;
    z-index: 2;
}

/* 前端内容层：高清白色阴影文字 */
.card-content {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #FFFFFF;
    font-family: 'Outfit', 'PingFang SC', sans-serif;
    font-size: 14px;
    font-weight: 800;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.95), 0 0 10px rgba(0, 0, 0, 0.75);
    white-space: nowrap;
    transition: transform 0.25s ease, text-shadow 0.25s ease;
}

.note-icon {
    font-size: 14px;
    color: #39C5BB;
    transition: transform 0.25s ease, color 0.25s ease;
}

.card-count {
    font-size: 11px;
    font-weight: 900;
    color: #FFFFFF;
    background: rgba(10, 30, 28, 0.7);
    border: none;
    padding: 1px 7px;
    border-radius: 10px;
    margin-left: 2px;
}

/* 3. 悬停状态 (Hover) */
.miku-art-card:hover .card-bg-layer {
    opacity: 1.0;
    transform: translateZ(0) scale(1.08);
}

.miku-art-card:hover .card-overlay-layer {
    background: linear-gradient(135deg, rgba(10, 32, 29, 0.25) 0%, rgba(18, 55, 50, 0.1) 100%);
}

.miku-art-card:hover .card-content {
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.9);
}

.miku-art-card:hover .note-icon {
    color: #39C5BB;
    transform: scale(1.3) rotate(16deg);
}

.miku-art-card:hover .card-count {
    color: #FFFFFF;
    background: rgba(57, 197, 187, 0.4);
    border-color: rgba(255, 255, 255, 0.6);
}

.miku-art-card:hover {
    transform: translateY(-3px) scale(1.03);
    border-color: #39C5BB;
    box-shadow: 0 6px 18px rgba(11, 122, 115, 0.25);
}

.miku-art-card:active {
    transform: translateY(-1px) scale(0.97);
}

/* 4. 选中激活态 (Active) */
.miku-art-card.active .card-bg-layer {
    opacity: 1.0;
    filter: saturate(1.35) brightness(1.12);
    transform: scale(1.08);
}

.miku-art-card.active .card-overlay-layer {
    background: linear-gradient(135deg, rgba(11, 122, 115, 0.3) 0%, rgba(6, 40, 38, 0.15) 100%);
}

.miku-art-card.active .card-content {
    color: #FFFFFF;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.95);
}

.miku-art-card.active .note-icon {
    color: #FFFFFF;
}

.miku-art-card.active .card-count {
    color: #FFFFFF;
    background: rgba(0, 0, 0, 0.5);
    border: none;
}

.miku-art-card.active {
    box-shadow: 0 10px 26px rgba(57, 197, 187, 0.35), 0 0 18px rgba(57, 197, 187, 0.25);
    box-shadow: 0 6px 20px rgba(11, 122, 115, 0.35) !important;
}

.card-active-badge {
    font-family: 'Audiowide', monospace;
    font-size: 9.5px;
    font-weight: 900;
    color: #FFFFFF;
    background: #0B7A73;
    border: none;
    padding: 1px 7px;
    border-radius: 6px;
    margin-left: 4px;
    letter-spacing: 0.5px;
}

.miku-art-card.popping {
    animation: capsulePop 0.48s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.active-badge {
    font-family: 'Audiowide', monospace;
    font-size: 9.5px;
    font-weight: 900;
    color: #FFFFFF;
    background: rgba(0, 0, 0, 0.35);
    border: 1.2px solid rgba(255, 255, 255, 0.7);
    padding: 1px 6px;
    border-radius: 6px;
    margin-left: 4px;
    letter-spacing: 0.5px;
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.95);
}

.dept-capsule.popping {
    animation: capsulePop 0.48s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes capsulePop {
    0% { transform: translateY(-2px) scale(1); }
    35% { transform: translateY(-5px) scale(1.08); }
    62% { transform: translateY(-1px) scale(0.97); }
    100% { transform: translateY(0) scale(1); }
}

/* 滚动箭头 */
.scroll-arrow {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.78);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: none;
    color: #12A79C;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(8, 90, 87, 0.12);
    transition: all 0.25s ease;
}

.scroll-arrow:hover {
    background: #39C5BB;
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 0 16px rgba(57, 197, 187, 0.6);
    transform: scale(1.08);
}

/* 悬浮粒子 */
.particle-stage {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
}

.floating-note-particle {
    position: fixed;
    font-size: 16px;
    font-weight: 900;
    color: #39C5BB;
    text-shadow: 0 0 10px #00F3FF;
    animation: particleUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes particleUp {
    0% { opacity: 1; transform: translateY(0) scale(0.8) rotate(0deg); }
    100% { opacity: 0; transform: translateY(-45px) scale(1.4) rotate(25deg); }
}

@media (max-width: 768px) {
    .nav-inner {
        padding: 0 12px;
        gap: 8px;
    }
    .nav-header-row {
        flex-wrap: wrap;
        gap: 8px;
    }
    .nav-header-title {
        font-size: 13.5px;
    }
    .dept-track-wrapper {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: none !important;
        padding-bottom: 4px;
    }
    .dept-track-wrapper::-webkit-scrollbar {
        display: none !important;
    }
    .scroll-arrow {
        display: none !important;
    }
    .dept-capsule {
        padding: 0 12px;
        height: 32px;
        font-size: 12px;
        flex-shrink: 0 !important;
    }
}
</style>
