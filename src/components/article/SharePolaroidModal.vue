<template>
    <teleport to="body">
        <transition name="modal-fade">
            <div class="polaroid-modal-backdrop" v-if="visible" @click.self="close">
                <div class="polaroid-modal-dialog">

                    <!-- 拍立得相纸主体 (Polaroid Card Frame) -->
                    <div class="polaroid-card" ref="cardRef">
                        <!-- 相片区域 -->
                        <div class="polaroid-photo-frame">
                            <img v-if="article.cover_url" :src="article.cover_url" :alt="article.title" class="polaroid-photo-img" />
                            <div v-else class="polaroid-photo-fallback">
                                <span class="fallback-seal">初音小站</span>
                                <span class="fallback-title">{{ article.title }}</span>
                            </div>
                            <div class="photo-vignette"></div>
                        </div>

                        <!-- 拍立得手写与排版区域 -->
                        <div class="polaroid-body">
                            <div class="polaroid-meta-kicker">
                                <span>初音小站 · 随笔存照</span>
                                <span class="kicker-date">{{ formatDate(article.create_time) }}</span>
                            </div>

                            <h2 class="polaroid-title">{{ article.title }}</h2>

                            <p class="polaroid-desc" v-if="article.description">
                                “{{ article.description }}”
                            </p>

                            <!-- 底部伴读者星璃认证印章与元信息 -->
                            <div class="polaroid-footer">
                                <div class="polaroid-author-row">
                                    <div class="author-circle">{{ article.author_name?.charAt(0) || '初' }}</div>
                                    <div class="author-texts">
                                        <span class="author-name">{{ article.author_name || '初音小帅' }}</span>
                                        <span class="author-role">初音记录 · 著作</span>
                                    </div>
                                </div>

                                <!-- 星璃伴读认证印章 -->
                                <div class="xingli-seal">
                                    <div class="seal-inner">
                                        <span class="seal-star">✦</span>
                                        <span class="seal-text">初音小站</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 操作控制栏 -->
                    <div class="modal-actions">
                        <button class="action-btn cta-copy tactile-btn" @click="copyShareLink">
                            <span>复制分享链接</span>
                        </button>
                        <button class="action-btn cta-close tactile-btn" @click="close">
                            <span>关闭</span>
                        </button>
                    </div>

                </div>
            </div>
        </transition>
    </teleport>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { formatDate } from '../../utils/format';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    article: {
        type: Object,
        default: () => ({})
    },
    commentCount: {
        type: Number,
        default: 0
    }
});

const emit = defineEmits(['update:visible', 'close']);

const close = () => {
    emit('update:visible', false);
    emit('close');
};

const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        ElMessage.success('文章分享链接已复制到剪贴板！');
    }).catch(() => {
        ElMessage.error('复制失败，请直接复制浏览器地址栏');
    });
};
</script>

<style scoped>
.polaroid-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.polaroid-modal-dialog {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    max-width: 440px;
    width: 100%;
}

/* ==================== 拍立得物理相纸 ==================== */
.polaroid-card {
    width: 100%;
    background: #FFFFFF;
    border-radius: 14px;
    padding: 16px 16px 24px 16px;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25), 0 4px 16px rgba(15, 23, 42, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    gap: 16px;
    transform: rotate(-0.5deg);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.polaroid-card:hover {
    transform: rotate(0deg) scale(1.01);
}

/* 相片区域 */
.polaroid-photo-frame {
    position: relative;
    width: 100%;
    height: 240px;
    border-radius: 8px;
    overflow: hidden;
    background: #0F172A;
}

.polaroid-photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.polaroid-photo-fallback {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: #ffffff;
    text-align: center;
    gap: 8px;
}

.fallback-seal {
    font-size: 11px;
    letter-spacing: 3px;
    color: #93C5FD;
    font-weight: 700;
}

.fallback-title {
    font-size: 17px;
    font-weight: 800;
    line-height: 1.4;
}

.photo-vignette {
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 40px rgba(15, 23, 42, 0.25);
    pointer-events: none;
}

/* 文本区域 */
.polaroid-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 4px;
}

.polaroid-meta-kicker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #94A3B8;
}

.polaroid-title {
    font-size: 19px;
    font-weight: 800;
    color: #0F172A;
    line-height: 1.35;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.polaroid-desc {
    font-size: 12.5px;
    color: #64748B;
    line-height: 1.6;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-style: italic;
}

/* 底部印章与作者 */
.polaroid-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px dashed rgba(15, 23, 42, 0.12);
}

.polaroid-author-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.author-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #E3F7F4;
    border: 1px solid rgba(57, 197, 187, 0.3);
    color: #12A79C;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
}

.author-texts {
    display: flex;
    flex-direction: column;
}

.author-name {
    font-size: 12px;
    font-weight: 700;
    color: #14322F;
}

.author-role {
    font-size: 9.5px;
    color: #5C837F;
}

/* 星璃认证印章 */
.xingli-seal {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    border: 1.5px dashed rgba(57, 197, 187, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(12deg);
}

.seal-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #39C5BB;
}

.seal-star {
    font-size: 9px;
    line-height: 1;
}

.seal-text {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.5px;
}

.seal-sub {
    font-size: 7px;
    font-weight: 700;
    letter-spacing: 1px;
    opacity: 0.8;
}

/* 操作按钮 */
.modal-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.action-btn {
    padding: 9px 24px;
    border-radius: var(--radius-pill);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    letter-spacing: 0.5px;
}

.cta-copy {
    background: #39C5BB;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.4);
}

.cta-copy:hover {
    background: #12A79C;
}

.cta-close {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.cta-close:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* 过渡动效 */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.25s ease;
}

.modal-fade-enter-active .polaroid-modal-dialog,
.modal-fade-leave-active .polaroid-modal-dialog {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-fade-enter-from .polaroid-modal-dialog {
    transform: translateY(20px) scale(0.95);
}
</style>
