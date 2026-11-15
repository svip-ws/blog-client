<template>
    <div
        ref="cardRef"
        class="sidebar-card glass-miku-card sidebar-comments-cyber"
        :style="card3DStyle"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
    >
        <!-- 粒子爆炸 Canvas -->
        <canvas ref="particleCanvas" class="particle-canvas"></canvas>

        <!-- 4K Miku 壁纸全息背景层 -->
        <div class="card-holo-bg">
            <img src="/images/miku/miku_wp_10.jpg" class="holo-img" alt="Holo Miku BG" loading="lazy" decoding="async" />
            <div class="holo-scanlines"></div>
            <div class="holo-glow-mask"></div>
        </div>

        <!-- 侧边栏头部 -->
        <div class="sidebar-header-cyber">
            <div class="header-left">
                <div class="header-disc-box">
                    <span class="header-icon-disc"></span>
                    <span class="disc-glow"></span>
                </div>
                <div class="title-group">
                    <span class="header-title">最新评论</span>
                </div>
            </div>
        </div>

        <!-- 音律分类筛选胶囊 (ALL / NEW / HOT) -->
        <div class="comments-filter-track">
            <span
                v-for="tab in filterTabs"
                :key="tab.key"
                class="filter-tab-pill tactile-btn"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
            >
                <span class="tab-dot"></span>
                <span>{{ tab.label }}</span>
            </span>
        </div>

        <!-- 留言列表（Cyber 胶囊音律长廊 + 二次元壁纸背景） -->
        <div class="sidebar-comments-body" v-if="displayComments && displayComments.length > 0">
            <div
                v-for="(comment, index) in displayComments"
                :key="comment.id"
                class="sb-comment-cyber tactile-btn"
                :style="{ animationDelay: (index * 0.05) + 's' }"
                @click="onItemClick($event, comment.article_id)"
                @mouseenter="onItemHover(comment)"
            >
                <!-- 360° 流动流光边框 -->
                <div class="comment-flowing-border" aria-hidden="true"></div>

                <!-- 斜向液态光束流动扫过 -->
                <div class="comment-flowing-light-beam" aria-hidden="true"></div>

                <!-- 内部液态流动水晕 -->
                <div class="comment-liquid-glow" aria-hidden="true"></div>

                <!-- 初音二次元壁纸卡片背景层 (悬浮变清晰) -->
                <div class="comment-card-miku-bg-wrap" aria-hidden="true">
                    <img :src="getCommentWallpaper(index)" alt="Miku Comment BG" class="comment-miku-bg-img" loading="lazy" decoding="async" />
                    <div class="comment-scrim-mask"></div>
                    <span class="comment-miku-watermark">39</span>
                </div>

                <!-- 初音耳机风格头像环 -->
                <div class="sb-comment-avatar">
                    <span class="avatar-char">{{ comment.user_name?.charAt(0) || '初' }}</span>
                    <div class="avatar-ring-dashed"></div>
                    <div class="avatar-online-dot"></div>
                </div>

                <div class="sb-comment-content">
                    <div class="sb-comment-top">
                        <div class="user-box">
                            <span class="sb-comment-user">{{ comment.user_name || '读者' }}</span>
                        </div>
                        <span class="sb-comment-time" v-if="comment.create_time">{{ formatTime(comment.create_time) }}</span>
                    </div>

                    <div class="sb-comment-text-box">
                        <span class="quote-mark left">「</span>
                        <p class="sb-comment-text">{{ comment.content }}</p>
                        <span class="quote-mark right">」</span>
                    </div>
                </div>

                <!-- 悬浮脉冲指示器与声波点 -->
                <div class="chat-pulse-box">
                    <span class="chat-pulse-indicator"></span>
                    <div class="mini-eq-bars">
                        <i></i><i></i><i></i>
                    </div>
                </div>
            </div>
        </div>
        <el-empty v-else description="暂无最新评论" :image-size="50" />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatTime } from '../../utils/format';

