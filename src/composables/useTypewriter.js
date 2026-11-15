/**
 * 打字机流式渲染（约 30 FPS，降低移动端 CPU 压力）
 * 依赖：messages、isGenerating（来自聊天编排），以及滚动回调
 */
import { onUnmounted } from "vue";

export function useTypewriter(messages, isGenerating, { scrollThrottled, scrollFinal }) {
  let rafId = null;

  function stopTypewriter() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // 组件卸载时停止打字机，避免离开页面后 raf 空转
  onUnmounted(stopTypewriter);

  function startTypewriterLoop() {
    if (rafId) return;
    let lastTickTime = 0;

    const tick = (timestamp) => {
      if (timestamp - lastTickTime >= 30) {
        lastTickTime = timestamp;
        let hasMoreToType = false;
        const currentModelMsg = messages.value.filter((m) => m.role === "model").slice(-1)[0];

        if (currentModelMsg) {
          // 1. 思考过程打字机
          const targetReasoning = currentModelMsg.reasoning || "";
          const currentReasoningLen = (currentModelMsg.displayedReasoning || "").length;
          if (currentReasoningLen < targetReasoning.length) {
            hasMoreToType = true;
            const diff = targetReasoning.length - currentReasoningLen;
            const step = diff > 40
              ? Math.min(10, Math.ceil(diff / 4))
              : Math.max(1, Math.min(5, Math.ceil(diff / 3)));
            currentModelMsg.displayedReasoning = targetReasoning.slice(0, currentReasoningLen + step);
            scrollThrottled();
          }

          // 2. 正文答案打字机
          const targetContent = currentModelMsg.content || "";
          const currentContentLen = (currentModelMsg.displayedContent || "").length;
          if (currentContentLen < targetContent.length) {
            hasMoreToType = true;
            const diff = targetContent.length - currentContentLen;
            const step = diff > 50
              ? Math.min(12, Math.ceil(diff / 3))
              : Math.max(1, Math.min(4, Math.ceil(diff / 2)));
            currentModelMsg.displayedContent = targetContent.slice(0, currentContentLen + step);
            scrollThrottled();
          }
        }

        if (!isGenerating.value && !hasMoreToType) {
          rafId = null;
          scrollFinal();
          return;
        }
      }

      if (isGenerating.value || rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
  }

  return { startTypewriterLoop, stopTypewriter };
}
