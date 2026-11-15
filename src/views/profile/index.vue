<template>
  <div class="profile-container">
    <!-- ================= 1. 用户信息 HERO 看板 (初音赛博 01 主题) ================= -->
    <div class="profile-hero glass-miku-card">
      <!-- 初音二次元壁纸背景层 (悬浮变清晰) -->
      <div class="hero-miku-bg-wrap" aria-hidden="true">
        <img :src="currentThemeWallpaper" alt="Miku Hero Wallpaper" class="hero-miku-bg-img" />
        <div class="hero-scrim-mask"></div>
      </div>

      <div class="hero-grid"></div>

      <div class="hero-content">
        <!-- 初音全息双马尾机甲头像框 -->
        <div class="miku-avatar-twintail-wrap">
          <div class="avatar-ring-border">
            <el-avatar :size="96" :src="userInfo.avatar_url" class="profile-avatar">
              {{ userInfo.nickname?.charAt(0) || 'M' }}
            </el-avatar>
          </div>
          <span class="headset-01-badge"><img src="/images/miku/miku_chibi_main.png" alt="Q版初音" style="width:16px;height:16px;object-fit:contain;" /></span>
          <span class="twintail-wing-left"></span>
          <span class="twintail-wing-right"></span>
        </div>

        <!-- 勋章与身份标签 -->
        <div class="miku-honor-tags">
          <span class="miku-tag teal">✦ 初音未来 · 音律研学者</span>
          <span class="miku-tag pink" v-if="userInfo.article_count > 0">★ 特约创作者</span>
          <span class="miku-tag cyan" v-if="userInfo.comment_count > 0">♪ 活跃同好</span>
        </div>

        <h1 class="profile-name">{{ userInfo.nickname || userInfo.username }}</h1>
        <p class="profile-bio">{{ userInfo.bio || '歌唱吧，让心中的律动响彻世界... ♪ (暂未填写个人签名)' }}</p>

        <!-- 统计面板 (背景融入初音壁纸 + 悬浮变清晰) -->
        <div class="profile-stats">
          <div class="stats-miku-bg-wrap" aria-hidden="true">
            <img src="/images/miku/miku_wp_11.jpg" alt="Stats Wallpaper" class="stats-miku-bg-img" />
            <div class="stats-scrim-mask"></div>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ userInfo.article_count || 0 }}</span>
            <span class="stat-label">发布文章</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ userInfo.comment_count || 0 }}</span>
            <span class="stat-label">发表评论</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ totalLikesReceived }}</span>
            <span class="stat-label">获得赞同</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ formatJoinDate(userInfo.create_time) }}</span>
            <span class="stat-label">加入时间</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= 2. TAB 内容功能区 ================= -->
    <div class="content-section">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <!-- ---------------- TAB 1: 我的文章 ---------------- -->
        <el-tab-pane name="articles">
          <template #label>
            <span class="tab-label-custom">
              <span class="tab-icon">✎</span> 我的文章 ({{ myArticles.length }})
            </span>
          </template>

          <div class="tab-content">
            <!-- 状态快速筛选胶囊 -->
            <div class="status-filter-bar" v-if="myArticles.length > 0">
              <button
                v-for="s in statusFilterOptions"
                :key="s.key"
                class="status-chip-btn"
                :class="{ active: articleFilter === s.key }"
                @click="articleFilter = s.key"
              >
                <span>{{ s.label }}</span>
                <span class="chip-count">{{ getArticleFilterCount(s.key) }}</span>
              </button>
            </div>

            <!-- 文章列表 -->
            <div
              v-for="(article, index) in filteredArticles"
              :key="article.id"
              class="article-item glass-miku-card"
              @click="goToArticle(article.id)"
            >
              <!-- 初音二次元壁纸背景层 (悬浮变清晰) -->
              <div class="card-miku-bg-wrap" aria-hidden="true">
                <img :src="getArticleBg(index)" alt="Miku Article Card Bg" class="card-miku-bg-img" />
                <div class="card-scrim-mask"></div>
              </div>

              <div class="article-info">
                <div class="article-top">
                  <el-tag :type="statusTagType(article.status)" size="small" effect="dark" class="miku-status-tag">
                    {{ statusText(article.status) }}
                  </el-tag>
                  <span class="article-category" v-if="article.category_name">
                    # {{ article.category_name }}
                  </span>
                </div>

                <h3 class="article-title">{{ article.title }}</h3>
                <p class="article-desc">{{ article.description || '暂无摘要...' }}</p>

                <!-- 驳回原因提示 -->
                <p class="reject-reason" v-if="article.status === 3 && article.reject_reason">
                  <span class="reject-label">⚠️ 驳回原因：</span>{{ article.reject_reason }}
                </p>

                <div class="article-meta">
                  <div class="article-meta-stats">
                    <span class="meta-time">🕒 {{ formatTime(article.create_time) }}</span>
                    <span class="meta-views">👁 {{ article.view_count || 0 }} 浏览</span>
                    <span class="meta-likes">👍 {{ article.like_count || 0 }} 赞同</span>
                  </div>

                  <!-- 操作按钮组 (编辑/修改/删除) -->
                  <div class="article-actions-group">
                    <button
                      class="action-btn edit-btn"
                      v-if="article.status !== 1"
                      @click.stop="editArticle(article.id)"
                    >
                      {{ article.status === 3 ? '✎ 修改并重新提交' : '✎ 编辑草稿' }}
                    </button>

                    <button
                      class="action-btn delete-btn"
                      @click.stop="handleDeleteArticle(article)"
                    >
                      ✕ 删除文章
                    </button>
                  </div>
                </div>
              </div>

              <div class="article-cover">
                <img :src="getArticleCover(article, index)" class="cover-img" @error="onCoverError(article.id)" />
              </div>
            </div>

            <!-- 空状态 -->
            <div class="empty-miku-box glass-miku-card" v-if="filteredArticles.length === 0">
              <div class="empty-bg-wrap" aria-hidden="true">
                <img src="/images/miku/miku_wp_3.jpg" alt="Empty Miku" class="empty-bg-img" />
                <div class="empty-mask"></div>
              </div>
              <div class="empty-symbol">♪ 39</div>
              <p class="empty-text">该状态下暂无文章，快去写下你的第一篇创作成品吧！</p>
              <el-button type="primary" class="write-now-btn" @click="router.push('/publish')">
                ✎ 撰写新文章
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- ---------------- TAB 2: 我的评论 ---------------- -->
        <el-tab-pane name="comments">
          <template #label>
            <span class="tab-label-custom">
              <span class="tab-icon">💬</span> 我的评论 ({{ myComments.length }})
            </span>
          </template>

          <div class="tab-content">
            <div
              v-for="comment in myComments"
              :key="comment.id"
              class="comment-item glass-miku-card"
              @click="goToArticle(comment.article_id)"
            >
              <!-- 初音二次元壁纸背景层 (悬浮变清晰) -->
              <div class="card-miku-bg-wrap" aria-hidden="true">
                <img src="/images/miku/miku_wp_2.jpg" alt="Miku Comment Bg" class="card-miku-bg-img" />
                <div class="card-scrim-mask"></div>
              </div>

              <div class="comment-content">
                <p class="comment-text">“ {{ comment.content }} ”</p>
                <div class="comment-meta">
                  <span class="comment-target">评论于文章 « {{ comment.article_title || '已删除的文章' }} »</span>
                  <span class="comment-time">{{ formatTime(comment.create_time) }}</span>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div class="empty-miku-box glass-miku-card" v-if="myComments.length === 0">
              <div class="empty-bg-wrap" aria-hidden="true">
                <img src="/images/miku/miku_wp_3.jpg" alt="Empty Miku" class="empty-bg-img" />
                <div class="empty-mask"></div>
              </div>
              <div class="empty-symbol">♫ 39</div>
              <p class="empty-text">还没有发表过评论，去阅读文章并留下你的印记吧！</p>
            </div>
          </div>
        </el-tab-pane>

        <!-- ---------------- TAB 3: 个人设置与主题定制 ---------------- -->
        <el-tab-pane name="settings">
          <template #label>
            <span class="tab-label-custom">
              <span class="tab-icon">⚙</span> 个人设置与初音壁纸
            </span>
          </template>

          <div class="tab-content settings-form glass-miku-card">
            <!-- 初音二次元壁纸背景层 (悬浮变清晰) -->
            <div class="form-miku-bg-wrap" aria-hidden="true">
              <img src="/images/miku/miku_wp_9.jpg" alt="Miku Settings Bg" class="form-miku-bg-img" />
              <div class="form-scrim-mask"></div>
            </div>

            <!-- 头像更换 -->
            <div class="avatar-section">
              <div class="avatar-preview" @click="triggerAvatarInput">
                <el-avatar :size="88" :src="userInfo.avatar_url" class="preview-avatar">
                  {{ userInfo.nickname?.charAt(0) || 'U' }}
                </el-avatar>
                <div class="avatar-overlay">
                  <span>📷 更换</span>
                </div>
              </div>
              <input ref="avatarInput" type="file" accept="image/*" style="display: none;" @change="handleAvatarChange" />
              <p class="avatar-hint">点击头像即可上传更新 (支持 JPG/PNG, < 5MB)</p>
            </div>

            <!-- 主题壁纸选框 -->
            <div class="theme-selector-section">
              <h3 class="section-title">✦ 个人主页初音壁纸设置</h3>
              <div class="wallpaper-options-grid">
                <div
                  v-for="wp in themeWallpaperOptions"
                  :key="wp.url"
                  class="wp-option-card"
                  :class="{ active: currentThemeWallpaper === wp.url }"
                  @click="setThemeWallpaper(wp.url)"
                >
                  <img :src="wp.url" :alt="wp.name" />
                  <span class="wp-name">{{ wp.name }}</span>
                  <span class="active-check" v-if="currentThemeWallpaper === wp.url">✓</span>
                </div>
              </div>
            </div>

            <el-divider class="miku-divider" />

            <!-- 基本信息表单 -->
            <h3 class="section-title">✦ 基本资料</h3>
            <el-form :model="profileForm" label-width="90px" style="max-width: 520px;" class="miku-form">
              <el-form-item label="用户名">
                <el-input :value="userInfo.username" disabled class="miku-input disabled" />
              </el-form-item>
              <el-form-item label="昵称">
                <el-input v-model="profileForm.nickname" placeholder="请输入你的专属昵称" maxlength="20" class="miku-input" />
              </el-form-item>
              <el-form-item label="签名简介">
                <el-input
                  v-model="profileForm.bio"
                  type="textarea"
                  :rows="3"
                  placeholder="介绍一下你自己吧... (支持音符 / 话题)"
                  maxlength="200"
                  show-word-limit
                  class="miku-textarea"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" class="save-profile-btn tactile-btn" :loading="saving" @click="handleSave">
                  ♪ 保存资料修改
                </el-button>
              </el-form-item>
            </el-form>

            <el-divider class="miku-divider" />

            <!-- 修改密码表单 -->
            <h3 class="section-title">✦ 安全设置 / 修改密码</h3>
            <el-form :model="passwordForm" label-width="90px" style="max-width: 520px;" class="miku-form">
              <el-form-item label="原密码">
                <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password class="miku-input" />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码 (不少于8位，包含字母与数字)" show-password class="miku-input" />
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password class="miku-input" />
              </el-form-item>
              <el-form-item>
                <el-button type="warning" class="change-pwd-btn tactile-btn" :loading="changingPwd" @click="handleChangePassword">
                  ✦ 修改账户密码
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserProfile, getUserArticles, getUserComments, updateProfile, uploadAvatar, changePassword } from '../../api/user';
import { deleteArticle } from '../../api/article';
import { useUserStore } from '../../stores/user';
import { formatTime } from '../../utils/format';
import { getMikuWallpaper } from '../../utils/mikuImage';

