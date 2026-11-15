<template>
  <div class="miku-chatgpt-page">
    <!-- 1. 左侧边栏 -->
    <aside class="miku-sidebar" :class="{ 'is-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="brand">
          <img src="/images/miku/miku_chibi_main.png" class="brand-avatar" alt="初音 AI" />
          <div class="brand-text">
            <span class="brand-title">初音 AI</span>
          </div>
        </div>
        <button class="sidebar-collapse-btn" @click="toggleSidebar" title="折叠边栏">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
        </button>
      </div>

      <button class="new-chat-btn" @click="startNewChat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16m8-8H4"/></svg>
        <span>新对话</span>
      </button>

      <div class="history-section">
        <div class="history-section-header">
          <span class="history-section-title">历史对话</span>
          <span v-if="conversations.length > 0" class="history-count">{{ conversations.length }}</span>
        </div>
        <div v-if="conversations.length === 0" class="empty-history">暂无历史对话</div>
        <div v-else class="history-list" ref="historyListRef">
          <div
            v-for="conv in conversations"
            :key="conv.id"
            class="history-item"
            :class="{ active: activeConvId === conv.id }"
            @click="selectConversation(conv.id)"
          >
            <div class="history-item-body">
              <span class="history-item-title">{{ conv.title || '新对话' }}</span>
              <span class="history-item-time">{{ formatTime(conv.updated_at) }}</span>
            </div>
            <button
              class="history-delete-btn"
              title="删除对话"
              @click.stop="confirmDelete(conv.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <!-- 已登录用户展示卡片 -->
        <div v-if="isLoggedIn" class="footer-user-card">
          <img :src="userAvatar" alt="User" class="footer-avatar-img" />
          <div class="footer-user-details">
            <span class="user-nickname-label">{{ userNickname }}</span>
            <span class="user-role-tag">正式账号</span>
          </div>
        </div>

        <!-- 游客模式引导卡片 -->
        <div v-else class="footer-guest-card" @click="goToLogin">
          <div class="guest-card-top">
            <span class="guest-card-title">游客体验模式</span>
            <span class="guest-badge-pill" :class="{ danger: remainingGuestCount <= 0 }">
              {{ remainingGuestCount > 0 ? `剩余 ${remainingGuestCount} 次提问` : '提问用尽' }}
            </span>
          </div>
          <button class="guest-action-btn">
            <span>登录解锁无限对话</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        <button class="footer-settings-btn" @click="goHome">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>返回主系统</span>
        </button>
      </div>
    </aside>

    <!-- 移动端侧边栏展开遮罩 -->
    <div
      v-if="!sidebarCollapsed"
      class="sidebar-backdrop"
      @click="toggleSidebar"
    ></div>

    <!-- 2. 主对话区 -->
    <main class="miku-main-stage">
      <!-- 移动端专属吸顶导航栏 -->
      <header class="mobile-chat-header">
        <button
          class="mobile-toggle-btn"
          @click="toggleSidebar"
          title="展开侧边栏"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="mobile-header-title">
          <div class="mobile-brand-logo-mark">
            <span class="logo-note">♪</span>
          </div>
          <span>初音 AI</span>
        </div>
        <button
          class="mobile-new-chat-btn"
          @click="startNewChat"
          title="发起新对话"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </header>

      <!-- 桌面端侧边栏折叠时的悬浮展开按钮 -->
      <button
        v-if="sidebarCollapsed"
        class="floating-sidebar-toggle-btn desktop-only-toggle"
        @click="toggleSidebar"
        title="展开侧边栏"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <path d="M14 15l3-3-3-3"/>
        </svg>
      </button>

      <!-- 消息滚动区 -->
      <div class="chat-content" ref="viewportRef" @scroll="handleScroll">
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-state-header">
            <h2 class="empty-brand-title">初音未来 · 智能对话助手</h2>
            <h1 class="empty-title">你好，我是<span class="highlight-miku">初音 AI</span><svg class="heart-pulse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></h1>
            <p class="empty-subtitle">随心聊聊文章心得、技术问题或创作灵感</p>
          </div>
          
          <div class="empty-suggestion-section">
            <div class="suggestion-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>
              你可以试试
            </div>
            <div class="suggestion-grid">
              <div class="suggestion-card card-blue" @click="sendPreset('西安交通大学城市学院 简介')">
                <div class="card-icon">🏫</div>
                <div class="card-text">西安交通大学<br>城市学院 简介</div>
                <div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
              </div>
              <div class="suggestion-card card-pink" @click="sendPreset('今日陕西省西安市天气')">
                <div class="card-icon">🌤️</div>
                <div class="card-text">今日陕西省<br>西安市天气</div>
                <div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
              </div>
              <div class="suggestion-card card-green" @click="sendPreset('帮我梳理一篇全栈项目复盘文章大纲')">
                <div class="card-icon">📝</div>
                <div class="card-text">全栈项目复盘<br>文章大纲梳理</div>
                <div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
              </div>
              <div class="suggestion-card card-purple" @click="sendPreset('小米创始人雷军')">
                <div class="card-icon">📱</div>
                <div class="card-text">小米创始人雷军<br>简介</div>
                <div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="messages-list">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="message-row"
            :class="msg.role"
          >
            <div class="message-avatar">
              <img v-if="msg.role === 'model'" src="/images/miku/miku_chibi_main.png" alt="初音 AI" class="avatar-img ai-avatar-img" />
              <img v-else-if="userAvatar" :src="userAvatar" alt="User" class="avatar-img user-avatar-img" />
              <span v-else class="avatar-text">{{ userNickname.charAt(0) }}</span>
            </div>
            <div class="message-main">
              <div class="message-header">
                <span class="message-sender">{{ msg.role === 'user' ? userNickname : '初音 AI' }}</span>
              </div>

              <!-- 🌐 专属极速联网检索动态状态指示条 (媲美 Perplexity/DeepSeek) -->
              <div
                v-if="msg.searchStatus"
                class="ai-search-indicator"
                :class="{ 'is-searching': msg.searchStatus === 'searching', 'is-done': msg.searchStatus === 'completed' }"
              >
                <span v-if="msg.searchStatus === 'searching'" class="search-pulse-glow"></span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon" :class="{ 'spinning': msg.searchStatus === 'searching' }">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span class="search-label">{{ msg.searchTitle || (msg.searchStatus === 'searching' ? '正在全网检索最新信息…' : '已融合全网实时资讯') }}</span>
                <span v-if="msg.searchStatus === 'searching'" class="search-shimmer-sweep"></span>
                <span v-else class="search-check-mark">✓</span>
              </div>

              <!-- 天气卡片（和风天气结构化数据） -->
              <WeatherCard v-if="msg.weather" :data="msg.weather" />

              <!-- 思考过程（可折叠面板） -->
              <div
                v-if="msg.role === 'model' && (msg.displayedReasoning || msg.reasoning)"
                class="thinking-panel"
              >
                <button type="button" class="thinking-toggle" @click="toggleThinking(msg)">
                  <span class="thinking-brain">🧠</span>
                  <span class="thinking-title">
                    {{ msg.isThinking ? `正在思考 ${msg.thinkingTime}s…` : `思考过程 · ${msg.thinkingTime}s` }}
                  </span>
                  <span class="thinking-chevron" :class="{ expanded: !msg.thinkingCollapsed }">▾</span>
                </button>
                <div v-show="!msg.thinkingCollapsed" class="thinking-content">
                  {{ msg.displayedReasoning || msg.reasoning }}
                </div>
              </div>

              <!-- 2. 正文答案输出 (Answer Content with Typewriter Effect) -->
              <div
                v-if="(msg.displayedContent || msg.content)"
                class="message-body markdown-body"
                :class="{ 'is-typing': isGenerating && idx === messages.length - 1 }"
              >
                <span v-html="getMsgHtml(msg)"></span>
              </div>
              <div v-else-if="isGenerating && msg.role === 'model' && !msg.searchStatus && !(msg.displayedReasoning || msg.reasoning)" class="loading-bubble">
                <span class="breathing-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入区 -->
      <div class="chat-input-area">
        <!-- 未登录游客体验提示条 -->
        <div v-if="!isLoggedIn" class="guest-tip-bar" @click="goToLogin">
          <span class="tip-icon">💡</span>
          <span class="tip-text">
            当前为游客体验模式，剩余 <strong class="tip-highlight">{{ remainingGuestCount }}</strong> 次免费提问额度
          </span>
          <button class="tip-login-link">登录解封无限对话 →</button>
        </div>

        <div class="input-box">
          <div class="input-prefix-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>
          </div>
          <textarea
            v-model="inputQuery"
            ref="textareaRef"
            rows="1"
            :disabled="isGenerating"
            :placeholder="isLoggedIn ? '发送消息给初音 AI…' : (remainingGuestCount > 0 ? `发送消息（游客体验中，剩余 ${remainingGuestCount} 次）…` : '试用提问额度已用尽，请登录后继续…')"
            @keydown.enter.exact="handleKeydownEnter"
            @input="autoGrow"
          ></textarea>
          <div class="input-actions">
            <!-- 🌐 极速联网搜索开关 -->
            <button
              type="button"
              class="web-search-toggle-btn tactile-btn"
              :class="{ 'is-active': isWebSearch }"
              @click="toggleWebSearch"
              :title="isWebSearch ? '已开启极速全网搜索（点击可关闭）' : '已关闭联网搜索（点击可开启）'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="web-icon">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>{{ isWebSearch ? '联网' : '离线' }}</span>
              <span class="status-indicator-dot-mini" :class="isWebSearch ? 'online' : 'offline'"></span>
            </button>

            <button
              class="send-btn"
              :class="{ 'is-stop-mode': isGenerating }"
              :disabled="!isGenerating && !inputQuery.trim()"
              @click="onSendClick"
              @touchstart.prevent.stop="onSendTouch"
              title="发送消息"
              aria-label="发送消息"
            >
              <span v-if="isGenerating" class="stop-square">■</span>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
        <div class="input-disclaimer">内容由 AI 生成，请核实重要信息。</div>
      </div>

      <!-- 回到底部按钮 -->
      <button
        v-if="showScrollArrow"
        class="scroll-bottom-btn"
        @click="scrollToBottomSmooth"
        title="回到底部"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
      </button>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import { useAiChat } from '../../composables/useAiChat';
