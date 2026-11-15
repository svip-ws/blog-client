<template>
    <div class="miku-card-decor" aria-hidden="true">
        <!-- ① 双层等比舞台底图：底层全卡色彩氛围 + 右侧原比清晰立绘融合 + 半色调星光网格与棱镜扫光 -->
        <img class="stage-ambient" :src="stageSrc" alt="" loading="lazy" decoding="async" />
        <img class="stage-bg" :src="stageSrc" alt="" loading="lazy" decoding="async" />
        <div class="stage-dim"></div>
        <div class="stage-aurora"></div>
        <div class="stage-holo-sweep"></div>

        <!-- ② 漂浮点缀：音符 / 葱叶 / 光点（悬停轻微浮动，reduced-motion 全停） -->
        <span class="deco deco-note-1">♪</span>
        <span class="deco deco-note-2">♫</span>
        <svg class="deco deco-leek" viewBox="0 0 20 44" fill="none">
            <path d="M9.4 42 C8.6 34 8.7 25 9.3 17 L10.7 17 C11.3 25 11.4 34 10.6 42 Z" fill="#F2FBF7" stroke="#9CCDBA" stroke-width="0.8" />
            <path d="M9.6 17 C6.2 11 5.2 5.6 6.2 1.4 C9 3.4 11 6.4 11.5 10.4 C12.1 6.6 14 3.6 16.2 2.4 C16.6 6.6 15 11.6 11.4 17 Z" fill="#39C5BB" />
            <path d="M9.8 16 C8.6 12 8.2 8 8.6 4.6" stroke="#7BE3DA" stroke-width="0.9" stroke-linecap="round" />
        </svg>
        <span class="deco deco-dot d1"></span>
        <span class="deco deco-dot d2"></span>

        <!-- ③ Q 版初音立绘：贴纸风，靠右下角停靠 -->
        <div class="chibi-wrap">
            <img class="chibi" :src="chibiSrc" alt="" loading="lazy" decoding="async" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { stageFor } from '../../utils/mikuPose';

const props = defineProps({
    /** 卡片序号：决定用哪张舞台底图（5 张循环复用） */
    variant: { type: Number, default: 0 }
});

const stageSrc = computed(() => stageFor(props.variant));
const chibiSrc = '/images/miku/miku_chibi_wave.png';
</script>

<style scoped>
/* 纯装饰层：不拦截交互、不参与布局 */
.miku-card-decor {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
}

/* 底层全幅色彩氛围：平时淡淡弥散在整张卡片中，悬停时点亮舞台氛围 */
.stage-ambient {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 22%;
    opacity: 0.14;
    filter: blur(10px) saturate(1.15) brightness(1.06);
    transform: scale(1.04);
    transition: opacity 0.4s ease, filter 0.4s ease;
}

/* 主立绘层：平时若隐若现作为淡雅水印底纹，悬停时高清绚丽浮现，左侧羽化融入底图 */
.stage-bg {
    position: absolute;
    top: 0;
    right: 0;
    width: 390px;
    height: 100%;
    object-fit: cover;
    object-position: center 18%;
    opacity: 0.15;
    filter: saturate(1.04) blur(1.5px);
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.72) 26%, #000000 56%);
    mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.72) 26%, #000000 56%);
    transition: opacity 0.4s ease, filter 0.4s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 通透琉璃渐变 + 细腻半色调波点网格 */
.stage-dim {
    position: absolute;
    inset: 0;
    background:
        radial-gradient(rgba(57, 197, 187, 0.14) 1px, transparent 1px),
        linear-gradient(108deg,
            rgba(255, 255, 255, 0.68) 0%,
            rgba(242, 253, 251, 0.54) 50%,
            rgba(255, 240, 247, 0.24) 100%);
    background-size: 16px 16px, 100% 100%;
    opacity: 0.94;
    transition: opacity 0.4s ease;
}

/* 舞台角落青粉霓虹极光点缀 */
.stage-aurora {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 12% 18%, rgba(57, 197, 187, 0.22) 0%, transparent 45%),
                radial-gradient(circle at 88% 82%, rgba(255, 126, 157, 0.22) 0%, transparent 48%);
    mix-blend-mode: screen;
    opacity: 0.35;
    transition: opacity 0.35s ease;
}

/* 悬停棱镜全息扫光 */
.stage-holo-sweep {
    position: absolute;
    inset: 0;
    background: linear-gradient(112deg,
            transparent 28%,
            rgba(255, 255, 255, 0.46) 46%,
            rgba(123, 227, 218, 0.28) 52%,
            rgba(255, 157, 187, 0.24) 57%,
            transparent 72%);
    transform: translateX(-130%);
    transition: transform 0.72s cubic-bezier(0.22, 1, 0.36, 1);
}

