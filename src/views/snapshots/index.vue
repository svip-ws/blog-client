<template>
  <div class="snapshot-page" :class="{ 'modal-active': modalVisible }">

    <!-- 背景环境：二次元初音未来壁纸全局背景 + 慢速渐变 + 12 个轻量化 GPU 全息粒子 + 噪点 + 晕影 -->
    <div class="bg-environment" :class="{ paused: modalVisible }">
      <div class="miku-global-bg-artwork"></div>
      <div class="gradient-mesh"></div>
      <div class="vignette-overlay"></div>
      <div class="noise-texture"></div>
      <!-- 超轻量 12 个浮动粒子 (will-change: transform) -->
      <div class="particles-container">
        <div v-for="p in particles" :key="p.id" class="holo-particle" :style="{
          left: p.x + '%',
          top: p.y + '%',
          width: p.size + 'px',
          height: p.size + 'px',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          background: p.color
        }"></div>
      </div>
    </div>

    <!-- ================= 1. HERO 头部看板 (双马尾轮廓 + 漂散光斑 + 赛博音波) ================= -->
    <header class="miku-hero-banner">
      <!-- 专属初音插画背景覆盖层 -->
      <div class="hero-artwork-bg" style="background-image: url('/images/miku/miku_messages_banner.jpg')"></div>

      <!-- 动态飘浮背景与双马尾光影轮廓 -->
      <div class="hero-bg-shapes">
        <div class="hero-circle c1"></div>
        <div class="hero-circle c2"></div>
        <div class="twintail-silhouette-bg">
          <div class="wing left-wing"></div>
          <div class="wing right-wing"></div>
        </div>
        <div class="sound-wave-top">
          <span v-for="n in 18" :key="n" class="wave-bar" :style="{ animationDelay: (n * 0.08) + 's' }"></span>
        </div>
        <span class="hero-music-note n1">♪</span>
        <span class="hero-music-note n2">♫</span>
        <span class="hero-music-note n3">39</span>
      </div>

      <div class="hero-inner">
        <!-- 左侧标题与搜索 -->
        <div class="hero-left-content">
          <h1 class="hero-title">旋律与光影画册</h1>
          <p class="hero-subtitle">
            定格灵感与美好瞬间，收录随拍影像、同人插画与主题壁纸。
          </p>

          <!-- 搜索栏（吸顶 Glassmorphism 样式） -->
          <div class="hero-search-wrapper">
            <div class="glass-search-bar">
              <el-icon class="search-icon">
                <Search />
              </el-icon>
              <input
                type="text"
                v-model="keyword"
                placeholder="搜索壁纸、插画或描述..."
                class="search-input"
                @keyup.enter="handleSearch"
              />
              <button class="search-btn tactile-btn shine-effect" @click="handleSearch">
                <span>搜索</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧统计面板 -->
        <div class="hero-cyber-panel">
          <div class="cyber-panel-hud">
            <div class="hud-top-line">
              <span class="miku-status-dot"></span>
              <span class="miku-status-text">光影画册统计</span>
            </div>
            <div class="miku-headphone-icon-wrap">
              <span class="miku-sub-note">共收录 <strong>{{ totalCount }}</strong> 份影像作品</span>
            </div>
            <div class="hud-bottom-info">
              <span>当前分类：{{ activeCategory }}</span>
              <span>{{ activeSort === 'newest' ? '最新发布' : '默认排序' }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 3. 悬浮展柜卡片区与筛选栏 -->
    <div class="gallery-container" ref="galleryRef">
      <div class="filter-glass-bar">
        <div class="filter-left-section">
          <div class="miku-tag-badge">
            <span class="miku-sub">分类</span>
          </div>

          <div class="filter-categories" @wheel.passive="handleCategoriesWheel">
            <button v-for="cat in categories" :key="cat" class="cat-chip tactile-btn"
              :class="{ active: activeCategory === cat }" @click="handleCategoryChange(cat)">
              <span class="chip-glow"></span>
              <span class="cat-label">{{ cat }}</span>
            </button>
          </div>
        </div>

        <div class="filter-right">
          <!-- 数字统计 -->
          <div class="stats-badge miku-data-chip">
            <span class="stats-text" v-if="keyword">
              搜索「{{ keyword }}」找到 <strong class="counter-num">{{ displayedTotalCount }}</strong> 张
            </span>
            <span class="stats-text" v-else>
              共收录 <strong class="counter-num">{{ displayedTotalCount }}</strong> 张<span class="stats-text-extra">画册作品</span>
            </span>
          </div>

          <el-select v-model="activeSort" size="small" class="holo-sort-select" @change="handleSortChange">
            <el-option label="默认排序" value="default" />
            <el-option label="最新发布" value="newest" />
          </el-select>
        </div>
      </div>

      <!-- 全息分割线 -->
      <div class="holo-divider"></div>

      <!-- 骨架屏 -->
      <div v-if="loading" class="cards-vault-grid">
        <div v-for="i in 8" :key="i" class="vault-card-skeleton">
          <div class="skeleton-shimmer"></div>
        </div>
      </div>

      <!-- 全息空状态 Empty State -->
      <div v-else-if="cardList.length === 0" class="holo-empty-state">
        <div class="empty-icon-wrapper">
          <div class="empty-ring"></div>
          <span class="empty-icon">♪</span>
        </div>
        <h3 class="empty-title">未捕捉到匹配的初音卡片</h3>
        <p class="empty-desc">尝试更换搜索关键词或选择其他分类标签</p>
        <button class="reset-filter-btn tactile-btn" @click="resetFilters">重置筛选条件</button>
      </div>

      <!-- Floating Vault 3D 卡片网格 (4列自适应真瀑布流) -->
      <div v-else class="cards-vault-grid">
        <div v-for="(card, index) in cardList" :key="card.id" class="vault-card-item"
          :class="[getCategoryClass(card.category), { 'is-revealed': revealedIds.has(card.id) }]"
          :style="{ '--stagger-delay': (index % 12) * 0.06 + 's' }" :data-card-id="card.id"
          @mouseenter="onCardMouseEnter($event, card)" @mousemove="onCardMouseMove($event, card)"
          @mouseleave="onCardMouseLeave($event, card)" @click="openModal(card)">
          <!-- 悬浮光芒边框线 -->
          <div class="card-halo"></div>

          <!-- 3D 卡牌主框体 -->
          <div class="card-frame" :ref="(el) => (cardRefs[card.id] = el)">
            <!-- 初音双马尾 / 音符挂件装饰 -->
            <div class="card-mini-twintail">{{ getMikuThemeIcon(index) }}</div>

            <!-- 封面图 (纯享无镭射滤镜，真实还原上传图片) -->
            <div class="card-cover-container">
              <img v-lazy.unload="getMikuCardCover(card, index)" class="card-cover-img" alt="Snapshot Cover"
                @error="handleImgError" />
              <div class="hover-inspect-badge">
                <span class="inspect-icon">✦</span>
                <span>3D 旋转赏析</span>
              </div>
            </div>

            <!-- 卡片文本描述区 -->
            <div class="card-meta-box">
              <div class="meta-top">
                <span class="cat-name">♪ {{ card.category }}</span>
                <span class="pub-date">{{ formatCardDate(card.create_time) }}</span>
              </div>
              <h3 class="card-title">{{ card.name }}</h3>
              <p class="card-excerpt">{{ card.description }}</p>
            </div>
          </div>

        </div>
      </div>

      <!-- 分页控制 -->
      <div class="pagination-vault" v-if="totalCount > pageSize">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next" :total="totalCount" @size-change="handleSizeChange"
          @current-change="handlePageChange" />
      </div>
    </div>

    <!-- 5. 无框纯享 3D 悬浮空间 (Open Space Viewport - NO BOX / NO FRAME) -->
    <teleport to="body">
      <transition name="open-space-fade">
        <div class="open-space-viewport" v-if="modalVisible && selectedCard" @wheel="handleWheel"
          @pointerdown="handlePointerDown" @pointermove="handlePointerMove" @pointerup="handlePointerUp"
          @pointercancel="handlePointerUp">
          <!-- 右上角固定悬浮退出按钮 -->
          <button class="top-exit-btn tactile-btn" @click="closeModal" title="退出 3D 鉴赏 (Esc)">
            <span class="exit-icon">✕</span>
            <span class="exit-text">退出</span>
          </button>

          <!-- 强化版全息深邃背景氛围 -->
          <div class="space-ambient-bg"></div>

          <!-- 3D 悬浮卡牌本体 (No Container / No Frame Around It) -->
          <div ref="standaloneCardRef" class="standalone-3d-card" :class="{ 'is-flipped': isFlipped }">

            <!-- 纯正卡片正面 (Clean Front Face: Pure Artwork) -->
            <div class="card-face front-face">
              <img :src="selectedCard.cover_url || selectedCard.cover || selectedCard.images?.[0]" class="face-cover-img" alt="Card Artwork" />
            </div>

            <!-- 卡片背面 (仅保留标题和描述) -->
            <div class="card-face back-face">
              <div class="back-card-body clean-back">
                <!-- 标题 -->
                <h2 class="back-title-shimmer">{{ selectedCard.name }}</h2>

                <!-- 描述故事文本 -->
                <p class="back-story-text">
                  {{ selectedCard.description || '暂无详细故事描述。' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { useSnapshotGallery } from '../../composables/useSnapshotGallery';
import { useCardViewport } from '../../composables/useCardViewport';

// 背景 12 个全息浮动粒子（纯展示数据）
const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 2,
  delay: Math.random() * 4,
  duration: Math.random() * 10 + 10,
  color: `hsla(${Math.floor(Math.random() * 360)}, 85%, 70%, ${Math.random() * 0.4 + 0.3})`
}));