const router = useRouter();
const userStore = useUserStore();
const activeTab = ref('articles');
const saving = ref(false);
const articleFilter = ref('all');

const userInfo = ref({});
const myArticles = ref([]);
const myComments = ref([]);

const brokenCovers = ref([]);
const onCoverError = (id) => {
  if (!brokenCovers.value.includes(id)) brokenCovers.value = [...brokenCovers.value, id];
};
const getArticleCover = (article, index) => {
  if (article && article.cover_url && !brokenCovers.value.includes(article.id)) {
    return article.cover_url;
  }
  return getMikuWallpaper(article?.id || index);
};

// 初音主题壁纸定制选框
const currentThemeWallpaper = ref(localStorage.getItem('miku_profile_theme') || '/images/miku/miku_wp_1.jpg');
const themeWallpaperOptions = [
  { name: '海蓝初音', url: '/images/miku/miku_wp_1.jpg' },
  { name: '舞台绽放', url: '/images/miku/miku_wp_5.jpg' },
  { name: '赛博音感', url: '/images/miku/miku_wp_8.jpg' },
  { name: '音符实验室', url: '/images/miku/miku_wp_9.jpg' }
];

const setThemeWallpaper = (url) => {
  currentThemeWallpaper.value = url;
  localStorage.setItem('miku_profile_theme', url);
  ElMessage.success('已切换个人主页初音壁纸！');
};

