<template>
  <div class="publish-page" :class="{ 'is-focus-mode': isFocusMode }">
    <!-- ================= 1. HERO 看板 (初音赛博全息音律创作工坊) ================= -->
    <header class="publish-hero-banner" v-if="!isFocusMode">
      <div class="hero-artwork-bg" style="background-image: url('/images/miku/miku_messages_banner.jpg')"></div>
      <div class="hero-scrim-mask"></div>

      <div class="hero-inner">
        <div class="hero-left-content">
          <h1 class="hero-title">{{ isEdit ? '编辑文章' : '写文章' }}</h1>
          <p class="hero-subtitle">
            在这里记录你的技术思考、学习笔记与生活灵感。
          </p>

          <!-- 创作实时状态胶囊 -->
          <div class="hero-stats-row">
            <div class="stat-pill">
              <span>全文字数：<strong>{{ wordCount }}</strong> 字</span>
            </div>
            <div class="stat-pill">
              <span>预计阅读：<strong>{{ estimatedReadTime }}</strong> 分钟</span>
            </div>
            <div class="stat-pill focus-toggle-pill" @click="toggleFocusMode">
              <span>{{ isFocusMode ? '退出专注模式' : '开启专注写作模式' }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ================= 2. Sticky 顶部操作栏 ================= -->
    <div class="top-bar">
      <div class="top-bar-inner">
        <div class="top-bar-left">
          <button class="back-btn tactile-btn" @click="router.back()">
            <el-icon><ArrowLeft /></el-icon>
            <span class="back-text">返回</span>
          </button>
          <div class="top-bar-divider"></div>
          <span class="top-bar-title">{{ isEdit ? '编辑文章' : '写文章' }}</span>
        </div>

        <div class="top-bar-right">
          <button class="btn-focus tactile-btn" @click="toggleFocusMode" :title="isFocusMode ? '退出专注' : '专注写作'">
            <span>{{ isFocusMode ? '☀️ 退出专注' : '🌙 专注模式' }}</span>
          </button>

          <transition name="fade-hint">
            <span class="auto-save-hint" v-if="autoSaved">
              <span class="save-dot"></span>
              <el-icon :size="14"><CircleCheck /></el-icon> 已保存草稿
            </span>
          </transition>

          <button class="btn-draft tactile-btn" @click="saveDraft" :disabled="submitLoading">
            <el-icon><DocumentCopy /></el-icon>
            <span>存草稿</span>
          </button>

          <button class="btn-publish tactile-btn shine-effect" :disabled="submitLoading" @click="handleSubmit">
            <el-icon v-if="!submitLoading"><Promotion /></el-icon>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
            <span>{{ submitBtnText }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ================= 3. 双栏编辑主体 ================= -->
    <div class="publish-body">
      <!-- 左侧：富文本与文章主内容编辑区 (接入初音壁纸 + 悬浮变清晰) -->
      <div class="editor-left glass-miku-card">
        <!-- 初音二次元壁纸背景层 (悬浮变清晰) -->
        <div class="card-miku-bg-wrap" aria-hidden="true">
          <img src="/images/miku/miku_wp_9.jpg" alt="Miku Editor Wallpaper" class="card-miku-bg-img" />
          <div class="card-scrim-mask"></div>
        </div>

        <!-- 被驳回提示区 -->
        <el-alert
          v-if="isEdit && rejectReason"
          class="reject-alert"
          type="error"
          show-icon
          :closable="false"
          title="该文章被驳回，请修改后重新提交"
        >
          <template #default>
            <span class="reject-reason">驳回原因：{{ rejectReason }}</span>
          </template>
        </el-alert>

        <!-- 快捷灵感与排版片段 -->
        <div class="miku-inspiration-bar">
          <div class="insp-head">
            <span class="insp-title">快捷灵感与排版片段：</span>
            <button class="insp-random-btn" @click="insertRandomLyric">♪ 灵感金句</button>
          </div>
          <div class="insp-chips-wrap">
            <button class="insp-chip" @click="insertSnippet('♪ [创作笔记] ')">♪ 笔记前缀</button>
            <button class="insp-chip" @click="insertSnippet('\n\n--- ✦ 初音音浪 ✦ ---\n\n')">✦ 分割线</button>
            <button class="insp-chip" @click="insertSnippet('\n\n> 千本桜 夜ニ紛レ 君ノ声モ 届カナイ... ♪\n')">♫ 《千本樱》</button>
            <button class="insp-chip" @click="insertSnippet('\n\n> 即使声音微弱，也要传送到世界的每一个角落... ✦\n')">✦ 灵感寄语</button>
            <button class="insp-chip" @click="insertSnippet('\n\n> 感谢阅读！愿音乐与文字带给你好心情 ♪')">♪ 结尾致谢</button>
          </div>
        </div>

        <el-form :model="articleForm" :rules="rules" ref="formRef" label-position="top" class="editor-form">
          <!-- 标题输入框 (精心打造赛博头部标识) -->
          <el-form-item prop="title">
            <div class="title-input-outer">
              <span class="title-head-badge">标题</span>
              <el-input
                v-model="articleForm.title"
                placeholder="请输入唯美的文章标题... ♪"
                maxlength="100"
                show-word-limit
                class="title-input"
              />
            </div>
          </el-form-item>

          <!-- 摘要输入框 -->
          <el-form-item>
            <el-input
              v-model="articleForm.description"
              type="textarea"
              :rows="2"
              placeholder="文章摘要（选填，不填则自动截取正文前 100 字...）"
              maxlength="200"
              show-word-limit
              class="desc-input"
            />
          </el-form-item>

          <!-- 封面图上传 + 预置初音高清画廊选框 -->
          <el-form-item>
            <template #label>
              <div class="miku-label-wrap">
                <span class="form-label">✦ 封面配图设置</span>
                <span class="form-label-hint">（支持上传本地图片或直接选选用初音预置画廊）</span>
              </div>
            </template>

            <!-- 预置初音画廊一键选择 -->
            <div class="preset-covers-bar">
              <span class="preset-title">♪ 选用初音高清预设封面：</span>
              <div class="preset-items-row">
                <div
                  v-for="(pCover, pIdx) in presetCovers"
                  :key="pIdx"
                  class="preset-cover-thumb"
                  :class="{ active: articleForm.cover === pCover }"
                  @click="setPresetCover(pCover)"
                >
                  <img :src="pCover" alt="Preset Miku Cover" />
                  <span class="preset-check" v-if="articleForm.cover === pCover">✓</span>
                </div>
              </div>
            </div>

            <!-- 自定义封面上传区 -->
            <el-upload
              class="cover-uploader"
              :action="uploadUrl"
              :headers="uploadHeaders"
              name="image"
              :show-file-list="false"
              :before-upload="beforeCoverUpload"
              :on-success="handleCoverSuccess"
              :on-error="handleCoverError"
            >
              <div class="cover-upload-area" v-if="!articleForm.cover">
                <el-icon :size="32" class="upload-icon"><Picture /></el-icon>
                <span class="upload-text">点击上传本地封面配图</span>
                <span class="upload-hint">支持 JPG / PNG / WEBP，单个不超过 5MB</span>
              </div>
              <div class="cover-preview-area" v-else>
                <img :src="coverPreview" alt="文章封面预览" class="cover-preview" />
                <div class="cover-actions">
                  <span class="cover-action-text">
                    <el-icon><RefreshRight /></el-icon> 点击更换封面图片
                  </span>
                </div>
              </div>
            </el-upload>
            <button type="button" v-if="articleForm.cover" class="remove-cover-btn" @click="removeCover">
              <el-icon><Delete /></el-icon> 移除当前封面
            </button>
          </el-form-item>

          <!-- 富文本编辑器 (WangEditor) -->
          <el-form-item prop="content">
            <div class="editor-wrapper">
              <Toolbar class="editor-toolbar" :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" />
              <Editor
                class="editor-content"
                v-model="articleForm.content"
                :defaultConfig="editorConfig"
                mode="default"
                @onCreated="handleEditorCreated"
                @onChange="handleEditorChange"
              />
            </div>
            <div class="editor-footer">
              <span class="word-count">
                <el-icon :size="13"><EditPen /></el-icon>
                <span>全文字数：<strong>{{ wordCount }}</strong> 字</span>
                <span class="read-time-hint">（预计阅读 {{ estimatedReadTime }} 分钟）</span>
              </span>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 右侧：属性与设置面板 (加入初音壁纸 + 悬浮变清晰) -->
      <div class="editor-right" v-if="!isFocusMode">
        <!-- 发布设置 -->
        <div class="setting-card glass-miku-card">
          <div class="card-miku-bg-wrap" aria-hidden="true">
            <img src="/images/miku/miku_wp_5.jpg" alt="Setting Bg 1" class="card-miku-bg-img" />
            <div class="card-scrim-mask"></div>
          </div>
          <div class="hud-card-tag">✦ 发布配置</div>

          <div class="setting-header">
            <el-icon :size="16" class="setting-header-icon teal"><Setting /></el-icon>
            <span>发布状态设置</span>
          </div>
          <div class="setting-body">
            <div class="setting-row">
              <span class="setting-label">提交类型</span>
              <el-radio-group v-model="articleForm.status" size="small" class="miku-radio-group">
                <el-radio-button :value="1">{{ userStore.isAdmin ? '正式发布' : '提交审核' }}</el-radio-button>
                <el-radio-button :value="0">存为草稿</el-radio-button>
              </el-radio-group>
            </div>
            <p class="setting-tip" v-if="!userStore.isAdmin">
              ✦ 提交后需管理员审核通过后即可在全站展示
            </p>
          </div>
        </div>

        <!-- 文章分类 -->
        <div class="setting-card glass-miku-card">
          <div class="card-miku-bg-wrap" aria-hidden="true">
            <img src="/images/miku/miku_wp_8.jpg" alt="Setting Bg 2" class="card-miku-bg-img" />
            <div class="card-scrim-mask"></div>
          </div>
          <div class="hud-card-tag">✦ 所属分类</div>

          <div class="setting-header">
            <el-icon :size="16" class="setting-header-icon gold"><FolderOpened /></el-icon>
            <span>所属分类</span>
          </div>
          <div class="setting-body">
            <el-select v-model="articleForm.category_id" placeholder="请选择文章分类..." style="width: 100%;" clearable class="miku-select">
              <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </div>
        </div>

        <!-- 文章标签 -->
        <div class="setting-card glass-miku-card">
          <div class="card-miku-bg-wrap" aria-hidden="true">
            <img src="/images/miku/miku_wp_7.jpg" alt="Setting Bg 3" class="card-miku-bg-img" />
            <div class="card-scrim-mask"></div>
          </div>
          <div class="hud-card-tag">✦ 内容标签</div>

          <div class="setting-header">
            <el-icon :size="16" class="setting-header-icon purple"><PriceTag /></el-icon>
            <span>内容标签</span>
          </div>
          <div class="setting-body">
            <el-select
              v-model="articleForm.tag_ids"
              multiple
              placeholder="选择文章标签 (可多选)..."
              style="width: 100%;"
              collapse-tags
              collapse-tags-tooltip
              class="miku-select"
            >
              <el-option v-for="tag in tagList" :key="tag.id" :label="tag.name" :value="tag.id" />
            </el-select>
          </div>
        </div>

        <!-- 编辑模式信息 -->
        <div class="setting-card glass-miku-card" v-if="isEdit">
          <div class="card-miku-bg-wrap" aria-hidden="true">
            <img src="/images/miku/miku_wp_4.jpg" alt="Setting Bg 4" class="card-miku-bg-img" />
            <div class="card-scrim-mask"></div>
          </div>
          <div class="hud-card-tag">✦ 文章详情</div>

          <div class="setting-header">
            <el-icon :size="16" class="setting-header-icon cyan"><DataLine /></el-icon>
            <span>文章编号信息</span>
          </div>
          <div class="setting-body">
            <div class="info-row">
              <span class="info-label">文章 ID</span>
              <span class="info-value"># {{ route.params.id }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, shallowRef, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import { ElMessage } from 'element-plus';
import request, { authHeader } from '../../api/request';
import { createArticle, updateArticle, getArticleById } from '../../api/article';
import { useUserStore } from '../../stores/user';
import {
  ArrowLeft, CircleCheck, DocumentCopy, Promotion, Loading,
  Picture, RefreshRight, Delete, EditPen, Setting,
  FolderOpened, PriceTag, DataLine
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const formRef = ref(null);
const submitLoading = ref(false);
const autoSaved = ref(false);
const wordCount = ref(0);
const isFocusMode = ref(false);

const isEdit = computed(() => !!route.params.id);
const rejectReason = ref('');

const estimatedReadTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 300)));