// 画廊容器（模板锚点）
const galleryRef = ref(null);

const {
  loading, cardList, categories, activeCategory, keyword, activeSort,
  currentPage, pageSize, totalCount, displayedTotalCount,
  cardRefs, revealedIds,
  fetchCards, fetchCategories,
  handleCategoryChange, handleSearch, handleSortChange, resetFilters,
  handlePageChange, handleSizeChange,
  onCardMouseEnter, onCardMouseMove, onCardMouseLeave,
  getMikuCardCover, getMikuThemeIcon, getCategoryClass,
  formatCardDate, handleImgError,
} = useSnapshotGallery();

const {
  modalVisible, showControlBar, selectedCard, isFlipped,
  standaloneCardRef,
  openModal: openViewport, closeModal, toggleFlip, resetView,
  handleWheel, handlePointerDown, handlePointerMove, handlePointerUp,
} = useCardViewport();

// 画廊卡片点击 → 打开沉浸式查看器
const openModal = (card) => openViewport(card);

// 分类芯片横向滚轮滚动
const handleCategoriesWheel = (e) => {
  const el = e.currentTarget;
  if (!el || el.scrollWidth <= el.clientWidth) return;
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    el.scrollLeft += e.deltaY;
  }
};

// 初始加载：分类 + 卡片列表
onMounted(() => {
  fetchCategories();
  fetchCards();
});
</script>
<style scoped>
/* ================= 全局 MIKU TEAL 极奢 3D 页面容器 ================= */
.snapshot-page {
  position: relative;
  min-height: 100vh;
  background: #EAF9F8;
  color: #14322F;
  font-family: -apple-system, BlinkMacSystemFont, "Outfit", "PingFang SC", sans-serif;
  overflow-x: hidden;
  padding-bottom: 80px;
}