const profileForm = reactive({
  nickname: '',
  bio: ''
});

const avatarInput = ref(null);
const changingPwd = ref(false);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 计算获得的赞同总数
const totalLikesReceived = computed(() => {
  return myArticles.value.reduce((acc, curr) => acc + (curr.like_count || 0), 0);
});

// 文章状态筛选
const statusFilterOptions = [
  { key: 'all', label: '全部' },
  { key: '1', label: '已发布' },
  { key: '2', label: '待审核' },
  { key: '3', label: '已驳回' },
  { key: '0', label: '草稿箱' }
];

const getArticleFilterCount = (key) => {
  if (key === 'all') return myArticles.value.length;
  return myArticles.value.filter(a => String(a.status) === String(key)).length;
};

const filteredArticles = computed(() => {
  if (articleFilter.value === 'all') return myArticles.value;
  return myArticles.value.filter(a => String(a.status) === String(articleFilter.value));
});

// 文章背景大图画廊
const MIKU_ARTICLE_BGS = [
  '/images/miku/miku_wp_5.jpg',
  '/images/miku/miku_wp_8.jpg',
  '/images/miku/miku_wp_9.jpg',
  '/images/miku/miku_wp_7.jpg',
  '/images/miku/miku_wp_4.jpg'
];

const getArticleBg = (index) => {
  return MIKU_ARTICLE_BGS[index % MIKU_ARTICLE_BGS.length];
};

