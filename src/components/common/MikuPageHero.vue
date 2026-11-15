<template>
    <section class="miku-hero" :class="'motif-' + motif">
        <!-- ① 专属初音插画底纹 -->
        <div class="hero-artwork-bg" :style="{ backgroundImage: 'url(' + banner + ')' }"></div>

        <!-- ② 青 / 粉双极光光晕 -->
        <div class="hero-aurora" aria-hidden="true">
            <span class="aurora a-teal"></span>
            <span class="aurora a-pink"></span>
        </div>

        <!-- ③ 赛博网格 + 扫描线 -->
        <div class="hero-grid" aria-hidden="true"></div>
        <div class="hero-scan" aria-hidden="true"></div>

        <!-- ④ 主题母题装饰层（每页视觉方向不同） -->
        <div class="hero-motif" aria-hidden="true">
            <!-- 分类 · 「双马尾 × 黑胶唱片」 -->
            <template v-if="motif === 'categories'">
                <svg class="twintail tail-l" viewBox="0 0 200 260" fill="none">
                    <defs>
                        <linearGradient :id="'ttL-' + uid" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#39C5BB" stop-opacity="0.92" />
                            <stop offset="100%" stop-color="#FF7E9D" stop-opacity="0.10" />
                        </linearGradient>
                    </defs>
                    <path :fill="'url(#ttL-' + uid + ')'"
                        d="M186 4 C 120 34 92 92 84 152 L 76 226 C 100 210 118 186 130 158 C 152 108 172 54 186 4 Z" />
                    <circle cx="187" cy="9" r="11" fill="#FF7E9D" opacity="0.5" />
                </svg>
                <svg class="twintail tail-r" viewBox="0 0 200 260" fill="none">
                    <defs>
                        <linearGradient :id="'ttR-' + uid" x1="1" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#FF7E9D" stop-opacity="0.88" />
                            <stop offset="100%" stop-color="#39C5BB" stop-opacity="0.10" />
                        </linearGradient>
                    </defs>
                    <path :fill="'url(#ttR-' + uid + ')'"
                        d="M186 4 C 120 34 92 92 84 152 L 76 226 C 100 210 118 186 130 158 C 152 108 172 54 186 4 Z" />
                    <circle cx="187" cy="9" r="11" fill="#39C5BB" opacity="0.5" />
                </svg>
                <div class="vinyl-disc">
                    <span class="vinyl-ring"></span>
                    <span class="vinyl-hole"></span>
                </div>
            </template>

            <!-- 标签 · 「音符簇 × 漂浮标签云」 -->
            <template v-else-if="motif === 'tags'">
                <span v-for="(c, i) in tagChips" :key="i" class="motif-chip"
                    :style="{ left: c.x, top: c.y, fontSize: c.s + 'rem', animationDelay: c.d }">{{ c.t }}</span>
            </template>

            <!-- 归档 · 「声波年轮 × 时间刻度」 -->
            <template v-else>
                <div class="rings">
                    <span v-for="i in 4" :key="i" :style="{ '--i': i }"></span>
                </div>
            </template>
        </div>

        <!-- ⑤ 光斑 / 音符（全页共享） -->
        <div class="hero-bg-shapes" aria-hidden="true">
            <div class="hero-circle c1"></div>
            <div class="hero-circle c2"></div>
            <span class="hero-music-note n1">♪</span>
            <span class="hero-music-note n2">♫</span>
            <span class="hero-music-note n3">♬</span>
        </div>

        <div class="hero-inner">
            <!-- 左侧标题区 -->
            <div class="hero-left">
                <div v-if="badge" class="hero-badge">
                    <span class="badge-dot"></span>
                    <span class="badge-tag">{{ badge }}</span>
                </div>
                <div class="hero-title-row">
                    <h1 class="hero-title">{{ title }}</h1>
                </div>
                <p class="hero-subtitle">{{ subtitle }}</p>
                <div v-if="stats.length" class="hero-stats">
                    <div v-for="(s, i) in stats" :key="i" class="stat-pill">
                        <span class="stat-icon">{{ s.glyph }}</span>
                        <span class="stat-num">{{ s.value }}</span>
                        <span class="stat-text">{{ s.label }}</span>
                    </div>
                </div>
            </div>

            <!-- 右侧初音插画 -->
            <div class="hero-panel">
                <div class="hero-hud-card">
                    <img :src="banner" :alt="title + '插画'" class="hud-img" decoding="async" />
                    <div class="hud-mask" v-if="hudStatus">
                        <div class="hud-top">
                            <span class="hud-dot"></span>
                            <span class="hud-status">{{ hudStatus }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
const props = defineProps({
    /* 主题母题：categories(双马尾·黑胶) / tags(音符簇·标签云) / archives(声波年轮·时间刻度) */
    motif: { type: String, default: 'categories' },
    /* EN 导语，如 TOPIC CATEGORIES */
    badge: { type: String, default: '' },
    /* 中文主标题 */
    title: { type: String, default: '' },
    /* EN 幽灵字，用于字体层次 */
    titleEn: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    /* 右上插画 + 底纹共用同一张图 */
    banner: { type: String, default: '' },
    hudCode: { type: String, default: '初音-39' },
    hudStatus: { type: String, default: '' },
    /* [{ glyph:'✦', value: 18, label:'个主题' }] */
    stats: { type: Array, default: () => [] },
});

/* SVG 渐变 id 唯一化，避免多处复用时冲突 */
const uid = Math.random().toString(36).slice(2, 7);

/* 标签页装饰用的漂浮符号（纯装饰，不含真实数据） */
const tagChips = [
    { t: '#', x: '5%', y: '16%', d: '0s', s: 1.05 },
    { t: '♪', x: '15%', y: '64%', d: '0.9s', s: 1.25 },
    { t: '#', x: '29%', y: '10%', d: '1.6s', s: 0.9 },
    { t: '♫', x: '45%', y: '76%', d: '0.4s', s: 1.15 },
    { t: '#', x: '61%', y: '14%', d: '2.1s', s: 1.0 },
    { t: '♬', x: '77%', y: '68%', d: '1.2s', s: 1.35 },
    { t: '#', x: '91%', y: '24%', d: '2.6s', s: 0.95 },
];
</script>

<style scoped>
/* =========================================================
   MIKU 通用页面 Hero · 共享氛围层 + 母题变体
   颜色全部走 style.css 的 MIKU TEAL token
========================================================= */
.miku-hero {
    position: relative;
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: 32px;
    padding: 40px 32px;
    isolation: isolate;
    background:
        radial-gradient(120% 140% at 88% 12%, rgba(255, 126, 157, 0.42) 0%, transparent 55%),
        linear-gradient(135deg, #12A79C 0%, #39C5BB 58%, #4ECDC4 100%);
    color: #ffffff;
    border: none;
    box-shadow: 0 18px 46px rgba(18, 167, 156, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

/* ---------- ① 插画底纹 ---------- */
.hero-artwork-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center right;
    opacity: 0.2;
    mix-blend-mode: overlay;
    pointer-events: none;
    z-index: 1;
}

/* ---------- ② 双极光 ---------- */
.hero-aurora {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 2;
}

.aurora {
    position: absolute;
    border-radius: 50%;
    filter: blur(46px);
    mix-blend-mode: screen;
}

.a-teal {
    width: 340px;
    height: 340px;
    top: -140px;
    left: -80px;
    background: radial-gradient(circle, rgba(123, 227, 218, 0.95) 0%, rgba(57, 197, 187, 0) 70%);
    animation: auroraDrift 13s ease-in-out infinite alternate;
}

.a-pink {
    width: 300px;
    height: 300px;
    bottom: -150px;
    right: 8%;
    background: radial-gradient(circle, rgba(255, 126, 157, 0.9) 0%, rgba(255, 126, 157, 0) 70%);
    animation: auroraDrift 17s ease-in-out infinite alternate-reverse;
}

@keyframes auroraDrift {
    0% {
        transform: translate3d(0, 0, 0) scale(1);
        opacity: 0.75;
    }

    100% {
        transform: translate3d(38px, 26px, 0) scale(1.18);
        opacity: 1;
    }
}

/* ---------- ③ 赛博网格 + 扫描线 ---------- */
.hero-grid {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.09) 1px, transparent 1px);
    background-size: 44px 44px;
    -webkit-mask-image: radial-gradient(120% 100% at 12% 0%, #000 0%, transparent 72%);
    mask-image: radial-gradient(120% 100% at 12% 0%, #000 0%, transparent 72%);
}

.hero-scan {
    position: absolute;
    left: 0;
    right: 0;
    height: 140px;
    top: -140px;
    z-index: 3;
    pointer-events: none;
    background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.16) 50%, transparent 100%);
    animation: heroScan 7.5s linear infinite;
}

@keyframes heroScan {
    0% {
        transform: translateY(0);
        opacity: 0;
    }

    12% {
        opacity: 1;
    }

    88% {
        opacity: 1;
    }

    100% {
        transform: translateY(460px);
        opacity: 0;
    }
}

/* ---------- ④ 母题装饰层 ---------- */
.hero-motif {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    overflow: hidden;
}

/* 分类 · 双马尾 */
.twintail {
    position: absolute;
    width: 190px;
    height: 250px;
    opacity: 0.55;
    filter: drop-shadow(0 6px 18px rgba(8, 90, 87, 0.28));
}

.tail-l {
    left: -26px;
    top: -26px;
    animation: tailSway 8s ease-in-out infinite;
}

.tail-r {
    right: -26px;
    top: -26px;
    transform: scaleX(-1);
    animation: tailSwayR 8s ease-in-out infinite 1.1s;
}

@keyframes tailSway {

    0%,
    100% {
        transform: rotate(0deg) translateY(0);
    }

    50% {
        transform: rotate(2.4deg) translateY(6px);
    }
}

@keyframes tailSwayR {

    0%,
    100% {
        transform: scaleX(-1) rotate(0deg) translateY(0);
    }

    50% {
        transform: scaleX(-1) rotate(2.4deg) translateY(6px);
    }
}

/* 分类 · 黑胶唱片（置于标题区与 HUD 看板之间的留白处，不压正文） */
.vinyl-disc {
    position: absolute;
    right: 306px;
    top: -58px;
    width: 128px;
    height: 128px;
    border-radius: 50%;
    opacity: 0.32;
    background:
        repeating-radial-gradient(circle at 50% 50%,
            rgba(255, 255, 255, 0.34) 0 1px,
            rgba(255, 255, 255, 0.06) 1px 7px),
        radial-gradient(circle at 50% 50%, #0E4B47 0%, #12A79C 100%);
    box-shadow: 0 0 26px rgba(255, 126, 157, 0.35);
    animation: vinylSpin 16s linear infinite;
}

.vinyl-ring {
    position: absolute;
    inset: 34%;
    border-radius: 50%;
    border: 1.5px dashed rgba(255, 255, 255, 0.55);
}

.vinyl-hole {
    position: absolute;
    inset: 45%;
    border-radius: 50%;
    background: #FF7E9D;
    box-shadow: 0 0 12px #FF7E9D;
}

@keyframes vinylSpin {
    to {
        transform: rotate(360deg);
    }
}

/* 标签 · 漂浮标签云 */
.motif-chip {
    position: absolute;
    font-family: 'Audiowide', sans-serif;
    color: rgba(255, 255, 255, 0.85);
    opacity: 0.16;
    animation: chipFloat 6.5s ease-in-out infinite;
}

@keyframes chipFloat {

    0%,
    100% {
        transform: translateY(0) rotate(-6deg);
    }

    50% {
        transform: translateY(-14px) rotate(6deg);
    }
}

.chip-eq {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: flex-end;
    gap: var(--eq-gap);
    height: var(--eq-h-lg);
    opacity: 0.22;
}

.chip-eq span {
    width: var(--eq-bar-w);
    border-radius: 2px;
    background: linear-gradient(180deg, #FF7E9D 0%, #ffffff 100%);
    animation: chipEq 1.5s ease-in-out infinite alternate;
}

@keyframes chipEq {
    0% {
        height: 14%;
        opacity: 0.35;
    }

    100% {
        height: 100%;
        opacity: 1;
    }
}

/* 归档 · 声波年轮 + 时间刻度 */
.rings {
    position: absolute;
    left: 46%;
    top: 50%;
    transform: translate(-50%, -50%);
}

.rings span {
    position: absolute;
    left: 50%;
    top: 50%;
    width: calc(90px * var(--i));
    height: calc(90px * var(--i));
    margin-left: calc(-45px * var(--i));
    margin-top: calc(-45px * var(--i));
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.5);
    opacity: 0.18;
    animation: ringPulse 5s ease-out infinite;
    animation-delay: calc(var(--i) * 0.5s);
}

@keyframes ringPulse {

    0%,
    100% {
        transform: scale(0.94);
        opacity: 0.1;
    }

    50% {
        transform: scale(1.05);
        opacity: 0.3;
    }
}

.ticks {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 14px;
    height: 20px;
}

.ticks span {
    position: absolute;
    bottom: 0;
    width: 1.5px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.55);
}

/* ---------- ⑤ 光斑 / 声波 / 音符 ---------- */
.hero-bg-shapes {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    overflow: hidden;
}

.hero-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
}