import WeatherCard from './components/WeatherCard.vue';

const router = useRouter();
const userStore = useUserStore();

// 布局：侧边栏折叠
const sidebarCollapsed = ref(false);
const toggleSidebar = () => { sidebarCollapsed.value = !sidebarCollapsed.value; };
const setCollapsed = (v) => { sidebarCollapsed.value = v; };

const chat = useAiChat(userStore, router);
const {
  conversations, activeConvId, messages, inputQuery, isGenerating, isLoggedIn,
  viewportRef, textareaRef, quota,
  confirmDelete, formatTime,
  showScrollArrow, handleScroll, scrollToBottomSmooth,
  autoGrow, sendPreset, handleKeydownEnter, onSendClick, onSendTouch,
  isWebSearch, toggleWebSearch,
  toggleThinking,
  getMsgHtml, fetchConversations,
} = chat;

// 需要联动侧边栏折叠的会话动作
const startNewChat = () => chat.startNewChat(setCollapsed);
const selectConversation = (id) => chat.selectConversation(id, setCollapsed);
const remainingGuestCount = quota.remainingGuestCount;

// 用户展示信息
const userAvatar = computed(() =>
  (userStore.userInfo && userStore.userInfo.avatar_url) ||
  'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png');
const userNickname = computed(() =>
  (userStore.userInfo && userStore.userInfo.nickname) || '游客');

