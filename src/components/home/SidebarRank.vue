<template>
    <div
        ref="cardRef"
        class="sidebar-card glass-miku-card sidebar-rank-cyber"
        :style="card3DStyle"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
    >
        <!-- 粒子爆炸 Canvas -->
        <canvas ref="particleCanvas" class="particle-canvas"></canvas>

        <!-- 4K 壁纸全息背景遮罩 -->
        <div class="card-holo-bg">
            <img src="/images/miku/miku_wp_9.jpg" class="holo-img" alt="Holo BG" loading="lazy" decoding="async" />
            <div class="holo-scanlines"></div>
            <div class="holo-mask"></div>
        </div>

        <!-- 侧边栏头部 -->
        <div class="sidebar-header-cyber">
            <div class="header-left">
                <div class="header-disc-box">
                    <span class="header-icon-disc"></span>
                    <span class="disc-glow"></span>
                </div>
                <div class="title-group">
                    <span class="header-title">热门阅读榜</span>
                </div>
            </div>
        </div>

        <!-- 榜单列表 (初音高清二次元壁纸背景 + 360° 流光边框 + 殿堂勋章) -->
        <div class="rank-list" v-if="articles && articles.length > 0">
            <div
                v-for="(article, index) in articles"
                :key="article.id"
                class="rank-item-cyber tactile-btn"
                :class="'rank-tier-' + (index + 1)"
                :style="{ animationDelay: (index * 0.06) + 's' }"
                @click="onItemClick($event, article.id)"
                @mouseenter="onItemHover(article)"
            >
                <!-- 360° 流动流光边框 -->
                <div class="rank-flowing-border" aria-hidden="true"></div>

                <!-- 斜向液态光束流动扫过 -->
                <div class="rank-flowing-light-beam" aria-hidden="true"></div>

                <!-- 初音二次元壁纸卡片背景层 (悬浮解封变清晰) -->
                <div class="rank-card-miku-bg-wrap" aria-hidden="true">
                    <img :src="getRankWallpaper(index)" alt="Miku Rank BG" class="rank-miku-bg-img" />
                    <div class="rank-scrim-mask"></div>
                    <span class="rank-miku-watermark">39</span>
                </div>

                <!-- 殿堂 / SSR / SR / R 勋章 -->
                <div class="rank-badge-box" :class="'top-' + (index + 1)">
                    <span class="rank-num">{{ String(index + 1).padStart(2, '0') }}</span>
                    <span v-if="index === 0" class="crown-icon glow-gold" title="殿堂榜首">👑 榜首</span>
                    <span v-else-if="index === 1" class="crown-icon glow-cyan" title="极光热文">🎵 热文</span>
                    <span v-else-if="index === 2" class="crown-icon glow-teal" title="秘境推荐">✦ 精选</span>
                    <span v-else class="rank-tier-tag">优</span>
                </div>

                <div class="rank-info">
                    <h4 class="rank-title">{{ article.title }}</h4>
                    <div class="rank-meta">
                        <span class="rank-views">
                            <span class="view-note">♪</span>
                            <span>{{ article.view_count || 0 }}</span>
                            <span class="view-unit">阅读</span>
                        </span>
                        <span class="rank-category" v-if="article.category_name">
                            {{ article.category_name }}
                        </span>
                    </div>
                </div>
                
                <div class="arrow-box">
                    <span class="rank-arrow">➔</span>
                </div>
            </div>
        </div>
        <el-empty v-else description="暂无热门文章" :image-size="50" />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    articles: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['goArticle']);

// 初音壁纸素材库
const MIKU_RANK_WALLPAPERS = [
    '/images/miku/miku_wp_9.jpg',
    '/images/miku/miku_wp_1.jpg',
    '/images/miku/miku_wp_3.jpg',
    '/images/miku/miku_wp_4.jpg',
    '/images/miku/miku_wp_8.jpg',
    '/images/miku/miku_wp_11.jpg'
];

const getRankWallpaper = (index) => {
    return MIKU_RANK_WALLPAPERS[index % MIKU_RANK_WALLPAPERS.length];
};

// 3D 倾斜效果
const cardRef = ref(null);
const tiltX = ref(0);
const tiltY = ref(0);

let rankTiltRaf = null;
const handleMouseMove = (e) => {
    if (!cardRef.value || rankTiltRaf) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    rankTiltRaf = requestAnimationFrame(() => {
        rankTiltRaf = null;
        if (!cardRef.value) return;
        const rect = cardRef.value.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        tiltX.value = ((y - centerY) / centerY) * -5;
        tiltY.value = ((x - centerX) / centerX) * 5;
    });
};

