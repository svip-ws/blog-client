<template>
  <div class="global-background">
    <!-- CSS 渐变光晕与网格底纹 -->
    <div class="bg-gradient-top-left"></div>
    <div class="bg-gradient-bottom-right"></div>
    <div class="bg-grid-overlay"></div>
    
    <!-- 交互式 Canvas 画布 -->
    <canvas ref="canvasRef" class="bg-interactive-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const canvasRef = ref(null);
let ctx = null;
let animationFrameId = null;
// 视差背景元素 (光斑与音符)
let parallaxElements = [];
// 交互式鼠标光晕 & 点击音符波纹粒子池
let pointerX = -999;
let pointerY = -999;
let smoothX = -999;
let smoothY = -999;
let pointerActive = false;
const clickBursts = [];
const clickRings = [];
const BURST_NOTES = ['♪', '♫', '✦', '✧'];
// 当前滚动高度
let currentScrollY = 0;
// 窗口尺寸
let width = 0;
let height = 0;

const isReducedMotion = () => document.documentElement.classList.contains('reduce-motion');

const handlePointerMove = (e) => {
  if (width <= 768 || isReducedMotion()) return;
  pointerX = e.clientX;
  pointerY = e.clientY;
  if (!pointerActive) {
    smoothX = pointerX;
    smoothY = pointerY;
    pointerActive = true;
  }
};

const handlePointerLeave = () => {
  pointerActive = false;
};

const handleGlobalClick = (e) => {
  if (width <= 768 || isReducedMotion()) return;
  // 限制粒子池上限，连点不掉帧
  if (clickRings.length < 5) {
    clickRings.push({ x: e.clientX, y: e.clientY, r: 4, maxR: 44, alpha: 0.45 });
  }
  const slots = Math.max(0, 24 - clickBursts.length);
  const spawnCount = Math.min(5, slots);
  for (let i = 0; i < spawnCount; i++) {
    const angle = (Math.PI * 2 * i) / Math.max(1, spawnCount) + (Math.random() - 0.5) * 0.5;
    const speed = 1.6 + Math.random() * 2.2;
    clickBursts.push({
      x: e.clientX,
      y: e.clientY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.9,
      alpha: 0.9,
      char: BURST_NOTES[i % BURST_NOTES.length],
      color: i % 2 === 0 ? '57, 197, 187' : '255, 126, 157',
      size: 11 + Math.random() * 4,
    });
  }
};

const initCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  
  handleResize();
  initParallaxElements();
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  window.addEventListener('click', handleGlobalClick, { passive: true });
  
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    // 移动端延时 800ms 启动背景粒子，让出 CPU/GPU 资源给页面首屏组件渲染
    setTimeout(() => { renderLoop(); }, 800);
  } else {
    renderLoop();
  }
};

const handleResize = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
};

const handleScroll = () => {
  currentScrollY = window.scrollY;
};

const initParallaxElements = () => {
  parallaxElements = [];
  const isMobile = window.innerWidth <= 768;
  // 移动端仅保留 6 个微型音符光点，大幅降低 CPU 计算量
  const count = isMobile ? 6 : Math.floor(window.innerWidth / 40);
  
  const notes = ['♪', '♫', '♬'];
  
  for (let i = 0; i < count; i++) {
    const isNote = Math.random() > 0.7;
    parallaxElements.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * (window.innerHeight * 2),
      size: isNote ? Math.random() * 6 + 8 : Math.random() * 20 + 10,
      speed: Math.random() * 0.25 + 0.08,
      opacity: Math.random() * 0.04 + 0.02,
      isNote: isNote,
      noteChar: notes[Math.floor(Math.random() * notes.length)],
      drift: Math.random() * Math.PI * 2,
      driftSpeed: Math.random() * 0.006 + 0.002
    });
  }
};

const handleVisibilityChange = () => {
  if (document.hidden) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  } else {
    if (!animationFrameId) renderLoop();
  }
};