const goToLogin = () => router.push('/login');
const goHome = () => router.push('/');

onMounted(() => {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) sidebarCollapsed.value = true;
  fetchConversations();
});

// 离开 AI 页：中止进行中的流式请求（打字机由 useTypewriter 内部停止）
onUnmounted(() => {
  chat.stopGeneration();
});
</script>
<style scoped>
/* ================= 简约毛玻璃风格 ================= */
.miku-chatgpt-page {
  /* 极简玻璃态 Token */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-bg-hover: rgba(255, 255, 255, 0.9);
  --glass-border: rgba(255, 255, 255, 0.8);
  --glass-border-hover: rgba(255, 255, 255, 1);
  --glass-blur: blur(24px) saturate(160%);
  --glass-blur-hover: blur(16px) saturate(180%);
  --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9);

  display: flex;
  width: 100vw;
  height: 100vh;
  background:
    linear-gradient(to right, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.55) 100%),
    url('/images/miku/miku_ai_bg.webp') right top / cover no-repeat;
  background-color: #f0f9ff;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  overflow: hidden;
  position: relative;
}

/* ===== 左侧边栏 (初音薄荷磨砂玻璃) ===== */
.miku-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(247, 253, 252, 0.92) 0%, rgba(235, 250, 248, 0.9) 100%);
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
  border-right: 1px solid rgba(57, 197, 187, 0.28);
  box-shadow: 4px 0 28px rgba(18, 167, 156, 0.08);
  display: flex;
  flex-direction: column;
  padding: 14px 12px;
  z-index: 30;
  transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: #14322F;
}

.miku-sidebar.is-collapsed {
  margin-left: -280px;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 25;
  display: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 0 4px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-avatar {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 0;
  border: none;
  box-shadow: none;
  background: transparent;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 15px;
  font-weight: 700;
  color: #1d1d1f;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 11px;
  color: #86868b;
  font-weight: 500;
}

.sidebar-collapse-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
  color: #424245;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.sidebar-collapse-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1d1d1f;
}

.sidebar-collapse-btn svg { width: 14px; height: 14px; }

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.15s ease;
  margin-bottom: 16px;
}

.new-chat-btn:hover {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.new-chat-btn svg { width: 15px; height: 15px; }

.history-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.history-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 4px;
}

.history-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #86868b;
}

.history-count {
  font-size: 11px;
  font-weight: 500;
  color: #86868b;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 6px;
  border-radius: 8px;
}