const handleMouseLeave = () => {
    if (rankTiltRaf) {
        cancelAnimationFrame(rankTiltRaf);
        rankTiltRaf = null;
    }
    tiltX.value = 0;
    tiltY.value = 0;
};

const card3DStyle = computed(() => {
    return {
        transform: `perspective(1000px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg) translateZ(0)`,
        transition: tiltX.value === 0 && tiltY.value === 0 ? 'transform 0.5s ease' : 'none'
    };
});

// Q版立绘对话与弹跳粒子
const isMascotBouncing = ref(false);
const particles = ref([]);
const mascotSpeech = ref('点击探索热门文章吧 ♪');
const speechList = [
    '热门榜单持续更新中 ♪',
    '看看大家都在讨论什么',
    '发现更多精彩文章 ♪',
    '探索初音技术文库与灵感'
];

const triggerMascotTalk = () => {
    const randomText = speechList[Math.floor(Math.random() * speechList.length)];
    mascotSpeech.value = randomText;
    isMascotBouncing.value = true;
    setTimeout(() => { isMascotBouncing.value = false; }, 600);
    spawnParticles();
};

const onItemHover = (article) => {
    mascotSpeech.value = `「${article.title?.slice(0, 14)}」`;
};

const spawnParticles = () => {
    const chars = ['♪', '♫', '✦', '39', '⚡', '★'];
    for (let i = 0; i < 5; i++) {
        const pId = Date.now() + Math.random();
        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 40;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 15;
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        particles.value.push({
            id: pId,
            char,
            style: {
                transform: `translate(${tx}px, ${ty}px) scale(${0.7 + Math.random() * 0.5})`,
                opacity: 0
            }
        });
        
        setTimeout(() => {
            particles.value = particles.value.filter(p => p.id !== pId);
        }, 800);
    }
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
.sidebar-rank-cyber {
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
}

.holo-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
        0deg,
        rgba(57, 197, 187, 0.05),
        rgba(57, 197, 187, 0.05) 1px,
        transparent 1px,
        transparent 4px
    );
}

