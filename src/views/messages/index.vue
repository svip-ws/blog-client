<template>
  <div class="miku-messages-page" :class="{ 'is-playing': isPlaying, 'view-board': currentViewMode === 'board' }">
    <!-- 1. 星空与歌词音符 Canvas 粒子背景 -->
    <canvas ref="bgCanvas" class="miku-space-canvas"></canvas>

    <!-- 2. 初音未来高质感舞台立绘与全息圆环 Backdrop -->
    <div class="miku-stage-backdrop">
      <img :src="currentBg" alt="Miku Backdrop" class="miku-bg-img" />
      <div class="miku-scrim-overlay"></div>

      <!-- 极光光晕（复用 MikuPageHero 视觉语言） -->
      <span class="aurora a-teal"></span>
      <span class="aurora a-pink"></span>

      <!-- 赛博网格 + 扫描线 -->
      <div class="miku-cyber-grid"></div>
      <div class="miku-scanline"></div>

      <!-- 柔和发光圆柱 / 月轮 -->
      <div class="miku-glowing-halo"></div>
      <div class="miku-rim-light"></div>
      <div class="miku-spotlight-cyan"></div>
      <div class="miku-spotlight-magenta"></div>
      <div class="miku-star-sparkles">
        <span v-for="n in 9" :key="n" class="sparkle-dot" :style="getSparkleStyle(n)">✦</span>
      </div>
    </div>

    <!-- 3. 顶部导航栏 -->
    <header class="miku-hud-header">
      <div class="hud-left-brand tactile-btn" @click="goHome" title="返回博客首页">
        <span class="back-icon">‹</span>
        <div class="miku-01-badge"><img src="/images/miku/miku_chibi_main.png" alt="Q版初音" style="width:16px;height:16px;object-fit:contain;" /></div>
        <div class="brand-text">
          <span class="main-title">返回首页</span>
        </div>
      </div>

      <!-- 中央标题 -->
      <div class="hud-center-spectrum">
        <div class="mini-equalizer">
          <span v-for="i in 5" :key="i" :class="{ wave: isPlaying }"></span>
        </div>
        <span class="hud-spectrum-title">留言墙 · 欢迎留下你的足迹</span>
      </div>

      <!-- 右侧操作组 -->
      <div class="hud-right-actions">
        <button class="hud-pill-btn" @click="currentViewMode = currentViewMode === 'live' ? 'board' : 'live'" :title="currentViewMode === 'live' ? '切换为卡片列表视图' : '切换为沉浸弹幕视图'">
          <svg class="hud-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          <span>{{ currentViewMode === 'live' ? '卡片列表' : '弹幕模式' }}</span>
        </button>

        <button class="hud-pill-btn" @click="switchWallpaper" title="切换背景壁纸">
          <svg class="hud-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="10" r="1.8" fill="currentColor"/><path d="M5 17l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
          <span>切换壁纸</span>
        </button>

        <button class="pink-pulse-btn" @click="openSendModal">
          <span class="pulse-ring"></span>
          <span class="pulse-ring delay"></span>
          <svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5L21 4l-.5 6.5-9 9-4-4 9-9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M11 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 19l3-1 1-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
          <span class="btn-content">写留言</span>
        </button>
      </div>
    </header>

    <!-- 4. 视角 1：演唱会沉浸视角 (浮动歌词气泡 + 底部高质感播放栏) -->
    <main v-if="currentViewMode === 'live'" class="miku-live-main">
      <!-- 4A. 无限弹幕墙 (Infinite Danmaku) -->
      <section class="danmaku-section">
        <div class="danmaku-container">
          <div v-if="!messageList.length" class="danmaku-empty">还没有留言弹幕，点右上角「写留言」写下第一条</div>
          <div
            v-for="(msg, index) in messageList"
            :key="msg.id"
            class="danmaku-msg-card"
            :style="getDanmakuStyle(index)"
            @click="onLikeClick($event, msg)"
          >
            <img :src="msg.avatar || getMikuAvatar(msg.id)" class="danmaku-avatar" />
            <div class="danmaku-content">
              <span class="danmaku-name">{{ msg.nickname }}:</span>
              <span class="danmaku-text">“{{ msg.content }}”</span>
            </div>
            <div class="danmaku-likes">
              <svg class="heart-ico" :class="{ liked: msg.isLiked }" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.2C.4 8.3 2 5 5.4 5c2 0 3.3 1.1 4.1 2.3C10.3 6.1 11.6 5 13.6 5 17 5 18.6 8.3 17 11.8 14.5 16.4 12 21 12 21z" fill="currentColor"/></svg>
              <span>{{ msg.likes || 0 }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 4B. 底部二次元赛博朋克播放器 -->
      <section class="miku-cyber-player">

        <!-- 左侧：旋转黑胶与打歌信息 -->
        <div class="cyber-player-left">
          <div class="vinyl-record" :class="{ 'is-spinning': isPlaying }">
            <div class="vinyl-hole"></div>
            <img
              class="vinyl-cover"
              :src="currentSong.cover || '/images/miku/miku_stage_art.jpg'"
              alt="专辑封面"
              @error="(e) => { e.target.onerror = null; e.target.src = '/images/miku/miku_stage_art.jpg'; }"
            />
          </div>
          <div class="song-info-marquee">
            <div class="now-playing-badge">正在播放</div>
            <h2 class="song-title-cyber">{{ currentSong.title }}</h2>
            <p class="song-artist-cyber">{{ currentSong.artist }}</p>
          </div>
        </div>

        <!-- 右侧：全息控制台 -->
        <div class="cyber-player-right">
          <div class="cyber-waveform-panel" @click="seekProgress">
            <span class="cyber-time-left">{{ formatTime(currentTime) }}</span>
            <div class="cyber-progress-track">
              <canvas ref="waveformCanvas" class="waveform-canvas-cyber"></canvas>
              <div class="cyber-progress-fill" :style="{ width: progressPercent + '%' }"></div>
              <div class="cyber-progress-glow" :style="{ left: progressPercent + '%' }"></div>
              <div v-if="!isMetaReady" class="cyber-loading-scan"></div>
            </div>
            <span class="cyber-time-right">{{ isMetaReady ? formatTime(duration) : '··:··' }}</span>
          </div>

          <div class="cyber-controls-panel">
            <button class="cyber-btn" :class="{ active: isShuffle }" @click="toggleShuffle" title="随机播放">
              <svg viewBox="0 0 24 24"><path d="M4 5h3l9 14h4M4 19h3l3-5M14 5l3 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 4l3 1-1 3M18 20l3-1-1-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="cyber-btn" @click="prevSong" title="上一首">
              <svg viewBox="0 0 24 24"><path d="M7 5v14M19 5L9 12l10 7z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
            </button>
            
            <button class="cyber-play-btn" :class="{ 'is-active': isPlaying }" @click="togglePlay" title="播放/暂停">
              <div class="btn-core">
                <svg v-if="!isPlaying" class="play-ico" viewBox="0 0 24 24"><path d="M8 5l12 7-12 7z" fill="currentColor"/></svg>
                <svg v-else class="play-ico" viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>
              </div>
              <div class="btn-ring"></div>
            </button>

            <button class="cyber-btn" @click="nextSong" title="下一首">
              <svg viewBox="0 0 24 24"><path d="M17 5v14M5 5l10 7L5 19z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
            </button>
            <button class="cyber-btn" :class="{ active: isRepeat }" @click="toggleRepeat" title="单曲循环">
              <svg viewBox="0 0 24 24"><path d="M17 5l3 3-3 3M7 19l-3-3 3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 8a8 8 0 00-14-3M4 16a8 8 0 0014 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- 5. 视角 2：二次元留言墙模式 -->
    <main v-else class="miku-board-main">
      <div class="board-container">
        <div class="board-header-card">
          <div class="board-header-left">
            <h1 class="board-title">✶ 初音未来 葱影留言墙</h1>
            <p class="board-subtitle">连接全世界骑士团的声音 ✦ 已收集 {{ messageList.length }} 条响彻宇宙的告白</p>
          </div>
          <div class="board-header-right">
            <button class="pink-pulse-btn" @click="openSendModal">
              <span class="pulse-ring"></span>
              <span class="pulse-ring delay"></span>
              <svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5L21 4l-.5 6.5-9 9-4-4 9-9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M11 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 19l3-1 1-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
              <span class="btn-content">写入告白</span>
            </button>
          </div>
        </div>

        <div v-if="!messageList.length" class="msg-empty-state">
          <p class="msg-empty-title">还没有人写下告白</p>
          <p class="msg-empty-sub">点右上角「写入告白」，成为第一个骑士 ✦</p>
        </div>
        <div v-else class="message-cards-grid">
          <article
            v-for="(msg, index) in messageList"
            :key="msg.id"
            class="miku-msg-card"
            :class="{ 'is-featured': msg.is_featured }"
            :style="{ animationDelay: (index % 12) * 0.06 + 's' }"
            @mousemove="onCardMove"
            @mouseleave="onCardLeave"
          >
            <div class="card-glare"></div>
            <div class="card-twintail-corner"></div>

            <div class="msg-card-head">
              <div class="avatar-wrapper">
                <img :src="msg.avatar || getMikuAvatar(msg.id)" class="user-avatar" />
                <span class="avatar-01-tag"><img src="/images/miku/miku_chibi_main.png" alt="Miku" style="width:12px;height:12px;object-fit:contain;" /></span>
              </div>
              <div class="user-info">
                <div class="user-name-row">
                  <span class="user-name">{{ msg.nickname || '访客' }}</span>
                  <span v-if="msg.is_featured" class="ssr-badge">精选</span>
                </div>
                <span class="post-time">{{ formatTimeAgo(msg.created_at) }}</span>
              </div>
            </div>

            <div class="msg-card-body">
              <p class="quote-content">“{{ msg.content }}”</p>
              <div v-if="msg.image_url" class="msg-image-box">
                <img :src="msg.image_url" class="attached-img" loading="lazy" decoding="async" />
              </div>
            </div>

            <div class="msg-card-foot">
              <button class="foot-action-btn like" :class="{ liked: msg.isLiked }" @click="onLikeClick($event, msg)">
                <svg class="heart-ico" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.2C.4 8.3 2 5 5.4 5c2 0 3.3 1.1 4.1 2.3C10.3 6.1 11.6 5 13.6 5 17 5 18.6 8.3 17 11.8 14.5 16.4 12 21 12 21z" fill="currentColor"/></svg>
                <span>{{ msg.likes || 0 }}</span>
              </button>

              <button class="foot-action-btn reply" @click="openReplyModal(msg)">
                <svg class="chat-ico" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
                <span>回复 ({{ msg.replies ? msg.replies.length : 0 }})</span>
              </button>

              <span class="card-tag">#留言</span>

              <button
                v-if="isOwnMessage(msg)"
                class="foot-action-btn delete"
                @click="removeMyMessage(msg)"
                title="删除我发的留言"
              >
                <span>删除</span>
              </button>
            </div>

            <div v-if="msg.replies && msg.replies.length > 0" class="sub-replies-list">
              <div v-for="reply in msg.replies" :key="reply.id" class="sub-reply-item">
                <span class="reply-user">@{{ reply.nickname }}:</span>
                <span class="reply-text">{{ reply.content }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>

    <!-- 7. 发送留言 / 二次元初音舞台弹幕投递舱 Modal -->
    <transition name="cyber-zoom">
      <div v-if="showSendModal" class="miku-modal-backdrop" @click.self="showSendModal = false">
        <div
          class="miku-modal-card"
          :style="{
            '--aura-primary': modalAuraThemes[activeAuraIndex].primary,
            '--aura-glow': modalAuraThemes[activeAuraIndex].glow
          }"
        >
          <!-- 全幅初音演出舞台背景层 -->
          <div class="modal-stage-bg" aria-hidden="true">
            <img src="/images/miku/miku_stage_art.jpg" alt="" class="modal-bg-img" />
            <div class="modal-bg-scrim"></div>
            <div class="modal-holo-grid"></div>
            <span class="modal-sparkle s1">✦</span>
            <span class="modal-sparkle s2">♪</span>
            <span class="modal-sparkle s3">♫</span>
          </div>

          <button class="modal-close-x" @click="showSendModal = false" aria-label="关闭">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>

          <!-- 头部舞台横幅：Q版立绘 + 霓虹渐变标题 + 动态声波律动 -->
          <div class="modal-card-header">
            <div class="modal-mascot-ring">
              <img src="/images/miku/miku_chibi_main.png" alt="Q版初音" class="modal-mascot-img" />
              <span class="mascot-halo"></span>
            </div>
            <div class="modal-title-group">
              <span class="modal-stage-chip">✦ MIKU LIVE</span>
              <h3 class="modal-title">投递弹幕</h3>
            </div>
            <div class="modal-eq" aria-hidden="true">
              <i v-for="n in 6" :key="n" :style="{ animationDelay: (n * 0.11) + 's' }"></i>
            </div>
          </div>

          <!-- 实时霓虹弹幕预览胶囊 + 光效配色球 -->
          <div class="danmaku-preview-strip">
            <div class="preview-pill">
              <img src="/images/miku/miku_chibi_wave.png" alt="" class="preview-avatar" />
              <span class="preview-nick">{{ newMsgForm.nickname.trim() || '匿名音符' }}</span>
              <span class="preview-sep">:</span>
              <span class="preview-msg">{{ newMsgForm.content.trim() || '写下心动旋律 ♪' }}</span>
            </div>
            <div class="aura-dots" role="group" aria-label="弹幕光效配色">
              <button
                v-for="(theme, idx) in modalAuraThemes"
                :key="theme.name"
                type="button"
                class="aura-dot"
                :class="{ active: activeAuraIndex === idx }"
                :style="{ '--dot-color': theme.primary }"
                :title="theme.name"
                @click="activeAuraIndex = idx"
              ></button>
            </div>
          </div>

          <!-- 极简晶透玻璃输入区 -->
          <div class="modal-form-body">
            <div class="glass-field">
              <span class="field-icon">🎤</span>
              <input
                v-model="newMsgForm.nickname"
                type="text"
                maxlength="24"
                placeholder="你的昵称（留空即匿名）"
                class="miku-input"
              />
            </div>

            <div class="glass-textarea-wrap">
              <textarea
                v-model="newMsgForm.content"
                rows="3"
                maxlength="200"
                placeholder="输入想说的话，发射到星空弹幕吧 ♪"
                class="miku-textarea"
              ></textarea>
              <span class="char-meter">{{ newMsgForm.content.length }}/200</span>
            </div>

            <!-- 精简短标签一键填入 -->
            <div class="quick-lyric-tags">
              <button
                v-for="quick in quickLyricPresets"
                :key="quick"
                type="button"
                class="quick-pill"
                @click="newMsgForm.content = quick"
              >
                {{ quick }}
              </button>
            </div>
          </div>

          <div class="modal-card-footer">
            <button type="button" class="modal-btn cancel" @click="showSendModal = false">取消</button>
            <button type="button" class="modal-btn submit" @click="submitNewMessage">
              <span>✨ 发射弹幕</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 8. 回复留言 · 初音舞台胶囊 Modal -->
    <transition name="cyber-zoom">
      <div v-if="activeReplyTarget" class="miku-modal-backdrop" @click.self="activeReplyTarget = null">
        <div
          class="miku-modal-card reply-modal-card"
          :style="{ '--aura-primary': '#39C5BB', '--aura-glow': 'rgba(57, 197, 187, 0.45)' }"
        >
          <div class="modal-stage-bg" aria-hidden="true">
            <img src="/images/miku/miku_stage_art.jpg" alt="" class="modal-bg-img" />
            <div class="modal-bg-scrim"></div>
            <div class="modal-holo-grid"></div>
          </div>

          <button class="modal-close-x" @click="activeReplyTarget = null" aria-label="关闭">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>

          <div class="modal-card-header">
            <div class="modal-mascot-ring">
              <img src="/images/miku/miku_chibi_wave.png" alt="Q版初音" class="modal-mascot-img" />
              <span class="mascot-halo"></span>
            </div>
            <div class="modal-title-group">
              <span class="modal-stage-chip">✦ ECHO REPLY</span>
              <h3 class="modal-title">回应 @{{ activeReplyTarget.nickname }}</h3>
            </div>
          </div>

          <p class="quote-target">“{{ activeReplyTarget.content }}”</p>

          <div class="glass-textarea-wrap">
            <textarea
              v-model="replyFormContent"
              rows="3"
              placeholder="写下你的回应 ♪"
              class="miku-textarea"
            ></textarea>
          </div>

          <div class="modal-card-footer">
            <button type="button" class="modal-btn cancel" @click="activeReplyTarget = null">取消</button>
            <button type="button" class="modal-btn submit" @click="submitReply">
              <span>✨ 发送回应</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 特效层：点赞爆裂粒子（不拦截交互） -->
    <div ref="fxLayer" class="mk-fx-layer" aria-hidden="true"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import { useMusicStore } from '../../stores/music';
import { useMessageBoard } from '../../composables/useMessageBoard';
import { useFxLayer } from '../../composables/useFxLayer';

const router = useRouter();
const userStore = useUserStore();

// 留言数据一律来自后端，不再保留本地预置假数据

// 音乐播放器（全站单实例，路由切换不断曲）
const music = useMusicStore();
const {
  currentSong, isPlaying, isShuffle, isRepeat,
  currentTime, duration, isMetaReady, progressPercent,
} = storeToRefs(music);
const {
  togglePlay, prevSong, nextSong, toggleShuffle, toggleRepeat,
  seekProgress, formatTime,
} = music;

// 留言板
const {
  messageList, newMsgForm, showSendModal, activeReplyTarget, replyFormContent,
  handleLike, openSendModal, submitNewMessage, openReplyModal, submitReply, loadMessages,
  isOwnMessage, removeMyMessage,
} = useMessageBoard(userStore);

// 动效降级：系统偏好 + 站点 reduce-motion 双写
const prefersReduced = ((typeof window !== 'undefined') &&
  (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) ||
  (typeof document !== 'undefined' && document.documentElement.classList.contains('reduce-motion'));

// 特效层
const fxLayer = ref(null);
const { spawnLikeBurst } = useFxLayer(fxLayer, prefersReduced);

// 点赞：粒子特效 + 业务逻辑
const onLikeClick = (e, msg) => {
  spawnLikeBurst(e);
  handleLike(msg);
};

// Canvas refs
const bgCanvas = ref(null);
const waveformCanvas = ref(null);
let animFrameId = null;
let waveFrameId = null;
let bgResizeHandler = null;

// 背景壁纸集
const bgWallpapers = [
  '/images/miku/miku_messages_banner.jpg',
  '/images/miku/miku_stage_art.jpg',
  '/images/miku/miku_wp_1.jpg',
  '/images/miku/miku_wp_8.jpg',
  '/images/miku/miku_room_bg.jpg'
];
const currentBgIndex = ref(0);
const currentBg = computed(() => bgWallpapers[currentBgIndex.value]);
const switchWallpaper = () => {
  currentBgIndex.value = (currentBgIndex.value + 1) % bgWallpapers.length;
};

// 视角模式：'live' 演唱会 | 'board' 留言墙
const currentViewMode = ref('live');

// 窗口宽度
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);
const handleWindowResize = () => { windowWidth.value = window.innerWidth; };

// 弹幕氛围光效主题（视觉实时预览用）
const modalAuraThemes = [
  { name: '初音青葱', primary: '#39C5BB', glow: 'rgba(57, 197, 187, 0.45)' },
  { name: '樱花应援粉', primary: '#FF7E9D', glow: 'rgba(255, 126, 157, 0.45)' },
  { name: '星夜幻紫', primary: '#A78BFA', glow: 'rgba(167, 139, 250, 0.45)' },
  { name: '舞台星耀金', primary: '#FBBF24', glow: 'rgba(251, 191, 36, 0.45)' },
];
const activeAuraIndex = ref(0);

// 精简二次元弹幕短签
const quickLyricPresets = [
  '♪ 公主殿下',
  '✨ 打卡留念',
  '💚 39快乐',
  '🌸 永远热爱'
];

const goHome = () => router.push('/');

const getMikuAvatar = (id) => {
  const avatars = [
    '/images/miku/miku_chibi_main.png',
    '/images/miku/miku_chibi_wave.png',
    '/images/miku/miku_chibi_category_card.png',
    '/images/miku/miku_chibi_tag_card.png'
  ];
  return avatars[(id || 0) % avatars.length];
};

const getDanmakuStyle = (index) => {
  const isMobile = windowWidth.value <= 768;
  const tracks = isMobile ? 5 : 7;
  const trackId = index % tracks;
  const top = isMobile ? ((trackId * 46) + 85 + 'px') : ((trackId * 56) + 80 + 'px');
  const delay = (index * (isMobile ? 1.6 : 2.5)) + 's';
  const duration = isMobile ? ((11 + (index % 4) * 2) + 's') : ((18 + (index % 4) * 3) + 's');
  return { top, animationDelay: delay, animationDuration: duration };
};

const getSparkleStyle = (index) => {
  const top = (index * 9 + 4) % 52;
  const left = (index * 17 + 6) % 92;
  return {
    top: `${top}%`, left: `${left}%`,
    animationDelay: `${(index * 0.3).toFixed(1)}s`
  };
};

// 卡片 3D 倾斜 + 光泽跟随
const onCardMove = (e) => {
  if (prefersReduced) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;
  el.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
  el.style.setProperty('--rx', ((0.5 - py) * 9).toFixed(2) + 'deg');
  el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
  el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
};
const onCardLeave = (e) => {
  const el = e.currentTarget;
  el.style.setProperty('--rx', '0deg');
  el.style.setProperty('--ry', '0deg');
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '刚刚';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 0) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (diffSec < 60) return '刚刚';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 后端数据加载（音乐 + 留言）
const loadBackendData = async () => {
  try {
    await music.loadPlaylist();
  } catch (e) {
    console.log('使用兜底歌单');
  }

  try {
    await loadMessages();
  } catch (e) {
    console.log('使用预置留言列表');
  }
};

// Background Canvas：星空、星光、正弦波、飘浮音符
const initBgCanvas = () => {
  const canvas = bgCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  bgResizeHandler = resize;
  window.addEventListener('resize', resize);

  const notes = ['♪', '♫', '♬', '✦'];
  const isMobile = windowWidth.value <= 768;
  const particleCount = isMobile ? 22 : 54;
  const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 2 + 1,
    color: Math.random() > 0.4 ? 'rgba(57, 197, 187, ' : 'rgba(255, 126, 157, ',
    alpha: Math.random() * 0.5 + 0.12,
    speed: Math.random() * 0.4 + 0.1,
    note: Math.random() > 0.82,
    glyph: notes[Math.floor(Math.random() * notes.length)],
    size: Math.random() * 10 + 10,
    drift: (Math.random() - 0.5) * 0.4
  }));

  let step = 0;
  let lastMsgFrameTime = 0;
  const render = (timestamp) => {
    if (document.hidden) {
      animFrameId = requestAnimationFrame(render);
      return;
    }
    animFrameId = requestAnimationFrame(render);
    if (timestamp && timestamp - lastMsgFrameTime < 33) return;
    lastMsgFrameTime = timestamp || performance.now();

    step += 0.02;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.y -= p.speed;
      p.x += p.drift * 0.3;
      if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
      if (p.x < -20) p.x = canvas.width + 20;
      if (p.x > canvas.width + 20) p.x = -20;
      p.alpha += Math.sin(step) * 0.01;
      const clampedAlpha = Math.max(0.08, Math.min(0.6, Math.abs(p.alpha)));

      if (p.note) {
        ctx.font = `${p.size}px 'Outfit', sans-serif`;
        ctx.fillStyle = p.color + clampedAlpha + ')';
        ctx.fillText(p.glyph, p.x, p.y);
      } else {
        ctx.fillStyle = p.color + clampedAlpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const waves = [
      { color: 'rgba(57, 197, 187, 0.15)', freq: 0.004, speed: 0.02, amp: isPlaying.value ? 35 : 15 },
      { color: 'rgba(255, 126, 157, 0.12)', freq: 0.006, speed: 0.03, amp: isPlaying.value ? 25 : 10 }
    ];
    const waveStep = isMobile ? 24 : 15;
    waves.forEach((w) => {
      ctx.fillStyle = w.color;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += waveStep) {
        const y = Math.sin(x * w.freq + step * 2) * w.amp + (canvas.height * 0.85);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();
    });
  };

  render();
};

