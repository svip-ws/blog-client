<template>
    <div class="comment-section anime-card">
        <div class="comment-header">
            <div class="header-left">
                <h3 class="comment-title">
                    <span>评论交流</span>
                </h3>
            </div>
            <span class="comment-count-badge">{{ totalCommentCount }} 条探讨</span>
        </div>

        <!-- 评论输入框 -->
        <div class="comment-input-box">
            <div class="avatar-miku-decor">
                <el-avatar :size="42" :src="isLoggedIn ? userAvatar : defaultAvatar" class="input-avatar">
                    {{ (isLoggedIn ? userName : (guestNickname || '拾')).charAt(0) }}
                </el-avatar>
                <span class="mini-decor-badge" title="Miku Cyber Voice">🎧</span>
            </div>
            <div class="input-area">
                <div v-if="!isLoggedIn" class="guest-info-row">
                    <el-input v-model="guestNickname" size="small" placeholder="你的学者昵称 (选填，默认: 热心学者)" style="width: 220px;" />
                    <span class="anime-chip gold">✦ 访客探讨通道</span>
                </div>
                <el-input
                    v-model="newContent"
                    type="textarea"
                    :rows="3"
                    placeholder="在此留下你的见解、疑惑或共鸣..."
                    maxlength="200"
                    show-word-limit
                    class="anime-textarea"
                />
                <div class="submit-btn-wrapper">
                    <button class="submit-comment-btn tactile-btn" :disabled="submitting" @click="submitComment(null, null)">
                        <span v-if="!submitting">发送探讨回响 ♪</span>
                        <span v-else>正在同步...</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 评论列表 -->
        <div class="comment-list" v-loading="loading">
            <el-empty v-if="comments.length === 0" description="暂无探讨回响，快来留下你的第一声共鸣吧！" :image-size="70" />

            <div v-for="item in comments" :key="item.id" class="comment-item">
                <div class="avatar-miku-decor">
                    <el-avatar :size="42" :src="item.user_avatar" class="comment-avatar">
                        {{ item.user_name?.charAt(0) || '学' }}
                    </el-avatar>
                    <span class="mini-decor-badge">🌸</span>
                </div>
                <div class="comment-body">
                    <div class="user-meta">
                        <span class="username">{{ item.user_name }}</span>
                        <span class="time">{{ formatTime(item.create_time) }}</span>
                    </div>
                    <p class="content">{{ item.content }}</p>
                    <div class="actions">
                        <button class="reply-trigger-btn" @click="showReplyBox(item.id, item.user_id, item.user_name)">
                            回复 ✦
                        </button>
                    </div>

                    <!-- 回复列表 -->
                    <div class="replies-wrapper" v-if="item.replies && item.replies.length > 0">
                        <div v-for="reply in item.replies" :key="reply.id" class="reply-item">
                            <div class="avatar-miku-decor">
                                <el-avatar :size="30" :src="reply.user_avatar" class="reply-avatar">
                                    {{ reply.user_name?.charAt(0) || '学' }}
                                </el-avatar>
                            </div>
                            <div class="reply-body">
                                <div class="user-meta">
                                    <span class="username">{{ reply.user_name }}</span>
                                    <span class="reply-text">回复</span>
                                    <span class="target-username">@{{ reply.reply_to_user_name }}</span>
                                    <span class="time">{{ formatTime(reply.create_time) }}</span>
                                </div>
                                <p class="content">{{ reply.content }}</p>
                                <div class="actions">
                                    <button class="reply-trigger-btn" @click="showReplyBox(item.id, reply.user_id, reply.user_name)">
                                        回复 ✦
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 回复输入框 -->
                    <div class="reply-input-box" v-if="activeReplyId === item.id">
                        <el-input
                            v-model="replyContent"
                            type="textarea"
                            :rows="2"
                            :placeholder="`回复 @${replyTargetName}...`"
                        />
                        <div class="reply-btns">
                            <button class="btn-cancel" @click="cancelReply">取消</button>
                            <button class="btn-confirm tactile-btn" :disabled="submitting" @click="submitComment(item.id, replyTargetUserId)">
                                提交回复 ✦
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../../api/request';
import { formatTime } from '../../utils/format';