.c1 {
    width: 200px;
    height: 200px;
    top: -60px;
    right: 24%;
}

.c2 {
    width: 300px;
    height: 300px;
    bottom: -130px;
    right: -60px;
}

.sound-wave-top {
    position: absolute;
    top: 22px;
    right: 42px;
    display: flex;
    align-items: flex-end;
    gap: var(--eq-gap);
    height: var(--eq-h-xs);
}

.wave-bar {
    width: var(--eq-bar-w);
    height: 100%;
    border-radius: 2px;
    background: #ffffff;
    animation: topWavePulse 1.2s ease-in-out infinite alternate;
}

@keyframes topWavePulse {
    0% {
        height: 20%;
        opacity: 0.3;
    }

    100% {
        height: 100%;
        opacity: 1;
        background: #FF7E9D;
    }
}

.hero-music-note {
    position: absolute;
    font-size: 24px;
    color: rgba(255, 255, 255, 0.7);
    animation: noteFloat 4.5s ease-in-out infinite;
}

.n1 {
    top: 24%;
    right: 30%;
}

.n2 {
    top: 56%;
    right: 34%;
    color: #FF7E9D;
    animation-delay: 1.5s;
}

.n3 {
    bottom: 16%;
    left: 42%;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.5);
    animation-delay: 2.6s;
}