.article-card:hover .stage-ambient {
    opacity: 0.46;
    filter: blur(6px) saturate(1.36) brightness(1.02);
}

.article-card:hover .stage-bg {
    opacity: 0.92;
    filter: saturate(1.32) contrast(1.06) brightness(1.02) blur(0px);
    transform: scale(1.045);
}

.article-card:hover .stage-dim {
    opacity: 0.56;
}

.article-card:hover .stage-aurora {
    opacity: 1;
}

.article-card:hover .stage-holo-sweep {
    transform: translateX(130%);
}

/* ---------- 漂浮点缀（贴卡片上下边缘的留白带，避开封面与正文） ---------- */
.deco {
    position: absolute;
    pointer-events: none;
}

.deco-note-1 {
    top: 3px;
    left: 32%;
    font-size: 13px;
    font-weight: 700;
    color: var(--miku-teal, #39C5BB);
    opacity: 0.55;
}

.deco-note-2 {
    top: 4px;
    right: 26%;
    font-size: 10px;
    color: var(--miku-pink, #FF7E9D);
    opacity: 0.5;
}

.deco-leek {
    top: 2px;
    left: 52%;
    width: 12px;
    height: auto;
    opacity: 0.55;
    transform: rotate(12deg);
    transform-origin: bottom center;
}

.deco-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #7BE3DA;
    opacity: 0.6;
}

.deco-dot.d1 {
    bottom: 4px;
    left: 28%;
    background: #FF9DBB;
}

.deco-dot.d2 {
    bottom: 5px;
    left: 55%;
    width: 3px;
    height: 3px;
}

/* 悬停：幅度小、时长短 */
.article-card:hover .deco-note-1 {
    animation: decoFloatA 1.4s ease-in-out infinite alternate;
}

.article-card:hover .deco-note-2 {
    animation: decoFloatB 1.1s ease-in-out infinite alternate;
}

.article-card:hover .deco-leek {
    animation: decoSway 1.6s ease-in-out infinite alternate;
}

.article-card:hover .deco-dot {
    animation: decoFloatA 1.2s ease-in-out infinite alternate;
}

@keyframes decoFloatA {
    from { transform: translateY(0); }
    to { transform: translateY(-4px); }
}

@keyframes decoFloatB {
    from { transform: translateY(0); }
    to { transform: translateY(3px); }
}

@keyframes decoSway {
    from { transform: rotate(8deg); }
    to { transform: rotate(20deg) translateY(-2px); }
}

/* ---------- Q 版立绘 ---------- */
.chibi-wrap {
    position: absolute;
    right: 8px;
    bottom: 2px;
    width: 56px;
    height: 52px;
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 立绘背后加一层柔和的青→粉舞台光晕，让 glossy 新立绘与卡片右下角的舞台光影自然融合 */
.chibi-wrap::before {
    content: '';
    position: absolute;
    left: -18px;
    right: -18px;
    bottom: -6px;
    top: -14px;
    z-index: -1;
    background: radial-gradient(ellipse at center bottom,
            rgba(57, 197, 187, 0.22) 0%,
            rgba(255, 126, 157, 0.12) 50%,
            transparent 72%);
    pointer-events: none;
    opacity: 0.85;
}

.chibi {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: bottom center;
    filter: drop-shadow(0 2px 4px rgba(14, 79, 74, 0.22))
            drop-shadow(0 0 8px rgba(57, 197, 187, 0.18))
            drop-shadow(0 0 18px rgba(255, 126, 157, 0.10));
}

.article-card:hover .chibi-wrap {
    transform: translateY(-3px) rotate(-4deg);
}

/* ---------- 响应式：移动端缩小立绘、隐藏部分点缀 ---------- */
@media (max-width: 680px) {
    .stage-bg {
        width: 100%;
        opacity: 0.14;
        -webkit-mask-image: none;
        mask-image: none;
    }

    .deco-note-2,
    .deco-leek,
    .deco-dot {
        display: none;
    }

    .chibi-wrap {
        right: 6px;
        bottom: 2px;
        width: 42px;
        height: 39px;
    }
}

/* ---------- 动效克制：双写（系统偏好 + 站内 reduce-motion） ---------- */
@media (prefers-reduced-motion: reduce) {

    .deco-note-1,
    .deco-note-2,
    .deco-leek,
    .deco-dot,
    .chibi-wrap {
        animation: none !important;
        transition: none !important;
    }
}

html.reduce-motion .deco-note-1,
html.reduce-motion .deco-note-2,
html.reduce-motion .deco-leek,
html.reduce-motion .deco-dot,
html.reduce-motion .chibi-wrap {
    animation: none !important;
    transition: none !important;
}
</style>
