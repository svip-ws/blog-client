<template>
    <div
        class="character-profile-card card-tier-elevated miku-tech-card"
        :class="{ 'is-expanded': showExpanded, 'is-wiggling': isWiggling }"
        tabindex="0"
        :aria-expanded="showExpanded"
        aria-label="初音小站 站点全景档案卡片"
        @keydown.enter.prevent="toggleExpand"
        @keydown.space.prevent="toggleExpand"
    >
        <!-- 4K Miku 壁纸全息背景层 (悬浮变清晰) -->
        <div class="card-holo-bg" aria-hidden="true">
            <img src="/images/miku/miku_wp_8.jpg" class="holo-img" alt="Miku Wallpaper BG" loading="lazy" decoding="async" />
            <div class="holo-scanlines"></div>
            <div class="holo-glow-mask"></div>
        </div>

        <!-- 1. 状态岛头部（点击即可自由展开/收起） -->
        <div class="island-header" role="button" @click="toggleExpand">
            <div class="island-left">
                <!-- 头像环 -->
                <div class="island-avatar-ring">
                    <div class="island-avatar">
                        <span class="avatar-note">♪</span>
                    </div>
                    <div class="avatar-ring-dashed"></div>
                </div>

                <div class="island-identity">
                    <div class="name-row">
                        <span class="island-name">初音小站</span>
                        <span class="miku-version-tag"><img src="/images/miku/miku_chibi_main.png" alt="Q版初音" class="chibi-mini-tag" /></span>
                    </div>
                    <span class="island-role-tag">技术与随笔博客</span>
                </div>
            </div>

            <div class="island-right">
                <span class="status-dot-pulse" aria-hidden="true"></span>
                <span class="status-badge-text">在线</span>
                <span class="expand-arrow" :class="{ 'is-rotated': showExpanded }" aria-hidden="true">▾</span>
            </div>
        </div>

        <!-- 2. 向下展开的站点档案区 -->
        <div class="card-expand-body">
            <div class="tech-divider" aria-hidden="true"></div>

            <!-- 站点简介卡（轻量毛玻璃面板：保留流光与点击切换寄语，去掉内嵌双壁纸与终端圆点） -->
            <div
                class="cli-console-box glass-light-miku"
                :class="{ 'is-active-pulse': isTerminalActive }"
                @click.stop="cycleQuote"
                title="点击切换站点寄语"
            >
                <div class="cli-flowing-border" aria-hidden="true"></div>

                <!-- 顶栏控制条 -->
                <div class="cli-header-bar">
                    <span class="cli-tag-bracket">站点档案 · 点击寄语切换</span>
                    <button class="cli-action-badge tactile-btn" @click.stop="goToArticles" title="前往文库">文库 →</button>
                </div>

                <!-- 站点简介信息 -->
                <div class="cli-body">
                    <div class="cli-line">
                        <span class="cli-key shimmer-key">方向</span>
                        <span class="cli-sep">：</span>
                        <span class="cli-val mode-val">全栈开发 · 学习笔记 · 日常随拍</span>
                    </div>
                    <div class="cli-line log-line">
                        <span class="cli-key shimmer-key">寄语</span>
                        <span class="cli-sep">：</span>
                        <span class="cli-val log-val">{{ currentQuote }}</span>
                    </div>
                </div>
            </div>

            <!-- 站点全量数据统计矩阵 (支持悬停流光扫过与点击路由) -->
            <div class="stats-tech-grid">
                <div class="stat-tech-item tactile-btn" @click.stop="goToArticles" title="点击探索文章库">
                    <span class="stat-tech-num shimmer-num">{{ stats.articles || 0 }}</span>
                    <span class="stat-tech-sub">文章</span>
                </div>
                <div class="stat-tech-divider" aria-hidden="true"></div>
                <div class="stat-tech-item tactile-btn" @click.stop="goToCategories" title="点击探索分类">
                    <span class="stat-tech-num shimmer-num">{{ stats.categories || 0 }}</span>
                    <span class="stat-tech-sub">分类</span>
                </div>
                <div class="stat-tech-divider" aria-hidden="true"></div>
                <div class="stat-tech-item tactile-btn" @click.stop="goToTags" title="点击探索标签">
                    <span class="stat-tech-num shimmer-num">{{ stats.tags || 0 }}</span>
                    <span class="stat-tech-sub">标签</span>
                </div>
                <div class="stat-tech-divider" aria-hidden="true"></div>
                <div class="stat-tech-item tactile-btn" @click.stop="goToArticles" title="全站总浏览量">
                    <span class="stat-tech-num shimmer-num">{{ formatViews(stats.totalViews) }}</span>
                    <span class="stat-tech-sub">访问</span>
                </div>
            </div>

            <!-- 快捷探索按钮 -->
            <div class="site-action-area">
                <button class="explore-site-btn tactile-btn shine-effect" @click.stop="goToArticles">
                    <span>浏览全部文章</span>
                    <span class="btn-arrow">→</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { formatCompactNumber } from '../../utils/format';