const fetchProfile = async () => {
  try {
    const res = await getUserProfile();
    userInfo.value = res.data;
    profileForm.nickname = res.data.nickname || '';
    profileForm.bio = res.data.bio || '';
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

const fetchMyArticles = async () => {
  try {
    const res = await getUserArticles();
    myArticles.value = res.data.list || [];
  } catch (error) {
    console.error('获取文章失败:', error);
  }
};

const fetchMyComments = async () => {
  try {
    const res = await getUserComments();
    myComments.value = res.data || [];
  } catch (error) {
    console.error('获取评论失败:', error);
  }
};

const handleSave = async () => {
  if (!profileForm.nickname.trim()) {
    ElMessage.warning('昵称不能为空');
    return;
  }
  saving.value = true;
  try {
    await updateProfile({
      nickname: profileForm.nickname,
      bio: profileForm.bio
    });
    ElMessage.success('资料更新成功！');
    if (userStore.userInfo) {
      userStore.userInfo.nickname = profileForm.nickname;
      localStorage.setItem('client_user', JSON.stringify(userStore.userInfo));
    }
    fetchProfile();
  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    saving.value = false;
  }
};

const triggerAvatarInput = () => {
  avatarInput.value?.click();
};

const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB');
    return;
  }

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const res = await uploadAvatar(formData);
    userInfo.value.avatar = res.data.key;
    userInfo.value.avatar_url = res.data.url;
    if (userStore.userInfo) {
      userStore.userInfo.avatar = res.data.key;
      userStore.userInfo.avatar_url = res.data.url;
      localStorage.setItem('client_user', JSON.stringify(userStore.userInfo));
    }
    ElMessage.success('头像更新成功！');
  } catch (error) {
    ElMessage.error('头像上传失败');
  }
  e.target.value = '';
};

const handleChangePassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    ElMessage.warning('请填写完整');
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致');
    return;
  }
  if (passwordForm.newPassword.length < 8) {
    ElMessage.warning('新密码不能少于 8 位');
    return;
  }
  if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(passwordForm.newPassword)) {
    ElMessage.warning('新密码必须同时包含英文字母和数字');
    return;
  }

  changingPwd.value = true;
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });
    ElMessage.success('密码修改成功，请重新登录');
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } catch (error) {
    console.error('修改密码失败:', error);
  } finally {
    changingPwd.value = false;
  }
};

const goToArticle = (id) => {
  router.push(`/article/${id}`);
};

const editArticle = (id) => {
  router.push(`/article/edit/${id}`);
};

const handleDeleteArticle = (article) => {
  ElMessageBox.confirm(
    `确定要删除文章《${article.title}》吗？删除后不可恢复。`,
    '♪ 确认删除文章',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteArticle(article.id);
      ElMessage.success('文章已成功删除！');
      fetchMyArticles();
    } catch (err) {
      ElMessage.error('删除文章失败');
    }
  }).catch(() => {});
};

const statusText = (s) => ({ 0: '草稿箱', 1: '已发布', 2: '待审核', 3: '已驳回' }[s] ?? '未知');
const statusTagType = (s) => ({ 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }[s] ?? 'info');

const formatJoinDate = (timeStr) => {
  if (!timeStr) return '2026.09';
  const date = new Date(timeStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
};

watch(activeTab, (tab) => {
  if (tab === 'articles' && myArticles.value.length === 0) {
    fetchMyArticles();
  } else if (tab === 'comments' && myComments.value.length === 0) {
    fetchMyComments();
  }
});

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  fetchProfile();
  fetchMyArticles();
});
</script>