.empty-history {
  font-size: 12px;
  color: #86868b;
  padding: 10px 4px;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 2px;
}

.history-list {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}
.history-list::-webkit-scrollbar { display: none !important; width: 0 !important; }

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  position: relative;
  overflow: hidden;
}

.history-item::before {
  display: none;
}

.history-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.history-item.active {
  background: rgba(0, 0, 0, 0.07);
  border-color: rgba(0, 0, 0, 0.04);
}

.history-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-item-title {
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item.active .history-item-title {
  font-weight: 600;
  color: #000000;
}

.history-item-time {
  font-size: 11px;
  color: #86868b;
}

.history-delete-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: #86868b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.15s ease;
}

.history-item:hover .history-delete-btn { opacity: 1; }
.history-delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}
.history-delete-btn svg { width: 13px; height: 13px; }

.sidebar-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-settings-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #424245;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.footer-settings-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  color: #1d1d1f;
  border-color: rgba(0, 0, 0, 0.1);
}

.footer-settings-btn svg { width: 15px; height: 15px; }

/* ===== 侧边栏底部用户/游客卡片 ===== */
.footer-user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.footer-avatar-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.footer-user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-nickname-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role-tag {
  font-size: 10px;
  color: #6e6e73;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 5px;
  border-radius: 4px;
  align-self: flex-start;
}

.footer-guest-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.15s ease;
}

.footer-guest-card:hover {
  background: rgba(255, 255, 255, 0.9);
}

.guest-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.guest-card-title {
  font-size: 12px;
  font-weight: 600;
  color: #1d1d1f;
}

.guest-badge-pill {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  color: #6e6e73;
}

.guest-badge-pill.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.guest-action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  background: #1d1d1f;
  color: #ffffff;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.guest-action-btn:hover {
  background: #333336;
}

.guest-action-btn svg {
  width: 12px;
  height: 12px;
}

/* ===== 主对话区 ===== */
.miku-main-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.mobile-chat-header {
  display: none;
}

.floating-sidebar-toggle-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 25;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.floating-sidebar-toggle-btn:hover {
  background: #ffffff;
  color: #0f172a;
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.floating-sidebar-toggle-btn svg {
  width: 18px;
  height: 18px;
}

/* 主舞台背底背景统一由外层容器呈现 */
.miku-main-stage::before {
  display: none;
}

.chat-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  position: relative;
  z-index: 20;
}

.header-menu-btn {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  color: #557774;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.header-menu-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  color: #1d1d1f;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.header-menu-btn svg { width: 16px; height: 16px; }

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-name {
  font-size: 16px;
  font-weight: 700;
  color: #1d1d1f;
}

.header-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  border: 1px solid rgba(0, 122, 255, 0.2);
  padding: 2px 8px;
  border-radius: 20px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #007aff;
  animation: pulseDot 1.4s infinite ease-in-out;
}

@keyframes pulseDot {
  0%, 100% { opacity: 0.3; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

.header-new-chat-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  color: #557774;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.header-new-chat-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  color: #1d1d1f;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.header-new-chat-btn svg { width: 16px; height: 16px; }

.chat-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  scroll-behavior: smooth;
  position: relative;
  z-index: 1;
}

/* ===== 空状态 ===== */
.empty-state {
  width: 100%;
  max-width: 900px;
  margin: 100px auto 60px;
  display: flex;
  flex-direction: column;
  padding: 0 40px;
  position: relative;
  z-index: 10;
}

.empty-state-header {
  margin-bottom: 60px;
}

.empty-brand-title {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(18, 167, 156, 0.28);
  font-size: 14px;
  font-weight: 800;
  color: #0B7A73;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
  box-shadow: 0 2px 10px rgba(14, 41, 38, 0.06);
}

.empty-title {
  font-size: 44px;
  font-weight: 900;
  color: #1e293b;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.highlight-miku {
  background: linear-gradient(90deg, #0ea5e9, #14b8a6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0 10px;
}

.heart-pulse-icon {
  width: 44px;
  height: 44px;
  color: #fb7185;
  margin-left: 10px;
  animation: heartPulse 1.5s infinite;
}

@keyframes heartPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.empty-subtitle {
  font-size: 20px;
  color: #64748b;
}

.empty-suggestion-section {
  display: flex;
  flex-direction: column;
}

.suggestion-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 16px;
}

.suggestion-title svg {
  width: 18px;
  height: 18px;
}

.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.suggestion-card {
  padding: 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(57, 197, 187, 0.32);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(18, 167, 156, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  height: 140px;
}

.suggestion-card::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.45;
  z-index: 0;
  transition: opacity 0.3s ease;
}

.suggestion-card:hover {
  transform: translateY(-5px);
  border-color: rgba(57, 197, 187, 0.65);
  box-shadow: 0 16px 36px rgba(57, 197, 187, 0.18), 0 0 18px rgba(255, 126, 157, 0.12);
}

.suggestion-card:hover::before {
  opacity: 0.8;
}

.card-blue::before { background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(186, 230, 253, 0.6) 100%); }
.card-pink::before { background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(254, 205, 211, 0.6) 100%); }
.card-green::before { background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(167, 243, 208, 0.6) 100%); }
.card-purple::before { background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(233, 213, 255, 0.6) 100%); }

