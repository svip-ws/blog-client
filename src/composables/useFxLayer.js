/**
 * 视觉特效层：点赞爆裂粒子等（fxLayer 为不拦截交互的固定层）
 * @param {import('vue').Ref} fxLayerRef 特效层 DOM ref
 * @param {boolean} prefersReduced 是否降级动效
 */
export function useFxLayer(fxLayerRef, prefersReduced) {
  function spawnLikeBurst(e) {
    if (prefersReduced) return;
    const layer = fxLayerRef.value;
    if (!layer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 12; i++) {
      const p = document.createElement("span");
      p.className = "mk-burst";
      const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const dist = 28 + Math.random() * 34;
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      p.style.setProperty("--tx", (Math.cos(ang) * dist).toFixed(1) + "px");
      p.style.setProperty("--ty", (Math.sin(ang) * dist).toFixed(1) + "px");
      p.style.background = i % 2 ? "var(--mk-pink)" : "var(--mk-teal)";
      layer.appendChild(p);
      setTimeout(() => p.remove(), 760);
    }
  }

  return { spawnLikeBurst };
}