/* 按钮微弹力触觉反馈 (Tactile Spring Feedback) */
.tactile-btn {
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background 0.2s ease !important;
}

.tactile-btn:active {
  transform: scale(0.93) translate3d(0, 1px, 0) !important;
}

/* ================= 2. 背景环境：慢速渐变 + 粒子 + 噪点 ================= */
.bg-environment {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-environment.paused .gradient-mesh,
.bg-environment.paused .holo-particle {
  animation-play-state: paused !important;
}

.miku-global-bg-artwork {
  position: absolute;
  inset: 0;
  background-image: url('/images/miku/miku_room_bg.jpg');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  opacity: 0.45;
  filter: saturate(1.15) contrast(1.05);
}

.gradient-mesh {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle at 10% 10%, rgba(57, 197, 187, 0.28) 0%, transparent 55%),
    radial-gradient(circle at 90% 85%, rgba(255, 126, 157, 0.20) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(234, 249, 248, 0.72) 0%, rgba(220, 245, 242, 0.82) 100%);
  backdrop-filter: blur(6px);
  animation: meshDrift 20s ease-in-out infinite alternate;
}

@keyframes meshDrift {
  0% {
    transform: scale(1) translate(0, 0);
  }

  100% {
    transform: scale(1.08) translate(-2%, 2%);
  }
}

.vignette-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, transparent 50%, rgba(18, 42, 40, 0.08) 100%);
}

.noise-texture {
  position: absolute;
  inset: 0;
  opacity: 0.02;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

.particles-container {
  position: absolute;
  inset: 0;
}

.holo-particle {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
  animation: floatUp 14s linear infinite;
}

@keyframes floatUp {
  0% {
    transform: translate3d(0, 100vh, 0) scale(0.6);
    opacity: 0;
  }

  20% {
    opacity: 0.8;
  }

  80% {
    opacity: 0.8;
  }

  100% {
    transform: translate3d(0, -20vh, 0) scale(1.2);
    opacity: 0;
  }
}

/* ================= 头部 Miku Cyber Hero 看板 ================= */
.miku-hero-banner {
  position: relative;
  padding: var(--navbar-clearance) 24px 64px;
  background: linear-gradient(135deg, #12A79C 0%, #39C5BB 60%, #4ECDC4 100%);
  color: #ffffff;
  overflow: hidden;
  border-bottom: 2px solid rgba(57, 197, 187, 0.4);
  box-shadow: 0 10px 30px rgba(18, 167, 156, 0.2);
}

.hero-artwork-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center right;
  opacity: 0.22;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.hero-bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
}

.hero-circle.c1 { width: 240px; height: 240px; top: -60px; right: 15%; }
.hero-circle.c2 { width: 380px; height: 380px; bottom: -160px; right: -80px; }

.twintail-silhouette-bg {
  position: absolute;
  top: 10px;
  right: 180px;
  width: 200px;
  height: 120px;
  opacity: 0.15;
  pointer-events: none;
}

.twintail-silhouette-bg .wing {
  position: absolute;
  width: 70px;
  height: 120px;
  border-radius: 50px 50px 0 50px;
  background: #ffffff;
}

.twintail-silhouette-bg .left-wing { left: 10px; transform: rotate(-30deg); }
.twintail-silhouette-bg .right-wing { right: 10px; transform: rotate(30deg) scaleX(-1); }

.sound-wave-top {
  position: absolute;
  top: 24px;
  right: 60px;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 24px;
  opacity: 0.85;
}

.wave-bar {
  width: 3px;
  height: 100%;
  background: #ffffff;
  border-radius: 2px;
  animation: topWavePulse 1.2s ease-in-out infinite alternate;
}

@keyframes topWavePulse {
  0% { height: 20%; opacity: 0.3; }
  100% { height: 100%; opacity: 1; background: #FF7E9D; }
}

.hero-music-note {
  position: absolute;
  font-size: 26px;
  color: rgba(255, 255, 255, 0.7);
  animation: noteFloat 4s ease-in-out infinite;
}

.n1 { top: 25%; right: 24%; animation-delay: 0s; }
.n2 { top: 60%; right: 28%; animation-delay: 1.5s; color: #FF7E9D; }
.n3 { top: 15%; right: 35%; animation-delay: 0.8s; font-family: monospace; font-weight: 900; }

@keyframes noteFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.1); }
}