.card-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  margin-bottom: auto;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.card-text {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  z-index: 1;
}

.card-arrow {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 1;
}

.card-arrow svg {
  width: 14px;
  height: 14px;
}

.card-blue .card-arrow { background: #38bdf8; }
.card-pink .card-arrow { background: #f472b6; }
.card-green .card-arrow { background: #34d399; }
.card-purple .card-arrow { background: #a78bfa; }

/* ===== 消息列表 ===== */
.messages-list {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.message-row {
  width: 100%;
  display: flex;
  gap: 16px;
  padding: 24px max(20px, calc((100% - 760px) / 2));
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  transition: background 0.15s ease;
}

.message-row:hover { background: rgba(0, 0, 0, 0.01); }

.message-row.user {
  background: transparent;
}

.message-row.user:hover { background: rgba(0, 0, 0, 0.02); }

.message-avatar {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.message-row.model .message-avatar {
  background: transparent;
  box-shadow: none;
  border: none;
  border-radius: 0;
  overflow: visible;
}

.message-row.user .message-avatar {
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.7);
}

.message-avatar:hover {
  transform: scale(1.06);
}

.message-avatar img.ai-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 0;
  border: none;
  box-shadow: none;
  filter: none;
}

.message-avatar img.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.message-avatar span {
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
}

.message-main {
  flex: 1;
  min-width: 0;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-sender {
  font-size: 13px;
  font-weight: 600;
  color: #86868b;
}

.message-row.user .message-sender {
  color: #86868b;
}


/* 思考过程折叠面板 */
.thinking-panel {
  margin-bottom: 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 22, 34, 0.72);
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}
.thinking-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(180, 200, 220, 0.85);
  font-size: 13px;
  text-align: left;
  transition: background 0.2s;
}
.thinking-toggle:hover {
  background: rgba(255, 255, 255, 0.04);
}
.thinking-brain {
  font-size: 15px;
}
.thinking-title {
  flex: 1;
  font-weight: 500;
  letter-spacing: 0.3px;
}
.thinking-chevron {
  font-size: 14px;
  transition: transform 0.25s ease;
  color: rgba(160, 180, 200, 0.6);
}
.thinking-chevron.expanded {
  transform: rotate(180deg);
}
.thinking-content {
  padding: 2px 16px 14px 40px;
  font-size: 13px;
  line-height: 1.75;
  color: rgba(150, 170, 190, 0.82);
  white-space: pre-wrap;
  word-break: break-word;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  max-height: 320px;
  overflow-y: auto;
}

.message-body {
  font-size: 15px;
  line-height: 1.7;
  color: rgba(235, 240, 245, 0.95);
  background: rgba(20, 28, 40, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 14px 18px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  animation: fadeIn 0.3s ease-out;
  transition: all 0.2s ease;
  contain: content;
}

.message-body.is-typing {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  will-change: contents;
}

.message-body:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
}

.message-row.user .message-body {
  background: rgba(35, 55, 75, 0.55);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(240, 246, 252, 0.95);
}

/* ===== 极速联网检索动态状态胶囊 (媲美 Perplexity / DeepSeek) ===== */
.ai-search-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  width: fit-content;
}

.ai-search-indicator.is-searching {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.08));
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #0284c7;
  box-shadow: 0 2px 12px rgba(56, 189, 248, 0.16);
  animation: fadeIn 0.25s ease-out;
}

.ai-search-indicator.is-done {
  background: rgba(240, 253, 244, 0.9);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #166534;
  font-size: 12px;
  padding: 4px 12px;
  box-shadow: none;
}

.ai-search-indicator .search-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  color: #0284c7;
}

.ai-search-indicator.is-done .search-icon {
  color: #16a34a;
}

.ai-search-indicator .search-icon.spinning {
  animation: searchIconRotate 2s linear infinite;
}

@keyframes searchIconRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ai-search-indicator .search-pulse-glow {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  animation: pulseDot 0.8s infinite alternate;
}

@keyframes pulseDot {
  0% { transform: scale(0.8); opacity: 0.4; }
  100% { transform: scale(1.4); opacity: 1; }
}