let lastFrameTime = 0;
const renderLoop = (timestamp) => {
  if (!ctx || document.hidden) return;
  animationFrameId = requestAnimationFrame(renderLoop);

  // 桌面端：当存在点击特效时切至 ~60fps (16ms)，平时维持 30fps 省电
  const isMobile = width <= 768;
  const hasBurst = clickBursts.length > 0 || clickRings.length > 0;
  const frameInterval = isMobile ? 50 : (hasBurst ? 16 : 33);

  if (timestamp && timestamp - lastFrameTime < frameInterval) return;
  lastFrameTime = timestamp || performance.now();

  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 桌面端柔和鼠标跟随极光光晕
  if (!isMobile && pointerActive && !isReducedMotion()) {
    smoothX += (pointerX - smoothX) * 0.18;
    smoothY += (pointerY - smoothY) * 0.18;
    const aura = ctx.createRadialGradient(smoothX, smoothY, 0, smoothX, smoothY, 170);
    aura.addColorStop(0, 'rgba(57, 197, 187, 0.085)');
    aura.addColorStop(0.5, 'rgba(255, 126, 157, 0.035)');
    aura.addColorStop(1, 'rgba(57, 197, 187, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(smoothX, smoothY, 170, 0, Math.PI * 2);
    ctx.fill();
  }

  // 仅在最外层设置一次 font
  ctx.font = "14px 'Outfit', sans-serif";

  // 渲染视差元素 (光斑和音符)
  parallaxElements.forEach(p => {
    let currentY = p.y - (currentScrollY * p.speed);

    while (currentY < -100) currentY += height * 2;
    while (currentY > height * 2) currentY -= height * 2;

    p.drift += p.driftSpeed;
    const currentX = p.x + Math.sin(p.drift) * 12;

    ctx.fillStyle = `rgba(57, 197, 187, ${p.opacity})`;
    if (p.isNote) {
      ctx.fillText(p.noteChar, currentX, currentY);
    } else {
      ctx.beginPath();
      ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 渲染点击扩散声波环
  for (let i = clickRings.length - 1; i >= 0; i--) {
    const ring = clickRings[i];
    ring.r += (ring.maxR - ring.r) * 0.14 + 0.8;
    ring.alpha *= 0.91;
    if (ring.alpha < 0.02 || ring.r >= ring.maxR) {
      clickRings.splice(i, 1);
      continue;
    }
    ctx.strokeStyle = `rgba(57, 197, 187, ${ring.alpha})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 渲染点击飞散音符粒子
  for (let i = clickBursts.length - 1; i >= 0; i--) {
    const b = clickBursts[i];
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.04;
    b.alpha *= 0.93;
    if (b.alpha < 0.03) {
      clickBursts.splice(i, 1);
      continue;
    }
    ctx.fillStyle = `rgba(${b.color}, ${b.alpha})`;
    ctx.font = `700 ${Math.round(b.size)}px 'Outfit', sans-serif`;
    ctx.fillText(b.char, b.x, b.y);
  }
};

onMounted(() => {
  initCanvas();
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerleave', handlePointerLeave);
  window.removeEventListener('click', handleGlobalClick);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.global-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none; /* 关键：不阻挡任何用户交互 */
  background: var(--bg-page, #EAF9F8); /* 兜底背景色 */
  overflow: hidden;
  transform: translateZ(0);
}

/* 顶部左侧微弱青色光晕：采用原生无模糊渐变，彻底消除 CSS 高开销 blur 重绘 */
.bg-gradient-top-left {
  position: absolute;
  top: -20vh;
  left: -20vw;
  width: 70vw;
  height: 70vh;
  background: radial-gradient(circle, rgba(57, 197, 187, 0.12) 0%, rgba(57, 197, 187, 0.04) 40%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  transform: translateZ(0);
}

/* 底部右侧微弱粉色光晕 */
.bg-gradient-bottom-right {
  position: absolute;
  bottom: -20vh;
  right: -20vw;
  width: 60vw;
  height: 60vh;
  background: radial-gradient(circle, rgba(255, 126, 157, 0.08) 0%, rgba(255, 126, 157, 0.02) 40%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  transform: translateZ(0);
}

/* 微弱细腻网格纹理叠加 */
.bg-grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(57, 197, 187, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(57, 197, 187, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
  pointer-events: none;
}

.bg-interactive-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