.hero-inner {
  max-width: 1280px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
}

.hero-left-content {
  flex: 1;
  max-width: 760px;
}

.hero-badge {
  margin-bottom: 14px;
}

.badge-tag {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #ffffff;
}

.hero-title {
  font-size: clamp(30px, 4.5vw, 46px);
  font-weight: 900;
  margin: 0 0 14px;
  letter-spacing: 0.5px;
  color: #ffffff;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.hero-subtitle {
  font-size: clamp(14px, 1.8vw, 16px);
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.7;
  margin: 0 0 24px;
}

.hero-cyber-panel {
  width: 300px;
  flex-shrink: 0;
}

.cyber-panel-hud {
  padding: 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.hud-top-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.miku-badge-code {
  font-family: monospace;
  font-size: 12px;
  font-weight: 800;
  color: #ffffff;
  background: rgba(255, 126, 157, 0.4);
  padding: 2px 8px;
  border-radius: 6px;
}

.miku-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FF7E9D;
  box-shadow: 0 0 10px #FF7E9D;
}

.miku-status-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.9);
}

.miku-headphone-icon-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 24px;
}

.miku-sub-note {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.9);
}

.miku-visual-equalizer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 36px;
  margin-bottom: 14px;
  padding: 0 2px;
}

.eq-bar {
  width: 3.5px;
  background: linear-gradient(180deg, #FF7E9D 0%, #ffffff 100%);
  border-radius: 4px;
  animation: hudEqPulse 1.4s ease-in-out infinite alternate;
}

@keyframes hudEqPulse {
  0% { height: 15%; opacity: 0.4; }
  100% { height: 100%; opacity: 1; }
}

.hud-bottom-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  border-top: 1px dashed rgba(255, 255, 255, 0.25);
  padding-top: 10px;
}

@media (max-width: 900px) {
  .hero-inner { flex-direction: column; align-items: flex-start; }
  .hero-cyber-panel { display: none; }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 30px;
  }
}

.hero-desc {
  font-size: 15px;
  color: #4B6B66;
  margin-bottom: 28px;
  line-height: 1.6;
}

/* 吸顶玻璃搜索栏 */
.hero-search-wrapper {
  max-width: 540px;
  margin: 0 auto;
}

.glass-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px 6px 18px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: none;
  box-shadow: 0 8px 32px rgba(8, 90, 87, 0.1);
}

.glass-search-bar:focus-within {
  box-shadow: 0 0 22px rgba(57, 197, 187, 0.3);
}

.search-icon {
  font-size: 18px;
  color: #12A79C;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #14322F;
  font-size: 14px;
  font-weight: 500;
  outline: none;
}

.search-input::placeholder {
  color: #5C837F;
}

.search-btn {
  padding: 8px 22px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, #39C5BB 0%, #12A79C 100%);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(57, 197, 187, 0.35);
}

