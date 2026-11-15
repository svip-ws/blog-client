<template>
    <div ref="tocWrapperRef" class="toc-wrapper anime-card" :class="{ visible: headings.length > 0 }" :style="tocDynamicStyle">
        <!-- 1. 顶栏目录标题 -->
        <div class="toc-header">
            <div class="toc-brand-group">
                <div class="toc-title-box">
                    <span class="toc-title">文章目录</span>
                </div>
            </div>
        </div>

        <!-- 2. 探秘进度进度条线 -->
        <div class="toc-progress-bar-wrap">
            <div class="toc-progress-fill" :style="{ width: scrollProgress + '%' }"></div>
            <span class="toc-progress-text">{{ Math.round(scrollProgress) }}%</span>
        </div>

        <!-- 3. 目录列表主体 -->
        <div class="toc-list">
            <div
                v-for="item in headings"
                :key="item.id"
                :data-id="item.id"
                class="toc-item tactile-btn"
                :class="['level-' + item.level, { active: activeId === item.id }]"
                @click="scrollTo(item.id)"
            >
                <!-- 音符与高亮节点 -->
                <div class="node-icon-wrap">
                    <span v-if="activeId === item.id" class="toc-node-dot"></span>
                    <span v-else class="toc-note-prefix">{{ getLevelNote(item.level) }}</span>
                </div>
                <span class="toc-text">{{ item.text }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
    headings: {
        type: Array,
        default: () => []
    }
});

const activeId = ref('');
const scrollProgress = ref(0);
const tocWrapperRef = ref(null);
const tocDynamicStyle = ref({});

const getLevelNote = (level) => {
    if (level <= 2) return '♪';
    if (level === 3) return '♫';
    return '♩';
};

// 点击目录平滑定位
const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
        const rect = el.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - 90;
        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
        activeId.value = id;
        nextTick(scrollToActiveTocItem);
    }
};

// 确保当前高亮项在目录盒内保持可见
const scrollToActiveTocItem = () => {
    if (!tocWrapperRef.value) return;
    const activeEl = tocWrapperRef.value.querySelector('.toc-item.active');
    if (activeEl) {
        activeEl.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
        });
    }
};

// 动态避让底部页脚：防止固定目录在长文章底部覆盖 AppFooter
const updateTocBounds = () => {
    const footer = document.querySelector('.anime-footer');
    if (!footer) {
        tocDynamicStyle.value = {};
        return;
    }
    const footerTop = footer.getBoundingClientRect().top;
    const defaultTop = 104;
    const maxAllowedBottom = Math.min(window.innerHeight - 44, footerTop - 24);
    const availableHeight = maxAllowedBottom - defaultTop;
    if (availableHeight >= 260) {
        tocDynamicStyle.value = {
            top: `${defaultTop}px`,
            maxHeight: `${Math.min(window.innerHeight - 148, availableHeight)}px`,
        };
    } else {
        const panelHeight = 260;
        const shiftedTop = Math.max(72, maxAllowedBottom - panelHeight);
        tocDynamicStyle.value = {
            top: `${shiftedTop}px`,
            maxHeight: `${Math.max(140, maxAllowedBottom - shiftedTop)}px`,
        };
    }
};

// 正文滚动与高亮计算
const updateActive = () => {
    updateTocBounds();
    // 计算全局滚动百分比
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
        scrollProgress.value = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
    }

    if (!props.headings || props.headings.length === 0) return;

    const triggerOffset = 130;
    let current = '';

    for (let i = 0; i < props.headings.length; i++) {
        const item = props.headings[i];
        const el = document.getElementById(item.id);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= triggerOffset) {
                current = item.id;
            } else {
                break;
            }
        }
    }

    if (!current && props.headings.length > 0) {
        current = props.headings[0].id;
    }

    if (current && current !== activeId.value) {
        activeId.value = current;
        nextTick(scrollToActiveTocItem);
    }
};

watch(() => props.headings, () => {
    nextTick(updateActive);
}, { deep: true });

onMounted(() => {
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateTocBounds, { passive: true });
    nextTick(updateActive);
});

onUnmounted(() => {
    window.removeEventListener('scroll', updateActive);
    window.removeEventListener('resize', updateTocBounds);
});
</script>

<style scoped>
/* 明亮、高对比度精致二次元初音 39.0MHz 玻璃目录面板 */
.toc-wrapper {
    position: fixed;
    top: 104px;
    right: max(24px, calc((100vw - 900px) / 2 - 268px));
    width: 252px;
    max-height: calc(100vh - 148px);
    overflow-y: auto;

    /* 隐去原生滚动条 */
    scrollbar-width: none;
    -ms-overflow-style: none;

    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(230, 250, 247, 0.96) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 10px 36px rgba(57, 197, 187, 0.22), 0 0 20px rgba(57, 197, 187, 0.15);
    border: none;
    opacity: 0;
    transform: translateX(25px);
    transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    z-index: 90;
    color: #123835;
}

