<template>
    <div class="article-nav" v-if="prev || next">
        <div class="nav-item prev" v-if="prev" @click="$emit('navigate', prev.id)">
            <span class="nav-label">
                <el-icon>
                    <ArrowLeft />
                </el-icon> 上一篇
            </span>
            <span class="nav-title">{{ prev.title }}</span>
        </div>
        <div class="nav-item next" v-if="next" @click="$emit('navigate', next.id)">
            <span class="nav-label">
                下一篇 <el-icon>
                    <ArrowRight />
                </el-icon>
            </span>
            <span class="nav-title">{{ next.title }}</span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    prev: {
        type: Object,
        default: null
    },
    next: {
        type: Object,
        default: null
    }
});

defineEmits(['navigate']);
</script>

<style scoped>
.article-nav {
    display: flex;
    gap: 16px;
    margin-top: 20px;
}

.nav-item {
    flex: 1;
    /* 性能：去掉 backdrop-filter（文章阅读页导航随正文滚动持续重模糊） */
    background: rgba(255, 255, 255, 0.92);
    border-radius: 16px;
    padding: 20px;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(56, 189, 248, 0.08);
    border: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.nav-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(56, 189, 248, 0.18);
}

.nav-item.next {
    text-align: right;
}

.nav-label {
    font-size: 12px;
    color: #0284c7;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 4px;
}

.nav-item.next .nav-label {
    justify-content: flex-end;
}

.nav-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.nav-item:hover .nav-title {
    color: #0284c7;
}

@media (max-width: 768px) {
    .article-nav {
        flex-direction: column;
        gap: 10px;
    }

    .nav-item.next {
        text-align: left;
    }

    .nav-item.next .nav-label {
        justify-content: flex-start;
    }
}
</style>