const props = defineProps({
    stats: {
        type: Object,
        default: () => ({ articles: 0, categories: 0, tags: 0, comments: 0, totalViews: 0 })
    }
});

const router = useRouter();
const formatViews = (n) => formatCompactNumber(n);

const isExpanded = ref(true);
const isWiggling = ref(false);
const isTerminalActive = ref(false);

const showExpanded = computed(() => isExpanded.value);

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
    isWiggling.value = true;
    setTimeout(() => { isWiggling.value = false; }, 350);
};

const goToArticles = () => router.push('/articles');
const goToCategories = () => router.push('/categories');
const goToTags = () => router.push('/tags');

// 命令行宣告
const quoteIndex = ref(0);
const quotes = [
    '用代码写歌，用文字存档时光。',
    '记录前端工程、全栈开发与日常思考。',
    '欢迎在文章区或留言板一起交流探讨。'
];

const currentQuote = computed(() => quotes[quoteIndex.value]);

const cycleQuote = () => {
    quoteIndex.value = (quoteIndex.value + 1) % quotes.length;
    isTerminalActive.value = true;
    setTimeout(() => { isTerminalActive.value = false; }, 400);
};

/* Q版人偶交互与模式切换 */
const isChibiBouncing = ref(false);
const particles = ref([]);
const cliMascotSpeech = ref('初音光感控制台准备完毕♪');

const soundModes = [
    { key: 'stereo', label: '🎧 立体声道', text: '立体声场共鸣中' },
    { key: 'overdrive', label: '⚡ 全频超频', text: '39号全频连击模式' },
    { key: 'resonance', label: '♪ 音节共鸣', text: '星轨声浪共振中' }
];
const currentMode = ref('stereo');
const currentModeLabel = computed(() => {
    const item = soundModes.find(m => m.key === currentMode.value);
    return item ? item.text : '立体声场共鸣';
});

const switchSoundMode = (mode) => {
    currentMode.value = mode.key;
    cliMascotSpeech.value = `切换模式: ${mode.label}!`;
    spawnParticles();
};

const triggerChibiBounce = () => {
    isChibiBouncing.value = true;
    setTimeout(() => { isChibiBouncing.value = false; }, 600);
    cycleQuote();
    spawnParticles();
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
</script>

<style scoped>
/*
 * 初音未来浅色高清毛玻璃控制台系统 (Miku Light Glassmorphism Console System)
 * 配色严格使用初音苍碧 / 绿色系，无任何红/粉色调：
 * --miku-teal: #39C5BB
 * --miku-deep: #12A79C
 * --miku-emerald: #0B7A73
 * --miku-glow: #00F3FF
 */

.character-profile-card.miku-tech-card {
    position: relative;
    padding: 12px 14px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(234, 250, 247, 0.95) 100%);
    border: none;
    border-radius: 20px;
    box-shadow:
        0 16px 40px rgba(57, 197, 187, 0.16),
        inset 0 1px 0 rgba(255, 255, 255, 0.6),
        0 0 25px rgba(57, 197, 187, 0.10);
    color: #0E2926;
    font-family: inherit;
    cursor: default;
    overflow: hidden;
    outline: none;
    isolation: isolate;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 4K 壁纸全息背景 */
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
    object-position: center 20%;
    opacity: 0.16;
    filter: saturate(1.1) blur(1.5px);
    transition: transform 0.4s ease, opacity 0.4s ease, filter 0.4s ease;
}

