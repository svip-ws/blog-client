<template>
    <div
        class="sidebar-card glass-miku-card sidebar-tags-ultimate"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        :style="cardTiltStyle"
    >
        <!-- 4K Miku 壁纸全息背景层 -->
        <div class="card-holo-bg">
            <img src="/images/miku/miku_wp_8.jpg" class="holo-img" alt="Holo Miku Wallpaper" loading="lazy" decoding="async" />
            <div class="holo-scanline"></div>
            <div class="holo-glow-mask"></div>
        </div>

        <!-- 1. 顶部 Header -->
        <div class="sidebar-header-cyber">
            <div class="header-left">
                <span class="header-icon-disc"></span>
                <span class="header-title">标签星球</span>
            </div>
            <span class="header-count">{{ tagItems.length }} 个</span>
        </div>

        <!-- 2. Q 版初音立绘互动 -->
        <div class="miku-tag-chibi-stage">
            <div class="chibi-avatar-3d tactile-btn" :class="{ 'is-jumping': isJumping }" @click="triggerMikuJump" title="点击互动">
                <img src="/images/miku/miku_chibi_main.png" alt="Q版初音" class="chibi-img" />
                
                <!-- 粒子爆发浮层 -->
                <div v-for="p in particles" :key="p.id" class="pop-particle" :style="p.style">{{ p.char }}</div>
            </div>

            <div class="speech-bubble-cyber">
                <p class="bubble-txt">拖拽或点击标签探索相关文章</p>
            </div>
        </div>

        <!-- 3. 交互式 3D 旋转球体标签云 (纯净无背景) -->
        <div
            class="sidebar-tags-sphere-container"
            ref="sphereContainerRef"
            @mouseenter="isHoveredSphere = true"
            @mouseleave="onSphereMouseLeave"
            @mousemove="onSphereMouseMove"
            @mousedown="onSphereMouseDown"
            @mouseup="onSphereMouseUp"
        >
            <div v-if="tagItems && tagItems.length > 0" class="sphere-stage">
                <div
                    v-for="item in tagItems"
                    :key="item.id"
                    class="tag-sphere-item tactile-btn"
                    :class="{ 'is-hovered': item.isHovered }"
                    :style="{
                        transform: `translate3d(${item.x2d}px, ${item.y2d}px, 0px) scale(${item.scale})`,
                        opacity: item.opacity,
                        zIndex: item.zIndex
                    }"
                    @mouseenter="item.isHovered = true"
                    @mouseleave="item.isHovered = false"
                    @click="onTagClick(item)"
                >
                    <span class="tag-icon">♫</span>
                    <span class="tag-name">{{ item.name }}</span>
                </div>
            </div>
            <el-empty v-else description="暂无标签数据" :image-size="50" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    tags: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['goTag']);

/* 3D 视差倾斜特效 */
const tiltX = ref(0);
const tiltY = ref(0);
const cardTiltStyle = computed(() => ({
    transform: `perspective(1000px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg)`
}));

let tagTiltRaf = null;
const handleMouseMove = (e) => {
    if (tagTiltRaf) return;
    const target = e.currentTarget;
    const clientX = e.clientX;
    const clientY = e.clientY;
    tagTiltRaf = requestAnimationFrame(() => {
        tagTiltRaf = null;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const x = clientX - rect.left - rect.width / 2;
        const y = clientY - rect.top - rect.height / 2;
        tiltX.value = (y / rect.height) * -5;
        tiltY.value = (x / rect.width) * 5;
    });
};

const handleMouseLeave = () => {
    if (tagTiltRaf) {
        cancelAnimationFrame(tagTiltRaf);
        tagTiltRaf = null;
    }
    tiltX.value = 0;
    tiltY.value = 0;
};

/* Q版初音台词与粒子爆发 */
const QUOTES = [
    '「滑动或拖拽球体，探索 3D 初音标签吧♪」',
    '「每一个标签都是星轨球体上的闪耀节点✦」',
    '「39！葱绿色标签球体正在旋转连击中～♫」',
    '「点击任意节点，直接直达精选内容库！🎧」'
];
const quoteIdx = ref(0);
const currentQuote = computed(() => QUOTES[quoteIdx.value]);
const isJumping = ref(false);
const particles = ref([]);