const toggleFocusMode = () => {
  isFocusMode.value = !isFocusMode.value;
  if (isFocusMode.value) {
    ElMessage.success('已开启初音 Zen 专注写作模式 ♪');
  } else {
    ElMessage.info('已退出专注模式');
  }
};

const submitBtnText = computed(() => {
  if (isEdit.value) return userStore.isAdmin ? '更新文章' : '重新提交';
  return userStore.isAdmin ? '发布文章' : '提交审核';
});

const uploadUrl = `${(import.meta.env.VITE_API_BASE_URL || '/api')}/article/upload`;
const editorRef = shallowRef(null);

// 预置初音画廊封面图列表
const presetCovers = [
  '/images/miku/miku_wp_1.jpg',
  '/images/miku/miku_wp_5.jpg',
  '/images/miku/miku_wp_8.jpg',
  '/images/miku/miku_wp_9.jpg',
  '/images/miku/miku_wp_7.jpg',
  '/images/miku/miku_wp_4.jpg'
];

const setPresetCover = (url) => {
  articleForm.cover = url;
  coverPreview.value = url;
  ElMessage.success('已选用初音高清画廊封面！');
};

// 经典初音歌词与句子库
const mikuLyrics = [
  '♪ 千本桜 夜ニ紛レ 君ノ声モ 届カナイ... (千本樱)',
  '✦ 即使声音微弱，也要传送到世界的每一个角落... (Tell Your World)',
  '★ 世界第一的公主殿下，请铭记在心哦 (World is Mine)',
  '🌸 即使相隔遥远，音乐也能将我们紧紧相连... (39)',
  '♫ 唱吧，将心中的律动化为永恒的旋律！'
];

