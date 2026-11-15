<template>
    <div class="like-section" ref="likeBtnBoxRef">
        <!-- 粒子爆炸 Canvas -->
        <canvas ref="particleCanvas" class="like-particle-canvas"></canvas>

        <button
            class="like-btn tactile-btn"
            :class="{ liked: isLiked, animate: justLiked }"
            :disabled="pending"
            @click="onLikeClick($event)"
        >
            <div class="heart-box">
                <svg class="heart-icon" viewBox="0 0 24 24" :fill="isLiked ? '#FF7E9D' : 'none'"
                    :stroke="isLiked ? '#FF7E9D' : '#39C5BB'" stroke-width="2.2">
                    <path
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <div class="heart-glow-ring" v-if="isLiked"></div>
            </div>

            <div class="like-text-group">
                <span class="like-text">{{ isLiked ? '已点赞支持' : '点赞支持' }}</span>
            </div>

            <div class="like-badge-num">
                <span class="like-count">{{ likeCount }}</span>
                <span class="like-sparkle">✦</span>
            </div>
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { toggleLike } from '../../api/article';

const props = defineProps({
    articleId: {
        type: [String, Number],
        required: true
    },
    initialLiked: {
        type: Boolean,
        default: false
    },
    initialCount: {
        type: Number,
        default: 0
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['needLogin']);

const isLiked = ref(props.initialLiked);
const likeCount = ref(props.initialCount);
const justLiked = ref(false);
const pending = ref(false);
const likeBtnBoxRef = ref(null);
const particleCanvas = ref(null);

const onLikeClick = (e) => {
    createParticles(e);
    handleLike();
};

const createParticles = (e) => {
    if (!particleCanvas.value || !likeBtnBoxRef.value) return;
    const canvas = particleCanvas.value;
    const ctx = canvas.getContext('2d');
    const rect = likeBtnBoxRef.value.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const colors = ['#FF7E9D', '#39C5BB', '#00F3FF', '#FFE600', '#FFFFFF'];
    const particles = [];
    
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push({
            x: clickX,
            y: clickY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            life: Math.random() * 20 + 20
        });
    }
    
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            if (p.alpha > 0) {
                alive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 1 / p.life;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        if (alive) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
    animate();
};

const handleLike = async () => {
    if (!props.isLoggedIn) {
        emit('needLogin');
        return;
    }
    if (pending.value) return;

    const prevLiked = isLiked.value;
    const prevCount = likeCount.value;
    isLiked.value = !isLiked.value;
    likeCount.value = prevCount + (isLiked.value ? 1 : -1);

    pending.value = true;
    try {
        const res = await toggleLike(props.articleId);
        isLiked.value = res.data.liked;
        likeCount.value = res.data.like_count;

        if (res.data.liked) {
            justLiked.value = true;
            setTimeout(() => { justLiked.value = false; }, 600);
        }

        ElMessage.success(res.data.liked ? '点赞成功！声鸣共振中 🎵' : '已取消点赞');
    } catch (error) {
        isLiked.value = prevLiked;
        likeCount.value = prevCount;
        console.error('点赞失败:', error);
    } finally {
        pending.value = false;
    }
};

const updateLike = (liked, count) => {
    isLiked.value = liked;
    likeCount.value = count;
};

defineExpose({ updateLike });
</script>

<style scoped>
.like-section {
    position: relative;
    display: flex;
    justify-content: center;
    padding-top: 24px;
    border-top: 1.5px dashed rgba(57, 197, 187, 0.3);
    width: 100%;
}

.like-particle-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 10;
}

.like-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 36px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(228, 248, 245, 0.9));
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 8px 24px rgba(57, 197, 187, 0.22);
    backdrop-filter: blur(12px);
}

.like-btn:hover {
    background: linear-gradient(135deg, #ffffff, rgba(255, 240, 245, 0.95));
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 10px 28px rgba(255, 126, 157, 0.38), 0 0 16px rgba(57, 197, 187, 0.28);
}

.like-btn.liked {
    background: linear-gradient(135deg, rgba(255, 240, 245, 0.98), rgba(255, 126, 157, 0.2));
    box-shadow: 0 4px 24px rgba(255, 126, 157, 0.45);
}

.heart-box {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.heart-icon {
    width: 24px;
    height: 24px;
    transition: transform 0.3s ease, stroke 0.3s ease;
}

.heart-glow-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 126, 157, 0.4), transparent);
    animation: heartGlowPulse 2s ease-in-out infinite alternate;
}

@keyframes heartGlowPulse {
    0% { transform: scale(0.9); opacity: 0.5; }
    100% { transform: scale(1.2); opacity: 0.9; }
}

.like-btn.animate .heart-icon {
    animation: heartPop 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes heartPop {
    0% { transform: scale(1); }
    50% { transform: scale(1.4) rotate(-8deg); }
    100% { transform: scale(1); }
}

.like-text-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.like-text {
    font-size: 13.5px;
    font-weight: 800;
    color: #0E2926;
    transition: color 0.3s ease;
}

.like-sub {
    font-family: 'Audiowide', sans-serif;
    font-size: 8px;
    font-weight: 800;
    color: #39C5BB;
    letter-spacing: 0.5px;
}

.like-btn:hover .like-text,
.like-btn.liked .like-text {
    color: #FF7E9D;
}

.like-badge-num {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(57, 197, 187, 0.15);
    padding: 3px 10px;
    border-radius: 12px;
    border: none;
}

.like-count {
    font-family: 'Audiowide', monospace;
    font-size: 15px;
    font-weight: 900;
    color: #00687d;
}

.like-sparkle {
    font-size: 12px;
    color: #FF7E9D;
}

.like-btn:hover .like-count,
.like-btn.liked .like-count {
    color: #FF7E9D;
}
</style>