const props = defineProps({
    comments: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['goArticle']);

// 初音壁纸素材库
const MIKU_COMMENT_WALLPAPERS = [
    '/images/miku/miku_wp_1.jpg',
    '/images/miku/miku_wp_3.jpg',
    '/images/miku/miku_wp_4.jpg',
    '/images/miku/miku_wp_8.jpg',
    '/images/miku/miku_wp_9.jpg',
    '/images/miku/miku_wp_11.jpg'
];

const getCommentWallpaper = (index) => {
    return MIKU_COMMENT_WALLPAPERS[index % MIKU_COMMENT_WALLPAPERS.length];
};

// 筛选 Tab
const activeTab = ref('all');
const filterTabs = [
    { key: 'all', label: '全部共鸣' },
    { key: 'new', label: '最新心意' },
    { key: 'hot', label: '热门讨论' }
];

const displayComments = computed(() => {
    if (!props.comments || props.comments.length === 0) return [];
    if (activeTab.value === 'new') {
        return [...props.comments].sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
    }
    if (activeTab.value === 'hot') {
        return [...props.comments].slice(0, 4);
    }
    return props.comments;
});

// 3D 卡片微倾斜效果
const cardRef = ref(null);
const tiltX = ref(0);
const tiltY = ref(0);

let commTiltRaf = null;
const handleMouseMove = (e) => {
    if (!cardRef.value || commTiltRaf) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    commTiltRaf = requestAnimationFrame(() => {
        commTiltRaf = null;
        if (!cardRef.value) return;
        const rect = cardRef.value.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        tiltX.value = ((y - centerY) / centerY) * -4;
        tiltY.value = ((x - centerX) / centerX) * 4;
    });
};

const handleMouseLeave = () => {
    if (commTiltRaf) {
        cancelAnimationFrame(commTiltRaf);
        commTiltRaf = null;
    }
    tiltX.value = 0;
    tiltY.value = 0;
};

const card3DStyle = computed(() => ({
    transform: `perspective(1000px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg) translateZ(0)`,
    transition: tiltX.value === 0 && tiltY.value === 0 ? 'transform 0.5s ease' : 'none'
}));

// Q版立绘对话
const mascotSpeech = ref('欢迎阅读大家的留言心意 ♪');
const speechList = [
    '每一条留言都是真诚的交流 ♪',
    '看看大家都在讨论什么',
    '欢迎留下你的想法与观点 ♪',
    '分享阅读心得，交流创作灵感'
];

const triggerMascotTalk = () => {
    const randomText = speechList[Math.floor(Math.random() * speechList.length)];
    mascotSpeech.value = randomText;
};

const onItemHover = (comment) => {
    mascotSpeech.value = `「${comment.user_name || '读者'}」：${comment.content?.slice(0, 14)}...`;
};

// 粒子爆炸效果
const particleCanvas = ref(null);
const onItemClick = (e, articleId) => {
    createParticles(e);
    emit('goArticle', articleId);
};

const createParticles = (e) => {
    if (!particleCanvas.value || !cardRef.value) return;
    const canvas = particleCanvas.value;
    const ctx = canvas.getContext('2d');
    const rect = cardRef.value.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const colors = ['#39C5BB', '#12A79C', '#0B7A73', '#00F3FF', '#FFFFFF'];
    const particles = [];
    
    for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        particles.push({
            x: clickX,
            y: clickY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            life: Math.random() * 20 + 20
        });
    }
    
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        
        particles.forEach(p => {
            if (p.alpha > 0) {
                alive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 1 / p.life;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        if (alive) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
    
    animate();
};
</script>

<style scoped>
.sidebar-comments-cyber {
    position: relative;
    padding: 18px 18px 16px;
    margin-bottom: 22px;
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(234, 250, 247, 0.95) 100%);
    border: none;
    box-shadow: 0 16px 40px rgba(57, 197, 187, 0.18), 0 0 25px rgba(57, 197, 187, 0.10) inset;
    overflow: hidden;
    transform-style: preserve-3d;
}

.particle-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 10;
}

/* 4K 全息壁纸背景 */
.card-holo-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
}

.holo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.18;
    filter: saturate(1.4) contrast(1.1);
    transition: opacity 0.4s ease, filter 0.4s ease;
}

.sidebar-comments-cyber:hover .holo-img {
    opacity: 0.32;
    filter: saturate(1.6) contrast(1.15) brightness(1.05);
}