const insertRandomLyric = () => {
  const lyric = mikuLyrics[Math.floor(Math.random() * mikuLyrics.length)];
  insertSnippet(`\n\n> ${lyric}\n\n`);
};

const articleForm = reactive({
  title: '',
  description: '',
  content: '',
  cover: '',
  category_id: null,
  tag_ids: [],
  status: 1
});

// 封面预览地址（可显示）；articleForm.cover 存 key 用于提交
const coverPreview = ref('');

const rules = {
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }]
};

const categoryList = ref([]);
const tagList = ref([]);

const uploadHeaders = computed(() => ({
  Authorization: authHeader()
}));

const toolbarConfig = {
  excludeKeys: ['fullScreen', 'group-video', 'insertTable', 'codeBlock']
};

const editorConfig = {
  placeholder: '在初音未来的歌声里写下你的文章吧... ♪',
  autoFocus: false,
  scroll: false,
  MENU_CONF: {
    uploadImage: {
      server: uploadUrl,
      fieldName: 'image',
      headers: uploadHeaders,
      maxFileSize: 5 * 1024 * 1024,
      allowedFileTypes: ['image/*'],
      customInsert(res, insertFn) {
        if (res.code === 200) {
          insertFn(res.data.url, '', '');
        }
      }
    }
  }
};