.search-btn:hover {
  background: linear-gradient(135deg, #12A79C 0%, #0F8A81 100%);
  box-shadow: 0 6px 18px rgba(57, 197, 187, 0.5);
}

/* ================= 3. FLOATING VAULT 3D 卡片网格区 ================= */
.gallery-container {
  position: relative;
  z-index: 2;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ================= MIKU CYBER FILTER GLASS BAR ================= */
.filter-glass-bar {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 16px;
  margin: 24px 0 20px;
  padding: 12px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: none;
  box-shadow: 
    0 12px 32px rgba(57, 197, 187, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.filter-glass-bar:hover {
  box-shadow: 
    0 16px 40px rgba(57, 197, 187, 0.18),
    0 0 20px rgba(255, 126, 157, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

/* 顶置 Miku 霓虹发光线条与 HUD 装饰 */
.filter-bar-hud-accent {
  position: absolute;
  inset: 0;
  pointer-events: none;
}


.hud-corner {
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: #39C5BB;
  border-style: solid;
  opacity: 0.65;
}

.hud-tl { top: 3px; left: 3px; border-width: 2px 0 0 2px; border-top-left-radius: 4px; }
.hud-tr { top: 3px; right: 3px; border-width: 2px 2px 0 0; border-top-right-radius: 4px; }
.hud-bl { bottom: 3px; left: 3px; border-width: 0 0 2px 2px; border-bottom-left-radius: 4px; }
.hud-br { bottom: 3px; right: 3px; border-width: 0 2px 2px 0; border-bottom-right-radius: 4px; }

/* 左侧区域：39 徽章与分类芯片（单行自适应） */
.filter-left-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  flex: 1;
  min-width: 0;
}

.miku-tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(57, 197, 187, 0.1);
  border: 1px solid rgba(57, 197, 187, 0.35);
  font-family: monospace, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  box-shadow: inset 0 0 8px rgba(57, 197, 187, 0.15);
  flex-shrink: 0;
}

.miku-code {
  color: #12A79C;
  font-size: 12px;
}

.miku-divider {
  color: rgba(57, 197, 187, 0.4);
}

.miku-sub {
  color: #39C5BB;
}

.filter-categories {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  flex: 1;
  min-width: 0;
  padding: 3px 0;
}

.filter-categories::-webkit-scrollbar {
  display: none;
}

.cat-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(57, 197, 187, 0.25);
  color: #285450;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  white-space: nowrap;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.cat-chip:hover {
  color: #12A79C;
  background: #E3F7F4;
  border-color: rgba(57, 197, 187, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(57, 197, 187, 0.2);
}

.cat-chip.active {
  color: #ffffff;
  background: linear-gradient(135deg, #39C5BB 0%, #12A79C 100%);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 
    0 4px 16px rgba(57, 197, 187, 0.45),
    0 0 12px rgba(255, 126, 157, 0.25);
  font-weight: 800;
  transform: translateY(-1px);
}

.chip-active-sparkle {
  font-size: 12px;
  color: #FFEAEF;
  margin-left: 2px;
  animation: mikuNoteBounce 1.2s ease-in-out infinite alternate;
}

@keyframes mikuNoteBounce {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(-2px) scale(1.15); }
}

/* 右侧：统计芯片与排序下拉（固定靠右单行展示） */
.filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.miku-data-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 16px;
  background: rgba(227, 247, 244, 0.75);
  border: 1px solid rgba(57, 197, 187, 0.3);
  font-size: 13px;
  color: #4B6B66;
  white-space: nowrap;
  flex-shrink: 0;
}

@media (max-width: 1120px) {
  .stats-text-extra {
    display: none;
  }
}

.pulse-equalizer {
  display: flex;
  align-items: flex-end;
  gap: 2.5px;
  height: 12px;
}

.pulse-equalizer span {
  width: 2.5px;
  background: #39C5BB;
  border-radius: 2px;
  animation: eqPulse 1.2s ease-in-out infinite alternate;
}

.pulse-equalizer span:nth-child(1) { height: 40%; animation-delay: 0s; }
.pulse-equalizer span:nth-child(2) { height: 90%; animation-delay: 0.3s; background: #FF7E9D; }
.pulse-equalizer span:nth-child(3) { height: 60%; animation-delay: 0.6s; }

@keyframes eqPulse {
  0% { height: 20%; }
  100% { height: 100%; }
}

.counter-num {
  color: #12A79C;
  font-weight: 800;
  font-size: 15px;
}

.holo-sort-select {
  width: 110px;
  flex-shrink: 0;
}

.holo-sort-select :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 16px !important;
  border: 1px solid rgba(57, 197, 187, 0.35) !important;
  box-shadow: 0 2px 8px rgba(57, 197, 187, 0.1) !important;
  transition: all 0.25s ease;
}

.holo-sort-select :deep(.el-input__wrapper.is-focus),
.holo-sort-select :deep(.el-input__wrapper:hover) {
  border-color: #39C5BB !important;
  box-shadow: 0 0 14px rgba(57, 197, 187, 0.3) !important;
}

.holo-sort-select :deep(.el-input__inner) {
  color: #14322F !important;
  font-weight: 600 !important;
  font-size: 13px !important;
}

.holo-divider {
  height: 1px;
  width: 100%;
  background: linear-gradient(90deg, transparent, rgba(57, 197, 187, 0.4), rgba(255, 126, 157, 0.3), transparent);
  margin: 16px 0 28px;
}

/* 4列自适应 CSS Grid 网格布局 */
.cards-vault-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1200px) {
  .cards-vault-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

@media (max-width: 850px) {
  .cards-vault-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 540px) {
  .cards-vault-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.vault-card-skeleton {
  height: 340px;
  border-radius: 20px;
  background: rgba(227, 247, 244, 0.6);
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
  break-inside: avoid;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: skeletonSweep 1.5s infinite;
}

@keyframes skeletonSweep {
  0% {
    transform: translate3d(-100%, 0, 0);
  }

  100% {
    transform: translate3d(100%, 0, 0);
  }
}

/* 空状态 */
.holo-empty-state {
  padding: 60px 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  border: 1px dashed rgba(57, 197, 187, 0.3);
  margin: 20px 0;
}

.empty-icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px dashed rgba(57, 197, 187, 0.4);
  animation: rotateCursor 10s linear infinite;
}

.empty-icon {
  font-size: 36px;
}

.empty-title {
  font-size: 18px;
  color: #00687d !important;
  font-weight: 800;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #00687d !important;
  opacity: 0.85;
  margin-bottom: 20px;
}

.reset-filter-btn {
  padding: 8px 20px;
  border-radius: 20px;
  background: #E3F7F4;
  border: 1px solid rgba(57, 197, 187, 0.35);
  color: #12A79C;
  font-weight: 700;
  cursor: pointer;
}

/* 3D 卡片主结构 (CSS Grid 网格卡片) */
.vault-card-item {
  position: relative;
  border-radius: 20px;
  cursor: pointer;
  opacity: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  transform: translate3d(0, 30px, 0) scale(0.95);
  transition: opacity 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation-delay: var(--stagger-delay);
}

.vault-card-item.is-revealed {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

/* 分类专属 Glow Shadow */
.vault-card-item.cat-cyber {
  --card-glow: rgba(57, 197, 187, 0.35);
}

.vault-card-item.cat-anime {
  --card-glow: rgba(255, 126, 157, 0.35);
}

.vault-card-item.cat-scenery {
  --card-glow: rgba(45, 212, 191, 0.35);
}

.vault-card-item.cat-portrait {
  --card-glow: rgba(52, 211, 153, 0.35);
}

.vault-card-item.cat-default {
  --card-glow: rgba(57, 197, 187, 0.3);
}

.card-frame {
  position: relative;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  border: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 12px 32px rgba(8, 90, 87, 0.08), 0 0 22px var(--card-glow);
  transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-style: preserve-3d;
  will-change: transform;
}

.card-mini-twintail {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 6;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(14, 41, 38, 0.58);
  border: none;
  font-size: 13px;
  color: #ffffff;
  backdrop-filter: blur(6px);
  transition: transform 0.3s ease, background 0.3s ease;
}

.vault-card-item:hover .card-mini-twintail {
  transform: scale(1.25) rotate(15deg);
  color: #FF7E9D;
}

.card-badges {
  position: absolute;
  top: 12px;
  left: 32px;
  z-index: 5;
  display: flex;
  gap: 6px;
}

.card-no-tag {
  padding: 3px 8px;
  border-radius: 10px;
  background: rgba(20, 50, 47, 0.85);
  color: #39C5BB;
  font-family: monospace;
  font-size: 11px;
  font-weight: 800;
  border: none;
}

.preset-pill {
  padding: 3px 8px;
  border-radius: 10px;
  background: #E3F7F4;
  color: #12A79C;
  font-size: 11px;
  font-weight: 700;
  border: none;
}

.card-like-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: none;
  box-shadow: 0 4px 12px rgba(8, 90, 87, 0.14);
  color: #8BA8A5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-like-btn:hover {
  background: #E3F7F4;
  color: #FF7E9D;
}

.heart-svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.card-like-btn.is-liked {
  color: #FF7E9D;
  background: rgba(255, 240, 245, 0.95);
  box-shadow: 0 4px 14px rgba(255, 126, 157, 0.3);
}

/* 主图与全息反射 */
.card-cover-container {
  position: relative;
  height: 240px;
  overflow: hidden;
}

.card-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.vault-card-item:hover .card-cover-img {
  transform: scale(1.05);
}

.dynamic-holo-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 0, 128, 0.15) 30%, rgba(0, 240, 255, 0.15) 70%, rgba(255, 255, 255, 0) 100%);
  mix-blend-mode: color-dodge;
  opacity: 0.3;
  pointer-events: none;
  transition: opacity 0.3s;
}