// 波形 Canvas：液态霓虹能量波 + 粒子拖尾
const initWaveformCanvas = () => {
  const canvas = waveformCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const particles = [];

  const renderWave = () => {
    waveFrameId = requestAnimationFrame(renderWave);
    if (!canvas.parentElement) return;

    const parentW = canvas.parentElement.clientWidth;
    if (canvas.width !== parentW) {
      canvas.width = parentW;
      canvas.height = 36;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const time = Date.now() * 0.002;
    const isPlay = isPlaying.value;
    const currentProgressX = w * (progressPercent.value / 100);

    const drawSine = (color, amplitude, frequency, speedOffset, lineWidth) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        let y = h / 2;
        if (isPlay) {
          const noise = Math.sin(x * 0.05 + time * 2) * 0.5;
          y += Math.sin(x * frequency + time * speedOffset) * amplitude * (1 + noise);
        } else {
          y += Math.sin(x * frequency * 0.5 + time * 0.5) * (amplitude * 0.2);
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    drawSine('rgba(255, 255, 255, 0.05)', 4, 0.02, 1, 1);

    ctx.save();
    ctx.beginPath();
    ctx.rect(currentProgressX, 0, w - currentProgressX, h);
    ctx.clip();
    drawSine('rgba(255,255,255,0.15)', 8, 0.03, 1.5, 1.5);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, currentProgressX, h);
    ctx.clip();
    drawSine('#39C5BB', 12, 0.03, 2, 2);
    drawSine('#FF7E9D', 8, 0.04, -1.8, 2);
    ctx.restore();

    if (isPlay && progressPercent.value > 0 && progressPercent.value < 100) {
      if (Math.random() > 0.3) {
        particles.push({
          x: currentProgressX,
          y: h / 2 + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 1.5 - 0.5,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
          color: Math.random() > 0.5 ? '#39C5BB' : '#FF7E9D'
        });
      }
    }

    ctx.shadowBlur = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  renderWave();
};

onMounted(() => {
  initBgCanvas();
  initWaveformCanvas();
  loadBackendData();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleWindowResize);
  }
});