@keyframes noteFloat {

    0%,
    100% {
        transform: translateY(0) rotate(0deg);
    }

    50% {
        transform: translateY(-9px) rotate(8deg);
    }
}

/* ---------- ⑥ HUD 四角括线 ---------- */
.hud-corner {
    position: absolute;
    width: 22px;
    height: 22px;
    z-index: 4;
    border: 2px solid rgba(255, 255, 255, 0.55);
    pointer-events: none;
}

.hud-corner.tl {
    top: 12px;
    left: 12px;
    border-right: none;
    border-bottom: none;
    border-radius: 8px 0 0 0;
}

.hud-corner.tr {
    top: 12px;
    right: 12px;
    border-left: none;
    border-bottom: none;
    border-radius: 0 8px 0 0;
}

.hud-corner.bl {
    bottom: 12px;
    left: 12px;
    border-right: none;
    border-top: none;
    border-radius: 0 0 0 8px;
}

.hud-corner.br {
    bottom: 12px;
    right: 12px;
    border-left: none;
    border-top: none;
    border-radius: 0 0 8px 0;
}

/* ---------- 内容层 ---------- */
.hero-inner {
    position: relative;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
}

.hero-left {
    flex: 1;
    min-width: 0;
    text-align: left;
}

/* 徽标胶囊 */
.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 14px;
    border-radius: var(--radius-pill);
    background: rgba(255, 255, 255, 0.26);
    border: none;
}

.badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #FF7E9D;
    box-shadow: 0 0 8px #FF7E9D;
    animation: badgePulse 1.8s ease-in-out infinite;
}

@keyframes badgePulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.45);
        opacity: 0.55;
    }
}

.badge-tag {
    font-family: 'Audiowide', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.6px;
    color: #ffffff;
}

.badge-note {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.85);
}

/* 标题 + EN 幽灵字 */
.hero-title-row {
    display: flex;
    align-items: baseline;
    gap: 14px;
    margin: 12px 0 12px;
    flex-wrap: wrap;
}

.hero-title {
    font-size: clamp(32px, 5vw, 46px);
    font-weight: 900;
    letter-spacing: 0.5px;
    margin: 0;
    text-shadow: 0 4px 18px rgba(0, 0, 0, 0.16);
}

.hero-title-en {
    font-family: 'Audiowide', sans-serif;
    font-size: clamp(13px, 1.6vw, 17px);
    font-weight: 400;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
}

.hero-subtitle {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.93);
    line-height: 1.65;
    margin: 0 0 22px;
    max-width: 560px;
}

.hero-stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: var(--radius-pill);
    background: rgba(11, 56, 52, 0.28);
    border: none;
    box-shadow: 0 4px 12px rgba(8, 42, 39, 0.14);
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease;
}