<style scoped>
/* ============================================================
   PROFILE PAGE - 初音未来赛博音律主题全量重构与悬浮变清晰
   ============================================================ */
.profile-container {
  max-width: 920px;
  margin: 0 auto;
  padding: var(--navbar-clearance) 20px 80px;

  --pf-ink-strong: #0B3B37;
  --pf-ink:        #0F4F49;
  --pf-ink-soft:   #357268;
  --pf-deep:       #0B7A73;
  --pf-deep-2:     #08635D;
}

.glass-miku-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1.5px solid rgba(57, 197, 187, 0.32);
  box-shadow: 0 10px 30px rgba(57, 197, 187, 0.1);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ================= 1. HERO 看板 ================= */
.profile-hero {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 46px 24px 36px;
  text-align: center;
  border-radius: 28px;
  background: linear-gradient(135deg, #064F4A 0%, #0A6E67 55%, #0C7B73 100%);
  color: #ffffff;
  border: 2px solid rgba(57, 197, 187, 0.4);
  box-shadow: 0 16px 40px rgba(18, 167, 156, 0.22);
}

.hero-miku-bg-wrap {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.hero-miku-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center right;
  opacity: 0.22;
  filter: blur(2.5px) saturate(1.12);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease;
}

.hero-scrim-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6, 40, 38, 0.75) 0%, rgba(10, 60, 56, 0.85) 100%);
  transition: opacity 0.4s ease;
}

.profile-hero:hover .hero-miku-bg-img {
  transform: scale(1.04);
  opacity: 0.55;
  filter: blur(0px) brightness(1.08) saturate(1.3);
}

.profile-hero:hover .hero-scrim-mask {
  opacity: 0.55;
}

.hero-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 32px 32px;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 全息双马尾机甲头像框 */
.miku-avatar-twintail-wrap {
  position: relative;
  margin-bottom: 16px;
}

.avatar-ring-border {
  padding: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #39C5BB, #FF7E9D, #12A79C);
  box-shadow: 0 0 24px rgba(57, 197, 187, 0.6);
}

