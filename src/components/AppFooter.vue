<template>
  <footer class="anime-footer">
    <!-- 顶部初音音波律动边条 -->
    <div class="miku-rhythm-strip">
      <div class="sound-wave">
        <span v-for="n in waveBarCount" :key="n" class="wave-bar" :style="{ animationDelay: (n * 0.04) + 's', animationDuration: (0.7 + (n % 8) * 0.12) + 's' }"></span>
      </div>
      <div class="floating-notes">
        <span class="note n1">♪</span>
        <span class="note n2">♫</span>
        <span class="note n3">♬</span>
        <span class="note n4">♩</span>
      </div>
    </div>

    <!-- Footer 主体无框全开内容容器 -->
    <div class="footer-container">
      <div class="footer-grid">

        <!-- 1. 品牌理念与社媒区 -->
        <div class="footer-brand">
          <h3 class="brand-title">
            <span class="note-icon">♪</span> 初音小站
          </h3>
          <p class="brand-desc">
            用代码与旋律书写灵感，用文字与光影记录时光点滴。
          </p>
          <div class="social-capsules">
            <div
              v-for="s in socials"
              :key="s.key"
              class="social-chip tactile-btn"
              @click="handleSocialClick(s)"
            >
              <span class="social-dot"></span>
              <span class="social-title">{{ s.title }}</span>
              <!-- 悬停气泡提示 -->
              <div class="social-hover-tooltip">
                <span class="tooltip-label">{{ s.icon }} {{ s.title }}：</span>
                <span class="tooltip-val">{{ s.key === 'bilibili' ? '点击确认后前往主页' : s.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 站内精选导航 -->
        <div class="footer-col">
          <h4 class="col-title">
            <span class="title-symbol">✦</span> 站内导航
          </h4>
          <ul class="nav-links">
            <li><router-link to="/" class="nav-link-item"><span class="link-arrow">›</span> 首页看板</router-link></li>
            <li><router-link to="/articles" class="nav-link-item"><span class="link-arrow">›</span> 技术文库</router-link></li>
            <li><router-link to="/snapshots" class="nav-link-item"><span class="link-arrow">›</span> 随拍图集</router-link></li>
            <li><router-link to="/messages" class="nav-link-item"><span class="link-arrow">›</span> 留言墙</router-link></li>
          </ul>
        </div>

        <!-- 3. 探索与归档 -->
        <div class="footer-col">
          <h4 class="col-title">
            <span class="title-symbol">✦</span> 关于与归档
          </h4>
          <ul class="nav-links">
            <li><router-link to="/about" class="nav-link-item"><span class="link-arrow">›</span> 关于博主</router-link></li>
            <li><router-link to="/categories" class="nav-link-item"><span class="link-arrow">›</span> 分类导航</router-link></li>
            <li><router-link to="/tags" class="nav-link-item"><span class="link-arrow">›</span> 标签云</router-link></li>
            <li><router-link to="/archives" class="nav-link-item"><span class="link-arrow">›</span> 时光归档</router-link></li>
          </ul>
        </div>

        <!-- 4. 站点主题看板 -->
        <div class="footer-col miku-widget-col">
          <h4 class="col-title">
            <span class="title-symbol">♪</span> 站点主题
          </h4>
          <div class="miku-status-card">
            <div class="miku-avatar-small">
              <img src="/images/miku/miku_chibi_main.png" alt="Q版初音" class="miku-chibi-icon" loading="lazy" decoding="async" />
            </div>
            <div class="status-info">
              <div class="miku-name">初音未来</div>
              <div class="miku-ver">主题配色 · #39C5BB</div>
            </div>
          </div>
          <div class="equalizer-mini">
            <div class="eq-bars">
              <span v-for="i in 14" :key="i" class="eq-bar" :style="{ animationDuration: (0.35 + (i % 6) * 0.12) + 's' }"></span>
            </div>
          </div>
        </div>

      </div>

      <!-- 霓虹光晕分割线 -->
      <div class="footer-divider-line"></div>

      <!-- 底部版权与标识 -->
      <div class="footer-bottom">
        <p class="copyright">
          版权所有 © 2026 <strong>初音小站</strong> · 陕ICP备2024027143号
        </p>
        <p class="miku-credit">
          初音未来主题博客
        </p>
      </div>
    </div>

    <!-- 联系方式弹窗 -->
    <teleport to="body">
      <transition name="modal-fade">
        <div v-if="contactModalVisible" class="contact-modal-backdrop" @click.self="contactModalVisible = false">
          <div class="contact-modal-card">
            <button class="modal-close-btn" @click="contactModalVisible = false" title="关闭 (Esc)">✕</button>
            <div class="modal-header">
              <img src="/images/miku/miku_chibi_main.png" class="modal-miku-doll" alt="初音未来" />
              <div class="modal-title-box">
                <h3 class="modal-title">联系方式</h3>
                <p class="modal-sub">欢迎交流与合作</p>
              </div>
            </div>
            <div class="modal-contacts-list">
              <div class="contact-item-row">
                <span class="contact-icon">🐧</span>
                <div class="contact-info">
                  <span class="contact-label">QQ 交流</span>
                  <span class="contact-value">2517441744</span>
                </div>
                <button class="copy-action-btn tactile-btn" @click="copyContact('2517441744', 'QQ 号码')">复制 QQ</button>
              </div>

              <div class="contact-item-row">
                <span class="contact-icon">💬</span>
                <div class="contact-info">
                  <span class="contact-label">微信交流</span>
                  <span class="contact-value">svip888ws</span>
                </div>
                <button class="copy-action-btn tactile-btn" @click="copyContact('svip888ws', '微信号码')">复制微信</button>
              </div>

              <div class="contact-item-row">
                <span class="contact-icon">✉️</span>
                <div class="contact-info">
                  <span class="contact-label">电子邮箱</span>
                  <span class="contact-value">canada.svip@gmail.com</span>
                </div>
                <button class="copy-action-btn tactile-btn" @click="copyContact('canada.svip@gmail.com', '邮箱地址')">复制邮箱</button>
              </div>

              <div class="contact-item-row">
                <span class="contact-icon">📺</span>
                <div class="contact-info">
                  <span class="contact-label">Bilibili 个人主页</span>
                  <span class="contact-value link-style">space.bilibili.com/1772424360</span>
                </div>
                <button class="jump-action-btn tactile-btn" @click="handleBilibiliJump">前往主页 ›</button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </footer>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const waveBarCount = ref(typeof window !== 'undefined' && window.innerWidth <= 768 ? 24 : 80);
const contactModalVisible = ref(false);

const socials = ref([
  {
    key: 'qq',
    title: 'QQ',
    value: '2517441744',
    icon: '🐧'
  },
  {
    key: 'bilibili',
    title: 'Bilibili',
    value: 'https://space.bilibili.com/1772424360?spm_id_from=333.1007.0.0',
    icon: '📺'
  },
  {
    key: 'email',
    title: '电子邮箱',
    value: 'canada.svip@gmail.com',
    icon: '✉️'
  },
  {
    key: 'wechat',
    title: '微信交流',
    value: 'svip888ws',
    icon: '💬'
  }
]);

const handleSocialClick = (social) => {
  if (social.key === 'bilibili') {
    handleBilibiliJump();
  } else {
    contactModalVisible.value = true;
  }
};

const handleBilibiliJump = () => {
  ElMessageBox.confirm(
    '即将离开本站前往博主的 Bilibili 主页 (space.bilibili.com)，是否确认前往？',
    '跳转外部链接确认',
    {
      confirmButtonText: '确认前往',
      cancelButtonText: '取消',
      type: 'info',
      confirmButtonClass: 'miku-confirm-btn'
    }
  ).then(() => {
    window.open('https://space.bilibili.com/1772424360?spm_id_from=333.1007.0.0', '_blank', 'noopener,noreferrer');
  }).catch(() => {});
};

const copyContact = (text, label) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success(`${label} ${text} 已成功复制到剪贴板！`);
    }).catch(() => {
      ElMessage.info(`${label}：${text}`);
    });
  } else {
    ElMessage.info(`${label}：${text}`);
  }
};
</script>