.holo-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
        0deg,
        rgba(57, 197, 187, 0.06),
        rgba(57, 197, 187, 0.06) 1px,
        transparent 1px,
        transparent 4px
    );
}

.holo-glow-mask {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 90% 10%, rgba(57, 197, 187, 0.18) 0%, transparent 60%),
                radial-gradient(circle at 10% 90%, rgba(18, 167, 156, 0.15) 0%, transparent 60%);
}

/* HUD 边角装饰 */
.hud-corner {
    position: absolute;
    font-family: 'Audiowide', monospace;
    font-size: 8.5px;
    font-weight: 900;
    color: rgba(57, 197, 187, 0.75);
    pointer-events: none;
    z-index: 3;
    line-height: 1;
}
.top-left { top: 6px; left: 8px; }
.top-right { top: 6px; right: 8px; }
.bottom-left { bottom: 6px; left: 8px; }
.bottom-right { bottom: 6px; right: 8px; }

/* Q版吉祥物舞台 */
.comments-chibi-mascot {
    position: absolute;
    top: 4px;
    right: 10px;
    z-index: 4;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.mascot-img-wrap {
    position: relative;
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chibi-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: none;
    animation: chibiFloat 3.5s ease-in-out infinite alternate;
    transition: transform 0.25s ease;
    z-index: 2;
}

.comments-chibi-mascot:hover .chibi-img {
    transform: scale(1.18) rotate(8deg);
}

@keyframes chibiFloat {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(-5px) rotate(-4deg); }
}

