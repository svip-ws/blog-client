import { ref, nextTick } from "vue";

/**
 * 对话滚动区控制：滚动位置、回底按钮、节流滚底
 */
export function useChatScroll() {
  const viewportRef = ref(null);
  const showScrollArrow = ref(false);
  let lastScrollTime = 0;

  function handleScroll() {
    if (!viewportRef.value) return;
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.value;
    showScrollArrow.value = scrollHeight - scrollTop - clientHeight > 120;
  }

  // 回到底部（用户已手动上滑时不强制，除非 force）
  function scrollToBottom(force = false) {
    nextTick(() => {
      if (viewportRef.value && (force || !showScrollArrow.value)) {
        viewportRef.value.scrollTop = viewportRef.value.scrollHeight;
      }
    });
  }

  function scrollToBottomSmooth() {
    if (viewportRef.value) {
      viewportRef.value.scrollTo({
        top: viewportRef.value.scrollHeight,
        behavior: "smooth",
      });
      showScrollArrow.value = false;
    }
  }

  // 节流滚底，限制流式输出时的重绘频率
  function scrollToBottomThrottled() {
    const now = Date.now();
    if (now - lastScrollTime > 80) {
      lastScrollTime = now;
      if (viewportRef.value && !showScrollArrow.value) {
        viewportRef.value.scrollTop = viewportRef.value.scrollHeight;
      }
    }
  }

  return {
    viewportRef, showScrollArrow, handleScroll,
    scrollToBottom, scrollToBottomSmooth, scrollToBottomThrottled,
  };
}