const handleEditorCreated = (editor) => { editorRef.value = editor; };

const handleEditorChange = (editor) => {
  const text = editor.getText().trim();
  wordCount.value = text.length;
};

// 插入快捷灵感模版片段
const insertSnippet = (snippetText) => {
  if (editorRef.value) {
    editorRef.value.insertText(snippetText);
    ElMessage.success('已插入初音快捷灵感片段 ♪');
  } else {
    articleForm.content += snippetText;
  }
};

// 自动保存
let autoSaveTimer = null;
const startAutoSave = () => {
  autoSaveTimer = setInterval(() => {
    if (articleForm.title || articleForm.content) {
      localStorage.setItem('draft_article', JSON.stringify({
        title: articleForm.title,
        description: articleForm.description,
        content: articleForm.content,
        cover: articleForm.cover,
        coverPreview: coverPreview.value,
        category_id: articleForm.category_id,
        tag_ids: articleForm.tag_ids
      }));
      autoSaved.value = true;
      setTimeout(() => { autoSaved.value = false; }, 2000);
    }
  }, 30000);
};

const restoreDraft = () => {
  const draft = localStorage.getItem('draft_article');
  if (draft && !isEdit.value) {
    try {
      const data = JSON.parse(draft);
      articleForm.title = data.title || '';
      articleForm.description = data.description || '';
      articleForm.content = data.content || '';
      articleForm.cover = data.cover || '';
      const rawCover = data.coverPreview || data.cover || '';
      if (!rawCover || rawCover.startsWith('http') || rawCover.startsWith('/')) {
        coverPreview.value = rawCover;
      } else {
        const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
        coverPreview.value = `${apiOrigin}/uploads/${rawCover.replace(/^\/+/, '')}`;
      }
      articleForm.category_id = data.category_id || null;
      articleForm.tag_ids = data.tag_ids || [];
    } catch (e) { }
  }
};

const saveDraft = () => {
  articleForm.status = 0;
  handleSubmit();
};

const beforeCoverUpload = (file) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(file.type)) {
    ElMessage.error('只能上传 JPG/PNG/GIF/WEBP 格式!');
    return false;
  }
  if (file.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过 5MB!');
    return false;
  }
  return true;
};

const handleCoverSuccess = (response) => {
  if (response.code === 200) {
    articleForm.cover = response.data.key;
    coverPreview.value = response.data.url;
    ElMessage.success('封面上传成功！');
  } else {
    ElMessage.error(response.message || '上传失败');
  }
};

const handleCoverError = () => {
  ElMessage.error('封面图片上传失败，请检查登录状态或图片格式后重试');
};

// 移除封面：同时清空 key 和预览
const removeCover = () => {
  articleForm.cover = '';
  coverPreview.value = '';
};

const fetchOptions = async () => {
  try {
    const [catRes, tagRes] = await Promise.all([
      request.get('/category'),
      request.get('/tag')
    ]);
    categoryList.value = catRes.data;
    tagList.value = tagRes.data;
  } catch (error) {
    console.error('获取选项失败:', error);
  }
};

const fetchArticle = async () => {
  if (!route.params.id) return;
  try {
    const res = await getArticleById(route.params.id);
    const data = res.data;
    articleForm.title = data.title;
    articleForm.description = data.description;
    articleForm.content = data.content;
    articleForm.cover = data.cover;
    coverPreview.value = data.cover_url || '';
    articleForm.category_id = data.category_id;
    articleForm.tag_ids = data.tag_ids || [];
    articleForm.status = data.status === 0 ? 0 : 1;
    rejectReason.value = data.status === 3 ? (data.reject_reason || '') : '';
  } catch (error) {
    console.error('获取文章失败:', error);
    ElMessage.error('文章加载失败');
    router.push('/');
  }
};