.character-profile-card.miku-tech-card:hover .holo-img {
    opacity: 0.72;
    filter: brightness(1.04) saturate(1.32) blur(0px);
    transform: scale(1.04);
}

.holo-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
        0deg,
        rgba(57, 197, 187, 0.05) 0px,
        rgba(57, 197, 187, 0.05) 1px,
        transparent 1px,
        transparent 3px
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

.character-profile-card.miku-tech-card:focus-visible {
    border-color: #39C5BB;
    box-shadow: 0 0 0 3px rgba(57, 197, 187, 0.35), 0 0 24px rgba(57, 197, 187, 0.4);
}

.character-profile-card.miku-tech-card.is-expanded {
    padding: 14px 16px;
    border-color: rgba(57, 197, 187, 0.85);
    box-shadow:
        0 16px 42px rgba(57, 197, 187, 0.25),
        0 0 28px rgba(57, 197, 187, 0.2);
}

.is-wiggling {
    animation: techWiggle 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes techWiggle {
    0%, 100% { transform: scale(1); }
    30% { transform: scale(1.02) rotate(-1deg); }
    70% { transform: scale(1.02) rotate(1deg); }
}

/* 1. 状态岛 Capsule Header */
.island-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    user-select: none;
}

.island-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.island-avatar-ring {
    position: relative;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.island-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #39C5BB 0%, #12A79C 60%, #0B7A73 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 12px rgba(57, 197, 187, 0.4);
    z-index: 2;
}

.avatar-note {
    font-size: 15px;
    font-weight: 900;
    color: #ffffff;
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.35);
}

.avatar-ring-dashed {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px dashed #39C5BB;
    animation: vinylSpin 8s linear infinite;
}

@keyframes vinylSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.island-identity {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.island-name {
    font-size: 14px;
    font-weight: 900;
    color: #0E2926;
    letter-spacing: 0.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.miku-version-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.chibi-mini-tag {
    width: 14px;
    height: 14px;
    object-fit: contain;
}

.island-role-tag {
    font-size: 9.5px;
    font-weight: 800;
    color: #0B7A73;
    letter-spacing: 0.8px;
}

.island-right {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 9999px;
    background: rgba(57, 197, 187, 0.14);
    border: none;
    flex-shrink: 0;
}

.status-dot-pulse {
    width: 6.5px;
    height: 6.5px;
    border-radius: 50%;
    background: #39C5BB;
    box-shadow: 0 0 8px #39C5BB;
    animation: dotPulse 1.8s ease-in-out infinite;
}

@keyframes dotPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.75); }
}

.status-badge-text {
    font-size: 10.5px;
    font-weight: 800;
    color: #0E2926;
    white-space: nowrap;
}

.expand-arrow {
    font-size: 12px;
    color: #39C5BB;
    transition: transform 0.3s ease;
    margin-left: 1px;
}

.expand-arrow.is-rotated {
    transform: rotate(180deg);
}

/* 2. 向下弹性展开体 */
.card-expand-body {
    position: relative;
    z-index: 2;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    margin-top: 0;
    pointer-events: none;
    transition:
        max-height 0.45s cubic-bezier(0.16, 1, 0.3, 1),
        opacity 0.35s ease,
        margin-top 0.35s ease;
}

.is-expanded .card-expand-body {
    max-height: 500px;
    opacity: 1;
    margin-top: 12px;
    pointer-events: auto;
}

.tech-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(57, 197, 187, 0.45) 50%, transparent 100%);
    margin-bottom: 12px;
}

/* ==================== CLI 控制台视窗 (<div.cli-console-box>) 多重流动特效 ==================== */
.cli-console-box.glass-light-miku {
    position: relative;
    background: rgba(255, 255, 255, 0.78);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: none;
    border-radius: 16px;
    padding: 12px 14px 14px;
    margin-bottom: 12px;
    cursor: pointer;
    overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 8px 24px rgba(57, 197, 187, 0.2);
    isolation: isolate;
    transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
}

.cli-console-box.is-active-pulse {
    border-color: #39C5BB;
    box-shadow: 0 0 24px rgba(57, 197, 187, 0.5);
}

