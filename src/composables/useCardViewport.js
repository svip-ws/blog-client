import { ref, nextTick, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";

/**
 * 无框沉浸式 3D 查看器：指针拖拽 + 物理阻尼、滚轮缩放、翻转、陀螺仪、键盘
 */
export function useCardViewport() {
  const modalVisible = ref(false);
  const showControlBar = ref(false);
  const selectedCard = ref(null);
  const isFlipped = ref(false);
  const isFlashing = ref(false);
  const zoomScale = ref(1.0);

  const standaloneCardRef = ref(null);

  // 命令式 3D 状态（直接操作 DOM，避免高频响应式开销）
  let curRotateX = 3;
  let curRotateY = 8;
  let velocityX = 0;
  let velocityY = 0;
  let dampingAnimationFrame = null;
  let isPointerDragging = false;
  let totalPointerMoved = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;

  const syncCardTransform = () => {
    if (standaloneCardRef.value) {
      standaloneCardRef.value.style.transform =
        `perspective(1200px) rotateX(${curRotateX.toFixed(2)}deg) rotateY(${curRotateY.toFixed(2)}deg) scale(${zoomScale.value.toFixed(2)})`;
    }
  };

  const stopDamping = () => {
    if (dampingAnimationFrame) {
      cancelAnimationFrame(dampingAnimationFrame);
      dampingAnimationFrame = null;
    }
  };

  const applyDamping = () => {
    stopDamping();
    const step = () => {
      if (Math.abs(velocityX) > 0.005 || Math.abs(velocityY) > 0.005) {
        curRotateY += velocityX;
        curRotateX += velocityY;
        velocityX *= 0.92; // 8% 物理摩擦阻尼
        velocityY *= 0.92;
        syncCardTransform();
        dampingAnimationFrame = requestAnimationFrame(step);
      } else {
        velocityX = 0;
        velocityY = 0;
        dampingAnimationFrame = null;
      }
    };
    dampingAnimationFrame = requestAnimationFrame(step);
  };

  const handlePointerDown = (e) => {
    // 点击底部控制栏不拦截拖拽
    if (e.target && e.target.closest && e.target.closest(".bottom-floating-controlbar")) return;
    stopDamping();
    isPointerDragging = true;
    totalPointerMoved = 0;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    velocityX = 0;
    velocityY = 0;
    if (e.target && e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
    }
  };

  const handlePointerMove = (e) => {
    if (!isPointerDragging) return;
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    totalPointerMoved += Math.abs(dx) + Math.abs(dy);

    velocityX = dx * 0.42;
    velocityY = -dy * 0.42;
    curRotateY += velocityX;
    curRotateX += velocityY;

    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    syncCardTransform();
  };

  const handlePointerUp = (e) => {
    if (!isPointerDragging) return;
    isPointerDragging = false;
    if (e.target && e.target.releasePointerCapture) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    applyDamping();
  };

  const handleWheel = (e) => {
    if (!modalVisible.value) return;
    if (e.cancelable) e.preventDefault();
    const delta = e.deltaY < 0 ? 0.06 : -0.06;
    zoomScale.value = Math.max(0.7, Math.min(1.4, zoomScale.value + delta));
    syncCardTransform();
  };

  const openModal = (card) => {
    stopDamping();
    selectedCard.value = card;
    isFlipped.value = false;
    zoomScale.value = 1.0;
    curRotateX = 3;
    curRotateY = 8;
    velocityX = 0;
    velocityY = 0;
    modalVisible.value = true;
    nextTick(syncCardTransform);
    setTimeout(() => { showControlBar.value = true; }, 350);
  };

  const closeModal = () => {
    stopDamping();
    showControlBar.value = false;
    setTimeout(() => {
      modalVisible.value = false;
      selectedCard.value = null;
    }, 200);
  };

  const toggleFlip = () => {
    stopDamping();
    isFlashing.value = true;
    isFlipped.value = !isFlipped.value;

    const targetRotateY = isFlipped.value ? curRotateY + 180 : curRotateY - 180;
    const startRotY = curRotateY;
    const startTime = performance.now();
    const duration = 380;

    const animateFlip = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      curRotateY = startRotY + (targetRotateY - startRotY) * ease;
      syncCardTransform();
      if (progress < 1) requestAnimationFrame(animateFlip);
      else {
        curRotateY = targetRotateY;
        syncCardTransform();
        isFlashing.value = false;
      }
    };
    requestAnimationFrame(animateFlip);
  };

  const resetView = () => {
    stopDamping();
    curRotateX = 3;
    curRotateY = isFlipped.value ? 188 : 8;
    zoomScale.value = 1.0;
    velocityX = 0;
    velocityY = 0;
    syncCardTransform();
    ElMessage.success("✦ 视角与沉浸缩放已重置");
  };

  const handleGyroscope = (e) => {
    if (!modalVisible.value || isPointerDragging) return;
    if (e.gamma !== null && e.beta !== null) {
      curRotateX = Math.max(-30, Math.min(30, (e.beta - 45) * 0.3));
      curRotateY = Math.max(-45, Math.min(45, e.gamma * 0.3));
      syncCardTransform();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && modalVisible.value) closeModal();
  };

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleGyroscope, { passive: true });
    }
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      window.removeEventListener("deviceorientation", handleGyroscope);
    }
    stopDamping();
  });

  return {
    modalVisible, showControlBar, selectedCard, isFlipped, isFlashing,
    zoomScale, standaloneCardRef,
    openModal, closeModal, toggleFlip, resetView,
    handleWheel, handlePointerDown, handlePointerMove, handlePointerUp,
  };
}