.ai-search-indicator .search-shimmer-sweep {
  position: absolute;
  top: 0;
  left: -100%;
  width: 70%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmerSweep 1.5s infinite ease-in-out;
  pointer-events: none;
}

@keyframes shimmerSweep {
  0% { left: -70%; }
  100% { left: 160%; }
}

.ai-search-indicator .search-check-mark {
  font-weight: 700;
  color: #16a34a;
  margin-left: 2px;
}

/* ===== 检索加载态 ===== */
.loading-bubble {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 16px;
  color: rgba(15, 23, 42, 0.75);
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  animation: fadeIn 0.2s ease-out;
}

.loading-bubble .loading-text {
  color: rgba(15, 23, 42, 0.85);
}

.loading-bubble .breathing-dots {
  display: inline-flex;
  gap: 4px;
}

.loading-bubble .breathing-dots span {
  font-weight: 700;
  color: #38bdf8;
  animation: breatheDot 0.85s infinite ease-in-out both;
}

.loading-bubble .breathing-dots span:nth-child(1) { animation-delay: 0s; }
.loading-bubble .breathing-dots span:nth-child(2) { animation-delay: 0.15s; }
.loading-bubble .breathing-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes breatheDot {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.85); }
  40% { opacity: 1; transform: scale(1.3); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 极速现代打字机流光光标 (彻底告别笨重慢速黑块) ===== */
.markdown-body.is-typing > span::after {
  content: '';
  display: inline-block;
  width: 2.5px;
  height: 1.15em;
  margin-left: 3px;
  background: linear-gradient(180deg, #38bdf8, #0ea5e9);
  border-radius: 2px;
  vertical-align: -0.15em;
  animation: smoothCursorPulse 0.75s ease-in-out infinite alternate;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.65);
}

@keyframes smoothCursorPulse {
  0% { opacity: 0.25; transform: scaleY(0.85); }
  100% { opacity: 1; transform: scaleY(1); }
}

/* ===== 底部悬浮输入区 ===== */
.chat-input-area {
  flex-shrink: 0;
  padding: 20px 40px 40px;
  background: linear-gradient(to top, rgba(240, 249, 255, 1) 20%, rgba(240, 249, 255, 0));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 10;
}

/* ===== 游客体验提示条 ===== */
.guest-tip-bar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(56, 189, 248, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  font-size: 12px;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.guest-tip-bar:hover {
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(56, 189, 248, 0.15);
  transform: translateY(-1px);
}

.tip-highlight {
  color: #0284c7;
  font-weight: 800;
}

.tip-login-link {
  background: transparent;
  border: none;
  color: #0284c7;
  font-weight: 700;
  cursor: pointer;
  padding: 0 4px;
}

.input-box {
  width: 100%;
  max-width: 900px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 12px 20px;
  border-radius: 36px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.input-box:focus-within {
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 12px 40px rgba(56, 189, 248, 0.15);
}

.input-prefix-icon {
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
}
.input-prefix-icon svg { width: 22px; height: 22px; }

.input-box textarea {
  flex: 1;
  box-sizing: border-box;
  min-height: 24px;
  max-height: 120px;
  border: none;
  outline: none;
  background: transparent;
  color: #1e293b;
  font-size: 16px;
  line-height: 24px;
  font-family: inherit;
  resize: none;
  padding: 0 4px;
  overflow-y: auto;
}

.input-box textarea::placeholder { color: #94a3b8; }
.input-box textarea:disabled { opacity: 0.6; }

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== 极速联网搜索开关 ===== */
.web-search-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  height: 32px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.85);
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}

.web-search-toggle-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(57, 197, 187, 0.4);
  color: #0d9488;
}

.web-search-toggle-btn .web-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.3s ease;
}

.web-search-toggle-btn.is-active {
  background: rgba(57, 197, 187, 0.12);
  border-color: rgba(57, 197, 187, 0.5);
  color: #0d9488;
  box-shadow: 0 2px 8px rgba(57, 197, 187, 0.18);
}

.web-search-toggle-btn.is-active .web-icon {
  transform: rotate(20deg);
  stroke: #0d9488;
}

.status-indicator-dot-mini {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  transition: background-color 0.2s ease;
}

.status-indicator-dot-mini.online {
  background-color: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.7);
}

.status-indicator-dot-mini.offline {
  background-color: #cbd5e1;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f1f5f9;
  color: #3b82f6;
}

.icon-btn svg { width: 20px; height: 20px; }

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #38bdf8;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  background: #0ea5e9;
  box-shadow: 0 6px 16px rgba(56, 189, 248, 0.4);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.92);
  background: #0284c7;
}

.send-btn.is-stop-mode {
  background: #ef4444 !important;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4) !important;
  opacity: 1 !important;
  cursor: pointer !important;
}