const handleSubmit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    if (!articleForm.content || articleForm.content === '<p><br></p>') {
      ElMessage.warning('请输入文章内容');
      return;
    }
    submitLoading.value = true;
    try {
      if (isEdit.value) {
        await updateArticle(route.params.id, articleForm);
        ElMessage.success(
          articleForm.status === 0
            ? '草稿已更新'
            : userStore.isAdmin ? '文章更新成功！' : '文章已重新提交，等待管理员审核'
        );
      } else {
        await createArticle(articleForm);
        ElMessage.success(
          articleForm.status === 0
            ? '草稿保存成功！'
            : userStore.isAdmin ? '文章发布成功！' : '文章已提交，等待管理员审核'
        );
        localStorage.removeItem('draft_article');
      }
      router.push('/articles');
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      submitLoading.value = false;
    }
  });
};

onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再发布文章');
    router.push('/login');
    return;
  }
  fetchOptions();
  fetchArticle();
  restoreDraft();
  startAutoSave();
});

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) editor.destroy();
  if (autoSaveTimer) clearInterval(autoSaveTimer);
});
</script>

<style scoped>
/* ============================================================
   PUBLISH PAGE - 初音未来赛博音律 01 写文章页面大胆极致重构
   ============================================================ */
.publish-page {
  background: linear-gradient(180deg, #E2F5F2 0%, #D8F2EE 100%);
  min-height: 100vh;
  padding-top: var(--navbar-height);

  --pub-ink-strong: #0B3B37;
  --pub-ink:        #0F4F49;
  --pub-ink-soft:   #357268;
  --pub-deep:       #0B7A73;
  --pub-deep-2:     #08635D;
}

.publish-page.is-focus-mode {
  background: #062826 !important;
}

.glass-miku-card {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1.5px solid rgba(57, 197, 187, 0.32);
  box-shadow: 0 10px 30px rgba(57, 197, 187, 0.1);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ================= 1. HERO 看板 ================= */
.publish-hero-banner {
  position: relative;
  overflow: hidden;
  padding: 36px 24px 44px;
  background: linear-gradient(135deg, #064F4A 0%, #0A6E67 55%, #0C7B73 100%);
  color: #ffffff;
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
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.hero-scrim-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6, 40, 38, 0.7) 0%, rgba(10, 60, 56, 0.8) 100%);
}

.publish-hero-banner:hover .hero-artwork-bg {
  transform: scale(1.03);
  opacity: 0.45;
}

.hero-inner {
  max-width: 1240px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}

.hero-left-content {
  flex: 1;
}

.badge-tag {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 9999px;
  background: rgba(6, 40, 38, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.35);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #ffffff;
  margin-bottom: 12px;
}

.hero-title {
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 900;
  margin: 0 0 10px;
  letter-spacing: 0.5px;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
}

.hero-subtitle {
  font-size: clamp(13px, 1.8vw, 15px);
  color: #ffffff;
  line-height: 1.6;
  margin: 0 0 20px;
  max-width: 620px;
}

.hero-stats-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 9999px;
  background: rgba(6, 40, 38, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 12.5px;
  font-weight: 700;
  color: #ffffff;
}

.focus-toggle-pill {
  cursor: pointer;
  background: #C2185B;
  border-color: #ffffff;
  transition: all 0.2s ease;
}

.focus-toggle-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(255, 126, 157, 0.4);
}

/* 右侧 HUD 看板 */
.hero-cyber-panel {
  width: 240px;
  flex-shrink: 0;
}

@media (max-width: 860px) {
  .hero-cyber-panel { display: none; }
}

.cyber-panel-hud {
  padding: 16px;
  border-radius: 18px;
  background: rgba(6, 40, 38, 0.3);
  backdrop-filter: blur(16px);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.hud-top-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.miku-badge-code {
  font-family: monospace;
  font-size: 11px;
  font-weight: 800;
  color: #ffffff;
  background: #C2185B;
  padding: 2px 7px;
  border-radius: 4px;
}

.miku-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #FF7E9D;
  box-shadow: 0 0 8px #FF7E9D;
}

.miku-status-text {
  font-size: 10.5px;
  font-weight: 700;
  color: #ffffff;
}

.miku-visual-equalizer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 30px;
  margin-bottom: 10px;
}