.profile-avatar {
  background: linear-gradient(135deg, #0B7A73, #08635D);
  color: #ffffff;
  font-size: 38px;
  font-weight: 900;
  border: 3px solid #ffffff;
}

.headset-01-badge {
  position: absolute;
  bottom: 0;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.twintail-wing-left, .twintail-wing-right {
  position: absolute;
  width: 14px;
  height: 28px;
  border-radius: 14px;
  background: linear-gradient(180deg, #39C5BB, #12A79C);
  top: 24px;
  box-shadow: 0 0 10px rgba(57, 197, 187, 0.6);
}

.twintail-wing-left { left: -12px; transform: rotate(-30deg); }
.twintail-wing-right { right: -12px; transform: rotate(30deg); }

/* 勋章与标签 */
.miku-honor-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.miku-tag {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #ffffff;
  background: rgba(6, 40, 38, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
}

.miku-tag.teal { border-color: rgba(57, 197, 187, 0.6); color: #E3F7F4; }
.miku-tag.pink { border-color: rgba(255, 126, 157, 0.6); color: #FFEAEF; }
.miku-tag.cyan { border-color: rgba(78, 205, 196, 0.6); color: #ffffff; }

.profile-name {
  font-size: clamp(26px, 4vw, 34px);
  font-weight: 900;
  margin: 0 0 10px;
  color: #ffffff;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
}

.profile-bio {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 24px;
  max-width: 480px;
  line-height: 1.6;
}

/* 统计面板 */
.profile-stats {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding: 16px 36px;
  border-radius: 9999px;
  background: rgba(6, 40, 38, 0.28);
  backdrop-filter: blur(16px);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.stats-miku-bg-wrap {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.stats-miku-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.15;
  filter: blur(2.5px);
  transition: transform 0.4s ease, opacity 0.4s ease, filter 0.4s ease;
}

.stats-scrim-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6, 40, 38, 0.78) 0%, rgba(10, 60, 56, 0.88) 100%);
  transition: opacity 0.4s ease;
}

.profile-stats:hover .stats-miku-bg-img {
  transform: scale(1.05);
  opacity: 0.5;
  filter: blur(0px) brightness(1.08) saturate(1.25);
}

.profile-stats:hover .stats-scrim-mask {
  opacity: 0.6;
}

.stat-item {
  position: relative;
  z-index: 1;
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 22px;
  font-weight: 900;
  color: #ffffff;
  font-family: monospace;
}

.stat-label {
  font-size: 12px;
  color: #E3F7F4;
  font-weight: 700;
}

.stat-divider {
  position: relative;
  z-index: 1;
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.3);
}

/* ================= 2. TABS 内容区 ================= */
.content-section {
  margin-top: 32px;
}

.profile-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.profile-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 800;
  color: var(--pf-ink-soft);
  transition: all 0.25s ease;
}

.profile-tabs :deep(.el-tabs__item.is-active) {
  color: var(--pf-deep);
}

.profile-tabs :deep(.el-tabs__active-bar) {
  background: linear-gradient(90deg, var(--pf-deep) 0%, var(--pf-deep-2) 100%);
  height: 3.5px;
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(57, 197, 187, 0.5);
}

.tab-label-custom {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab-icon {
  font-size: 15px;
}

.tab-content {
  min-height: 320px;
  padding-top: 16px;
}

/* 状态筛选胶囊 */
.status-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  flex-wrap: nowrap;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 2px 2px 6px;
}

.status-filter-bar::-webkit-scrollbar {
  display: none;
}

.status-chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 9999px;
  border: 1px solid rgba(57, 197, 187, 0.3);
  background: rgba(255, 255, 255, 0.9);
  color: var(--pf-ink-soft);
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.status-chip-btn:hover {
  background: #E3F7F4;
  color: var(--pf-deep);
}

.status-chip-btn.active {
  background: linear-gradient(135deg, var(--pf-deep), var(--pf-deep-2));
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(57, 197, 187, 0.35);
}

.chip-count {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.08);
}

.status-chip-btn.active .chip-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* ================= 3. 我的文章 & 我的评论卡片 (壁纸 + 悬浮变清晰) ================= */
.article-item, .comment-item {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 22px 24px;
  margin-bottom: 18px;
  display: flex;
  gap: 20px;
  border: 1.5px solid rgba(57, 197, 187, 0.32);
  cursor: pointer;
}

.card-miku-bg-wrap {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.card-miku-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  opacity: 0.15;
  filter: saturate(1.08) blur(1.5px);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease;
}

.card-scrim-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(125deg, rgba(255, 255, 255, 0.74) 0%, rgba(235, 252, 249, 0.60) 55%, rgba(255, 238, 246, 0.48) 100%);
  transition: opacity 0.4s ease;
}

.article-item:hover .card-miku-bg-img,
.comment-item:hover .card-miku-bg-img {
  transform: scale(1.05);
  opacity: 0.72;
  filter: brightness(1.05) saturate(1.28) blur(0px);
}

.article-item:hover .card-scrim-mask,
.comment-item:hover .card-scrim-mask {
  opacity: 0.58;
}

.article-item:hover, .comment-item:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 126, 157, 0.5);
  box-shadow: 0 14px 32px rgba(57, 197, 187, 0.2);
}

.article-info {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

.article-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.miku-status-tag {
  font-weight: 800 !important;
  border-radius: 6px !important;
}

.article-category {
  font-size: 12.5px;
  color: var(--pf-deep);
  font-weight: 800;
}

.article-title {
  font-size: 18px;
  font-weight: 900;
  color: var(--pf-ink-strong);
  margin: 0 0 8px;
  line-height: 1.4;
}

.article-desc {
  font-size: 14px;
  line-height: 1.65;
  color: var(--pf-ink);
  font-weight: 600;
  margin: 0 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.reject-reason {
  font-size: 12.5px;
  color: #C2185B;
  background: rgba(255, 234, 239, 0.9);
  border: 1px solid rgba(255, 126, 157, 0.4);
  border-radius: 10px;
  padding: 8px 12px;
  margin: 0 0 12px;
  line-height: 1.6;
}

.reject-label {
  font-weight: 800;
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--pf-ink-soft);
}

.article-meta-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.article-actions-group {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  padding: 4px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  border: 1px solid rgba(57, 197, 187, 0.45);
  background: rgba(57, 197, 187, 0.16);
  color: var(--pf-deep);
}

.edit-btn:hover {
  background: var(--pf-deep);
  color: #ffffff;
}

.delete-btn {
  border: 1px solid rgba(255, 126, 157, 0.45);
  background: rgba(255, 126, 157, 0.14);
  color: #C2185B;
}

.delete-btn:hover {
  background: #C2185B;
  color: #ffffff;
}

.article-cover {
  position: relative;
  z-index: 1;
  width: 140px;
  height: 96px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1.5px solid rgba(57, 197, 187, 0.35);
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(57, 197, 187, 0.12);
  color: var(--pf-ink-soft);
  font-size: 12px;
  font-weight: 800;
}

/* 评论卡片内容 */
.comment-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

.comment-text {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.7;
  color: var(--pf-ink);
  margin: 0 0 12px;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--pf-ink-soft);
}