.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.send-btn svg { width: 18px; height: 18px; }
.stop-square { font-size: 13px; line-height: 1; }

.input-disclaimer {
  display: none;
}

/* ===== 回到底部按钮 ===== */
.scroll-bottom-btn {
  position: absolute;
  bottom: 100px;
  right: 28px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(30, 40, 55, 0.6);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(235, 240, 245, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  z-index: 50;
  transition: all 0.25s ease;
}

.scroll-bottom-btn:hover {
  transform: scale(1.06);
  background: rgba(40, 55, 75, 0.8);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}

.scroll-bottom-btn svg { width: 17px; height: 17px; }

/* ===== Markdown 内容样式 ===== */
.message-body :deep(p) { margin: 0 0 12px; }
.message-body :deep(p):last-child { margin-bottom: 0; }

.message-body :deep(strong) {
  color: #a0d8ef;
  font-weight: 700;
  text-shadow: none;
}

.message-body :deep(em) {
  color: rgba(235, 240, 245, 0.85);
  font-style: italic;
  text-shadow: none;
}

.message-body :deep(blockquote) {
  margin: 12px 0;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(160, 216, 239, 0.35);
  border-radius: 10px;
  color: rgba(235, 240, 245, 0.85);
}

.message-body :deep(.inline-code) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #a0d8ef;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 13.5px;
}

