<template>
  <img
    v-lazy="src"
    :class="['lazy-image', { 'lazy-image--unload': unload }]"
    :alt="alt"
    :width="width || undefined"
    :height="height || undefined"
    decoding="async"
    @error="$emit('error', $event)"
  />
</template>

<script setup>
/**
 * LazyImage —— 懒加载图片封装组件
 * 自动带占位骨架与 v-lazy 指令，调用方无需关心指令注册。
 */
defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  unload: { type: Boolean, default: false }, // 离屏是否释放内存（长列表建议 true）
  width: { type: [Number, String], default: null },
  height: { type: [Number, String], default: null },
});

defineEmits(['error']);
</script>

<style scoped>
.lazy-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