.vault-card-item:hover .dynamic-holo-sheen {
  opacity: 0.8;
}

.hover-inspect-badge {
  position: absolute;
  inset: 0;
  background: rgba(4, 6, 12, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.25s;
}

.vault-card-item:hover .hover-inspect-badge {
  opacity: 1;
}

.card-meta-box {
  padding: 16px;
}

.meta-top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #00687d !important;
  margin-bottom: 6px;
}

.cat-name {
  color: #12A79C !important;
  font-weight: 800;
}

.pub-date {
  color: #00687d !important;
  opacity: 0.8;
  font-weight: 700;
}

.card-title {
  font-size: 16.5px;
  font-weight: 900;
  color: #00687d !important;
  margin-bottom: 6px;
  transition: color 0.2s;
}

.vault-card-item:hover .card-title {
  color: #12A79C !important;
}

.card-excerpt {
  font-size: 13px;
  color: #00687d !important;
  opacity: 0.85;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
  margin-bottom: 12px;
}

.meta-footer {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: #8BA8A5;
}

.pagination-vault {
  margin-top: 48px;
  display: flex;
  justify-content: center;
}

/* ================= 5. 无框纯享 3D 悬浮空间 (Open Space Viewport - NO BOX / NO FRAME) ================= */
.open-space-viewport {
  position: fixed;
  inset: 0;
  z-index: 10000;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
}

/* 右上角固定悬浮退出按钮 */
.top-exit-btn {
  position: absolute;
  top: 24px;
  right: 32px;
  z-index: 120;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 30px;
  background: rgba(20, 50, 47, 0.85);
  border: 1px solid rgba(57, 197, 187, 0.35);
  backdrop-filter: blur(16px);
  color: #EAF9F8;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 15px rgba(57, 197, 187, 0.3);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.top-exit-btn:hover {
  background: rgba(255, 126, 157, 0.9);
  border-color: rgba(255, 126, 157, 0.6);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 12px 30px rgba(255, 126, 157, 0.45), 0 0 20px rgba(255, 126, 157, 0.6);
  color: #ffffff;
}

.top-exit-btn .exit-icon {
  font-size: 16px;
  line-height: 1;
  font-weight: bold;
}


.space-ambient-bg {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(135deg, rgba(7, 28, 30, 0.65) 0%, rgba(20, 50, 47, 0.75) 100%), url('/images/miku/miku_modal_bg.jpg');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: none;
}

/* 地面放射状发光 (Floor Glow) */
.floor-glow-radial {
  position: absolute;
  bottom: -10%;
  left: 50%;
  transform: translateX(-50%);
  width: 750px;
  height: 350px;
  border-radius: 50%;
  pointer-events: none;
  transition: background 0.6s ease;
  filter: blur(40px);
  opacity: 0.85;
}

/* 围绕卡片的微弱环形彩虹光线 (Ambient Light Rays) */
.ambient-light-rays {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0%, rgba(57, 197, 187, 0.2) 20%, rgba(255, 126, 157, 0.2) 40%, rgba(57, 197, 187, 0.2) 60%, transparent 80%);
  animation: rotateLightRays 18s linear infinite;
  pointer-events: none;
  filter: blur(10px);
}