onBeforeUnmount(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (waveFrameId) cancelAnimationFrame(waveFrameId);
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleWindowResize);
    if (bgResizeHandler) window.removeEventListener('resize', bgResizeHandler);
  }
});
</script>
<style scoped>
/* 暗色初音品牌配色（页内 token，不污染全局） */
.miku-messages-page {
  --mk-bg: #0B1020;
  --mk-bg-2: #0E1630;
  --mk-teal: #39C5BB;
  --mk-pink: #FF7E9D;
  --mk-deep: #12A79C;
  --mk-glass: rgba(14, 22, 38, 0.72);
  --mk-glass-strong: rgba(10, 16, 30, 0.88);
  --mk-border: rgba(57, 197, 187, 0.28);
  --mk-text: #EAF6FF;
  --mk-text-dim: #8DA4C4;
  --mk-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);

  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--mk-bg);
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--mk-text);
  user-select: none;
}

/* 1. 星空 Canvas 背景 */
.miku-space-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

/* 2. 背景图与全息视觉光罩 */
.miku-stage-backdrop {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
}

.miku-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.66;
  filter: contrast(1.08) brightness(1.1) saturate(1.14) drop-shadow(0 0 26px rgba(57, 197, 187, 0.32));
  transition: opacity 0.8s ease, transform 10s ease-in-out;
}

