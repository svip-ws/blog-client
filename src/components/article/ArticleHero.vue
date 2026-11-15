<template>
    <div
        ref="heroCardRef"
        class="article-hero-panel glass-miku-card"
        :style="card3DStyle"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
    >
        <!-- 粒子爆炸 Canvas -->
        <canvas ref="particleCanvas" class="particle-canvas"></canvas>

        <!-- 4K 壁纸全息背景遮罩 -->
        <div class="card-holo-bg">
            <img src="/images/miku/miku_wp_1.jpg" class="holo-img" alt="Holo BG" />
            <div class="holo-scanlines"></div>
            <div class="holo-mask"></div>
        </div>

        <!-- 封面图：简洁干净呈现 (缺失或加载失败自动补充初音壁纸) -->
        <div class="cover-simple">
            <el-image 
                :src="displayCover" 
                fit="cover" 
                :preview-src-list="[displayCover]"
                class="detail-cover-img" 
                alt="Article Cover"
                @error="onCoverError"
            />
        </div>

        <!-- 文章头部信息 -->
        <div class="article-header">
            <div class="header-badge-row" v-if="article.category_name">
                <span class="category-badge glow-cyan">
                    <span>{{ article.category_name }}</span>
                </span>
            </div>

            <h1 class="article-title">{{ article.title }}</h1>

            <p class="article-summary" v-if="article.description">
                <span class="summary-icon">♪</span>
                <span>{{ article.description }}</span>
            </p>

            <div class="article-meta-row">
                <div class="meta-author">
                    <div class="avatar-miku-decor">
                        <el-avatar :size="42" :src="article.author_avatar_url" class="author-avatar">
                            {{ article.author_name?.charAt(0) || '初' }}
                        </el-avatar>
                        <span class="mini-decor-badge" title="Miku Cyber Voice">🎧</span>
                    </div>
                    <div class="author-info">
                        <span class="author-name">{{ article.author_name || '初音小帅' }}</span>
                        <span class="publish-time">发布于 {{ formatTime(article.create_time) }}</span>
                    </div>
                </div>

                <div class="meta-stats-row">
                    <span class="stat-capsule">
                        <el-icon><View /></el-icon>
                        <span>{{ article.view_count || 0 }} 浏览</span>
                    </span>
                    <span class="stat-capsule">
                        <el-icon><ChatDotRound /></el-icon>
                        <span>{{ commentCount }} 讨论</span>
                    </span>
                    <span class="stat-capsule" v-if="readTime">
                        <el-icon><Clock /></el-icon>
                        <span>{{ readTime }}</span>
                    </span>
                    <button class="share-card-btn tactile-btn" @click="onShareClick($event)" title="生成拍立得分享名片">
                        <span class="share-icon">📸</span>
                        <span>分享名片</span>
                    </button>
                </div>
            </div>

            <!-- 青绿胶囊态技能标签 -->
            <div class="tag-chips-list" v-if="article.tag_names && article.tag_names.length">
                <span
                    v-for="(tag, idx) in article.tag_names"
                    :key="idx"
                    class="tag-chip tactile-btn"
                >
                    <span>{{ cleanTagName(tag) }}</span>
                </span>
            </div>
        </div>

        <!-- 拍立得分享名片 Modal 弹窗 -->
        <SharePolaroidModal
            v-if="showShareModal"
            :visible="showShareModal"
            :article="article"
            :comment-count="commentCount"
            @close="showShareModal = false"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { View, ChatDotRound, Clock } from '@element-plus/icons-vue';
import SharePolaroidModal from './SharePolaroidModal.vue';
import { getMikuWallpaper } from '../../utils/mikuImage';