@keyframes rotateLightRays {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 90度翻动 Lens Flare 闪光 */
.midpoint-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, #ffffff 0%, rgba(57, 197, 187, 0.85) 50%, transparent 100%);
  z-index: 15;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.midpoint-flash.active {
  opacity: 0.95;
}

/* 3D 悬浮卡牌本体 (Standalone Floating 3D Card) */
.standalone-3d-card {
  position: relative;
  width: 310px;
  height: 440px;
  z-index: 5;
  transform-style: preserve-3d;
  cursor: grab;
  user-select: none;
  will-change: transform;
}

.standalone-3d-card:active {
  cursor: grabbing;
}

@media (max-width: 640px) {
  .standalone-3d-card {
    width: 270px;
    height: 380px;
  }
}

.card-face {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  overflow: hidden;
  backface-visibility: hidden;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.6), 0 0 35px rgba(57, 197, 187, 0.35);
}

.front-face {
  background: #14322F;
}

.face-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.corner-badge-no {
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(20, 50, 47, 0.88);
  color: #39C5BB;
  padding: 4px 10px;
  border-radius: 10px;
  font-family: monospace;
  font-size: 12px;
  font-weight: 800;
  border: 1px solid rgba(57, 197, 187, 0.4);
}

.corner-badge-preset {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 126, 157, 0.88);
  color: #fff;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
}

.holo-sheen-overlay {
  position: absolute;
  inset: 0;
  mix-blend-mode: color-dodge;
  pointer-events: none;
  transition: background 0.5s ease, opacity 0.3s ease;
}

.sparkle-dust-layer {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.7) 1px, transparent 0);
  background-size: 16px 16px;
  opacity: 0.15;
  pointer-events: none;
}

/* 背面设计 (Back Face Content & Typography) */
.back-face {
  background: #0D2624;
  transform: rotateY(180deg);
  padding: 24px;
}

.back-holo-pattern {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(57, 197, 187, 0.25) 0%, transparent 75%);
  opacity: 0.8;
}

.back-card-body {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.back-card-body.clean-back {
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 24px;
  gap: 24px;
  box-sizing: border-box;
}

.back-card-body.clean-back .back-title-shimmer {
  font-size: 22px;
  font-weight: 900;
  margin: 0;
  line-height: 1.4;
}

.back-card-body.clean-back .back-story-text {
  font-size: 13px;
  color: #EAF9F8;
  line-height: 1.75;
  text-align: center;
  background: rgba(255, 255, 255, 0.06);
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid rgba(57, 197, 187, 0.2);
  max-height: 240px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
}


.back-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.auth-seal {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #FF7E9D;
}

.card-tag-pill {
  font-size: 11px;
  color: #39C5BB;
  font-family: monospace;
  background: rgba(57, 197, 187, 0.15);
  padding: 2px 8px;
  border-radius: 8px;
}

.back-title-shimmer {
  font-size: 20px;
  font-weight: 900;
  text-align: center;
  margin: 8px 0;
  background: linear-gradient(90deg, #ffffff, #FF7E9D, #39C5BB, #ffffff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textShimmer 4s linear infinite;
}

@keyframes textShimmer {
  to {
    background-position: 200% center;
  }
}

.back-story-text {
  font-size: 12px;
  color: #EAF9F8;
  line-height: 1.6;
  text-align: left;
  background: rgba(255, 255, 255, 0.05);
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(57, 197, 187, 0.15);
  max-height: 100px;
  overflow-y: auto;
}

.back-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 11px;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-item .lbl {
  color: #8BA8A5;
  font-size: 10px;
}

.meta-item .val {
  color: #EAF9F8;
  font-weight: 600;
}

.back-actions-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.back-like-btn,
.back-share-btn,
.back-flip-btn {
  position: relative;
  flex: 1;
  padding: 8px 4px;
  border-radius: 10px;
  border: none;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.back-like-btn {
  background: rgba(255, 126, 157, 0.2);
  color: #FF7E9D;
}

.back-like-btn.is-liked {
  background: #FF7E9D;
  color: #fff;
}

.back-share-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.back-flip-btn {
  background: rgba(57, 197, 187, 0.2);
  color: #39C5BB;
}

.back-footer-auth {
  text-align: center;
  font-size: 9px;
  color: #8BA8A5;
  font-family: monospace;
}

@media (max-width: 640px) {
  .swatch-title,
  .slider-title {
    display: none;
  }
}

@keyframes floatControlBar {
  0% {
    transform: translate3d(-50%, 0, 0);
  }

  100% {
    transform: translate3d(-50%, -4px, 0);
  }
}

.bar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #EAF9F8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.bar-btn:hover {
  background: rgba(57, 197, 187, 0.2);
  color: #fff;
  border-color: rgba(57, 197, 187, 0.5);
}

.bar-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
}

/* Glow Swatches Group */
.mode-swatches-group {
  display: flex;
  gap: 6px;
}

.swatch-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #8BA8A5;
  font-size: 11px;
  cursor: pointer;
}

.swatch-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.swatch-pill.active {
  background: rgba(57, 197, 187, 0.2);
  border-color: #39C5BB;
  color: #fff;
  box-shadow: 0 0 10px rgba(57, 197, 187, 0.4);
}

/* Slider Group */
.slider-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #8BA8A5;
}