const triggerMikuJump = () => {
    quoteIdx.value = (quoteIdx.value + 1) % QUOTES.length;
    isJumping.value = true;
    setTimeout(() => { isJumping.value = false; }, 600);
    spawnParticles();
};

const spawnParticles = () => {
    const chars = ['♪', '♫', '✦', '★', '39', '⚡'];
    for (let i = 0; i < 6; i++) {
        const pId = Date.now() + Math.random();
        const angle = Math.random() * Math.PI * 2;
        const dist = 35 + Math.random() * 50;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 20;
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        particles.value.push({
            id: pId,
            char,
            style: {
                transform: `translate(${tx}px, ${ty}px) scale(${0.8 + Math.random() * 0.5})`,
                opacity: 0
            }
        });
        
        setTimeout(() => {
            particles.value = particles.value.filter(p => p.id !== pId);
        }, 800);
    }
};

/* ==================== 3D 旋转球体标签算法 (Tag Sphere) ==================== */
const sphereContainerRef = ref(null);
const tagItems = ref([]);
const isHoveredSphere = ref(false);
const isDragging = ref(false);

const RADIUS = 92; // 3D 球体半径
let rotX = 0;
let rotY = 0;
let speedX = 0.004; // 默认自转 speed
let speedY = 0.006;
let lastMouseX = 0;
let lastMouseY = 0;
let animFrameId = null;

// 初始化球体坐标 (Fibonacci 螺旋球面均匀分布)
const initSpherePositions = () => {
    const rawTags = (props.tags && props.tags.length > 0) ? props.tags : [
        { id: 1, name: '初音未来' },
        { id: 2, name: 'VOCALOID' },
        { id: 3, name: '千本樱' },
        { id: 4, name: '电子歌姬' },
        { id: 5, name: '音乐创作' },
        { id: 6, name: '美学笔记' },
        { id: 7, name: 'Vue3' },
        { id: 8, name: '前端开发' },
        { id: 9, name: '初音随拍' },
        { id: 10, name: '全息二次元' }
    ];

    const len = rawTags.length;
    tagItems.value = rawTags.map((tag, i) => {
        // Fibonacci sphere point distribution
        const phi = Math.acos(1 - (2 * (i + 0.5)) / len);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

        const x0 = RADIUS * Math.sin(phi) * Math.cos(theta);
        const y0 = RADIUS * Math.sin(phi) * Math.sin(theta);
        const z0 = RADIUS * Math.cos(phi);

        return {
            id: tag.id,
            name: tag.name.replace(/^#|#$/g, ''), // 严格去除 # 号
            x: x0,
            y: y0,
            z: z0,
            x2d: 0,
            y2d: 0,
            scale: 1,
            opacity: 1,
            zIndex: 1,
            isHovered: false
        };
    });
};

// 动画渲染循环
const renderSphereFrame = () => {
    // 旋转角增量
    rotX += speedX;
    rotY += speedY;

    // 减速阻尼（当离开鼠标拖拽时回归默认自转速度）
    if (!isDragging.value && !isHoveredSphere.value) {
        speedX = speedX * 0.96 + 0.003 * 0.04;
        speedY = speedY * 0.96 + 0.005 * 0.04;
    }

    const cosX = Math.cos(speedX);
    const sinX = Math.sin(speedX);
    const cosY = Math.cos(speedY);
    const sinY = Math.sin(speedY);

    const centerX = 135; // 容器内中心点 X
    const centerY = 110; // 容器内中心点 Y

    tagItems.value.forEach(item => {
        // 绕 Y 轴旋转
        let x1 = item.x * cosY + item.z * sinY;
        let z1 = -item.x * sinY + item.z * cosY;

        // 绕 X 轴旋转
        let y2 = item.y * cosX - z1 * sinX;
        let z2 = item.y * sinX + z1 * cosX;

        item.x = x1;
        item.y = y2;
        item.z = z2;

        // 3D 透视投影换算
        const pScale = (z2 + RADIUS * 1.5) / (RADIUS * 2.5);
        const scale = Math.max(0.55, Math.min(1.25, pScale));
        const opacity = Math.max(0.25, Math.min(1, (z2 + RADIUS) / (RADIUS * 2) * 0.75 + 0.25));

        item.x2d = centerX + x1 - 36; // 偏移文本宽度中心
        item.y2d = centerY + y2 - 12;
        item.scale = item.isHovered ? scale * 1.35 : scale;
        item.opacity = item.isHovered ? 1 : opacity;
        item.zIndex = Math.round(z2 + RADIUS + 10);
    });

    if (isVisible) {
        animFrameId = requestAnimationFrame(renderSphereFrame);
    } else {
        animFrameId = null;
    }
};

/* 鼠标交互处理 */
const onSphereMouseMove = (e) => {
    if (!sphereContainerRef.value) return;
    const rect = sphereContainerRef.value.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging.value) {
        const dx = mouseX - lastMouseX;
        const dy = mouseY - lastMouseY;
        speedY = dx * 0.0008;
        speedX = -dy * 0.0008;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    } else {
        // 靠近中心越快，远离越慢
        const dx = mouseX - rect.width / 2;
        const dy = mouseY - rect.height / 2;
        speedY = dx * 0.00008;
        speedX = -dy * 0.00008;
    }
};