.eq-bar {
  width: 3px;
  background: linear-gradient(180deg, #FF7E9D 0%, #ffffff 100%);
  border-radius: 3px;
  animation: hudEqPulse 1.4s ease-in-out infinite alternate;
}

@keyframes hudEqPulse {
  0% { height: 20%; opacity: 0.4; }
  100% { height: 100%; opacity: 1; }
}

.hud-bottom-info {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  font-weight: 700;
  color: #ffffff;
  border-top: 1px dashed rgba(255, 255, 255, 0.25);
  padding-top: 8px;
}

/* ================= 2. Sticky 顶部操作栏 ================= */
.top-bar {
  position: sticky;
  top: var(--navbar-height);
  z-index: 100;
  /* 性能：去掉 backdrop-filter（sticky 顶栏随正文滚动持续重模糊） */
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1.5px solid rgba(57, 197, 187, 0.3);
  box-shadow: 0 4px 20px rgba(57, 197, 187, 0.1);
}

.top-bar-inner {
  max-width: 1240px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (min-width: 768px) {
  .top-bar-inner { padding: 12px 24px; }
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  background: #ffffff;
  border: 1px solid rgba(57, 197, 187, 0.4);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--pub-ink-soft);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #E3F7F4;
  color: var(--pub-deep);
}

.back-text { display: none; }
@media (min-width: 640px) { .back-text { display: inline; } }

.top-bar-divider {
  width: 1.5px;
  height: 20px;
  background: rgba(57, 197, 187, 0.3);
  display: none;
}
@media (min-width: 640px) { .top-bar-divider { display: block; } }

.top-bar-title {
  font-size: 16px;
  font-weight: 900;
  color: var(--pub-ink-strong);
}

.miku-editor-badge {
  font-family: monospace;
  font-size: 10px;
  font-weight: 800;
  color: #ffffff;
  background: #C2185B;
  padding: 2px 8px;
  border-radius: 6px;
  display: none;
}
@media (min-width: 768px) { .miku-editor-badge { display: inline-block; } }

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-focus {
  padding: 7px 14px;
  border-radius: 12px;
  border: 1px solid rgba(57, 197, 187, 0.4);
  background: #E3F7F4;
  color: var(--pub-deep);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.auto-save-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--pub-deep);
  white-space: nowrap;
}

.save-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FF7E9D;
  box-shadow: 0 0 8px #FF7E9D;
}

.btn-draft, .btn-publish {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
  white-space: nowrap;
}

.btn-draft {
  background: #ffffff;
  color: var(--pub-ink-soft);
  border: 1.5px solid rgba(57, 197, 187, 0.35);
}

.btn-draft:hover:not(:disabled) {
  background: #E3F7F4;
  color: var(--pub-deep);
}

.btn-publish {
  background: linear-gradient(135deg, var(--pub-deep) 0%, var(--pub-deep-2) 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(57, 197, 187, 0.4);
}

.btn-publish:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(255, 126, 157, 0.45);
  transform: translateY(-2px);
}

.btn-draft:disabled, .btn-publish:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================= 3. 双栏布局 ================= */
.publish-body {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
}

@media (min-width: 1024px) {
  .publish-body {
    grid-template-columns: 1fr 300px;
    padding: 28px 24px 80px;
  }
}

.is-focus-mode .publish-body {
  grid-template-columns: 1fr !important;
  max-width: 960px !important;
}

/* ================= 4. 左侧编辑区 (壁纸 + 悬浮变清晰) ================= */
.editor-left {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 24px;
  border: 1.5px solid rgba(57, 197, 187, 0.32);
}

@media (min-width: 768px) {
  .editor-left { padding: 30px; }
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
  opacity: 0.14;
  filter: saturate(1.08) blur(1.8px);
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.38s ease, filter 0.38s ease;
}

.card-scrim-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(125deg, rgba(255, 255, 255, 0.78) 0%, rgba(238, 252, 250, 0.64) 55%, rgba(255, 238, 246, 0.52) 100%);
  transition: opacity 0.38s ease;
}

.editor-left:hover .card-miku-bg-img {
  transform: scale(1.03);
  opacity: 0.62;
  filter: brightness(1.05) saturate(1.26) blur(0px);
}

.editor-left:hover .card-scrim-mask {
  opacity: 0.62;
}

.editor-form, .miku-inspiration-bar, .reject-alert {
  position: relative;
  z-index: 1;
}

/* 灵感与歌词库助手 */
.miku-inspiration-bar {
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(234, 249, 248, 0.95);
  border: 1.5px solid rgba(57, 197, 187, 0.35);
  margin-bottom: 22px;
}

.insp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.insp-title {
  font-size: 13px;
  font-weight: 900;
  color: var(--pub-ink-strong);
}

.insp-random-btn {
  padding: 3px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 126, 157, 0.4);
  background: rgba(255, 126, 157, 0.12);
  color: #C2185B;
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.insp-random-btn:hover {
  background: #C2185B;
  color: #ffffff;
}