.slider-track-wrap {
  width: 80px;
  display: flex;
  align-items: center;
}

.bar-range-input {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  accent-color: #39C5BB;
  background: linear-gradient(90deg, #14322F, #39C5BB, #FF7E9D);
  cursor: pointer;
}

.slider-num {
  font-size: 11px;
  color: #39C5BB;
  font-weight: 800;
  font-family: monospace;
}

/* Spark burst animation */
.spark-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.spark-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f87171;
  animation: sparkFly 0.5s ease-out forwards;
}

@keyframes sparkFly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }

  100% {
    transform: translate(calc(cos(var(--spark-idx) * 60deg) * 35px), calc(sin(var(--spark-idx) * 60deg) * 35px)) scale(0);
    opacity: 0;
  }
}

/* Vue Transitions */
.open-space-fade-enter-active,
.open-space-fade-leave-active {
  transition: opacity 0.35s ease;
}

.open-space-fade-enter-from,
.open-space-fade-leave-to {
  opacity: 0;
}


/* ================= 移动端特别适配 (Snapshots Mobile Special Adaptations) ================= */
@media (max-width: 768px) {
  .miku-hero-banner {
    padding: calc(var(--navbar-clearance, 64px) + 8px) 16px 28px;
    border-bottom-width: 1px;
  }

  .hero-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .hero-left-content {
    max-width: 100%;
  }

  .hero-title {
    font-size: 24px;
    line-height: 1.3;
    margin-bottom: 8px;
  }

  .hero-subtitle {
    font-size: 12.5px;
    line-height: 1.5;
    margin-bottom: 16px;
    opacity: 0.9;
  }

  .badge-tag {
    font-size: 10px;
    padding: 3px 10px;
    letter-spacing: 1px;
  }

  .hero-search-wrapper {
    max-width: 100%;
  }

  .glass-search-bar {
    padding: 4px 6px 4px 14px;
    border-radius: 24px;
  }

  .search-input {
    font-size: 13px;
  }

  .search-btn {
    padding: 6px 14px;
    font-size: 12px;
    border-radius: 18px;
  }

  .hero-circle,
  .twintail-silhouette-bg,
  .sound-wave-top,
  .hero-music-note,
  .hero-cyber-panel {
    display: none !important;
  }

  .gallery-container {
    padding: 0 10px;
  }

  /* 筛选栏移动端自适应（单行可滑动芯片） */
  .filter-glass-bar {
    margin: 14px 0 14px;
    padding: 10px 12px;
    border-radius: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .filter-left-section {
    width: 100%;
    gap: 8px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 2px;
  }

  .filter-left-section::-webkit-scrollbar {
    display: none;
  }

  .miku-tag-badge {
    flex-shrink: 0;
    padding: 3px 8px;
    font-size: 10px;
  }

  .filter-categories {
    flex-wrap: nowrap;
    gap: 6px;
    flex-shrink: 0;
  }

  .cat-chip {
    flex-shrink: 0;
    padding: 5px 12px;
    font-size: 12px;
    white-space: nowrap;
  }

  .filter-right {
    width: 100%;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .miku-data-chip {
    padding: 4px 10px;
    font-size: 11.5px;
  }

  .holo-sort-select {
    width: 105px;
  }

  .holo-sort-select :deep(.el-input__wrapper) {
    padding: 1px 8px !important;
  }

  .holo-divider {
    margin: 12px 0 16px;
  }

  /* 相册 3D 网格 2 列高密分布 */
  .cards-vault-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
  }

  .card-cover-container {
    height: 150px;
  }

  .card-meta-box {
    padding: 10px;
  }

  .card-title {
    font-size: 13.5px;
    line-height: 1.35;
    margin-bottom: 3px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-excerpt {
    font-size: 11px;
    line-height: 1.4;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta-top {
    font-size: 10px;
    margin-bottom: 3px;
  }

  .card-mini-twintail {
    top: 6px;
    left: 8px;
    font-size: 12px;
  }

  .hover-inspect-badge {
    display: none;
  }

  /* 分页移动端适配 */
  .pagination-vault {
    margin-top: 24px;
    width: 100%;
  }

  .pagination-vault :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }

  .pagination-vault :deep(.el-pagination__sizes),
  .pagination-vault :deep(.el-pagination__total) {
    display: none !important;
  }
}

@media (max-width: 640px) {
  .top-exit-btn {
    top: 14px;
    right: 14px;
    padding: 6px 14px;
    font-size: 13px;
    border-radius: 20px;
  }

  .standalone-3d-card {
    width: min(290px, 82vw);
    height: min(410px, 58vh);
  }

  .card-face {
    border-radius: 18px;
  }

  .back-card-body.clean-back {
    padding: 16px 12px;
    gap: 14px;
  }

  .back-card-body.clean-back .back-title-shimmer {
    font-size: 17px;
  }

  .back-card-body.clean-back .back-story-text {
    font-size: 12px;
    line-height: 1.6;
    padding: 12px;
    max-height: 180px;
    border-radius: 12px;
  }


  .bar-btn {
    padding: 6px 10px;
    font-size: 11.5px;
    border-radius: 12px;
    gap: 4px;
  }

  .bar-divider {
    height: 16px;
  }
}

@media (max-width: 370px) {
  .cards-vault-grid {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  .card-cover-container {
    height: 190px;
  }
}
</style>