const props = defineProps({
    articleId: {
        type: [String, Number],
        required: true
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    userAvatar: {
        type: String,
        default: ''
    },
    userName: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['needLogin', 'commentAdded']);

const loading = ref(false);
const submitting = ref(false);
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
const guestNickname = ref('');

const comments = ref([]);
const totalCommentCount = ref(0); // 服务端权威评论总数（支持即时同步）
const newContent = ref('');
const replyContent = ref('');
const activeReplyId = ref(null);
const replyTargetUserId = ref(null);
const replyTargetName = ref('');

const loadComments = async () => {
    if (!props.articleId) return;
    loading.value = true;
    try {
        const res = await request.get(`/comment/${props.articleId}`);
        const data = res.data;
        comments.value = Array.isArray(data) ? data : (data?.list || []);
        totalCommentCount.value = Array.isArray(data)
            ? (data.total ?? data.length)
            : (data?.total ?? comments.value.length);
    } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
        console.error('加载评论失败:', error);
    } finally {
        loading.value = false;
    }
};

const showReplyBox = (parentId, toUserId, toUserName) => {
    activeReplyId.value = parentId;
    replyTargetUserId.value = toUserId;
    replyTargetName.value = toUserName || '该学者';
    replyContent.value = '';
};

const cancelReply = () => {
    activeReplyId.value = null;
    replyTargetUserId.value = null;
    replyContent.value = '';
};

const submitComment = async (parentId, toUserId) => {
    const isReply = parentId !== null;
    const content = isReply ? replyContent.value : newContent.value;

    if (!content.trim()) {
        ElMessage.warning('内容不能为空哦！');
        return;
    }

    submitting.value = true;
    try {
        const res = await request.post('/comment', {
            article_id: props.articleId,
            content: content,
            parent_id: parentId,
            reply_to_user_id: toUserId,
            guest_name: guestNickname.value.trim() || '热心学者',
            reply_to_name: replyTargetName.value
        });

        const payload = res.data; // { comment, comment_count }
        const newComment = payload.comment;

        // 即时插入刚发表的评论，无需整表重载，前端交互零等待
        if (isReply) {
            const parent = comments.value.find((c) => c.id === parentId);
            if (parent) {
                if (!parent.replies) parent.replies = [];
                parent.replies.push(newComment);
            } else {
                // 兜底：找不到父评论时整体刷新，保证一致性
                await loadComments();
            }
            cancelReply();
        } else {
            comments.value.push(newComment);
            newContent.value = '';
        }

        // 以服务端重算的权威总数同步计数
        totalCommentCount.value = payload.comment_count;
        ElMessage.success(isReply ? '回复成功！' : '探讨已成功发表！');
        emit('commentAdded', payload.comment_count);
    } catch (error) {
        console.error('提交失败:', error);
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    loadComments();
});

watch(() => props.articleId, (newId) => {
    if (newId) {
        loadComments();
    }
});

defineExpose({ loadComments, commentCount: () => comments.value.length });
</script>

<style scoped>
.comment-section {
    /* 性能：去掉 backdrop-filter（评论区大块随滚动逐帧重模糊）背景略提不透明度 */
    background: rgba(255, 255, 255, 0.96);
    border-radius: 20px;
    padding: 32px 36px;
    margin-top: 24px;
    border: none;
    box-shadow: 0 12px 38px rgba(57, 197, 187, 0.12);
    transition: all 0.3s ease;
}

.comment-section:hover {
    box-shadow: 0 16px 46px rgba(57, 197, 187, 0.18);
}

.comment-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 24px;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.header-badge {
    font-size: 10px;
    font-weight: 900;
    color: #12A79C;
    letter-spacing: 2px;
}

.comment-title {
    font-size: 20px;
    font-weight: 900;
    color: #14322F;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-sparkle {
    font-size: 18px;
}

.comment-count-badge {
    font-size: 12px;
    color: #12A79C;
    font-weight: 800;
    padding: 5px 16px;
    background: rgba(57, 197, 187, 0.12);
    border-radius: 50px;
    border: none;
}

/* 输入框 */
.comment-input-box {
    display: flex;
    gap: 16px;
    margin-bottom: 30px;
}

.avatar-miku-decor {
    position: relative;
    flex-shrink: 0;
}

.input-avatar {
    background: linear-gradient(135deg, #39C5BB, #12A79C);
    color: #ffffff;
    font-weight: 900;
    border: 2px solid #ffffff;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.3);
}

.mini-decor-badge {
    position: absolute;
    top: -4px;
    right: -6px;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    padding: 1px;
    box-shadow: 0 2px 6px rgba(57, 197, 187, 0.3);
    border: 1px solid rgba(57, 197, 187, 0.3);
}

.input-area {
    flex: 1;
}

.guest-info-row {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.submit-btn-wrapper {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
}

.submit-comment-btn {
    padding: 10px 26px;
    border-radius: 50px;
    background: linear-gradient(135deg, #39C5BB, #12A79C);
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(57, 197, 187, 0.35);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.submit-comment-btn:hover {
    box-shadow: 0 0 20px rgba(255, 126, 157, 0.45), 0 4px 16px rgba(57, 197, 187, 0.4);
    transform: translateY(-2px);
}

/* 评论列表 */
.comment-list {
    min-height: 100px;
}

.comment-item {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(57, 197, 187, 0.15);
    /* 性能：离屏评论跳过渲染/绘制 */
    content-visibility: auto;
    contain-intrinsic-size: auto 160px;
}

.comment-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.comment-avatar {
    background: linear-gradient(135deg, #12A79C, #39C5BB);
    color: #ffffff;
    font-weight: 900;
    border: 2px solid #ffffff;
    box-shadow: 0 3px 10px rgba(57, 197, 187, 0.25);
}

.comment-body {
    flex: 1;
    min-width: 0;
}

.user-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
}

.username {
    font-size: 14.5px;
    font-weight: 800;
    color: #14322F;
}

.time {
    font-size: 12px;
    color: #557772;
}

.content {
    font-size: 14.5px;
    color: #1E3A37;
    line-height: 1.7;
    margin: 4px 0 10px;
    font-weight: 500;
}

.reply-trigger-btn {
    background: transparent;
    border: none;
    color: #12A79C;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;
}

.reply-trigger-btn:hover {
    color: #FF7E9D;
    text-shadow: 0 0 8px rgba(255, 126, 157, 0.4);
}

/* 回复列表 */
.replies-wrapper {
    background: rgba(227, 247, 244, 0.5);
    border: 1px solid rgba(57, 197, 187, 0.25);
    padding: 16px;
    border-radius: 14px;
    margin-top: 12px;
    backdrop-filter: blur(8px);
}

.reply-item {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
}

.reply-item:last-child {
    margin-bottom: 0;
}

.reply-avatar {
    background: linear-gradient(135deg, #39C5BB, #12A79C);
    color: #ffffff;
    font-weight: 800;
}

.reply-body {
    flex: 1;
    min-width: 0;
}

.reply-text {
    font-size: 12px;
    color: #557772;
}

.target-username {
    font-size: 13px;
    font-weight: 700;
    color: #12A79C;
}

/* 回复输入框 */
.reply-input-box {
    margin-top: 14px;
    background: rgba(255, 255, 255, 0.95);
    padding: 14px;
    border-radius: 14px;
    border: none;
    box-shadow: 0 4px 18px rgba(57, 197, 187, 0.12);
}

.reply-btns {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.btn-cancel {
    padding: 6px 16px;
    border-radius: 50px;
    background: rgba(57, 197, 187, 0.08);
    border: none;
    color: #557772;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-cancel:hover {
    background: rgba(57, 197, 187, 0.16);
    color: #14322F;
}

.btn-confirm {
    padding: 6px 18px;
    border-radius: 50px;
    background: linear-gradient(135deg, #39C5BB, #12A79C);
    border: none;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(57, 197, 187, 0.3);
    transition: all 0.25s ease;
}

.btn-confirm:hover {
    box-shadow: 0 0 16px rgba(255, 126, 157, 0.4);
    transform: translateY(-1px);
}

@media (max-width: 768px) {
    .comment-section {
        padding: 20px 14px;
        border-radius: 18px;
        margin-top: 24px;
    }
    .reply-list {
        margin-left: 12px;
        padding-left: 10px;
        border-left: 2px solid rgba(57, 197, 187, 0.25);
    }
    .author-avatar {
        width: 36px !important;
        height: 36px !important;
    }
    .comment-item {
        padding: 12px 0;
    }
    .submit-bar {
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
    }
}
</style>