.comment-target {
  color: var(--pf-deep);
}

/* 空状态卡 */
.empty-miku-box {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 60px 20px;
  text-align: center;
  margin: 20px 0;
}

.empty-bg-wrap {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.empty-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.15;
  filter: blur(2.5px);
  transition: opacity 0.4s ease, filter 0.4s ease;
}

.empty-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 252, 250, 0.94) 100%);
}

.empty-miku-box:hover .empty-bg-img {
  opacity: 0.45;
  filter: blur(0px);
}

.empty-symbol {
  position: relative;
  z-index: 1;
  font-size: 44px;
  margin-bottom: 12px;
  color: #39C5BB;
}

.empty-text {
  position: relative;
  z-index: 1;
  font-size: 15px;
  font-weight: 700;
  color: var(--pf-ink);
  margin: 0 0 20px;
}

.write-now-btn {
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, var(--pf-deep), var(--pf-deep-2)) !important;
  border: none !important;
  border-radius: 9999px !important;
  font-weight: 800 !important;
  padding: 10px 24px !important;
}

/* ================= 4. 个人设置与主题定制 ================= */
.settings-form {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 32px 28px;
}

.form-miku-bg-wrap {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.form-miku-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.14;
  filter: blur(2.5px) saturate(1.12);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease;
}

.form-scrim-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 252, 250, 0.94) 100%);
  transition: opacity 0.4s ease;
}

.settings-form:hover .form-miku-bg-img {
  transform: scale(1.04);
  opacity: 0.48;
  filter: blur(0px) brightness(1.06) saturate(1.25);
}

.settings-form:hover .form-scrim-mask {
  opacity: 0.65;
}

.avatar-section, .theme-selector-section, .section-title, .miku-form, .miku-divider {
  position: relative;
  z-index: 1;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0 20px;
}

.avatar-preview {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #39C5BB, #FF7E9D);
  box-shadow: 0 0 20px rgba(57, 197, 187, 0.4);
}