.miku-messages-page.is-playing .miku-bg-img {
  transform: scale(1.04);
}

/* 角色轮廓光晕：提亮视觉中心，呼应初音青/粉 */
.miku-rim-light {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 460px;
  height: 600px;
  background: radial-gradient(ellipse 55% 60% at 50% 50%, rgba(57, 197, 187, 0.22) 0%, rgba(255, 126, 157, 0.12) 45%, transparent 72%);
  filter: blur(40px);
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 2;
}

.miku-scrim-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 40%, rgba(11, 16, 32, 0.1) 0%, rgba(11, 16, 32, 0.78) 100%),
    linear-gradient(180deg, rgba(11, 16, 32, 0.42) 0%, rgba(11, 16, 32, 0.12) 42%, rgba(11, 16, 32, 0.82) 100%);
}

/* 极光光晕（复用 MikuPageHero 视觉语言） */
.aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 2;
}

.a-teal {
  width: 460px;
  height: 460px;
  top: -160px;
  left: -90px;
  background: radial-gradient(circle, rgba(57, 197, 187, 0.85) 0%, rgba(57, 197, 187, 0) 70%);
  animation: auroraDrift 14s ease-in-out infinite alternate;
}

.a-pink {
  width: 420px;
  height: 420px;
  bottom: -170px;
  right: 6%;
  background: radial-gradient(circle, rgba(255, 126, 157, 0.78) 0%, rgba(255, 126, 157, 0) 70%);
  animation: auroraDrift 18s ease-in-out infinite alternate-reverse;
}

@keyframes auroraDrift {
  0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.7; }
  100% { transform: translate3d(42px, 28px, 0) scale(1.18); opacity: 1; }
}

/* 赛博网格 */
.miku-cyber-grid {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(57, 197, 187, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(57, 197, 187, 0.07) 1px, transparent 1px);
  background-size: 46px 46px;
  -webkit-mask-image: radial-gradient(120% 100% at 50% 30%, #000 0%, transparent 75%);
  mask-image: radial-gradient(120% 100% at 50% 30%, #000 0%, transparent 75%);
  opacity: 0.6;
}

/* 扫描线 */
.miku-scanline {
  position: absolute;
  left: 0;
  right: 0;
  height: 160px;
  top: -160px;
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 0%, rgba(57, 197, 187, 0.12) 50%, transparent 100%);
  animation: heroScan 8s linear infinite;
}

@keyframes heroScan {
  0% { transform: translateY(0); opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}

/* 柔和圆柱/月轮发光背罩 */
.miku-glowing-halo {
  position: absolute;
  top: 44%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(57, 197, 187, 0.34) 0%, rgba(255, 126, 157, 0.18) 60%, transparent 75%);
  filter: blur(44px);
  pointer-events: none;
  z-index: 2;
}

.miku-spotlight-cyan {
  position: absolute;
  top: -20%;
  left: 12%;
  width: 520px;
  height: 720px;
  background: radial-gradient(ellipse at center, rgba(57, 197, 187, 0.2) 0%, transparent 70%);
  transform: rotate(-25deg);
  pointer-events: none;
  z-index: 2;
}

.miku-spotlight-magenta {
  position: absolute;
  top: -20%;
  right: 12%;
  width: 520px;
  height: 720px;
  background: radial-gradient(ellipse at center, rgba(255, 126, 157, 0.18) 0%, transparent 70%);
  transform: rotate(25deg);
  pointer-events: none;
  z-index: 2;
}

.sparkle-dot {
  position: absolute;
  font-size: 12px;
  color: var(--mk-teal);
  opacity: 0.55;
  animation: sparkleBreathe 3s infinite alternate ease-in-out;
  z-index: 3;
}

@keyframes sparkleBreathe {
  0% { transform: scale(0.6) rotate(0deg); opacity: 0.3; }
  100% { transform: scale(1.3) rotate(180deg); opacity: 1; text-shadow: 0 0 10px var(--mk-teal); }
}

/* HUD 四角括线 */
.hud-corner {
  position: absolute;
  width: 22px;
  height: 22px;
  z-index: 30;
  border: 2px solid rgba(57, 197, 187, 0.5);
  pointer-events: none;
}
.hud-corner.tl { top: 14px; left: 14px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
.hud-corner.tr { top: 14px; right: 14px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
.hud-corner.bl { bottom: 14px; left: 14px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
.hud-corner.br { bottom: 14px; right: 14px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }

/* 3. 顶部 HUD 导航栏 */
.miku-hud-header {
  position: absolute;
  top: 20px;
  left: 30px;
  right: 30px;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 30;
}

.hud-left-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--mk-glass);
  backdrop-filter: blur(16px);
  padding: 8px 20px;
  border-radius: 999px;
  border: none;
  box-shadow: 0 8px 26px rgba(57, 197, 187, 0.2);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hud-left-brand:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(57, 197, 187, 0.32);
}

.back-icon { font-size: 22px; font-weight: 900; color: var(--mk-teal); line-height: 1; }

.miku-01-badge {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text { display: flex; flex-direction: column; gap: 1px; }
.main-title { font-size: 16px; font-weight: 900; color: #FFFFFF; letter-spacing: 1.5px; text-shadow: 0 0 16px rgba(57, 197, 187, 0.55); }
.sub-title { font-size: 8px; font-weight: 700; color: var(--mk-teal); opacity: 0.42; letter-spacing: 1px; }

/* 中央动态频谱 indicator */
.hud-center-spectrum {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--mk-glass);
  backdrop-filter: blur(14px);
  padding: 8px 24px;
  border-radius: 999px;
  border: none;
  box-shadow: 0 8px 24px rgba(255, 126, 157, 0.16);
}

.twintail-icon { color: var(--mk-teal); font-size: 14px; }
.hud-spectrum-title { font-size: 11px; font-weight: 900; color: #FFB3C9; letter-spacing: 1.5px; }

.mini-equalizer { display: flex; align-items: flex-end; gap: 3px; height: 14px; }
.mini-equalizer span { width: 3px; height: 30%; background: var(--mk-teal); border-radius: 2px; }
.mini-equalizer span.wave { animation: miniEq 0.5s infinite alternate ease-in-out; }
.mini-equalizer span:nth-child(2).wave { animation-delay: 0.1s; }
.mini-equalizer span:nth-child(3).wave { animation-delay: 0.2s; }
.mini-equalizer span:nth-child(4).wave { animation-delay: 0.3s; }
.mini-equalizer span:nth-child(5).wave { animation-delay: 0.4s; }

@keyframes miniEq { 0% { height: 20%; } 100% { height: 100%; background: var(--mk-pink); } }

.hud-right-actions { display: flex; align-items: center; gap: 12px; }

/* 通用底部按压微交互（触觉反馈） */
.hud-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--mk-glass);
  backdrop-filter: blur(14px);
  border: none;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  font-size: 12px;
  font-weight: 800;
  padding: 9px 16px;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.hud-pill-btn .hud-ico { width: 16px; height: 16px; }
.hud-pill-btn:hover, .hud-pill-btn.active {
  background: rgba(57, 197, 187, 0.2);
  border-color: var(--mk-teal);
  color: #FFFFFF;
  box-shadow: 0 0 14px rgba(57, 197, 187, 0.4);
}
.hud-pill-btn:active { transform: scale(0.93); }

/* ================= 无限弹幕 (Danmaku) 样式 ================= */
.danmaku-section {
  position: absolute;
  top: 80px;
  bottom: 140px;
  left: 0;
  right: 0;
  overflow: hidden;
  pointer-events: none; /* 让弹幕不阻挡下方背景交互，除非 hovering 弹幕 */
}

.danmaku-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.danmaku-msg-card {
  position: absolute;
  right: -50vw; /* 从屏幕右侧外部出现 */
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(14, 41, 38, 0.94);
  border: 1px solid rgba(57, 197, 187, 0.4);
  border-radius: 999px;
  padding: 6px 18px 6px 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  animation: danmaku-scroll linear infinite;
  pointer-events: auto;
  transition: transform 0.2s, border-color 0.2s, z-index 0s;
  cursor: pointer;
}

.danmaku-msg-card:hover {
  animation-play-state: paused;
  transform: scale(1.05);
  border-color: var(--mk-pink);
  z-index: 10;
  box-shadow: 0 0 15px rgba(255, 126, 157, 0.4);
}

.danmaku-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--mk-teal);
  object-fit: cover;
}

.danmaku-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.danmaku-name {
  color: var(--mk-teal);
  font-weight: 800;
  font-size: 13px;
  text-shadow: 0 0 4px rgba(57, 197, 187, 0.3);
}

.danmaku-text {
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.danmaku-likes {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  margin-left: 8px;
}

.danmaku-likes .heart-ico {
  width: 14px;
  height: 14px;
}

.danmaku-likes .heart-ico.liked {
  color: var(--mk-pink);
}

@keyframes danmaku-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-100vw - 100vw)); }
}