const cleanTagName = (name) => String(name || '').replace(/^#+/, '');

const props = defineProps({
    article: {
        type: Object,
        required: true
    },
    commentCount: {
        type: Number,
        default: 0
    }
});

const coverBroken = ref(false);
const onCoverError = () => { coverBroken.value = true; };
const displayCover = computed(() => {
    if (props.article && props.article.cover_url && !coverBroken.value) {
        return props.article.cover_url;
    }
    return getMikuWallpaper(props.article?.id || 1);
});

const heroCardRef = ref(null);
const particleCanvas = ref(null);
const card3DStyle = ref({});
const showShareModal = ref(false);

const mascotSpeech = ref('欢迎阅读本文 ♪');
const mascotQuotes = [
    '静下心来，享受阅读时光 ♪',
    '遇到有启发的观点，欢迎在底部留言讨论',
    '如果觉得内容不错，欢迎点赞支持 ♪',
    '愿这篇文章带给你新的思考与灵感'
];

const triggerMascotTalk = () => {
    const rand = mascotQuotes[Math.floor(Math.random() * mascotQuotes.length)];
    mascotSpeech.value = rand;
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const handleMouseMove = (e) => {
    if (!heroCardRef.value) return;
    const rect = heroCardRef.value.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = (-y / rect.height) * 4;
    const rotateY = (x / rect.width) * 4;

    card3DStyle.value = {
        transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`,
        transition: 'transform 0.1s ease-out'
    };
};

const handleMouseLeave = () => {
    card3DStyle.value = {
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: 'transform 0.5s ease'
    };
};

const onShareClick = (e) => {
    triggerParticleExplosion(e);
    showShareModal.value = true;
};

const triggerParticleExplosion = (e) => {
    const canvas = particleCanvas.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = heroCardRef.value.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const particles = [];
    const colors = ['#39C5BB', '#00F3FF', '#FF7E9D', '#FFFFFF'];

    for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
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

const readTime = computed(() => {
    if (!props.article?.content) return '';
    const text = props.article.content.replace(/<[^>]+>/g, '');
    const words = text.length;
    const minutes = Math.ceil(words / 400);
    return `${minutes} 分钟阅读`;
});
</script>

<style scoped>
.article-hero-panel {
    position: relative;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(228, 248, 245, 0.9) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: none;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 12px 36px rgba(57, 197, 187, 0.18), 0 0 20px rgba(57, 197, 187, 0.1) inset;
    margin-bottom: 24px;
    transform-style: preserve-3d;
}

.particle-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 10;
}

/* 4K 全息壁纸背景 */
.card-holo-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
}

.holo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.12;
    filter: saturate(1.5);
}

.holo-scanlines {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 50%, rgba(57, 197, 187, 0.05) 50%);
    background-size: 100% 4px;
}

.holo-mask {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.8) 0%, rgba(228, 248, 245, 0.95) 70%);
}

.hud-corner {
    position: absolute;
    font-family: monospace;
    font-size: 14px;
    font-weight: 900;
    color: rgba(57, 197, 187, 0.6);
    pointer-events: none;
    z-index: 3;
    line-height: 1;
}
.top-left { top: 6px; left: 8px; }
.top-right { top: 6px; right: 8px; }
.bottom-left { bottom: 6px; left: 8px; }
.bottom-right { bottom: 6px; right: 8px; }

/* Q版初音 Mascot */
.hero-chibi-mascot {
    position: absolute;
    top: 16px;
    right: 20px;
    z-index: 8;
    cursor: pointer;
    display: flex;
    align-items: center;
}

.speech-bubble {
    position: absolute;
    right: 56px;
    top: 6px;
    white-space: nowrap;
    background: linear-gradient(135deg, #0E2926, #1C4D46);
    color: #00F3FF;
    font-size: 11px;
    font-weight: 800;
    padding: 6px 12px;
    border-radius: 14px;
    border: none;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    animation: bubblePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.speech-bubble::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -6px;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 6px solid #1C4D46;
}

.chibi-img {
    width: 52px;
    height: 52px;
    object-fit: contain;
    filter: drop-shadow(0 4px 10px rgba(57, 197, 187, 0.4));
    transition: transform 0.25s ease;
}

.hero-chibi-mascot:hover .chibi-img {
    transform: scale(1.15) rotate(8deg);
}

/* 封面图：自适应排版，干净呈现 */
.cover-simple {
    width: 100%;
    overflow: hidden;
    border-radius: 24px 24px 0 0;
}

.detail-cover-img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
    cursor: zoom-in;
    border: none;
    box-shadow: none;
    border-radius: 0;
    background: #f0faf8;
}

/* 头部内容 */
.article-header {
    padding: 28px 36px 28px;
    position: relative;
    z-index: 2;
}

.header-badge-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
}

.category-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 14px;
    background: linear-gradient(135deg, rgba(57, 197, 187, 0.2), rgba(57, 197, 187, 0.08));
    color: #00687d;
    font-size: 12.5px;
    font-weight: 800;
    border-radius: 50px;
    border: none;
    box-shadow: 0 2px 10px rgba(57, 197, 187, 0.15);
}

.badge-node {
    font-size: 10px;
    color: #FF7E9D;
}

.article-en-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Audiowide', monospace;
    font-size: 10.5px;
    font-weight: 800;
    color: #12A79C;
    letter-spacing: 1px;
}

.cyan-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #39C5BB;
    box-shadow: 0 0 8px #39C5BB;
}

.glowing-node {
    font-size: 11px;
    color: #FF7E9D;
}

.article-title {
    font-size: 28px;
    font-weight: 900;
    color: #0E2926;
    line-height: 1.35;
    margin-bottom: 14px;
    letter-spacing: -0.5px;
}

.article-summary {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: rgba(57, 197, 187, 0.08);
    border: none;
    padding: 12px 18px;
    border-radius: 12px;
    color: #00687d;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 22px;
}

.summary-icon {
    color: #FF7E9D;
    font-size: 15px;
    flex-shrink: 0;
    margin-top: 2px;
}

.article-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(57, 197, 187, 0.25);
}

.meta-author {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar-miku-decor {
    position: relative;
}

.author-avatar {
    border: 2px solid #39C5BB;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.3);
}

.mini-decor-badge {
    position: absolute;
    bottom: -2px;
    right: -4px;
    font-size: 11px;
    background: #0E2926;
    border-radius: 50%;
    padding: 1px;
}

.author-info {
    display: flex;
    flex-direction: column;
}

.author-name {
    font-size: 14.5px;
    font-weight: 800;
    color: #0E2926;
}

.publish-time {
    font-size: 11.5px;
    color: #00687d;
    opacity: 0.85;
}

.meta-stats-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.stat-capsule {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(255, 255, 255, 0.8);
    border: none;
    padding: 5px 12px;
    border-radius: 50px;
    font-size: 12px;
    color: #00687d;
    font-weight: 700;
}

.share-card-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #FF7E9D 0%, #FF527B 100%);
    color: #ffffff;
    border: none;
    padding: 6px 16px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(255, 126, 157, 0.4);
    transition: all 0.25s ease;
}

.share-card-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(255, 126, 157, 0.6);
}

.tag-chips-list {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 18px;
}

.tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: rgba(57, 197, 187, 0.12);
    border: none;
    color: #00687d;
    font-size: 11.5px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.tag-chip:hover {
    background: rgba(57, 197, 187, 0.25);
    color: #12A79C;
    border-color: #39C5BB;
}

.chip-prefix {
    color: #FF7E9D;
    font-weight: 900;
}

@media (max-width: 768px) {
    .article-hero-panel {
        border-radius: 18px;
        margin-bottom: 18px;
        border-width: 1px;
    }
    .article-header {
        padding: 16px;
    }
    .article-title {
        font-size: 20px;
        line-height: 1.4;
        margin-bottom: 10px;
    }
    .article-summary {
        font-size: 13px;
        padding: 10px 12px;
        margin-bottom: 14px;
    }
    .article-meta-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    .meta-stats-row {
        width: 100%;
        flex-wrap: wrap;
        gap: 8px;
    }
    .stat-capsule {
        padding: 4px 10px;
        font-size: 11.5px;
    }
    .share-card-btn {
        margin-left: auto;
        padding: 5px 12px;
        font-size: 11.5px;
    }
    .cover-simple {
        border-radius: 16px 16px 0 0;
    }
    .detail-cover-img {
        max-height: 200px;
        aspect-ratio: 16 / 9;
    }
    .hero-chibi-mascot {
        right: 8px;
        top: 8px;
        transform: scale(0.8);
    }
    .speech-bubble {
        display: none;
    }
}
</style>