.preview-avatar {
  background: linear-gradient(135deg, #0B7A73, #08635D);
  color: #ffffff;
  font-size: 34px;
  font-weight: 900;
  border: 2px solid #ffffff;
}

.avatar-overlay {
  position: absolute;
  inset: 3px;
  background: rgba(11, 61, 56, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 50%;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
}

.avatar-preview:hover .avatar-overlay {
  opacity: 1;
}

.avatar-hint {
  font-size: 12px;
  color: var(--pf-ink-soft);
  font-weight: 700;
  margin: 12px 0 0;
}

.section-title {
  font-size: 16.5px;
  font-weight: 900;
  color: var(--pf-ink-strong);
  margin: 16px 0 16px;
}

/* 主题壁纸选择网格 */
.wallpaper-options-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

@media (max-width: 640px) {
  .wallpaper-options-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.wp-option-card {
  position: relative;
  height: 80px;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid rgba(57, 197, 187, 0.3);
  cursor: pointer;
  transition: all 0.25s ease;
}

.wp-option-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.wp-name {
  position: absolute;
  bottom: 0;
  inset-x: 0;
  background: rgba(11, 61, 56, 0.85);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
  padding: 3px 0;
}

.active-check {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #C2185B;
  color: #ffffff;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.wp-option-card:hover {
  transform: translateY(-3px);
  border-color: #39C5BB;
}

.wp-option-card.active {
  border-color: #FF7E9D;
  box-shadow: 0 0 14px rgba(255, 126, 157, 0.5);
}

.miku-divider {
  border-color: rgba(57, 197, 187, 0.25) !important;
  margin: 24px 0 !important;
}

/* 表单按键 */
.save-profile-btn {
  background: linear-gradient(135deg, var(--pf-deep), var(--pf-deep-2)) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 800 !important;
  padding: 10px 24px !important;
}

.change-pwd-btn {
  background: linear-gradient(135deg, #C2185B, #B3244F) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 800 !important;
  color: #ffffff !important;
  padding: 10px 24px !important;
}

/* ============================================================
   RESPONSIVE ADAPTATIONS (MOBILE ≤ 768px)
   ============================================================ */
@media (max-width: 768px) {
  .profile-container {
    padding-top: calc(var(--navbar-clearance, 70px) + 20px) !important;
    padding-left: 12px;
    padding-right: 12px;
    padding-bottom: 60px;
  }

  .glass-miku-card {
    border-radius: 18px;
  }

  /* HERO 看板适配 */
  .profile-hero {
    padding: 24px 14px 20px;
    border-radius: 20px;
  }

  .profile-avatar {
    width: 76px !important;
    height: 76px !important;
    font-size: 28px !important;
  }

  .avatar-ring-border {
    padding: 3px;
  }

  .headset-01-badge {
    font-size: 9px;
    padding: 1px 5px;
  }

  .twintail-wing-left, .twintail-wing-right {
    width: 10px;
    height: 22px;
    top: 18px;
  }
  .twintail-wing-left { left: -8px; }
  .twintail-wing-right { right: -8px; }

  .miku-honor-tags {
    gap: 6px;
    margin-bottom: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .miku-tag {
    padding: 3px 10px;
    font-size: 10px;
    letter-spacing: 0.5px;
  }

  .profile-name {
    font-size: 22px;
    margin-bottom: 6px;
  }

  .profile-bio {
    font-size: 12.5px;
    margin-bottom: 18px;
    line-height: 1.5;
  }

  /* 统计面板 移动端 2x2 网格化 */
  .profile-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 16px;
    padding: 14px 16px;
    border-radius: 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .stat-divider {
    display: none;
  }

  .stat-num {
    font-size: 18px;
  }

  .stat-label {
    font-size: 11px;
  }

  /* TABS 内容区适配 */
  .content-section {
    margin-top: 18px;
  }

  .profile-tabs :deep(.el-tabs__nav-wrap) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .profile-tabs :deep(.el-tabs__nav-wrap::-webkit-scrollbar) {
    display: none;
  }

  .profile-tabs :deep(.el-tabs__item) {
    font-size: 13.5px;
    padding: 0 12px !important;
    white-space: nowrap;
  }

  .tab-icon {
    font-size: 13px;
  }

  .status-filter-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
    padding: 2px 2px 6px;
    width: 100%;
    box-sizing: border-box;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .status-filter-bar::-webkit-scrollbar {
    display: none;
  }

  .status-chip-btn {
    padding: 6px 14px;
    font-size: 12px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  /* 文章卡片 & 评论卡片 移动端适配 */
  .article-item {
    flex-direction: column-reverse;
    padding: 14px 12px;
    gap: 12px;
    border-radius: 16px;
  }

  .comment-item {
    padding: 14px 12px;
    border-radius: 16px;
  }

  .article-cover {
    width: 100%;
    height: 150px;
    border-radius: 12px;
  }

  .article-title {
    font-size: 15.5px;
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .article-desc {
    font-size: 13px;
    margin-bottom: 10px;
    -webkit-line-clamp: 2;
  }

  .article-meta {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px 12px;
    font-size: 11.5px;
    width: 100%;
  }

  .article-meta-stats {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 12px;
  }

  .article-actions-group {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .action-btn {
    padding: 4px 10px;
    font-size: 11px;
    border-radius: 9999px;
  }

  .comment-text {
    font-size: 13.5px;
  }

  .comment-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    font-size: 11.5px;
  }

  /* 个人设置表单适配 */
  .settings-form {
    padding: 18px 12px;
    border-radius: 16px;
  }

  .preview-avatar {
    width: 72px !important;
    height: 72px !important;
    font-size: 28px !important;
  }

  .wallpaper-options-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .wp-option-card {
    height: 72px;
    border-radius: 10px;
  }

  .miku-form {
    max-width: 100% !important;
  }

  .miku-form :deep(.el-form-item) {
    flex-direction: column;
    align-items: flex-start;
  }

  .miku-form :deep(.el-form-item__label) {
    width: 100% !important;
    text-align: left;
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 800;
    color: var(--pf-ink-strong);
  }

  .miku-form :deep(.el-form-item__content) {
    width: 100%;
    margin-left: 0 !important;
  }

  .save-profile-btn, .change-pwd-btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .profile-container {
    padding-top: calc(var(--navbar-clearance, 70px) + 20px) !important;
    padding-left: 10px;
    padding-right: 10px;
    padding-bottom: 50px;
  }

  .profile-hero {
    padding: 20px 12px 18px;
  }

  .profile-name {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .profile-bio {
    font-size: 12px;
    margin-bottom: 14px;
  }

  .wallpaper-options-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .wp-option-card {
    height: 65px;
  }

  .article-actions-group {
    flex-direction: row;
    width: auto;
    margin-left: auto;
  }

  .action-btn {
    width: auto;
    padding: 3px 8px;
    font-size: 10.5px;
  }
}
</style>