<style scoped>
/* ============================================================
   footer.anime-footer - 初音未来视觉主题 Footer (无外框直通式)
   ============================================================ */
.anime-footer {
  width: 100%;
  position: relative;
  content-visibility: auto;
  contain-intrinsic-size: auto 420px;
  /* 初音未来背景图片作为视觉主体 + 沉浸式层次罩层（顶部柔和过渡） */
  background-image: 
    linear-gradient(180deg, rgba(234, 249, 248, 0.6) 0%, rgba(18, 52, 49, 0.92) 48px, rgba(10, 30, 28, 0.97) 100%),
    url('/images/miku_footer_bg.webp'),
    url('/images/miku/miku_wp_1.jpg');
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
  color: #EAF9F8;
  overflow: hidden;
  border-top: 1px solid rgba(57, 197, 187, 0.25);
  box-shadow: 0 -10px 32px rgba(57, 197, 187, 0.08);
}

/* 顶部音波与音符律动边条 */
.miku-rhythm-strip {
  position: relative;
  height: 28px;
  background: rgba(18, 167, 156, 0.15);
  border-bottom: 1px solid rgba(57, 197, 187, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.sound-wave {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  width: 95%;
  max-width: 1400px;
  height: 18px;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 5%, #000 95%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 5%, #000 95%, transparent 100%);
}

.wave-bar {
  width: 3px;
  height: 100%;
  background: #39C5BB;
  border-radius: 2px;
  animation: wavePulse 1.2s ease-in-out infinite alternate;
}

@keyframes wavePulse {
  0% { height: 20%; opacity: 0.3; }
  100% { height: 100%; opacity: 0.95; background: #FF7E9D; }
}

.floating-notes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.note {
  position: absolute;
  font-size: 14px;
  color: #39C5BB;
  opacity: 0.7;
  animation: noteFloat 4s ease-in-out infinite;
}

.n1 { left: 15%; animation-delay: 0s; }
.n2 { left: 35%; animation-delay: 1.2s; color: #FF7E9D; }
.n3 { left: 65%; animation-delay: 2.4s; }
.n4 { left: 85%; animation-delay: 0.8s; color: #FF7E9D; }

@keyframes noteFloat {
  0%, 100% { transform: translateY(2px) scale(0.9); opacity: 0.4; }
  50% { transform: translateY(-8px) scale(1.15); opacity: 1; text-shadow: 0 0 8px #39C5BB; }
}

/* Footer 内容容器 (无边框内衬) */
.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 32px 36px;
  position: relative;
  z-index: 2;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.2fr;
  gap: 48px;
  margin-bottom: 40px;
}

/* 品牌信息区 */
.footer-brand {
  display: flex;
  flex-direction: column;
}

.brand-badge-row {
  margin-bottom: 14px;
}

.miku-chip-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: 9999px;
  background: rgba(57, 197, 187, 0.15);
  border: none;
  color: #39C5BB;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.chip-miku-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  margin-right: 6px;
}

.brand-title {
  font-size: 26px;
  font-weight: 900;
  color: #EAF9F8;
  margin: 0 0 12px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-icon {
  color: #39C5BB;
}

.brand-desc {
  font-size: 13.5px;
  color: #8BA8A5;
  line-height: 1.8;
  margin: 0 0 22px;
  max-width: 460px;
}

.social-capsules {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.social-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #EAF9F8;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
}

.social-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #39C5BB;
}

.social-chip:hover {
  background: #39C5BB;
  color: #FFFFFF;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(57, 197, 187, 0.4);
}

.social-chip:hover .social-dot {
  background: #FFFFFF;
}

/* 栏目通用样式 */
.col-title {
  font-size: 16px;
  font-weight: 800;
  color: #39C5BB;
  margin: 0 0 20px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.title-symbol {
  color: #FF7E9D;
  font-size: 14px;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-link-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #8BA8A5;
  text-decoration: none;
  transition: all 0.2s ease;
}

.link-arrow {
  color: rgba(57, 197, 187, 0.5);
  transition: transform 0.2s ease;
}

.nav-link-item:hover {
  color: #39C5BB;
  transform: translateX(4px);
}

.nav-link-item:hover .link-arrow {
  color: #39C5BB;
  transform: translateX(2px);
}

/* Vocaloid 小挂件 */
.miku-widget-col {
  display: flex;
  flex-direction: column;
}

.miku-status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  border-radius: 18px;
  margin-bottom: 14px;
}

.miku-avatar-small {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.miku-chibi-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.miku-status-card:hover .miku-chibi-icon {
  transform: scale(1.18) rotate(6deg);
}

.status-info {
  display: flex;
  flex-direction: column;
}

.miku-name {
  font-size: 13.5px;
  font-weight: 800;
  color: #EAF9F8;
}

.miku-ver {
  font-size: 10px;
  color: #39C5BB;
  font-weight: 700;
}

.equalizer-mini {
  background: rgba(0, 0, 0, 0.22);
  padding: 12px 14px;
  border-radius: 14px;
  border: none;
}

.eq-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 18px;
  margin-bottom: 6px;
}

.eq-bar {
  flex: 1;
  height: 30%;
  background: #39C5BB;
  border-radius: 1px;
  animation: eqPulse 0.8s ease-in-out infinite alternate;
}

@keyframes eqPulse {
  0% { height: 15%; background: #39C5BB; }
  100% { height: 95%; background: #FF7E9D; }
}

.eq-label {
  font-size: 9px;
  font-family: monospace;
  color: #8BA8A5;
  letter-spacing: 1px;
}

/* 分割线 */
.footer-divider-line {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(57, 197, 187, 0.35) 30%, rgba(255, 126, 157, 0.35) 70%, transparent 100%);
  margin: 12px 0 24px;
}

/* 底部版权 */
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #8BA8A5;
}

.copyright strong {
  color: #39C5BB;
  font-weight: 700;
}

.miku-credit {
  font-size: 11.5px;
  font-weight: 700;
  color: #39C5BB;
  letter-spacing: 1.5px;
}

.miku-credit .heart {
  color: #FF7E9D;
  font-size: 13px;
}

/* 响应式媒体查询 */
@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
}

@media (max-width: 768px) {
  .footer-container {
    padding: 24px 16px calc(84px + env(safe-area-inset-bottom));
  }

  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 24px 16px;
    margin-bottom: 24px;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }

  .brand-badge-row {
    margin-bottom: 8px;
  }

  .brand-title {
    font-size: 20px;
    margin-bottom: 8px;
  }

  .brand-desc {
    font-size: 12.5px;
    line-height: 1.6;
    margin-bottom: 14px;
  }

  .social-capsules {
    gap: 8px;
  }

  .social-chip {
    padding: 5px 12px;
    font-size: 11px;
  }

  .col-title {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .nav-links {
    gap: 8px;
  }
}

@media (max-width: 640px) {
  .footer-container {
    padding: 24px 16px calc(84px + env(safe-area-inset-bottom));
  }

  .nav-link-item {
    font-size: 13px;
  }

  .miku-widget-col {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
    align-items: stretch;
  }

  .miku-widget-col .col-title {
    width: 100%;
    margin-bottom: 8px;
  }

  .miku-status-card {
    flex: 1;
    min-width: 170px;
    margin-bottom: 0;
    padding: 10px 12px;
  }

  .equalizer-mini {
    flex: 1;
    min-width: 140px;
    padding: 10px 12px;
  }

  .footer-divider-line {
    margin: 8px 0 16px;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
    gap: 6px;
    font-size: 12px;
  }
}

/* ============================================================
   社媒悬停气泡与联系方式弹窗样式
   ============================================================ */
.social-chip {
  position: relative;
  cursor: pointer;
}

.social-hover-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-6px);
  background: rgba(10, 30, 28, 0.95);
  border: 1px solid #39C5BB;
  box-shadow: 0 8px 24px rgba(8, 90, 87, 0.4);
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;
  font-size: 11.5px;
  color: #EAF9F8;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 4px;
}

.social-hover-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: #39C5BB transparent transparent transparent;
}