.insp-chips-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.insp-chip {
  padding: 5px 12px;
  border-radius: 12px;
  border: 1px solid rgba(57, 197, 187, 0.35);
  background: #ffffff;
  color: var(--pub-ink);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.insp-chip:hover {
  background: var(--pub-deep);
  color: #ffffff;
  border-color: transparent;
}

/* 标题框大升级 */
.title-input-outer {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 2.5px solid rgba(57, 197, 187, 0.35);
  padding-bottom: 4px;
  transition: border-color 0.3s ease;
}

.title-head-badge {
  font-family: monospace;
  font-size: 11px;
  font-weight: 900;
  color: #ffffff;
  background: var(--pub-deep);
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.title-input {
  flex: 1;
}

.title-input :deep(.el-input__wrapper) {
  font-size: 24px;
  font-weight: 900;
  padding: 6px 0;
  box-shadow: none !important;
  border-radius: 0;
  background: transparent;
}

.title-input :deep(.el-input__inner) {
  color: var(--pub-ink-strong);
}

.title-input :deep(.el-input__inner::placeholder) {
  color: var(--pub-ink-soft);
  opacity: 1;
}

.title-input-outer:focus-within {
  border-bottom-color: #39C5BB;
}

.desc-input :deep(.el-textarea__inner) {
  font-size: 14px;
  font-weight: 600;
  color: var(--pub-ink);
  box-shadow: none !important;
  border: 1.5px solid rgba(57, 197, 187, 0.3);
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.92);
  transition: all 0.25s ease;
}

.desc-input :deep(.el-textarea__inner:focus) {
  border-color: #39C5BB;
  box-shadow: 0 0 14px rgba(57, 197, 187, 0.2) !important;
}

.miku-label-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-label {
  font-weight: 900;
  color: var(--pub-ink-strong);
}

.form-label-hint {
  font-size: 12px;
  color: var(--pub-ink-soft);
  font-weight: 700;
}

/* 预置初音画廊封面选框 */
.preset-covers-bar {
  margin-bottom: 12px;
}

.preset-title {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: var(--pub-deep);
  margin-bottom: 8px;
}

.preset-items-row {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.preset-cover-thumb {
  position: relative;
  width: 72px;
  height: 46px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid rgba(57, 197, 187, 0.35);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.preset-cover-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preset-cover-thumb:hover {
  transform: translateY(-2px);
  border-color: #39C5BB;
}

.preset-cover-thumb.active {
  border-color: #FF7E9D;
  box-shadow: 0 0 10px rgba(255, 126, 157, 0.5);
}

.preset-check {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #C2185B;
  color: #ffffff;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 900;
}

/* 封面上传 */
.cover-uploader {
  width: 100%;
}

.cover-uploader :deep(.el-upload) {
  width: 100% !important;
  display: block !important;
}

.cover-upload-area {
  width: 100%;
  height: 140px;
  border: 2px dashed rgba(57, 197, 187, 0.4);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--pub-ink-soft);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(234, 249, 248, 0.6);
}

.cover-upload-area:hover {
  border-color: #39C5BB;
  color: var(--pub-deep);
  background: #E3F7F4;
}

.upload-icon { color: #39C5BB; }
.upload-text { font-weight: 800; }
.upload-hint { font-size: 11px; color: var(--pub-ink-soft); }

.cover-preview-area {
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  border: 1.5px solid rgba(57, 197, 187, 0.4);
}

.cover-preview {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  display: block;
}

.cover-actions {
  position: absolute;
  inset: 0;
  background: rgba(11, 61, 56, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cover-preview-area:hover .cover-actions { opacity: 1; }

.cover-action-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 20px;
  border-radius: 9999px;
  backdrop-filter: blur(4px);
}

.remove-cover-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  background: none;
  border: none;
  color: #C2185B;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0;
}

/* 富文本编辑器 */
.editor-wrapper {
  border: 1.5px solid rgba(57, 197, 187, 0.35);
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.editor-wrapper:focus-within {
  border-color: #39C5BB;
  box-shadow: 0 0 18px rgba(57, 197, 187, 0.25);
}

.editor-toolbar {
  border-bottom: 1px solid rgba(57, 197, 187, 0.2);
  background: #E3F7F4;
}

.editor-content {
  min-height: 460px;
  height: 560px;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0 0;
}

.word-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--pub-ink-soft);
}

.word-count strong { color: var(--pub-deep); }
.read-time-hint { color: #FF7E9D; }

/* ================= 5. 右侧设置面板 (壁纸 + 悬浮变清晰) ================= */
.editor-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 1024px) {
  .editor-right {
    position: sticky;
    top: 130px;
  }
}

.setting-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 20px;
  border: 1.5px solid rgba(57, 197, 187, 0.32);
}

.hud-card-tag {
  position: absolute;
  top: 12px;
  right: 14px;
  font-family: monospace;
  font-size: 9px;
  font-weight: 900;
  color: var(--pub-deep);
  background: rgba(57, 197, 187, 0.18);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(57, 197, 187, 0.35);
  z-index: 2;
}

.setting-card:hover .card-miku-bg-img {
  transform: scale(1.05);
  opacity: 0.68;
  filter: brightness(1.06) saturate(1.28) blur(0px);
}

.setting-card:hover .card-scrim-mask { opacity: 0.58; }

.setting-header, .setting-body {
  position: relative;
  z-index: 1;
}

.setting-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14.5px;
  font-weight: 900;
  color: var(--pub-ink-strong);
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(57, 197, 187, 0.35);
}

.setting-header-icon.teal { color: #39C5BB; }
.setting-header-icon.gold { color: #F59E0B; }
.setting-header-icon.purple { color: #A78BFA; }
.setting-header-icon.cyan { color: #0284c7; }

.setting-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.setting-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--pub-ink-strong);
}

.miku-radio-group :deep(.el-radio-button__inner) {
  font-weight: 800;
  border-color: rgba(57, 197, 187, 0.3);
}

.miku-radio-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--pub-deep);
  border-color: var(--pub-deep);
  box-shadow: -1px 0 0 0 var(--pub-deep);
}