const onSphereMouseDown = (e) => {
    if (!sphereContainerRef.value) return;
    isDragging.value = true;
    const rect = sphereContainerRef.value.getBoundingClientRect();
    lastMouseX = e.clientX - rect.left;
    lastMouseY = e.clientY - rect.top;
};

const onSphereMouseUp = () => {
    isDragging.value = false;
};

const onSphereMouseLeave = () => {
    isHoveredSphere.value = false;
    isDragging.value = false;
};

const onTagClick = (item) => {
    spawnParticles();
    emit('goTag', item.id);
};

let isVisible = true;
let observer = null;

watch(() => props.tags, () => {
    initSpherePositions();
}, { deep: true });

onMounted(() => {
    initSpherePositions();
    
    // 性能优化：卡片进入视口时才开启 3D 球体旋转动画循环
    if (typeof IntersectionObserver !== 'undefined' && sphereContainerRef.value) {
        observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            if (isVisible && !animFrameId) {
                animFrameId = requestAnimationFrame(renderSphereFrame);
            }
        }, { threshold: 0.1 });
        observer.observe(sphereContainerRef.value);
    } else {
        animFrameId = requestAnimationFrame(renderSphereFrame);
    }
});

onUnmounted(() => {
    if (observer) observer.disconnect();
    if (animFrameId) cancelAnimationFrame(animFrameId);
});
</script>

<style scoped>
.sidebar-tags-ultimate {
    position: relative;
    padding: 18px;
    margin-bottom: 22px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.92);
    border: none;
    box-shadow: 0 16px 40px rgba(57, 197, 187, 0.18), 0 0 25px rgba(57, 197, 187, 0.12);
    transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
    transform-style: preserve-3d;
    overflow: hidden;
}

/* 4K 壁纸全息背景层 */
.card-holo-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

.holo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.18;
    filter: saturate(1.4) contrast(1.1);
}

.holo-scanline {
    position: absolute;
    inset: 0;
    height: 50%;
    background: linear-gradient(180deg, transparent 0%, rgba(57, 197, 187, 0.15) 50%, transparent 100%);
    animation: scanlineSweep 4s linear infinite;
    will-change: transform;
}

@keyframes scanlineSweep {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(200%); }
}

.holo-glow-mask {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 80% 20%, rgba(57, 197, 187, 0.15) 0%, transparent 60%),
                radial-gradient(circle at 20% 80%, rgba(18, 167, 156, 0.15) 0%, transparent 60%);
}

/* 科技角标装饰 */
.hud-bracket {
    position: absolute;
    font-family: 'Audiowide', monospace;
    font-size: 9px;
    font-weight: 900;
    color: var(--miku-teal);
    opacity: 0.7;
    pointer-events: none;
}

.top-left { top: 6px; left: 10px; }
.top-right { top: 6px; right: 10px; }
.bottom-left { bottom: 6px; left: 10px; }
.bottom-right { bottom: 6px; right: 10px; }