.social-chip:hover .social-hover-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-10px);
}

.tooltip-label {
  color: #39C5BB;
  font-weight: 700;
}

.tooltip-val {
  color: #ffffff;
  font-weight: 600;
}

/* 联系方式全息弹窗 */
.contact-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(10, 30, 28, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.contact-modal-card {
  width: 100%;
  max-width: 440px;
  background: rgba(18, 52, 49, 0.96);
  border: 1.5px solid #39C5BB;
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(8, 90, 87, 0.5);
  padding: 24px;
  position: relative;
  color: #EAF9F8;
  overflow: hidden;
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(57, 197, 187, 0.4);
  color: #EAF9F8;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #f87171;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(57, 197, 187, 0.25);
}

.modal-miku-doll {
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: none;
}

.modal-title-box {
  display: flex;
  flex-direction: column;
}

.modal-title {
  font-size: 18px;
  font-weight: 800;
  color: #39C5BB;
  margin: 0 0 2px;
}

.modal-sub {
  font-size: 11px;
  color: #8BA8A5;
  margin: 0;
  letter-spacing: 0.5px;
}

.modal-contacts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.contact-item-row:hover {
  background: rgba(57, 197, 187, 0.15);
}

.contact-icon {
  font-size: 20px;
  width: 28px;
  text-align: center;
}

.contact-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-label {
  font-size: 11px;
  color: #8BA8A5;
  font-weight: 600;
}

.contact-value {
  font-size: 13.5px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-value.link-style {
  color: #38bdf8;
}

.copy-action-btn,
.jump-action-btn {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.copy-action-btn {
  background: rgba(57, 197, 187, 0.22);
  border: none;
  color: #39C5BB;
}

.copy-action-btn:hover {
  background: #39C5BB;
  color: #123431;
}

.jump-action-btn {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: none;
  color: #ffffff;
}

.jump-action-btn:hover {
  background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.4);
}

/* Modal Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>