.toc-wrapper::-webkit-scrollbar {
    display: none;
}

.toc-wrapper.visible {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
}

/* 顶栏 HUD 区域 */
.toc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
}

.toc-brand-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.miku-01-badge {
    background: linear-gradient(135deg, #FF007F 0%, #FF55AA 100%);
    color: #FFFFFF;
    font-weight: 900;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 5px;
    letter-spacing: 1px;
    box-shadow: 0 0 10px rgba(255, 0, 127, 0.6);
}

.toc-title-box {
    display: flex;
    flex-direction: column;
}

.toc-title {
    font-family: 'Outfit', monospace;
    font-size: 12.5px;
    font-weight: 900;
    color: #12A79C;
    letter-spacing: 1px;
}

.toc-sub {
    font-size: 8.5px;
    font-weight: 800;
    color: #FF007F;
    letter-spacing: 1px;
    opacity: 0.85;
}

/* 迷你动态均衡器 */
.mini-spectrum-icon {
    display: flex;
    align-items: flex-end;
    gap: 2.5px;
    height: 12px;
}

.spectrum-bar {
    width: 2.5px;
    height: 100%;
    background: #12A79C;
    border-radius: 1px;
    animation: miniSpectrum 0.6s infinite alternate ease-in-out;
}
.spectrum-bar:nth-child(2) { animation-delay: 0.15s; }
.spectrum-bar:nth-child(3) { animation-delay: 0.3s; }
.spectrum-bar:nth-child(4) { animation-delay: 0.45s; }

@keyframes miniSpectrum {
    0% { height: 20%; background: #12A79C; }
    100% { height: 100%; background: #FF007F; }
}

/* 探索进度条 */
.toc-progress-bar-wrap {
    position: relative;
    width: 100%;
    height: 5px;
    background: rgba(57, 197, 187, 0.15);
    border-radius: 999px;
    margin: 8px 0 14px;
    overflow: visible;
}

.toc-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #39C5BB 0%, #FF007F 100%);
    border-radius: 999px;
    box-shadow: 0 0 8px rgba(57, 197, 187, 0.6);
    transition: width 0.15s linear;
}

.toc-progress-text {
    position: absolute;
    right: 0;
    top: -14px;
    font-size: 9.5px;
    font-weight: 900;
    color: #12A79C;
    font-family: monospace;
}

/* 目录列表主体 */
.toc-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.toc-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    font-size: 12.5px;
    color: #1A3C38; /* 清晰高对比度暗青文字 */
    font-weight: 700;
    cursor: pointer;
    border-radius: 10px;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
    white-space: nowrap;
    border: 1px solid transparent;
    background: rgba(57, 197, 187, 0.05);
}

.node-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    flex-shrink: 0;
}

.toc-node-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #FF007F;
    box-shadow: 0 0 10px #FF007F, 0 0 16px #39C5BB;
    animation: nodePulse 1.5s infinite alternate ease-in-out;
}

@keyframes nodePulse {
    0% { transform: scale(0.9); }
    100% { transform: scale(1.3); }
}

.toc-note-prefix {
    font-size: 11px;
    color: #12A79C;
    opacity: 0.85;
}

.toc-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}

.active-badge {
    font-size: 9px;
    font-weight: 900;
    background: rgba(57, 197, 187, 0.2);
    color: #12A79C;
    padding: 1px 5px;
    border-radius: 4px;
    border: none;
    font-family: monospace;
}

/* 目录项 Hover */
.toc-item:hover {
    color: #E04878;
    background: rgba(255, 126, 157, 0.14);
    border-color: rgba(255, 126, 157, 0.42);
    box-shadow: 0 0 12px rgba(255, 126, 157, 0.18);
    transform: translateX(4px);
}

/* 目录项 Active */
.toc-item.active {
    color: #12A79C;
    background: linear-gradient(90deg, rgba(57, 197, 187, 0.22) 0%, rgba(57, 197, 187, 0.08) 100%);
    border-color: rgba(57, 197, 187, 0.6);
    box-shadow: 0 0 14px rgba(57, 197, 187, 0.3);
    font-weight: 900;
}

.level-2 { padding-left: 10px; }
.level-3 { padding-left: 20px; font-size: 11.5px; }
.level-4 { padding-left: 28px; font-size: 11.5px; }

/* 底部脚标 */
.toc-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px solid rgba(57, 197, 187, 0.25);
    font-size: 8.5px;
    font-weight: 800;
    color: #12A79C;
    opacity: 0.85;
}

.twintail-feather { font-size: 11px; }

@media (max-width: 1420px) {
    .toc-wrapper {
        width: 180px;
        right: 10px;
        padding: 12px;
    }
}

@media (max-width: 1259px) {
    .toc-wrapper {
        display: none;
    }
}
</style>