.message-body :deep(.code-block-box) {
  background: rgba(12, 16, 24, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  margin: 12px 0;
  overflow: hidden;
  box-shadow: none;
}

.message-body :deep(.code-head) {
  background: rgba(255, 255, 255, 0.04);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(235, 240, 245, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.message-body :deep(pre) {
  padding: 12px;
  margin: 0;
  overflow-x: auto;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 13.5px;
  color: rgba(235, 240, 245, 0.9);
  line-height: 1.6;
}

.message-body :deep(.md-h1),
.message-body :deep(.md-h2),
.message-body :deep(.md-h3) {
  color: #ffffff;
  font-weight: 700;
  margin: 18px 0 8px;
  line-height: 1.4;
  border-bottom: none;
  text-shadow: none;
}

.message-body :deep(.md-h1) { font-size: 18px; }
.message-body :deep(.md-h2) { font-size: 16px; }
.message-body :deep(.md-h3) { font-size: 15px; }

.message-body :deep(ul),
.message-body :deep(ol) {
  margin: 6px 0 10px 0;
  padding-left: 0;
  list-style: none;
}

.message-body :deep(.md-li) {
  margin-bottom: 6px;
  padding-left: 0;
  list-style: none;
}

.message-body :deep(li::marker) {
  display: none;
  content: none;
}

.message-body :deep(.md-clean-item) {
  margin: 6px 0;
  padding: 2px 0;
  line-height: 1.7;
}

.message-body :deep(.md-item-num) {
  color: #a0d8ef;
  font-weight: 700;
}

/* ===== 响应式 ===== */
/* ===== 响应式 ===== */
/* ===== 响应式 ===== */
@media (max-width: 860px) {
  .message-row { padding: 16px 14px; }
  .message-main { max-width: none; }
  .empty-state { padding: 0 16px; margin: 30px auto 20px; }
  .empty-title { font-size: 28px; }
  .empty-subtitle { font-size: 14px; }
  .empty-suggestion-chips { flex-direction: column; align-items: stretch; }
  .chip { text-align: center; }
  .suggestion-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}

@media (max-width: 768px) {
  .miku-chatgpt-page {
    height: 100dvh;
    height: 100vh;
  }

  /* 1. 移动端抽屉式边栏 (1:1 继承 PC 毛玻璃透明度与风貌) */
  .miku-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 84vw;
    max-width: 320px;
    margin-left: 0 !important;
    transform: translateX(0);
    z-index: 100;
    background: rgba(255, 255, 255, 0.82) !important;
    backdrop-filter: blur(24px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
    border-right: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 6px 0 36px rgba(0, 0, 0, 0.12);
    padding-top: max(14px, env(safe-area-inset-top));
    padding-bottom: max(14px, env(safe-area-inset-bottom));
  }
  .miku-sidebar.is-collapsed {
    transform: translateX(-100%);
    margin-left: 0 !important;
  }
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 95;
  }

  /* 2. 移动端顶栏 (与 PC 通透背景无缝融为一体) */
  .desktop-only-toggle {
    display: none !important;
  }
  .mobile-chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: max(8px, env(safe-area-inset-top)) 14px 8px 14px;
    height: auto;
    min-height: 48px;
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.5);
    position: sticky;
    top: 0;
    z-index: 40;
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  .mobile-toggle-btn,
  .mobile-new-chat-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    color: #334155;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.15s ease;
    flex-shrink: 0;
  }
  .mobile-toggle-btn:active,
  .mobile-new-chat-btn:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.95);
  }
  .mobile-toggle-btn svg,
  .mobile-new-chat-btn svg {
    width: 18px;
    height: 18px;
  }
  .mobile-header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 800;
    color: #1d1d1f;
  }
  .mobile-brand-logo-mark {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #FFFFFF;
    border: 1.2px solid rgba(57, 197, 187, 0.4);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .mobile-brand-logo-mark .logo-note {
    font-size: 14px;
    font-weight: 900;
    color: #12A79C;
  }

  /* 3. 移动端空状态与推荐卡片 (1:1 还原 PC 炫彩毛玻璃与粉色脉冲心形) */
  .empty-state {
    margin: 18px auto 16px;
    padding: 0 14px;
  }
  .heart-pulse-icon {
    width: 32px;
    height: 32px;
    color: #fb7185; /* 与 PC 保持一致：粉红色脉冲爱心 */
    margin-left: 6px;
  }
  .empty-state-header {
    margin-bottom: 20px;
  }
  .empty-title {
    font-size: 24px;
    flex-wrap: wrap;
    gap: 4px;
    line-height: 1.35;
  }
  .empty-brand-title {
    font-size: 22px;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .empty-subtitle {
    font-size: 14px;
    margin-top: 4px;
    color: #64748b;
  }
  .suggestion-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .suggestion-card {
    height: 120px;
    padding: 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .suggestion-card::before {
    opacity: 0.75; /* 确保色彩渐变背景在移动端亮丽呈现 */
  }
  .suggestion-card:active {
    transform: scale(0.97);
  }
  .card-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
    margin-bottom: auto;
  }
  .card-text {
    font-size: 12.5px;
    line-height: 1.35;
    font-weight: 600;
  }
  .card-arrow {
    position: absolute;
    right: 12px;
    bottom: 12px;
    width: 22px;
    height: 22px;
  }
  .card-arrow svg {
    width: 12px;
    height: 12px;
  }

  /* 4. 消息行与复制按钮 */
  .message-row {
    padding: 14px 12px;
    gap: 12px;
  }
  .message-avatar {
    width: 32px;
    height: 32px;
  }
  .avatar-img {
    width: 32px;
    height: 32px;
  }
  .message-body,
  .loading-bubble {
    font-size: 14.5px;
    padding: 12px 16px;
    border-radius: 16px;
  }
  .history-delete-btn {
    opacity: 0.88;
  }

  /* 5. 底部输入框 (1:1 还原 PC 胶囊毛玻璃气泡，兼顾移动端打字宽度) */
  .chat-input-area {
    padding: 8px 10px max(10px, env(safe-area-inset-bottom));
  }
  .input-box {
    padding: 7px 8px 7px 14px;
    border-radius: 26px;
    gap: 8px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.08);
  }
  .input-box:focus-within {
    border-color: rgba(56, 189, 248, 0.4);
    box-shadow: 0 10px 32px rgba(56, 189, 248, 0.15);
  }
  .input-prefix-icon {
    display: none;
  }
  .input-box textarea {
    font-size: 15px;
    line-height: 22px;
    padding: 2px 0;
  }
  .input-actions {
    gap: 6px;
  }
  .web-search-toggle-btn {
    padding: 5px 8px;
    font-size: 11px;
    gap: 4px;
  }
  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
  }
  .guest-tip-bar {
    padding: 6px 14px;
    font-size: 11.5px;
    margin-bottom: 6px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.3);
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.08);
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }
  .input-disclaimer {
    display: block;
    font-size: 11px;
    color: rgba(140, 150, 165, 0.75);
    text-align: center;
    margin-top: 4px;
  }
  .scroll-bottom-btn {
    bottom: calc(76px + env(safe-area-inset-bottom));
    right: 12px;
    width: 38px;
    height: 38px;
  }
  .message-body :deep(pre) {
    font-size: 12px;
    padding: 8px 10px;
  }
  .message-body :deep(.inline-code) {
    font-size: 12px;
  }
  .message-body :deep(table) {
    display: block;
    overflow-x: auto;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
  }
}

@media (max-width: 480px) {
  .empty-title {
    font-size: 21px;
  }
  .empty-brand-title {
    font-size: 20px;
  }
  .empty-subtitle {
    font-size: 13px;
  }
  .suggestion-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .suggestion-card {
    height: 110px;
    padding: 12px;
    border-radius: 14px;
  }
  .card-text {
    font-size: 11.5px;
    line-height: 1.35;
  }
  .card-icon {
    width: 26px;
    height: 26px;
    font-size: 13px;
  }
  .card-arrow {
    right: 10px;
    bottom: 10px;
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 360px) {
  .suggestion-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .suggestion-card {
    height: 86px;
  }
}
</style>

