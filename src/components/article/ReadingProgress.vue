<template>
    <div class="reading-progress-track">
        <div class="reading-progress-bar" :style="{ width: progress + '%' }">
            <!-- 标志性二次元互动：沿进度条旅行并反应的 Q版初音吉祥物 -->
            <div class="mascot-runner" :class="milestoneClass" :title="`已探索 ${Math.round(progress)}%`" @click="triggerMikuTalk">
                <img src="/images/miku/miku_chibi_main.png" alt="Miku Runner" class="runner-chibi-img" />
                <span class="milestone-bubble" v-if="showMilestoneBubble">
                    {{ milestoneText }}
                </span>
            </div>
        </div>
    </div>

    <!-- 顶部状态胶囊（滚动超过 3% 时显示） -->
    <transition name="fade-badge">
        <div class="floating-progress-badge" v-if="progress > 3">
            <span class="badge-dot"></span>
            <span class="badge-tag">阅读进度</span>
            <span class="badge-percent">{{ Math.round(progress) }}%</span>
        </div>
    </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const progress = ref(0);
const prevProgress = ref(0);
const milestoneText = ref('');
const showMilestoneBubble = ref(false);
let bubbleTimer = null;

const milestoneClass = computed(() => {
    if (progress.value >= 99) return 'at-100';
    if (progress.value >= 75) return 'at-75';
    if (progress.value >= 50) return 'at-50';
    if (progress.value >= 25) return 'at-25';
    return '';
});

const triggerReaction = (text, duration = 2500) => {
    milestoneText.value = text;
    showMilestoneBubble.value = true;
    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
        showMilestoneBubble.value = false;
    }, duration);
};

const triggerMikuTalk = () => {
    const quotes = [
        `已阅读 ${Math.round(progress.value)}% ♪`,
        '阅读愉快，享受思考与沉淀 ♪',
        '觉得有收获可以点赞支持哦 ♪'
    ];
    const rand = quotes[Math.floor(Math.random() * quotes.length)];
    triggerReaction(rand, 2200);
};

const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const cur = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    
    // 阅读完成轻提示
    if (prevProgress.value < 98 && cur >= 98) {
        triggerReaction('已阅读完全文 ♪', 2200);
    }

    prevProgress.value = cur;
    progress.value = cur;
};

onMounted(() => {
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
});

onUnmounted(() => {
    window.removeEventListener('scroll', updateProgress);
    if (bubbleTimer) clearTimeout(bubbleTimer);
});
</script>

<style scoped>
.reading-progress-track {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(57, 197, 187, 0.14);
    z-index: 1002;
    pointer-events: none;
}

.reading-progress-bar {
    position: relative;
    height: 100%;
    background: linear-gradient(90deg, #39C5BB 0%, #00F3FF 50%, #FF7E9D 100%);
    border-radius: 0 4px 4px 0;
    box-shadow: 0 0 10px rgba(57, 197, 187, 0.6);
    transition: width 0.08s linear;
}

/* 旅行陪伴小使者 (Q版初音) */
.mascot-runner {
    position: absolute;
    right: -12px;
    top: 2px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    animation: runnerBounce 2s ease-in-out infinite alternate;
}

.runner-chibi-img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    filter: none;
}

@keyframes runnerBounce {
    0% { transform: translateY(0) scale(1) rotate(0deg); }
    100% { transform: translateY(-4px) scale(1.1) rotate(6deg); }
}

/* 反应气泡 */
.milestone-bubble {
    position: absolute;
    top: 38px;
    right: -20px;
    white-space: nowrap;
    padding: 6px 14px;
    background: linear-gradient(135deg, #0E2926, #1C4D46);
    color: #00F3FF;
    border: 1px solid #39C5BB;
    border-radius: 14px;
    font-size: 11.5px;
    font-weight: 800;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    animation: bubblePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.milestone-bubble::after {
    content: '';
    position: absolute;
    top: -5px;
    right: 22px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 6px solid #1C4D46;
}

@keyframes bubblePop {
    from { opacity: 0; transform: translateY(-4px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 顶部进度胶囊徽章 */
.floating-progress-badge {
    position: fixed;
    top: 66px;
    right: 20px;
    z-index: 998;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(14px);
    border: 1.5px solid rgba(57, 197, 187, 0.4);
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.2);
}

.badge-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #39C5BB;
    box-shadow: 0 0 8px #39C5BB;
    animation: dotPulse 1.5s infinite alternate;
}

@keyframes dotPulse {
    from { opacity: 0.5; }
    to { opacity: 1; }
}

.badge-tag {
    font-family: 'Audiowide', sans-serif;
    font-size: 9.5px;
    font-weight: 800;
    color: #00687d;
    letter-spacing: 0.5px;
}

.badge-percent {
    font-family: 'Audiowide', monospace;
    font-size: 12px;
    font-weight: 900;
    color: #FF7E9D;
}

.fade-badge-enter-active,
.fade-badge-leave-active {
    transition: opacity 0.25s, transform 0.25s;
}

.fade-badge-enter-from,
.fade-badge-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

@media (min-width: 1260px), (max-width: 640px) {
    .floating-progress-badge {
        display: none;
    }
}
</style>