/* 1. Header */
.sidebar-header-cyber {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 12px;
    border-bottom: 1.5px dashed rgba(57, 197, 187, 0.3);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-icon-disc {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px dashed var(--miku-teal);
    animation: vinylSpin 8s linear infinite;
}

@keyframes vinylSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.header-title {
    font-size: 16px;
    font-weight: 900;
    color: #0E2926;
    text-shadow: 0 0 8px rgba(57, 197, 187, 0.3);
}

.header-chip {
    font-family: 'Audiowide', sans-serif;
    font-size: 8.5px;
    font-weight: 900;
    color: #ffffff;
    background: linear-gradient(90deg, var(--miku-teal), var(--miku-deep));
    padding: 2px 7px;
    border-radius: 4px;
}

.header-count {
    font-family: 'Audiowide', monospace;
    font-size: 11px;
    font-weight: 900;
    color: #00687d;
}

/* 2. 初音 Q 版舞台 */
.miku-tag-chibi-stage {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    padding: 8px 10px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(227, 247, 244, 0.9) 100%);
    border-radius: 16px;
    border: 1.5px solid rgba(57, 197, 187, 0.3);
}

.chibi-avatar-3d {
    position: relative;
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chibi-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: none;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 2;
}

.chibi-avatar-3d.is-jumping .chibi-img {
    animation: mikuJump 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes mikuJump {
    0% { transform: translateY(0) rotate(0deg) scale(1); }
    40% { transform: translateY(-14px) rotate(-10deg) scale(1.2); }
    70% { transform: translateY(-5px) rotate(6deg) scale(1.1); }
    100% { transform: translateY(0) rotate(0deg) scale(1); }
}

.pop-particle {
    position: absolute;
    font-size: 14px;
    font-weight: 900;
    color: #39C5BB;
    text-shadow: 0 0 6px rgba(57, 197, 187, 0.8);
    pointer-events: none;
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 5;
}

.speech-bubble-cyber {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.bubble-tag {
    font-family: 'Audiowide', sans-serif;
    font-size: 8px;
    font-weight: 900;
    color: var(--miku-teal);
}

.bubble-txt {
    font-size: 11px;
    font-weight: 800;
    color: #0E2926;
    line-height: 1.35;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* ==================== 3. 交互式 3D 旋转球体容器 ==================== */
.sidebar-tags-sphere-container {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 220px;
    overflow: hidden;
    cursor: grab;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sidebar-tags-sphere-container:active {
    cursor: grabbing;
}

.sphere-stage {
    position: absolute;
    inset: 0;
    background: transparent;
}

.tag-sphere-item {
    position: absolute;
    top: 0;
    left: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.94);
    border: none;
    box-shadow: 0 4px 14px rgba(8, 90, 87, 0.12);
    cursor: pointer;
    white-space: nowrap;
    will-change: transform, opacity;
    transition: background 0.25s ease, box-shadow 0.25s ease;
}

.tag-icon {
    font-size: 11px;
    color: #39C5BB;
    transition: transform 0.2s ease;
}

.tag-name {
    font-size: 12.5px;
    font-weight: 800;
    color: #0E2926;
    letter-spacing: 0.3px;
}

.tag-sphere-item.is-hovered,
.tag-sphere-item:hover {
    background: linear-gradient(135deg, #39C5BB 0%, #12A79C 100%);
    box-shadow: 0 6px 20px rgba(57, 197, 187, 0.55);
}

.tag-sphere-item.is-hovered .tag-name,
.tag-sphere-item:hover .tag-name {
    color: #FFFFFF;
}

.tag-sphere-item.is-hovered .tag-icon,
.tag-sphere-item:hover .tag-icon {
    color: #FFFFFF;
    transform: rotate(20deg) scale(1.2);
}

/* 4. 底部 HUD */
.tags-footer-hud {
    position: relative;
    z-index: 2;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed rgba(57, 197, 187, 0.25);
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

.hud-eq-bars {
    display: flex;
    align-items: flex-end;
    gap: 2.5px;
    height: 12px;
}

.hud-eq-bars i {
    width: 2.5px;
    border-radius: 2px;
    background: linear-gradient(180deg, #39C5BB, #12A79C);
    animation: waveBar 1.2s ease-in-out infinite alternate;
}

.hud-eq-bars i:nth-child(1) { height: 40%; animation-delay: 0.1s; }
.hud-eq-bars i:nth-child(2) { height: 90%; animation-delay: 0.3s; }
.hud-eq-bars i:nth-child(3) { height: 60%; animation-delay: 0.2s; }
.hud-eq-bars i:nth-child(4) { height: 100%; animation-delay: 0.4s; }

@keyframes waveBar {
    from { opacity: 0.4; transform: scaleY(0.5); }
    to { opacity: 1; transform: scaleY(1); }
}
</style>