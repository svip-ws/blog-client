/**
 * v-holo 指令：轻量级 60fps 鼠标跟随全息聚光与微距 3D 磁吸倾斜
 * - 使用单帧 rAF 节流 + CSS 变量 (--hx, --hy) 驱动无边卡片实时全息高光
 * - 自动尊重 html.reduce-motion 与移动端/触屏降级（避免触屏粘滞悬停）
 */
const handlers = new WeakMap();

export const holoTilt = {
  mounted(el, binding) {
    if (typeof window === 'undefined') return;
    const isCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
    if (isCoarsePointer) return;

    const maxTilt = typeof binding?.value?.tilt === 'number' ? binding.value.tilt : 2.2;
    const scale = typeof binding?.value?.scale === 'number' ? binding.value.scale : 1.006;

    el.classList.add('holo-interactive');

    let rafId = null;
    let lastX = 0;
    let lastY = 0;

    const onMove = (e) => {
      if (document.documentElement.classList.contains('reduce-motion')) return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const px = Math.min(1, Math.max(0, (lastX - rect.left) / rect.width));
        const py = Math.min(1, Math.max(0, (lastY - rect.top) / rect.height));
        const rx = (0.5 - py) * (maxTilt * 2);
        const ry = (px - 0.5) * (maxTilt * 2);

        el.style.setProperty('--hx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--hy', `${(py * 100).toFixed(1)}%`);
        if (maxTilt > 0) {
          el.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px) scale(${scale})`;
        }
      });
    };

    const onLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      el.style.removeProperty('transform');
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave, { passive: true });
    handlers.set(el, { onMove, onLeave });
  },
  unmounted(el) {
    const bound = handlers.get(el);
    if (!bound) return;
    el.removeEventListener('mousemove', bound.onMove);
    el.removeEventListener('mouseleave', bound.onLeave);
    handlers.delete(el);
  },
};