/* 醒目的粉色渐变按钮 + 脉冲扩散动效 */
.pink-pulse-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, #5B6CFF 0%, #39C5BB 100%);
  border: none;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 900;
  padding: 10px 20px;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 0 22px rgba(91, 108, 255, 0.5), 0 0 12px rgba(57, 197, 187, 0.35);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}
.pink-pulse-btn .btn-ico { width: 17px; height: 17px; }
.pink-pulse-btn:hover {
  box-shadow: 0 0 32px rgba(91, 108, 255, 0.75), 0 0 18px rgba(57, 197, 187, 0.55);
  animation: btnHeartbeat 1.15s ease-in-out infinite;
}
.pink-pulse-btn:active { transform: scale(0.94); animation: none; }
@keyframes btnHeartbeat {
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.07); }
  28% { transform: scale(1); }
  42% { transform: scale(1.04); }
}

/* 可点击元素聚焦反馈（键盘可达 + 视觉暗示） */
.hud-pill-btn:focus-visible,
.ctrl-btn:focus-visible,
.foot-action-btn:focus-visible,
.modal-btn:focus-visible,
.quick-pill:focus-visible,
.pink-pulse-btn:focus-visible,
.chibi-miku-mascot:focus-visible .mascot-avatar-ring,
.hud-left-brand:focus-visible {
  outline: 2px solid var(--mk-teal);
  outline-offset: 3px;
}

.pulse-ring {
  position: absolute;
  inset: -4px;
  border-radius: 999px;
  border: 2px solid rgba(91, 108, 255, 0.7);
  animation: pulseOut 2s infinite ease-out;
  pointer-events: none;
}
.pulse-ring.delay { animation-delay: 1s; }

@keyframes pulseOut {
  0% { transform: scale(1); opacity: 0.9; }
  100% { transform: scale(1.35); opacity: 0; }
}

/* 4. 视角 1：演唱会沉浸视角 */
.miku-live-main {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 30px;
}

.lyric-pill-bubble::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.55) 50%, transparent 65%);
  background-size: 220% 100%;
  background-position: 220% 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.lyric-pill-bubble:hover::after { opacity: 1; animation: pillSweep 1.1s linear infinite; }
@keyframes pillSweep {
  0% { background-position: 220% 0; }
  100% { background-position: -120% 0; }
}

.lyric-pill-bubble:hover {
  transform: translateY(-5px) scale(1.06);
  border-color: var(--mk-teal);
  box-shadow: 0 0 25px rgba(57, 197, 187, 0.6), inset 0 0 15px rgba(57, 197, 187, 0.3);
  background: rgba(20, 35, 60, 0.82);
}

.lyric-pill-bubble.is-highlight {
  border-color: var(--mk-pink);
  box-shadow: 0 0 25px rgba(255, 126, 157, 0.5), inset 0 0 12px rgba(255, 126, 157, 0.22);
  background: linear-gradient(90deg, rgba(255, 126, 157, 0.18) 0%, rgba(15, 24, 42, 0.72) 100%);
}

.lyric-pill-bubble.is-vip {
  border-color: var(--mk-teal);
  background: linear-gradient(90deg, rgba(57, 197, 187, 0.22) 0%, rgba(15, 24, 42, 0.78) 100%);
}

@keyframes pillFloat {
  0% { transform: translateY(0px); }
  100% { transform: translateY(-8px); }
}

.pill-avatar-holder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(57, 197, 187, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.pill-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.pill-default-note { font-size: 13px; color: var(--mk-teal); }
.pill-icon { font-size: 14px; }
.pill-text { font-size: 14px; font-weight: 800; letter-spacing: 0.5px; }

.pill-tag {
  background: linear-gradient(90deg, var(--mk-teal) 0%, var(--mk-pink) 100%);
  font-size: 9px;
  font-weight: 900;
  padding: 1px 6px;
  border-radius: 4px;
  color: #FFF;
}

/* 4B. 底部参考样式二次元播放栏 */
.miku-cyber-player {
  width: 90%;
  max-width: 900px;
  margin: 0 auto;
  background: linear-gradient(135deg, rgba(16, 25, 36, 0.96), rgba(22, 34, 48, 0.98));
  border: 1px solid rgba(57, 197, 187, 0.4);
  border-radius: 20px;
  padding: 16px 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(57, 197, 187, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

/* 左侧：黑胶与信息 */
.cyber-player-left {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 35%;
  min-width: 240px;
}

.vinyl-record {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: #111;
  border: 4px solid #222;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(0,0,0,0.8), 0 0 0 1px rgba(57, 197, 187, 0.3);
  animation: spinVinyl 8s linear infinite;
  animation-play-state: paused;
}
.vinyl-record.is-spinning { animation-play-state: running; }

@keyframes spinVinyl {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.vinyl-hole {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  z-index: 5;
  box-shadow: inset 0 0 4px rgba(0,0,0,0.5);
}

.vinyl-cover {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  opacity: 0.85;
}

.song-info-marquee {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  white-space: nowrap;
}

.now-playing-badge {
  font-size: 10px;
  font-weight: 900;
  color: var(--mk-pink);
  background: rgba(255, 126, 157, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--mk-pink);
  display: inline-block;
  align-self: flex-start;
  margin-bottom: 4px;
  letter-spacing: 1px;
}

.song-title-cyber {
  font-size: 16px;
  font-weight: 900;
  color: #FFFFFF;
  text-shadow: 0 0 8px rgba(255,255,255,0.3);
  margin: 0 0 2px 0;
  text-overflow: ellipsis;
  overflow: hidden;
}

.song-artist-cyber {
  font-size: 12px;
  color: var(--mk-teal);
  margin: 0;
  text-overflow: ellipsis;
  overflow: hidden;
}

/* 右侧：控制面板 */
.cyber-player-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cyber-waveform-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: transparent;
  padding: 8px 4px;
  position: relative;
}
.miku-messages-page.is-playing .cyber-waveform-panel {
  animation: none; /* Removed the panel breathing animation since there's no box anymore */
}

/* 移除装饰性网格背景，让特效直接漂浮 */
.cyber-waveform-panel::before {
  display: none;
}

.cyber-time-left, .cyber-time-right {
  font-family: 'Outfit', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--mk-teal);
  width: 38px;
  text-align: center;
  text-shadow: 0 0 5px var(--mk-teal);
  z-index: 2;
}

.cyber-progress-track {
  flex: 1;
  height: 36px;
  position: relative;
  display: flex;
  align-items: center;
  z-index: 2;
}

.waveform-canvas-cyber {
  width: 100%;
  height: 100%;
  opacity: 1;
}

/* 进度条发光头 (能量核心) */
.cyber-progress-glow {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 16px;
  background: #fff;
  box-shadow: 0 0 10px #fff, 0 0 20px var(--mk-pink), 0 0 30px var(--mk-teal);
  border-radius: 999px;
  pointer-events: none;
}

.cyber-loading-scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(57, 197, 187, 0.4), transparent);
  background-size: 50% 100%;
  animation: cyberScan 1.5s linear infinite;
}