.setting-tip {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--pub-deep);
  line-height: 1.5;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.info-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--pub-ink-soft);
}

.info-value {
  font-size: 13px;
  font-weight: 900;
  color: var(--pub-ink-strong);
  font-family: monospace;
}

/* 下拉框主题化 */
.miku-select :deep(.el-input__wrapper) {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: none !important;
  border: 1.5px solid rgba(57, 197, 187, 0.3);
  transition: all 0.25s ease;
}

.miku-select :deep(.el-input__wrapper:focus-within) {
  border-color: #39C5BB;
  box-shadow: 0 0 12px rgba(57, 197, 187, 0.25) !important;
}

.reject-alert {
  margin-bottom: 18px;
  border-radius: 14px;
}

.reject-reason {
  font-size: 13px;
  line-height: 1.6;
  font-weight: 700;
}

/* ================= 移动端精细化响应式 (MOBILE RESPONSIVENESS) ================= */
@media (max-width: 768px) {
  .publish-hero-banner {
    padding: 20px 14px 24px;
  }
  .badge-tag {
    font-size: 9px;
    padding: 2px 8px;
    letter-spacing: 0.8px;
  }
  .hero-title {
    font-size: 20px;
    margin-bottom: 6px;
  }
  .hero-subtitle {
    font-size: 12px;
    margin-bottom: 12px;
    line-height: 1.5;
  }
  .hero-stats-row {
    gap: 6px;
  }
  .stat-pill {
    padding: 4px 10px;
    font-size: 11px;
  }

  /* 顶部 Sticky 操作栏适配 */
  .top-bar-inner {
    padding: 8px 10px;
    gap: 6px;
  }
  .back-btn {
    padding: 5px 8px;
    font-size: 12px;
  }
  .top-bar-title {
    font-size: 13.5px;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .top-bar-right {
    gap: 6px;
  }
  .btn-focus {
    padding: 5px 8px;
    font-size: 11px;
  }
  .auto-save-hint {
    display: none;
  }
  .btn-draft, .btn-publish {
    padding: 6px 10px;
    font-size: 11.5px;
    gap: 4px;
  }

  /* 编辑器双栏转单栏 */
  .publish-body {
    grid-template-columns: 1fr !important;
    padding: 14px 10px 60px;
    gap: 14px;
  }

  .editor-left {
    padding: 16px 12px;
    border-radius: 16px;
  }

  /* 灵感助手胶囊单排横向滑动 */
  .insp-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .insp-chips-wrap {
    display: flex;
    overflow-x: auto;
    flex-wrap: nowrap;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 4px;
    width: 100%;
  }
  .insp-chips-wrap::-webkit-scrollbar {
    display: none;
  }
  .insp-chip {
    flex-shrink: 0;
    font-size: 11px;
    padding: 3px 8px;
  }

  /* 标题与封面设置 */
  .title-input-outer {
    gap: 6px;
    padding-bottom: 2px;
  }
  .title-head-badge {
    font-size: 10px;
    padding: 3px 6px;
    border-radius: 6px;
    flex-shrink: 0;
  }
  .title-input :deep(.el-input__wrapper) {
    font-size: 16px !important;
    padding: 4px 0 !important;
  }
  .title-input :deep(.el-input__inner) {
    font-size: 16px !important;
  }
  .desc-input :deep(.el-textarea__inner) {
    font-size: 12.5px !important;
    padding: 8px 10px !important;
    border-radius: 10px;
  }
  .miku-label-wrap {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .form-label {
    font-size: 13.5px;
  }
  .form-label-hint {
    font-size: 11px;
    line-height: 1.35;
  }
  .preset-covers-bar {
    margin-bottom: 8px;
  }
  .preset-title {
    font-size: 11.5px;
    margin-bottom: 6px;
  }
  .preset-items-row {
    display: flex;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
    padding-bottom: 4px;
  }
  .preset-items-row::-webkit-scrollbar {
    display: none;
  }
  .preset-cover-thumb {
    width: 60px;
    height: 38px;
    flex-shrink: 0;
  }
  .cover-upload-area {
    width: 100%;
    height: 110px;
    font-size: 12px;
  }
  .cover-preview {
    max-height: 150px;
  }

  /* 富文本编辑器工具栏横向自适应与高度 */
  .editor-toolbar {
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .editor-toolbar::-webkit-scrollbar {
    display: none;
  }
  .editor-content {
    min-height: 320px !important;
    height: 420px !important;
  }

  /* 右侧设置面板 */
  .editor-right {
    gap: 12px;
  }
  .setting-card {
    padding: 14px;
    border-radius: 14px;
  }
  .setting-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .miku-radio-group {
    width: 100%;
    display: flex;
  }
  .miku-radio-group :deep(.el-radio-button) {
    flex: 1;
    text-align: center;
  }
  .miku-radio-group :deep(.el-radio-button__inner) {
    width: 100%;
    padding: 7px 10px;
  }
}
</style>