<template>
    <div class="tab-bar">
        <div v-for="tab in tabs" :key="tab.path" class="tab-item tactile-btn" :class="{ active: isNavActive(tab.path, route.path) }"
            @click="goTo(tab.path)">
            <div class="tab-icon-wrap">
                <el-icon class="tab-icon">
                    <component :is="tab.icon" />
                </el-icon>
            </div>
            <span class="tab-label">{{ tab.label }}</span>
        </div>
    </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { HomeFilled, Document, VideoCamera, Camera, User } from '@element-plus/icons-vue';
import { isNavActive } from '../utils/navActive';

const route = useRoute();
const router = useRouter();

const tabs = [
    { path: '/', label: '首页', icon: HomeFilled },
    { path: '/articles', label: '文章', icon: Document },
    { path: '/messages', label: '留言墙', icon: VideoCamera },
    { path: '/snapshots', label: '随拍', icon: Camera },
    { path: '/profile', label: '我的', icon: User }
];

const goTo = (path) => {
    router.push(path);
};
</script>

<style scoped>
.tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 999;
    display: none;
    height: 60px;
    /* 性能：去掉 backdrop-filter（fixed 底栏在滚动时逐帧重模糊）背景已高不透明，视觉不变 */
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(235, 248, 246, 0.97) 100%);
    border-top: 1px solid rgba(57, 197, 187, 0.32);
    box-shadow: 0 -6px 24px rgba(8, 90, 87, 0.12);
    padding-bottom: env(safe-area-inset-bottom);
}

@media (max-width: 768px) {
    .tab-bar {
        display: flex;
        align-items: center;
        justify-content: space-around;
    }
}

.tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
    padding: 6px 14px;
    min-width: 58px;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    -webkit-tap-highlight-color: transparent;
    border-radius: var(--radius-pill, 9999px);
}

.tab-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    transition: all 0.25s ease;
}

.tab-icon {
    font-size: 19px;
    color: #5C837F;
    transition: all 0.25s ease;
}

.tab-label {
    font-size: 10.5px;
    font-weight: 700;
    color: #5C837F;
    transition: all 0.25s ease;
}

.tab-item.active .tab-icon-wrap {
    background: rgba(57, 197, 187, 0.2);
    box-shadow: 0 0 12px rgba(57, 197, 187, 0.35);
}

.tab-item.active .tab-icon {
    color: #12A79C;
    transform: scale(1.12);
}

.tab-item.active .tab-label {
    color: #12A79C;
    font-weight: 800;
}
</style>