@keyframes cyberScan {
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}

.cyber-controls-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.cyber-btn {
  background: none;
  border: none;
  color: var(--mk-text-dim);
  cursor: pointer;
  padding: 6px;
  transition: all 0.2s ease;
}
.cyber-btn svg { width: 20px; height: 20px; }
.cyber-btn:hover {
  color: var(--mk-teal);
  filter: drop-shadow(0 0 6px var(--mk-teal));
  transform: scale(1.1);
}
.cyber-btn.active {
  color: var(--mk-pink);
  filter: drop-shadow(0 0 8px var(--mk-pink));
}

.cyber-play-btn {
  position: relative;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-core {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(10, 16, 30, 0.9);
  border: 2px solid var(--mk-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 2;
  transition: all 0.3s ease;
}
.btn-core svg { width: 20px; height: 20px; }

.btn-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px dashed var(--mk-teal);
  opacity: 0.5;
  transition: all 0.3s ease;
}

.cyber-play-btn:hover .btn-core {
  border-color: var(--mk-pink);
  box-shadow: 0 0 15px rgba(255, 126, 157, 0.6);
}
.cyber-play-btn:hover .btn-ring {
  border-color: var(--mk-pink);
  transform: rotate(45deg);
  opacity: 1;
}

.cyber-play-btn.is-active .btn-ring {
  animation: spinRing 4s linear infinite;
  border-style: solid;
  border-color: rgba(255, 126, 157, 0.4);
  border-top-color: var(--mk-pink);
  border-bottom-color: var(--mk-teal);
}

@keyframes spinRing {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .miku-cyber-player {
    flex-direction: column;
    padding: 16px;
    width: 95%;
  }
  .cyber-player-left { width: 100%; justify-content: center; }
  .cyber-player-right { width: 100%; }
}

/* 5. 视角 2：二次元留言墙模式 */
.miku-board-main {
  position: absolute;
  inset: 80px 0 0 0;
  z-index: 15;
  overflow-y: auto;
  padding: 24px 40px 120px;
  perspective: 1100px;
}

.board-container { max-width: 1100px; margin: 0 auto; }

.board-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(14, 41, 38, 0.94);
  border: none;
  border-radius: 20px;
  padding: 24px 32px;
  margin-bottom: 30px;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.38);
}

.board-title { font-size: 22px; font-weight: 900; color: var(--mk-teal); margin-bottom: 4px; text-shadow: 0 0 16px rgba(57, 197, 187, 0.35); }
.board-subtitle { font-size: 13px; color: var(--mk-text-dim); }

