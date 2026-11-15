<template>
  <div class="skeleton-wrapper" :class="{ grid: isGrid }">
    <div v-for="n in count" :key="n" class="skeleton-card">
      <div class="skeleton-thumb shimmer"></div>
      <div class="skeleton-content">
        <div class="skeleton-title shimmer"></div>
        <div class="skeleton-line shimmer"></div>
        <div class="skeleton-line short shimmer"></div>
        <div class="skeleton-footer">
          <div class="skeleton-badge shimmer"></div>
          <div class="skeleton-date shimmer"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 3,
  },
  isGrid: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.skeleton-wrapper.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.skeleton-card {
  background: var(--card-bg, #ffffff);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.skeleton-thumb {
  width: 100%;
  height: 160px;
  border-radius: 12px;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-title {
  height: 22px;
  width: 75%;
  border-radius: 6px;
}

.skeleton-line {
  height: 14px;
  width: 100%;
  border-radius: 4px;
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.skeleton-badge {
  height: 20px;
  width: 60px;
  border-radius: 10px;
}

.skeleton-date {
  height: 14px;
  width: 80px;
  border-radius: 4px;
}

/* 闪烁光泽动画 (初音微青柔光) */
.shimmer {
  background: linear-gradient(
    90deg,
    rgba(241, 245, 249, 0.95) 25%,
    rgba(226, 232, 240, 0.95) 37%,
    rgba(241, 245, 249, 0.95) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 移动端骨架屏适配 */
@media (max-width: 768px) {
  .skeleton-wrapper {
    gap: 14px;
  }
  .skeleton-wrapper.grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .skeleton-card {
    padding: 12px;
    gap: 10px;
    border-radius: 14px;
  }
  .skeleton-thumb {
    height: 130px;
    border-radius: 10px;
  }
  .skeleton-title {
    height: 18px;
    width: 85%;
  }
  .skeleton-line {
    height: 12px;
  }
  .skeleton-badge {
    height: 18px;
    width: 50px;
  }
}
</style>