.speech-bubble {
    position: absolute;
    bottom: 48px;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    white-space: nowrap;
    background: linear-gradient(135deg, #0E2926, #16433E);
    border: 1.5px solid #39C5BB;
    padding: 6px 12px;
    border-radius: 14px;
    box-shadow: 0 6px 20px rgba(8, 90, 87, 0.35);
    animation: bubblePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: none;
}

.bubble-tag {
    font-family: 'Audiowide', sans-serif;
    font-size: 7.5px;
    font-weight: 900;
    color: #39C5BB;
    letter-spacing: 0.5px;
}

.bubble-txt {
    font-size: 11px;
    font-weight: 800;
    color: #FFFFFF;
}

.speech-bubble::after {
    content: '';
    position: absolute;
    bottom: -6px;
    right: 18px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid #16433E;
}

@keyframes bubblePop {
    from { opacity: 0; transform: scale(0.6) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

/* 侧边栏头部 */
.sidebar-header-cyber {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1.5px dashed rgba(57, 197, 187, 0.35);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-disc-box {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-icon-disc {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px dashed #39C5BB;
    animation: vinylSpin 6s linear infinite;
}

.disc-glow {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(57, 197, 187, 0.4), transparent);
}

@keyframes vinylSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.title-group {
    display: flex;
    flex-direction: column;
}

.header-title {
    font-size: 15px;
    font-weight: 900;
    color: #0E2926;
    letter-spacing: 0.5px;
}

.header-sub {
    font-family: 'Audiowide', sans-serif;
    font-size: 8px;
    font-weight: 800;
    color: #00687d;
    letter-spacing: 1px;
}

.header-chip {
    font-family: 'Audiowide', sans-serif;
    font-size: 8.5px;
    font-weight: 900;
    color: #ffffff;
    padding: 2px 7px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(57, 197, 187, 0.4);
}

.glow-cyan {
    background: linear-gradient(90deg, #39C5BB, #00687d);
}

/* 筛选 Tab 胶囊条 */
.comments-filter-track {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
}

.filter-tab-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.85);
    border: none;
    box-shadow: 0 2px 8px rgba(8, 90, 87, 0.06);
    font-size: 11px;
    font-weight: 800;
    color: #475569;
    cursor: pointer;
    transition: all 0.25s ease;
}

.tab-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #94A3B8;
    transition: background 0.25s ease;
}

.filter-tab-pill:hover {
    background: rgba(57, 197, 187, 0.15);
    color: #0B7A73;
}

.filter-tab-pill.active {
    background: linear-gradient(135deg, #39C5BB 0%, #12A79C 100%);
    color: #FFFFFF;
    box-shadow: 0 2px 10px rgba(57, 197, 187, 0.35);
}

.filter-tab-pill.active .tab-dot {
    background: #FFFFFF;
    box-shadow: 0 0 6px #FFFFFF;
}

/* ==================== 留言卡片 (.sb-comment-cyber) 主题化设计 ==================== */
.sidebar-comments-body {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.sb-comment-cyber {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 11px 13px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.88);
    border: none;
    box-shadow: 0 4px 14px rgba(8, 90, 87, 0.07);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
    isolation: isolate;
    /* 性能：让浏览器跳过渲染离屏卡片 */
    content-visibility: auto;
    contain-intrinsic-size: 0 60px;
}

/* 360° 全围环绕流动流光边框 (Hover 时高亮) */
.comment-flowing-border {
    position: absolute;
    inset: -2px;
    border-radius: 18px;
    background: linear-gradient(90deg, #39C5BB, #00F3FF, #12A79C, #0B7A73, #00F3FF, #39C5BB);
    background-size: 300% 300%;
    /* 性能：默认暂停动画，仅 hover 时激活 */
    animation: flowingBorder 3.5s linear infinite;
    animation-play-state: paused;
    z-index: 0;
    opacity: 0;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask-composite: xor;
    padding: 1.5px;
    transition: opacity 0.3s ease;
}

.sb-comment-cyber:hover .comment-flowing-border {
    opacity: 0.95;
    animation-play-state: running;
}

/* 斜向液态光束流动扫过 - 性能：默认暂停，hover 时才运行 */
.comment-flowing-light-beam {
    position: absolute;
    top: -50%;
    left: -70%;
    width: 45%;
    height: 200%;
    background: linear-gradient(90deg, transparent 0%, rgba(57, 197, 187, 0.28) 50%, transparent 100%);
    transform: rotate(25deg);
    animation: diagonalBeamSweep 4s ease-in-out infinite;
    animation-play-state: paused;
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.sb-comment-cyber:hover .comment-flowing-light-beam {
    animation-play-state: running;
    opacity: 0.6;
}

/* 内部液态流动水晕 - 性能：默认暂停，hover 时才运行 */
.comment-liquid-glow {
    position: absolute;
    inset: -50%;
    background: radial-gradient(ellipse at 30% 20%, rgba(0, 243, 255, 0.18) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(57, 197, 187, 0.15) 0%, transparent 50%);
    background-size: 200% 200%;
    animation: liquidFlow 6s ease-in-out infinite alternate;
    animation-play-state: paused;
    pointer-events: none;
    z-index: 1;
}

.sb-comment-cyber:hover .comment-liquid-glow {
    animation-play-state: running;
}

/* 初音二次元壁纸背景层 (悬浮变清晰) */
.comment-card-miku-bg-wrap {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
    isolation: isolate;
    border-radius: 16px;
}

.comment-miku-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 20%;
    opacity: 0.50;
    filter: saturate(1.26) contrast(1.04);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease;
}

.comment-scrim-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(125deg, rgba(255, 255, 255, 0.62) 0%, rgba(235, 252, 249, 0.46) 55%, rgba(255, 238, 246, 0.36) 100%);
    transition: background 0.4s ease;
}

.comment-miku-watermark {
    position: absolute;
    bottom: -8px;
    right: 8px;
    font-family: 'Audiowide', monospace;
    font-size: 32px;
    font-weight: 900;
    color: rgba(57, 197, 187, 0.12);
    pointer-events: none;
    user-select: none;
}

/* Hover 时右侧插画柔和亮起、左侧正文保持高清对比 */
.sb-comment-cyber:hover {
    background: #ffffff;
    border-color: #39C5BB;
    transform: translateX(6px) scale(1.015);
    box-shadow: 0 10px 28px rgba(57, 197, 187, 0.32), 0 0 16px rgba(57, 197, 187, 0.18);
}

.sb-comment-cyber:hover .comment-miku-bg-img {
    transform: scale(1.06);
    opacity: 0.62;
    filter: brightness(1.05) saturate(1.32);
}

.sb-comment-cyber:hover .comment-scrim-mask {
    background: linear-gradient(96deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.78) 52%, rgba(224, 248, 245, 0.32) 100%);
}

/* 头像与耳机环 */
.sb-comment-avatar {
    position: relative;
    z-index: 1;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #39C5BB 0%, #0B7A73 100%);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13.5px;
    font-weight: 900;
    flex-shrink: 0;
    box-shadow: 0 3px 12px rgba(57, 197, 187, 0.4);
}

.avatar-ring-dashed {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1.5px dashed rgba(57, 197, 187, 0.7);
    /* 性能：默认不旋转，hover 时才运转 */
    animation: vinylSpin 8s linear infinite;
    animation-play-state: paused;
}

.sb-comment-cyber:hover .avatar-ring-dashed {
    animation-play-state: running;
}

.avatar-online-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 9.5px;
    height: 9.5px;
    border-radius: 50%;
    background: #00F3FF;
    border: 1.5px solid #ffffff;
    box-shadow: 0 0 8px #00F3FF;
}

/* 内容 */
.sb-comment-content {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.sb-comment-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.user-box {
    display: flex;
    align-items: center;
    gap: 6px;
}

.sb-comment-user {
    font-size: 13px;
    font-weight: 900;
    color: #0E2926;
}

.resonator-tag {
    font-family: 'Audiowide', sans-serif;
    font-size: 7.5px;
    font-weight: 800;
    color: #39C5BB;
    background: rgba(57, 197, 187, 0.15);
    padding: 1px 5px;
    border-radius: 4px;
    border: 1px solid rgba(57, 197, 187, 0.35);
}

.sb-comment-time {
    font-family: monospace;
    font-size: 9.5px;
    color: #00687d;
    font-weight: 700;
}

.sb-comment-text-box {
    display: flex;
    align-items: center;
    gap: 2px;
}

.quote-mark {
    font-size: 13px;
    font-weight: 900;
    color: #39C5BB;
    line-height: 1;
    text-shadow: 0 0 6px rgba(57, 197, 187, 0.4);
}

.sb-comment-text {
    font-size: 12px;
    font-weight: 800;
    color: #0F3B37;
    margin: 0;
    line-height: 1.45;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chat-pulse-box {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 3px;
    align-self: center;
    flex-shrink: 0;
}

.chat-pulse-indicator {
    width: 6.5px;
    height: 6.5px;
    border-radius: 50%;
    background: #39C5BB;
    transition: all 0.25s ease;
}

.mini-eq-bars {
    display: flex;
    align-items: flex-end;
    gap: 1.5px;
    height: 10px;
}

.mini-eq-bars i {
    width: 2px;
    height: 100%;
    background: #39C5BB;
    border-radius: 1px;
    opacity: 0.5;
    /* 性能：默认暂停，hover 时运行 */
    animation: waveBar 1.2s ease-in-out infinite alternate;
    animation-play-state: paused;
}

.sb-comment-cyber:hover .mini-eq-bars i {
    animation-play-state: running;
}

.mini-eq-bars i:nth-child(1) { animation-delay: 0s; }
.mini-eq-bars i:nth-child(2) { animation-delay: 0.2s; }
.mini-eq-bars i:nth-child(3) { animation-delay: 0.4s; }

.sb-comment-cyber:hover .chat-pulse-indicator {
    background: #00F3FF;
    transform: scale(1.4);
    box-shadow: 0 0 10px #00F3FF;
}

.sb-comment-cyber:hover .mini-eq-bars i {
    background: #00F3FF;
    opacity: 1;
}

/* 底部 HUD 状态与音轨音频律动条 */
.comments-footer-hud {
    position: relative;
    z-index: 2;
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px dashed rgba(57, 197, 187, 0.28);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.hud-status-text {
    font-family: 'Audiowide', monospace;
    font-size: 8.5px;
    font-weight: 900;
    color: #00687d;
}

.cyber-spectrum-bar {
    display: flex;
    align-items: flex-end;
    gap: 2.5px;
    height: 12px;
}

.spectrum-column {
    width: 2.5px;
    border-radius: 2px;
    background: linear-gradient(180deg, #39C5BB, #12A79C);
    animation: spectrumBounce 1s ease-in-out infinite alternate;
}

@keyframes spectrumBounce {
    0% { height: 20%; opacity: 0.35; }
    100% { height: 95%; opacity: 1; }
}
</style>