.message-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.miku-msg-card {
  position: relative;
  background: rgba(14, 41, 38, 0.92);
  border: none;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
  transform-style: preserve-3d;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform 0.18s ease-out, box-shadow 0.3s ease;
  overflow: hidden;
  content-visibility: auto;
  contain-intrinsic-size: auto 220px;
  animation: cardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes cardEnter {
  0% { opacity: 0; transform: translateY(18px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.miku-msg-card:hover {
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(-4px);
  box-shadow: 0 16px 40px rgba(57, 197, 187, 0.26), 0 0 22px rgba(57, 197, 187, 0.16);
}

.miku-msg-card.is-featured {
  background: linear-gradient(135deg, rgba(255, 126, 157, 0.14) 0%, rgba(14, 22, 38, 0.86) 100%);
  box-shadow: 0 12px 34px rgba(255, 126, 157, 0.18);
}

/* 光泽跟随层 */
.card-glare {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.16) 0%, transparent 46%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 3;
}
.miku-msg-card:hover .card-glare { opacity: 1; }

.card-twintail-corner {
  position: absolute;
  top: 0; right: 0;
  width: 32px; height: 32px;
  background: linear-gradient(135deg, transparent 50%, rgba(57, 197, 187, 0.4) 50%);
  z-index: 2;
}

.msg-card-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; position: relative; z-index: 4; }

.avatar-wrapper { position: relative; width: 44px; height: 44px; }
.user-avatar { width: 100%; height: 100%; border-radius: 50%; border: 2px solid var(--mk-teal); object-fit: cover; }

.avatar-01-tag {
  position: absolute;
  bottom: -2px; right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info { display: flex; flex-direction: column; }
.user-name-row { display: flex; align-items: center; gap: 8px; }
.user-name { font-size: 14px; font-weight: 900; color: #FFF; }

.ssr-badge {
  background: linear-gradient(90deg, var(--mk-pink) 0%, #FFB347 100%);
  font-size: 9px;
  font-weight: 900;
  padding: 1px 6px;
  border-radius: 4px;
}

.post-time { font-size: 10px; color: var(--mk-text-dim); margin-top: 2px; }

.quote-content { font-size: 14px; line-height: 1.6; color: #E1EFFE; margin-bottom: 12px; position: relative; z-index: 4; }

.attached-img { width: 100%; max-height: 180px; object-fit: cover; border-radius: 10px; margin-bottom: 12px; position: relative; z-index: 4; }

.msg-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 10px;
  position: relative;
  z-index: 4;
}

.foot-action-btn {
  background: none;
  border: none;
  color: var(--mk-text-dim);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s ease, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.foot-action-btn svg { width: 16px; height: 16px; }
.foot-action-btn:hover { color: var(--mk-teal); }
.foot-action-btn:active { transform: scale(0.9); }
.foot-action-btn.liked { color: var(--mk-pink); }

.card-tag { font-size: 10px; color: var(--mk-teal); font-weight: 800; }

.sub-replies-list {
  background: rgba(57, 197, 187, 0.06);
  border-radius: 8px;
  padding: 10px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 4;
}

.sub-reply-item { font-size: 12px; }
.reply-user { color: var(--mk-teal); font-weight: 800; margin-right: 6px; }
.reply-text { color: #D1E5FF; }



/* 7 & 8. 二次元初音舞台弹幕投递舱 Modal 视觉 */
.miku-modal-backdrop {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 50% 45%, rgba(16, 48, 52, 0.65), rgba(7, 13, 24, 0.84));
  backdrop-filter: blur(18px) saturate(1.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.miku-modal-card {
  position: relative;
  width: 92%;
  max-width: 490px;
  background: linear-gradient(145deg, rgba(16, 36, 44, 0.94) 0%, rgba(28, 22, 46, 0.95) 55%, rgba(12, 34, 40, 0.96) 100%);
  border: none;
  border-radius: 26px;
  padding: 26px 26px 22px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), 0 0 42px var(--aura-glow, rgba(57, 197, 187, 0.42)), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
  overflow: hidden;
  transition: box-shadow 0.28s ease;
}

.modal-stage-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.modal-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0.34;
  filter: saturate(1.3) brightness(0.95);
}

.modal-bg-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(14, 34, 42, 0.72) 0%, rgba(16, 26, 44, 0.86) 58%, rgba(24, 18, 42, 0.92) 100%);
}

.modal-holo-grid {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(rgba(57, 197, 187, 0.16) 1px, transparent 1px),
    radial-gradient(circle at 86% 14%, rgba(255, 126, 157, 0.22) 0%, transparent 45%);
  background-size: 18px 18px, 100% 100%;
}

.modal-sparkle {
  position: absolute;
  font-size: 13px;
  color: rgba(123, 227, 218, 0.55);
  animation: modalFloatSparkle 3.4s ease-in-out infinite;
}
.modal-sparkle.s1 { top: 18px; right: 64px; color: #FF9DBB; }
.modal-sparkle.s2 { bottom: 68px; left: 18px; animation-delay: 0.9s; }
.modal-sparkle.s3 { top: 52%; right: 20px; animation-delay: 1.7s; color: #7BE3DA; }
@keyframes modalFloatSparkle {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
  50% { transform: translateY(-6px) scale(1.2); opacity: 0.95; }
}

.modal-close-x {
  position: absolute;
  top: 16px; right: 16px;
  z-index: 4;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #FFF;
  width: 32px; height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s ease, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-close-x svg { width: 17px; height: 17px; }
.modal-close-x:hover { background: rgba(255, 126, 157, 0.42); border-color: rgba(255, 126, 157, 0.7); }
.modal-close-x:active { transform: scale(0.9); }

.modal-card-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  padding-right: 36px;
}

.modal-mascot-ring {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(57, 197, 187, 0.28), rgba(255, 126, 157, 0.24));
  border: 1.5px solid rgba(123, 227, 218, 0.65);
  box-shadow: 0 0 18px rgba(57, 197, 187, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-mascot-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
}

.mascot-halo {
  position: absolute;
  inset: -4px;
  border-radius: 19px;
  border: 1px dashed rgba(255, 126, 157, 0.55);
  pointer-events: none;
}

.modal-title-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.modal-stage-chip {
  display: inline-flex;
  align-self: flex-start;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(57, 197, 187, 0.28), rgba(255, 126, 157, 0.28));
  border: 1px solid rgba(123, 227, 218, 0.45);
  color: #A7F3EC;
}

.modal-title {
  font-size: 20px;
  font-weight: 900;
  margin: 0;
  background: linear-gradient(90deg, #FFFFFF 0%, #86EFE5 52%, #FFB8CE 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 0.5px;
}

.modal-eq {
  margin-left: auto;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 22px;
}
.modal-eq i {
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, #FF7E9D 0%, #39C5BB 100%);
  animation: modalEqWave 1s ease-in-out infinite alternate;
}
@keyframes modalEqWave {
  from { height: 22%; opacity: 0.55; }
  to { height: 100%; opacity: 1; }
}

/* 实时霓虹弹幕预览条 + 配色球 */
.danmaku-preview-strip {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  margin-bottom: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  backdrop-filter: blur(10px);
}

.preview-pill {
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--aura-primary, #39C5BB) 18%, rgba(12, 24, 34, 0.85));
  border: none;
  box-shadow: 0 0 14px var(--aura-glow, rgba(57, 197, 187, 0.35));
  font-size: 12px;
}

.preview-avatar {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.preview-nick {
  font-weight: 800;
  color: var(--aura-primary, #39C5BB);
  white-space: nowrap;
  flex-shrink: 0;
}

.preview-sep { opacity: 0.6; flex-shrink: 0; }

.preview-msg {
  color: #F4FFFE;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aura-dots {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.aura-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: var(--dot-color);
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.aura-dot.active {
  transform: scale(1.22);
  border-color: #FFFFFF;
  box-shadow: 0 0 10px var(--dot-color);
}

.modal-form-body {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.glass-field {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.10);
  border: none;
  border-radius: 14px;
  padding: 2px 12px;
  transition: box-shadow 0.2s ease, background 0.2s ease;
}

.glass-field:focus-within {
  background: rgba(255, 255, 255, 0.14);
  box-shadow: 0 0 16px var(--aura-glow, rgba(57, 197, 187, 0.35));
}

.field-icon { font-size: 14px; opacity: 0.9; }

.miku-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 9px 4px;
  color: #FFFFFF;
  font-size: 13.5px;
  outline: none;
  font-family: inherit;
}

.glass-textarea-wrap {
  position: relative;
  z-index: 2;
}

.miku-textarea {
  width: 100%;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.10);
  border: none;
  border-radius: 16px;
  padding: 12px 14px 24px;
  color: #FFFFFF;
  font-size: 14px;
  line-height: 1.55;
  outline: none;
  resize: none;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  font-family: inherit;
}

.miku-textarea:focus {
  background: rgba(255, 255, 255, 0.14);
  box-shadow: 0 0 16px var(--aura-glow, rgba(57, 197, 187, 0.32));
}

.miku-input::placeholder, .miku-textarea::placeholder {
  color: rgba(215, 245, 242, 0.56);
}

.char-meter {
  position: absolute;
  right: 12px;
  bottom: 8px;
  font-size: 10.5px;
  font-weight: 700;
  color: rgba(167, 243, 236, 0.55);
  pointer-events: none;
}

.quote-target {
  position: relative;
  z-index: 2;
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(57, 197, 187, 0.14);
  border: none;
  font-size: 13px;
  color: #DDF7F4;
}

.quick-lyric-tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.quick-lyric-tags::-webkit-scrollbar { display: none; }

.quick-pill {
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(57, 197, 187, 0.22), rgba(255, 126, 157, 0.24));
  border: none;
  color: #FFE4EE;
  font-size: 11.5px;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, box-shadow 0.2s ease;
}
.quick-pill:hover {
  background: linear-gradient(135deg, rgba(57, 197, 187, 0.36), rgba(255, 126, 157, 0.42));
  color: #FFFFFF;
  box-shadow: 0 0 12px rgba(255, 126, 157, 0.35);
}
.quick-pill:active { transform: scale(0.92); }

.modal-card-footer {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.modal-btn {
  padding: 10px 22px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 900;
  cursor: pointer;
  border: none;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}
.modal-btn.cancel {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #CFE9E6;
}
.modal-btn.cancel:hover { background: rgba(255, 255, 255, 0.18); }
.modal-btn.cancel:active { transform: scale(0.94); }
.modal-btn.submit {
  background: linear-gradient(95deg, #39C5BB 0%, #FF7E9D 100%);
  color: #FFFFFF;
  box-shadow: 0 6px 22px rgba(255, 126, 157, 0.45), 0 0 16px rgba(57, 197, 187, 0.35);
}
.modal-btn.submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(255, 126, 157, 0.6), 0 0 22px rgba(57, 197, 187, 0.5);
}
.modal-btn.submit:active { transform: scale(0.94); }

.cyber-zoom-enter-active, .cyber-zoom-leave-active { transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.cyber-zoom-enter-from, .cyber-zoom-leave-to { opacity: 0; transform: scale(0.9); }

/* 特效层 */
.mk-fx-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  overflow: hidden;
}

/* 点赞爆裂粒子 */
.mk-burst {
  position: fixed;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 8px currentColor;
  animation: mkBurst 0.72s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes mkBurst {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
}

/* 告白弹幕彗星 */
.danmaku-comet {
  position: absolute;
  right: -45%;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 22px 11px 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(91, 108, 255, 0.96) 0%, rgba(57, 197, 187, 0.96) 100%);
  color: #06121f;
  font-weight: 900;
  font-size: 16px;
  white-space: nowrap;
  box-shadow: 0 0 30px rgba(57, 197, 187, 0.75), 0 0 60px rgba(91, 108, 255, 0.45);
  animation: cometFly var(--dur, 6s) linear forwards;
}
.comet-trail {
  position: absolute;
  right: 100%;
  top: 50%;
  width: 46vw;
  height: 4px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, transparent, rgba(57, 197, 187, 0.9));
  border-radius: 2px;
  filter: blur(1.5px);
}
.comet-text { text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4); }
@keyframes cometFly {
  0% { transform: translateX(0) translateY(0); opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { transform: translateX(-150vw) translateY(-10px); opacity: 0; }
}

/* Responsive Adaptations (移动端专属特别适配) */
@media (max-width: 768px) {
  /* 1. 顶部 HUD 导航栏 移动端适配 */
  .miku-hud-header {
    left: 8px;
    right: 8px;
    top: max(8px, env(safe-area-inset-top));
    height: auto;
    gap: 6px;
    padding: 6px 10px;
    flex-wrap: nowrap;
    justify-content: space-between;
    z-index: 100;
    border-radius: 16px;
    backdrop-filter: blur(16px);
  }
  .hud-left-brand {
    padding: 4px 8px;
    gap: 6px;
  }
  .back-icon { font-size: 16px; }
  .miku-01-badge { font-size: 9px; padding: 1px 4px; }
  .main-title { font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
  .sub-title { display: none; }
  .hud-center-spectrum { display: none; }
  
  .hud-right-actions { gap: 6px; }
  .hud-pill-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    font-size: 11px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hud-pill-btn span { display: none; }
  .pink-pulse-btn {
    height: 36px;
    padding: 0 12px;
    font-size: 11.5px;
    gap: 4px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pink-pulse-btn .btn-ico { width: 14px; height: 14px; }

  /* 2. Danmaku 弹幕 移动端卡片与轨道区适配 */
  .danmaku-section {
    top: calc(56px + env(safe-area-inset-top));
    bottom: max(165px, calc(150px + env(safe-area-inset-bottom)));
  }
  .danmaku-msg-card {
    padding: 5px 10px 5px 5px;
    gap: 6px;
    max-width: 85vw;
    background: rgba(14, 41, 38, 0.88);
    backdrop-filter: blur(12px);
    border-radius: 20px;
  }
  .danmaku-avatar {
    width: 26px;
    height: 26px;
    border-width: 1.5px;
  }
  .danmaku-name { font-size: 11px; }
  .danmaku-text { font-size: 12px; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .danmaku-likes { font-size: 10px; margin-left: 4px; }
  .danmaku-likes .heart-ico { width: 12px; height: 12px; }

  /* 3. 底部二次元播放栏 移动端特别优化 */
  .miku-cyber-player {
    position: fixed;
    left: 8px;
    right: 8px;
    width: calc(100% - 16px);
    bottom: max(8px, env(safe-area-inset-bottom));
    padding: 10px 12px 8px 12px;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "left controls"
      "wave wave";
    gap: 8px 10px;
    align-items: center;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(14, 25, 38, 0.95) 0%, rgba(20, 36, 54, 0.98) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid rgba(57, 197, 187, 0.45);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(57, 197, 187, 0.2);
    box-sizing: border-box;
    z-index: 50;
  }

  .miku-cyber-player::before,
  .miku-cyber-player::after {
    width: 12px;
    height: 12px;
  }

  .cyber-player-left {
    grid-area: left;
    width: 100%;
    min-width: 0;
    gap: 8px;
    justify-content: flex-start;
    display: flex;
    align-items: center;
  }

  .vinyl-record {
    width: 38px;
    height: 38px;
    border-width: 2px;
    flex-shrink: 0;
  }

  .now-playing-badge {
    font-size: 8px;
    padding: 1px 4px;
    margin-bottom: 1px;
    line-height: 1;
  }

  .song-title-cyber {
    font-size: 13px;
    margin: 0;
    max-width: 130px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .song-artist-cyber {
    font-size: 10.5px;
  }

  .cyber-player-right {
    display: contents; /* 提升子元素至 grid 的直系子节点 */
  }

  .cyber-waveform-panel {
    grid-area: wave;
    width: 100%;
    padding: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cyber-time-left, .cyber-time-right {
    font-size: 10px;
    width: 32px;
    text-align: center;
    font-family: Consolas, Monaco, monospace;
  }

  .cyber-controls-panel {
    grid-area: controls;
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: flex-end;
  }

  .cyber-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cyber-btn:active {
    transform: scale(0.92);
  }

  .cyber-btn svg {
    width: 15px;
    height: 15px;
  }

  .cyber-play-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--mk-teal) 0%, var(--mk-pink) 100%);
    box-shadow: 0 0 16px rgba(57, 197, 187, 0.5);
  }

  .cyber-play-btn:active {
    transform: scale(0.92);
  }

  .btn-core svg {
    width: 16px;
    height: 16px;
  }

  /* 4. 留言墙 移动端适配 */
  .miku-board-main {
    inset: calc(56px + env(safe-area-inset-top)) 0 0 0;
    padding: 12px 10px max(155px, calc(140px + env(safe-area-inset-bottom)));
    perspective: none;
  }
  .board-container { padding: 0; }
  .board-header-card {
    padding: 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    border-radius: 14px;
  }
  .board-header-right { width: 100%; display: flex; justify-content: flex-end; }
  .board-title { font-size: 16px; }
  .board-subtitle { font-size: 10.5px; }
  .message-cards-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .miku-msg-card {
    padding: 14px 12px;
    border-radius: 14px;
  }
  .quote-content { font-size: 13.5px; line-height: 1.6; }
  .msg-card-foot {
    gap: 8px;
    padding-top: 10px;
  }
  .foot-action-btn {
    padding: 4px 12px;
    font-size: 11.5px;
    border-radius: 8px;
  }
  .card-tag { font-size: 10px; margin-left: auto; }

  /* 5. Modal 弹窗 移动端适配 */
  .miku-modal-card {
    width: 92%;
    max-width: 480px;
    max-height: 85vh;
    overflow-y: auto;
    padding: 18px 14px max(18px, env(safe-area-inset-bottom));
    border-radius: 16px;
    margin: auto;
  }
  .modal-title { font-size: 15px; }
  .modal-subtitle { font-size: 10px; }
  .quick-lyric-tags { gap: 6px; }
  .quick-pill { font-size: 10px; padding: 3px 8px; }
  .modal-card-footer { gap: 8px; margin-top: 18px; }
  .modal-btn { padding: 8px 16px; font-size: 12px; }
}

@media (max-width: 480px) {
  .miku-hud-header {
    top: max(6px, env(safe-area-inset-top));
    left: 6px;
    right: 6px;
    padding: 4px 8px;
  }
  .hud-left-brand {
    padding: 4px 6px;
  }
  .main-title {
    font-size: 11.5px;
  }
  .miku-01-badge { display: none; }
  .pink-pulse-btn {
    padding: 0 10px;
    font-size: 11px;
    height: 34px;
  }
  .vinyl-record {
    width: 32px;
    height: 32px;
  }
  .song-title-cyber {
    max-width: 105px;
    font-size: 12px;
  }
  .now-playing-badge {
    display: none;
  }
  .cyber-controls-panel {
    gap: 4px;
  }
  .cyber-btn {
    width: 28px;
    height: 28px;
  }
  .cyber-btn svg {
    width: 13px;
    height: 13px;
  }
  .cyber-play-btn {
    width: 34px;
    height: 34px;
  }
}

/* 动效双写：系统偏好 + 站点 reduce-motion */
@media (prefers-reduced-motion: reduce) {
  .aurora, .miku-scanline, .sparkle-dot, .mini-equalizer span.wave,
  .lyric-pill-bubble, .pulse-ring, .main-play-ring-btn.playing,
  .mascot-avatar-ring, .mascot-avatar-ring.wave, .miku-msg-card, .mk-burst, .danmaku-comet,
  .pink-pulse-btn:hover, .waveform-loading, .lyric-pill-bubble::after, .mascot-blush.show {
    animation: none !important;
  }
  .miku-scanline { display: none; }
  .miku-msg-card { transition: border-color 0.3s ease, box-shadow 0.3s ease; }
  .miku-msg-card:hover { transform: translateY(-4px); }
  .pink-pulse-btn:hover, .hud-pill-btn:hover, .ctrl-btn:hover, .main-play-ring-btn:hover { transform: none; }
  .pink-pulse-btn:hover { animation: none !important; }
  .card-glare { display: none; }
}

html.reduce-motion .aurora,
html.reduce-motion .miku-scanline,
html.reduce-motion .sparkle-dot,
html.reduce-motion .mini-equalizer span.wave,
html.reduce-motion .lyric-pill-bubble,
html.reduce-motion .pulse-ring,
html.reduce-motion .main-play-ring-btn.playing,
html.reduce-motion .mascot-avatar-ring,
html.reduce-motion .mascot-avatar-ring.wave,
html.reduce-motion .miku-msg-card,
html.reduce-motion .mk-burst,
html.reduce-motion .danmaku-comet,
html.reduce-motion .pink-pulse-btn:hover,
html.reduce-motion .waveform-loading {
  animation: none !important;
}
html.reduce-motion .lyric-pill-bubble::after { animation: none !important; opacity: 0 !important; }
html.reduce-motion .pink-pulse-btn:hover { animation: none !important; }
html.reduce-motion .miku-scanline { display: none; }
html.reduce-motion .miku-msg-card:hover { transform: translateY(-4px); }
html.reduce-motion .card-glare { display: none; }
.msg-empty-state,
.danmaku-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 56px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.72);
}

.msg-empty-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.msg-empty-sub {
  margin: 0;
  font-size: 13px;
  opacity: 0.75;
}

.danmaku-empty {
  padding: 40px 16px;
  font-size: 13px;
}

.foot-action-btn.delete {
  color: rgba(255, 130, 150, 0.9);
}

.foot-action-btn.delete:hover {
  color: #ff5c7a;
}
</style>