/* 360° 全围环绕流动流光边框 - 性能：默认暂停 */
.cli-flowing-border {
    position: absolute;
    inset: -2px;
    border-radius: 18px;
    background: linear-gradient(90deg, #39C5BB, #00F3FF, #12A79C, #0B7A73, #00F3FF, #39C5BB);
    background-size: 400% 400%;
    animation: flowingBorder 3.2s linear infinite;
    animation-play-state: paused;
    z-index: 0;
    opacity: 0.88;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask-composite: xor;
    padding: 2px;
}

.cli-console-box:hover .cli-flowing-border {
    animation-play-state: running;
}

@keyframes flowingBorder {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes flowSweep {
    0% { background-position: 0% 0%; }
    100% { background-position: 200% 0%; }
}

/* 动态水韵/液态流动极光波浪 - 性能：默认暂停 */
.cli-liquid-flow-stream {
    position: absolute;
    inset: -50%;
    background: radial-gradient(ellipse at 30% 20%, rgba(0, 243, 255, 0.25) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(57, 197, 187, 0.22) 0%, transparent 50%),
                linear-gradient(45deg, transparent 40%, rgba(57, 197, 187, 0.18) 50%, transparent 60%);
    background-size: 200% 200%;
    animation: liquidFlow 5.5s ease-in-out infinite alternate;
    animation-play-state: paused;
    pointer-events: none;
    z-index: 1;
}

.cli-console-box:hover .cli-liquid-flow-stream {
    animation-play-state: running;
}

@keyframes liquidFlow {
    0% { transform: translate(-10%, -10%) rotate(0deg) scale(1); }
    50% { transform: translate(8%, 6%) rotate(180deg) scale(1.1); }
    100% { transform: translate(-6%, 10%) rotate(360deg) scale(0.95); }
}

/* 对角线斜光流动扫过 - 性能：默认暂停 */
.cli-light-beam-sweep {
    position: absolute;
    top: -50%;
    left: -60%;
    width: 40%;
    height: 200%;
    background: linear-gradient(90deg, transparent 0%, rgba(57, 197, 187, 0.25) 50%, transparent 100%);
    transform: rotate(25deg);
    animation: diagonalBeamSweep 3.5s ease-in-out infinite;
    animation-play-state: paused;
    pointer-events: none;
    z-index: 2;
}

.cli-console-box:hover .cli-light-beam-sweep {
    animation-play-state: running;
}

@keyframes diagonalBeamSweep {
    0% { transform: translateX(0) rotate(25deg); opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translateX(450px) rotate(25deg); opacity: 0; }
}

/* 内部流动光晕 - 性能：默认暂停 */
.cli-flowing-glow {
    position: absolute;
    inset: -50%;
    background: radial-gradient(circle at 50% 50%, rgba(57, 197, 187, 0.16) 0%, transparent 65%);
    animation: pulseGlow 4s ease-in-out infinite alternate;
    animation-play-state: paused;
    pointer-events: none;
    z-index: 1;
}

.cli-console-box:hover .cli-flowing-glow {
    animation-play-state: running;
}

@keyframes pulseGlow {
    0% { transform: translate(-10%, -10%) scale(0.9); opacity: 0.5; }
    100% { transform: translate(10%, 10%) scale(1.15); opacity: 0.9; }
}

/* CLI 初音二次元壁纸背景 (悬浮变清晰) */
.cli-miku-bg-wrap {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
    isolation: isolate;
}

.cli-miku-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.18;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}

.cli-scrim-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(230, 249, 246, 0.92) 100%);
    transition: background 0.4s ease;
}

.cli-miku-watermark {
    position: absolute;
    bottom: -10px;
    right: 6px;
    font-family: 'Audiowide', monospace;
    font-size: 44px;
    font-weight: 900;
    color: rgba(57, 197, 187, 0.12);
    pointer-events: none;
    user-select: none;
}

.cli-console-box:hover {
    border-color: #39C5BB;
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(57, 197, 187, 0.32), 0 0 20px rgba(57, 197, 187, 0.25);
}

.cli-console-box:hover .cli-miku-bg-img {
    transform: scale(1.08);
    opacity: 0.55;
    filter: blur(0px) brightness(1.06) saturate(1.35);
}

.cli-console-box:hover .cli-scrim-mask {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(220, 247, 243, 0.84) 100%);
}