.holo-mask {
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
.rank-chibi-mascot {
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

.rank-chibi-mascot:hover .chibi-img {
    transform: scale(1.18) rotate(8deg);
}

.mascot-img-wrap.is-bouncing .chibi-img {
    animation: mikuJump 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes mikuJump {
    0% { transform: translateY(0) rotate(0deg) scale(1); }
    40% { transform: translateY(-14px) rotate(-10deg) scale(1.2); }
    70% { transform: translateY(-5px) rotate(6deg) scale(1.1); }
    100% { transform: translateY(0) rotate(0deg) scale(1); }
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

.pop-particle {
    position: absolute;
    font-size: 13px;
    font-weight: 900;
    color: #39C5BB;
    text-shadow: 0 0 6px rgba(57, 197, 187, 0.8);
    pointer-events: none;
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 5;
}

/* 侧边栏头部 */
.sidebar-header-cyber {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 12px;
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

/* 列表条目 (.rank-item-cyber) 主题化 */
.rank-list {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.rank-item-cyber {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.90);
    border: none;
    box-shadow: 0 4px 14px rgba(8, 90, 87, 0.07);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
    isolation: isolate;
}

/* 360° 全围环绕流动流光边框 - 性能：默认暂停 */
.rank-flowing-border {
    position: absolute;
    inset: -2px;
    border-radius: 18px;
    background: linear-gradient(90deg, #39C5BB, #00F3FF, #12A79C, #0B7A73, #00F3FF, #39C5BB);
    background-size: 300% 300%;
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

.rank-item-cyber:hover .rank-flowing-border {
    opacity: 0.95;
    animation-play-state: running;
}

/* 斜向液态光束流动扫过 - 性能：默认暂停 */
.rank-flowing-light-beam {
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

.rank-item-cyber:hover .rank-flowing-light-beam {
    animation-play-state: running;
    opacity: 0.6;
}

@keyframes diagonalBeamSweep {
    0% { transform: translateX(0) rotate(25deg); opacity: 0; }
    20% { opacity: 0.6; }
    80% { opacity: 0.6; }
    100% { transform: translateX(450px) rotate(25deg); opacity: 0; }
}

@keyframes flowingBorder {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* 初音二次元壁纸背景层 (悬浮变清晰) */
.rank-card-miku-bg-wrap {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
    isolation: isolate;
    border-radius: 16px;
}

.rank-miku-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 20%;
    opacity: 0.50;
    filter: saturate(1.26) contrast(1.04);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease;
}

.rank-scrim-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(125deg, rgba(255, 255, 255, 0.62) 0%, rgba(235, 252, 249, 0.46) 55%, rgba(255, 238, 246, 0.36) 100%);
    transition: background 0.4s ease;
}

.rank-miku-watermark {
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

.rank-item-cyber:hover {
    background: #ffffff;
    border-color: #39C5BB;
    transform: translateX(6px) scale(1.015);
    box-shadow: 0 10px 28px rgba(57, 197, 187, 0.32), 0 0 16px rgba(57, 197, 187, 0.18);
}

.rank-item-cyber:hover .rank-miku-bg-img {
    transform: scale(1.06);
    opacity: 0.62;
    filter: brightness(1.05) saturate(1.32);
}

.rank-item-cyber:hover .rank-scrim-mask {
    background: linear-gradient(96deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.78) 52%, rgba(224, 248, 245, 0.32) 100%);
}

/* 勋章与排名 */
.rank-badge-box {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    padding: 4px 6px;
    border-radius: 10px;
    background: rgba(57, 197, 187, 0.12);
    border: none;
    flex-shrink: 0;
    line-height: 1.1;
}

.rank-num {
    font-family: 'Audiowide', monospace;
    font-size: 13px;
    font-weight: 900;
    color: #00687d;
}

.crown-icon {
    font-size: 9px;
    font-weight: 900;
    margin-top: 2px;
    letter-spacing: 0.5px;
}

.rank-tier-tag {
    font-family: 'Audiowide', sans-serif;
    font-size: 8px;
    font-weight: 800;
    color: #0B7A73;
    margin-top: 2px;
}

/* SSR 殿堂榜首 */
.top-1 {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(57, 197, 187, 0.25) 100%);
    border: none;
    box-shadow: 0 4px 14px rgba(255, 215, 0, 0.3);
    animation: ssrPulse 2.5s ease-in-out infinite alternate;
}

.top-1 .rank-num {
    color: #b45309;
    text-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
}

.glow-gold {
    color: #b45309;
    text-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
}

@keyframes ssrPulse {
    0% { box-shadow: 0 0 10px rgba(57, 197, 187, 0.3); }
    100% { box-shadow: 0 0 16px rgba(255, 215, 0, 0.5); }
}

/* SR 极光榜二 */
.top-2 {
    background: linear-gradient(135deg, rgba(57, 197, 187, 0.25) 0%, rgba(0, 243, 255, 0.15) 100%);
    border: none;
}

.top-2 .rank-num { color: #00687d; }
.glow-cyan { color: #00687d; }

/* R 榜三 */
.top-3 {
    background: linear-gradient(135deg, rgba(18, 167, 156, 0.2) 0%, rgba(228, 248, 245, 0.4) 100%);
    border: none;
}

.top-3 .rank-num { color: #0B7A73; }
.glow-teal { color: #0B7A73; }

/* 文章信息 */
.rank-info {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
}

.rank-title {
    font-size: 13px;
    font-weight: 900;
    color: #0E2926;
    margin: 0 0 4px;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.2s ease;
}

.rank-item-cyber:hover .rank-title {
    color: #00687d;
}

.rank-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
}

.rank-views {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #00687d;
    font-weight: 800;
    font-family: 'Audiowide', monospace;
    background: rgba(57, 197, 187, 0.14);
    padding: 2px 7px;
    border-radius: 6px;
    border: none;
}

.view-note {
    font-size: 11px;
    color: #39C5BB;
    font-weight: 900;
}

.view-unit {
    font-size: 9px;
    color: #0B7A73;
}

.rank-category {
    font-size: 10px;
    font-weight: 800;
    color: #ffffff;
    background: linear-gradient(90deg, #39C5BB, #00687d);
    padding: 2px 7px;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(57, 197, 187, 0.3);
}

.arrow-box {
    position: relative;
    z-index: 1;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(57, 197, 187, 0.12);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.25s ease;
}

.rank-arrow {
    font-size: 12px;
    font-weight: 900;
    color: #39C5BB;
    transition: transform 0.25s ease, color 0.25s ease;
}

.rank-item-cyber:hover .arrow-box {
    background: #39C5BB;
    transform: rotate(-45deg);
    box-shadow: 0 0 10px rgba(57, 197, 187, 0.5);
}

.rank-item-cyber:hover .rank-arrow {
    color: #ffffff;
}

/* 底部 HUD 状态与音轨音频律动条 */
.rank-footer-hud {
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