.stat-pill:hover {
    transform: translateY(-2px);
    background: rgba(11, 56, 52, 0.4);
}

.stat-num {
    font-family: 'Audiowide', sans-serif;
    font-weight: 900;
    font-size: 16px;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.16);
}

.stat-icon {
    color: #FF7E9D;
}

/* ---------- 右侧 HUD 看板 ---------- */
.hero-panel {
    width: 262px;
    flex-shrink: 0;
}

.hero-hud-card {
    position: relative;
    width: 100%;
    height: 148px;
    border-radius: 20px;
    overflow: hidden;
    border: none;
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.24);
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
}

.hero-hud-card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3), 0 0 26px rgba(255, 126, 157, 0.35);
}

.hud-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.hud-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(18, 167, 156, 0.34) 0%, rgba(14, 34, 32, 0.8) 100%);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none;
}

.hud-top {
    display: flex;
    align-items: center;
    gap: 8px;
}

.hud-code {
    font-family: 'Audiowide', monospace;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.6px;
    color: #ffffff;
    background: rgba(255, 126, 157, 0.42);
    padding: 2px 7px;
    border-radius: 4px;
}

.hud-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #FF7E9D;
    box-shadow: 0 0 8px #FF7E9D;
}

.hud-status {
    font-family: 'Audiowide', sans-serif;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.92);
}

.hud-eq {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: var(--eq-h-md);
}

.eq-bar {
    width: var(--eq-bar-w);
    border-radius: 2px;
    background: linear-gradient(180deg, #FF7E9D 0%, #ffffff 100%);
    animation: hudEqPulse 1.4s ease-in-out infinite alternate;
}

@keyframes hudEqPulse {
    0% {
        height: 15%;
        opacity: 0.4;
    }

    100% {
        height: 100%;
        opacity: 1;
    }
}

.hud-bottom {
    display: flex;
    justify-content: space-between;
    font-family: 'Audiowide', monospace;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.86);
    border-top: 1px dashed rgba(255, 255, 255, 0.28);
    padding-top: 7px;
}

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
    .vinyl-disc {
        right: 258px;
    }

    .hero-panel {
        width: 216px;
    }

    .chip-eq {
        display: none;
    }
}

@media (max-width: 768px) {
    .miku-hero {
        padding: 30px 22px;
        border-radius: 20px;
    }

    .hero-panel {
        display: none;
    }

    .vinyl-disc {
        display: none;
    }

    .hero-subtitle {
        font-size: 14px;
        margin-bottom: 18px;
    }

    .sound-wave-top {
        right: 22px;
        top: 16px;
    }

    .hero-title-en {
        letter-spacing: 2px;
    }

    .twintail {
        width: 130px;
        height: 170px;
        opacity: 0.42;
    }
}

@media (max-width: 480px) {
    .hero-title-row {
        gap: 8px;
    }

    .hero-title-en {
        display: none;
    }

    .stat-pill {
        padding: 5px 12px;
        font-size: 12px;
    }
}

/* ---------- 动效克制 ---------- */
@media (prefers-reduced-motion: reduce) {

    .aurora,
    .hero-scan,
    .vinyl-disc,
    .twintail,
    .motif-chip,
    .chip-eq span,
    .rings span,
    .wave-bar,
    .hero-music-note,
    .eq-bar,
    .badge-dot {
        animation: none !important;
    }

    .hero-scan {
        display: none;
    }

    .hero-hud-card,
    .stat-pill {
        transition: none;
    }
}

html.reduce-motion .aurora,
html.reduce-motion .hero-scan,
html.reduce-motion .vinyl-disc,
html.reduce-motion .twintail,
html.reduce-motion .motif-chip,
html.reduce-motion .chip-eq span,
html.reduce-motion .rings span,
html.reduce-motion .wave-bar,
html.reduce-motion .hero-music-note,
html.reduce-motion .eq-bar,
html.reduce-motion .badge-dot {
    animation: none !important;
}

html.reduce-motion .hero-scan {
    display: none;
}

html.reduce-motion .hero-hud-card,
html.reduce-motion .stat-pill {
    transition: none;
}
</style>