/* Q版初音人偶交互舞台 */
.cli-chibi-stage {
    position: absolute;
    top: 32px;
    right: 12px;
    z-index: 4;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.chibi-doll-wrap {
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chibi-doll-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: none;
    animation: chibiFloat 3.5s ease-in-out infinite alternate;
    transition: transform 0.25s ease;
    z-index: 2;
}

.cli-chibi-stage:hover .chibi-doll-img {
    transform: scale(1.2) rotate(8deg);
}

.chibi-doll-wrap.is-bouncing .chibi-doll-img {
    animation: mikuJump 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes mikuJump {
    0% { transform: translateY(0) rotate(0deg) scale(1); }
    40% { transform: translateY(-14px) rotate(-10deg) scale(1.25); }
    70% { transform: translateY(-5px) rotate(6deg) scale(1.1); }
    100% { transform: translateY(0) rotate(0deg) scale(1); }
}

@keyframes chibiFloat {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(-5px) rotate(-4deg); }
}

.cli-speech-bubble {
    position: absolute;
    bottom: 46px;
    right: 0;
    white-space: nowrap;
    background: linear-gradient(135deg, #0E2926, #16433E);
    border: 1.5px solid #39C5BB;
    color: #39C5BB;
    font-size: 10.5px;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 12px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    animation: bubblePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: none;
}

.cli-speech-bubble::after {
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

.cli-header-bar,
.cli-mode-selector,
.cli-body,
.cli-bottom-spectrum {
    position: relative;
    z-index: 2;
}

.cli-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dashed rgba(57, 197, 187, 0.35);
}

.cli-window-dots {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-right: 2px;
}

.cli-window-dots .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

.cli-window-dots .dot-cyan { background: #39C5BB; box-shadow: 0 0 6px #39C5BB; }
.cli-window-dots .dot-teal { background: #12A79C; }
.cli-window-dots .dot-blue { background: #00F3FF; }

.cli-tag-bracket {
    font-size: 9.5px;
    font-weight: 900;
    color: #0B7A73;
    letter-spacing: 0.5px;
}

.cli-equalizer-micro {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;
    height: 10px;
}

.eq-bar {
    width: 2px;
    background: #39C5BB;
    border-radius: 1px;
    animation: eqPulse 1.4s ease-in-out infinite alternate;
}

.eq-bar.b1 { height: 40%; animation-delay: 0s; }
.eq-bar.b2 { height: 90%; animation-delay: 0.2s; }
.eq-bar.b3 { height: 60%; animation-delay: 0.4s; }

@keyframes eqPulse {
    0% { height: 30%; opacity: 0.4; }
    100% { height: 100%; opacity: 1; }
}

.cli-action-badge {
    margin-left: auto;
    font-size: 9px;
    font-weight: 800;
    color: #0B7A73;
    background: rgba(57, 197, 187, 0.18);
    border: none;
    border-radius: 6px;
    padding: 2px 7px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cli-action-badge:hover {
    background: #39C5BB;
    color: #FFFFFF;
    box-shadow: 0 0 8px rgba(57, 197, 187, 0.5);
}

/* 模式切换芯片条 */
.cli-mode-selector {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 8px;
}

.cli-mode-pill {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    flex-shrink: 0;
    font-family: 'Audiowide', monospace;
    font-size: 8.5px;
    font-weight: 800;
    padding: 3px 9px;
    border-radius: 6px;
    background: rgba(57, 197, 187, 0.12);
    border: none;
    color: #0F4F49;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cli-mode-pill:hover {
    background: rgba(57, 197, 187, 0.25);
    color: #0B7A73;
}

.cli-mode-pill.active {
    background: linear-gradient(135deg, #0B7A73, #08635D);
    color: #FFFFFF;
    box-shadow: 0 2px 8px rgba(11, 122, 115, 0.35);
}

/* 控制台行输出 (流光键名) */
.cli-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    line-height: 1.35;
    padding-right: 48px; /* 留出 Q 版人偶位置 */
}

.cli-line {
    display: flex;
    align-items: center;
    gap: 5px;
}

.cli-prompt {
    color: #39C5BB;
    font-weight: 900;
}

.shimmer-key {
    font-weight: 900;
    min-width: 46px;
    background: linear-gradient(90deg, #0B7A73 0%, #39C5BB 50%, #0B7A73 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: keyFlow 3s ease infinite;
}

@keyframes keyFlow {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
}

.cli-sep {
    color: #5C837F;
}

.cli-val {
    font-weight: 700;
}

.user-val { color: #0E2926; }
.mode-val { color: #12A79C; font-weight: 800; }

.status-pulse-dot {
    width: 5.5px;
    height: 5.5px;
    border-radius: 50%;
    display: inline-block;
    background: #39C5BB;
    box-shadow: 0 0 6px #39C5BB;
    animation: dotPulse 1.8s infinite;
}

.status-val {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #0B7A73;
    font-weight: 800;
}

.log-val {
    color: #0F4F49;
    font-size: 10.5px;
    font-weight: 800;
}

.cli-cursor {
    display: inline-block;
    font-weight: 900;
    color: #39C5BB;
    margin-left: 2px;
    animation: cursorBlink 1s infinite;
}

@keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

/* 底部流动音频波浪律动条 */
.cli-bottom-spectrum {
    display: flex;
    align-items: flex-end;
    gap: 2.5px;
    height: 10px;
    margin-top: 8px;
    opacity: 0.65;
}

.cli-bottom-spectrum i {
    flex: 1;
    height: 100%;
    background: linear-gradient(180deg, #39C5BB, #12A79C);
    border-radius: 1px;
    animation: waveBar 1.2s ease-in-out infinite alternate;
}

@keyframes waveBar {
    from { opacity: 0.35; transform: scaleY(0.3); }
    to { opacity: 1; transform: scaleY(1); }
}

/* 3. 站点数据统计矩阵 (支持悬停流光扫过) */
.stats-tech-grid {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 10px 6px 6px;
    background: rgba(57, 197, 187, 0.08);
    border-radius: 12px;
    border: none;
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.stats-tech-grid:hover {
    border-color: rgba(57, 197, 187, 0.55);
    box-shadow: 0 4px 16px rgba(57, 197, 187, 0.15);
}

.stat-tech-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex: 1;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.stat-tech-item:hover {
    transform: translateY(-2px);
}

.stat-tech-label {
    font-size: 8.5px;
    font-weight: 900;
    color: #0B7A73;
    letter-spacing: 0.8px;
}

.stat-tech-num {
    font-size: 15.5px;
    font-weight: 900;
    color: #0E2926;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
}

.shimmer-num {
    background: linear-gradient(90deg, #0B7A73 0%, #39C5BB 50%, #0B7A73 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    transition: background-position 0.5s ease;
}

.stat-tech-item:hover .shimmer-num {
    animation: textShimmer 1.2s ease infinite;
    color: transparent;
    text-shadow: 0 0 12px rgba(57, 197, 187, 0.6);
}

@keyframes textShimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
}

.stat-tech-sub {
    font-size: 9.5px;
    color: #475569;
    font-weight: 700;
}

.stat-tech-divider {
    width: 1px;
    height: 22px;
    background: rgba(57, 197, 187, 0.25);
}

/* 4. 快捷探索按钮 */
.site-action-area {
    margin-top: 10px;
}

.explore-site-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 12px;
    background: linear-gradient(135deg, #39C5BB 0%, #12A79C 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.4);
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(57, 197, 187, 0.35);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.explore-site-btn:hover,
.explore-site-btn:focus-visible {
    background: linear-gradient(135deg, #12A79C 0%, #0B7A73 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 26px rgba(57, 197, 187, 0.5), 0 0 16px rgba(57, 197, 187, 0.35);
}

.btn-arrow {
    font-size: 14px;
    color: #E3F7F4;
    transition: transform 0.2s ease, color 0.2s ease;
}

.explore-site-btn:hover .btn-arrow {
    transform: translateX(4px);
    color: #ffffff;
}

/* 移动端约束：直接展示展开态 */
@media (max-width: 768px) {
    .character-profile-card.miku-tech-card {
        padding: 13px 15px !important;
        cursor: default;
    }

    .card-expand-body {
        max-height: none !important;
        opacity: 1 !important;
        margin-top: 10px !important;
        pointer-events: auto !important;
    }

    .expand-arrow {
        display: none !important;
    }
}
</style>