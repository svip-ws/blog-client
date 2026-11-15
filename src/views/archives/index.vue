<template>
    <div class="page-container archives-page">
        <MikuPageHero motif="archives" title="归档"
            subtitle="按时间轨迹回溯每一篇文字与灵感的诞生历程。" banner="/images/miku/miku_archives_banner.jpg"
            :stats="heroStats" />

        <!-- 顶部时光罗盘导航与视图切换栏 -->
        <div class="archive-toolbar glass-miku-card">
            <div class="toolbar-left">
                <span class="toolbar-label">
                    <span class="pulse-icon">✦</span> 年份跃迁导航:
                </span>
                <div class="year-pills">
                    <button class="pill-btn" :class="{ active: selectedYear === 'all' }" @click="selectedYear = 'all'">
                        全部年份
                    </button>
                    <button v-for="yr in availableYears" :key="yr" class="pill-btn"
                        :class="{ active: selectedYear === yr }" @click="selectedYear = yr">
                        {{ yr }} 年
                    </button>
                </div>
            </div>

            <div class="toolbar-right">
                <div class="view-mode-group">
                    <button class="mode-btn" :class="{ active: viewMode === 'timeline' }" @click="viewMode = 'timeline'" title="时间轴视图">
                        <span>时间轴</span>
                    </button>
                    <button class="mode-btn" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="网格卡片视图">
                        <span>卡片视图</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 归档全景主体双栏布局：主内容区 + 右侧 Q 版初音陪同挂件 -->
        <div class="archives-main-layout">
            <!-- 加载骨架屏 -->
            <div v-if="loading" class="skeleton-timeline">
                <div v-for="i in 3" :key="i" class="skeleton-group glass-miku-card">
                    <div class="skeleton-header">
                        <div class="skeleton-circle-sm"></div>
                        <div class="skeleton-line" style="width: 120px;"></div>
                        <div class="skeleton-chip"></div>
                    </div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="filteredArchives.length === 0" class="empty-state-box glass-miku-card">
                <div class="empty-icon">🎧</div>
                <p class="empty-text">该时间段内暂无归档记录，去探索其他年份吧！</p>
                <span class="empty-note">♪ ── ♫ ── ♬</span>
            </div>

            <!-- 【视图 1】：炫酷时光轴模式 -->
            <div v-else-if="viewMode === 'timeline'" class="archives-list">
                <div v-for="(group, index) in filteredArchives" :key="group.year_month" class="year-group"
                    :style="{ animationDelay: index * 0.08 + 's' }">
                    
                    <!-- 炫酷月度基座 header（带 4K 壁纸底图 + 唱片图标 + 频谱波形） -->
                    <div class="year-header glass-miku-card">
                        <!-- 月度背景壁纸层（全卡色彩氛围 + 右侧等比立绘） -->
                        <div class="year-bg-wrap">
                            <img :src="getGroupBg(index)" class="year-bg-ambient" alt="" />
                            <img :src="getGroupBg(index)" class="year-bg-img" alt="Miku 4K Wallpaper" />
                            <div class="year-bg-mask"></div>
                        </div>

                        <div class="year-header-content">
                            <div class="year-icon">
                                <span class="icon-vinyl"></span>
                                <el-icon><Calendar /></el-icon>
                            </div>
                            <h3 class="year-title">{{ formatYearMonth(group.year_month) }}</h3>
                            <span class="year-eq" aria-hidden="true">
                                <i v-for="i in 6" :key="i" :style="{ animationDelay: (i * 0.11) + 's' }"></i>
                            </span>
                            <span class="year-count-chip">{{ group.count }} 篇沉淀</span>
                            <span class="year-no">{{ String(index + 1).padStart(2, '0') }}</span>
                        </div>
                    </div>

                    <!-- 纵向声波时间轴列表 -->
                    <div class="article-timeline-list">
                        <div v-for="(article, i) in group.articles" :key="article.id"
                            class="archive-item glass-miku-card tactile-btn"
                            :style="{ animationDelay: (index * 0.06 + i * 0.03) + 's' }" @click="goToDetail(article.id)">
                            
                            <!-- 全幅初音二次元舞台壁纸与霓虹全息扫光（底层色彩氛围 + 右侧等比清晰立绘） -->
                            <div class="archive-bg-wrap" aria-hidden="true">
                                <img :src="getGroupBg(index + i + 1)" class="archive-bg-ambient" alt="" />
                                <img :src="getGroupBg(index + i + 1)" class="archive-bg-img" alt="" />
                                <div class="archive-scrim-mask"></div>
                                <div class="archive-holo-sweep"></div>
                            </div>

                            <!-- 呼吸光环节点 -->
                            <div class="item-dot-glow"></div>
                            
                            <!-- 封面预览图 -->
                            <div class="item-cover-thumb">
                                <img :src="getArticleCover(article, index + i)" class="thumb-img" alt="Cover"
                                    @error="(e) => { if (!e.target.dataset.fb) { e.target.dataset.fb = '1'; e.target.src = '/images/miku/miku_stage_art.jpg'; } }" />
                                <div class="thumb-overlay">
                                    <span class="thumb-spin-vinyl"></span>
                                </div>
                            </div>

                            <div class="item-body">
                                <div class="item-meta-top">
                                    <span class="item-date">{{ formatDateFull(article.create_time) }}</span>
                                    <span class="item-cat-badge">{{ article.category_name || '未分类' }}</span>
                                    <span v-if="article.view_count" class="item-views">
                                        <el-icon><View /></el-icon> {{ article.view_count }}
                                    </span>
                                </div>
                                <h4 class="item-title hover-underline-miku">{{ article.title }}</h4>
                            </div>
                            <span class="item-arrow">→</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 【视图 2】：二次元动漫卡片网格模式 -->
            <div v-else class="archives-grid-layout">
                <div v-for="(article, index) in allFlatArticles" :key="article.id"
                    class="grid-card glass-miku-card tactile-btn"
                    :style="{ animationDelay: index * 0.04 + 's' }" @click="goToDetail(article.id)">
                    
                    <div class="grid-card-banner">
                        <img :src="getArticleCover(article, index)" class="banner-img" alt="Card Cover"
                            @error="(e) => { if (!e.target.dataset.fb) { e.target.dataset.fb = '1'; e.target.src = '/images/miku/miku_stage_art.jpg'; } }" />
                        <div class="banner-mask"></div>
                        <span class="grid-cat-tag">{{ article.category_name || '初音文章' }}</span>
                    </div>

                    <div class="grid-card-content">
                        <div class="grid-date-row">
                            <span class="grid-date">✦ {{ formatDateFull(article.create_time) }}</span>
                            <span class="grid-views">👀 {{ article.view_count || 0 }}</span>
                        </div>
                        <h4 class="grid-card-title">{{ article.title }}</h4>
                        <div class="grid-card-footer">
                            <span class="read-link">查看详情 →</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧/挂随：Q 版初音立绘与日历二次元陪伴卡 -->
            <aside class="miku-side-companion">
                <!-- 初音陪伴与语录卡 -->
                <div class="companion-card glass-miku-card">
                    <div class="companion-head">
                        <span class="cyber-chip">时光随记</span>
                    </div>

                    <!-- Q 版初音立绘形象 (直接点击人物更换语录) -->
                    <div class="chibi-avatar-wrap tactile-btn" @click="triggerMikuQuote" title="点击初音更换语录 ✦">
                        <img src="/images/miku/miku_chibi_main.png" alt="Q版初音立绘" class="chibi-miku-img" />
                    </div>

                    <div class="companion-bubble">
                        <p class="bubble-text">{{ currentQuote }}</p>
                    </div>

                    <!-- 快捷互动动作组 -->
                    <div class="companion-actions">
                        <button class="action-mini-btn" @click="goToRandomArticle" title="随机探索一篇记忆">
                            <span>🎲 随机传送</span>
                        </button>
                        <button class="action-mini-btn" @click="scrollToTop" title="回到顶部">
                            <span>⬆️ 回到顶部</span>
                        </button>
                    </div>

                    <div class="companion-footer">
                        <div class="stats-mini">
                            <span class="mini-label">累计归档</span>
                            <span class="mini-val">{{ total }} 篇记忆</span>
                        </div>
                        <span class="music-wave-bar">
                            <i></i><i></i><i></i><i></i>
                        </span>
                    </div>
                </div>

                <!-- 初音未来风格 Cyber 日历模块 -->
                <div class="miku-calendar-card glass-miku-card">
                    <div class="calendar-header">
                        <div class="cal-title-box">
                            <span class="cal-month-text">{{ calendarHeaderTitle }}</span>
                        </div>
                        <div class="cal-nav-btns">
                            <button class="cal-nav-btn" @click="prevMonth" title="上个月">‹</button>
                            <button class="cal-nav-btn" @click="nextMonth" title="下个月">›</button>
                        </div>
                    </div>

                    <div class="calendar-week-row">
                        <span v-for="w in ['日','一','二','三','四','五','六']" :key="w" class="week-cell">{{ w }}</span>
                    </div>

                    <div class="calendar-days-grid">
                        <div v-for="(item, idx) in calendarDays" :key="idx"
                            class="day-cell"
                            :class="{
                                'other-month': !item.isCurrentMonth,
                                'is-today': item.isToday,
                                'has-article': item.hasArticle
                            }"
                            :title="item.hasArticle ? `${item.dateStr}: ${item.articles.map(a => a.title).join(' | ')}` : ''"
                            @click="handleDayClick(item)">
                            <span class="day-num">{{ item.day }}</span>
                            <span v-if="item.hasArticle" class="day-note-dot">♪</span>
                        </div>
                    </div>

                    <div class="calendar-footer">
                        <span class="cal-legend"><i class="legend-dot"></i> 含有文章记录</span>
                    </div>
                </div>
            </aside>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getArchives } from '../../api/archive';
import MikuPageHero from '../../components/common/MikuPageHero.vue';
import { Calendar, View } from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const archives = ref([]);
const selectedYear = ref('all');
const viewMode = ref('timeline');

/* Miku 专属 4K 壁纸库 */
const MIKU_ARCHIVE_BG_POOL = [
    '/images/miku/miku_wp_3.jpg',
    '/images/miku/miku_wp_1.jpg',
    '/images/miku/miku_wp_8.jpg',
    '/images/miku/miku_wp_9.jpg',
    '/images/miku/miku_wp_10.jpg',
    '/images/miku/miku_wp_11.jpg',
    '/images/miku/miku_wp_2.jpg',
    '/images/miku/miku_wp_4.jpg',
    '/images/miku/miku_wp_5.jpg',
    '/images/miku/miku_wp_7.jpg'
];

/* 初音语录交互（点击人物切换） */
const MIKU_QUOTES = [
    '按时间线索整理每一篇学习笔记与技术文章。',
    '点滴记录积累成属于自己的知识库。',
    '回顾过往写下的文字，常会有新的收获。'
];
const quoteIndex = ref(0);
const currentQuote = computed(() => MIKU_QUOTES[quoteIndex.value]);

const triggerMikuQuote = () => {
    quoteIndex.value = (quoteIndex.value + 1) % MIKU_QUOTES.length;
};

/* ==================== Miku 二次元日历组件逻辑 ==================== */
const calendarDate = ref(new Date());

const calendarYear = computed(() => calendarDate.value.getFullYear());
const calendarMonth = computed(() => calendarDate.value.getMonth() + 1);

const calendarHeaderTitle = computed(() => {
    return `${calendarYear.value} 年 ${String(calendarMonth.value).padStart(2, '0')} 月`;
});

const prevMonth = () => {
    calendarDate.value = new Date(calendarYear.value, calendarDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
    calendarDate.value = new Date(calendarYear.value, calendarDate.value.getMonth() + 1, 1);
};

// 搜集有文章发表的日期 (格式 'YYYY-MM-DD')
const articleDateMap = computed(() => {
    const map = {};
    archives.value.forEach(group => {
        if (group.articles) {
            group.articles.forEach(art => {
                if (art.create_time) {
                    const d = new Date(art.create_time);
                    const yyyymmdd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    if (!map[yyyymmdd]) map[yyyymmdd] = [];
                    map[yyyymmdd].push(art);
                }
            });
        }
    });
    return map;
});

// 计算当前视图月份的天数网格
const calendarDays = computed(() => {
    const year = calendarYear.value;
    const month = calendarDate.value.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const days = [];

    // 上个月尾数补齐
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayWeek - 1; i >= 0; i--) {
        days.push({
            day: prevLastDay - i,
            isCurrentMonth: false,
            dateStr: '',
            isToday: false,
            hasArticle: false,
            articles: []
        });
    }

    // 当月天数
    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const articles = articleDateMap.value[dateStr] || [];
        days.push({
            day: d,
            isCurrentMonth: true,
            dateStr,
            isToday: dateStr === todayStr,
            hasArticle: articles.length > 0,
            articles
        });
    }

    // 下个月开头补齐
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({
            day: i,
            isCurrentMonth: false,
            dateStr: '',
            isToday: false,
            hasArticle: false,
            articles: []
        });
    }

    return days;
});

const handleDayClick = (dayObj) => {
    if (dayObj.hasArticle && dayObj.articles.length > 0) {
        goToDetail(dayObj.articles[0].id);
    }
};

/* 可选年份 */
const availableYears = computed(() => {
    const set = new Set();
    archives.value.forEach(g => {
        if (g.year_month) {
            const yr = g.year_month.split('-')[0];
            if (yr) set.add(yr);
        }
    });
    return Array.from(set).sort((a, b) => b - a);
});

/* 过滤归档 */
const filteredArchives = computed(() => {
    if (selectedYear.value === 'all') return archives.value;
    return archives.value.filter(g => g.year_month && g.year_month.startsWith(selectedYear.value));
});

/* 平铺所有文章 */
const allFlatArticles = computed(() => {
    const list = [];
    filteredArchives.value.forEach(group => {
        if (group.articles) {
            list.push(...group.articles);
        }
    });
    return list;
});

const getGroupBg = (index) => {
    return MIKU_ARCHIVE_BG_POOL[index % MIKU_ARCHIVE_BG_POOL.length];
};

const imgBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');

const getArticleCover = (article, index) => {
    const raw = article.cover_url;
    if (raw) {
        if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
        if (raw.startsWith('/uploads/')) return imgBase ? `${imgBase}${raw}` : raw;
        return raw;
    }
    return MIKU_ARCHIVE_BG_POOL[index % MIKU_ARCHIVE_BG_POOL.length];
};

/* Hero 统计胶囊 */
const heroStats = computed(() => {
    const stats = [];
    if (!loading.value && total.value > 0) {
        stats.push({ glyph: '✦', value: total.value, label: '篇沉淀' });
    }
    if (archives.value.length > 0) {
        stats.push({ glyph: '🎧', value: archives.value.length, label: '个月份' });
    }
    return stats;
});

const formatYearMonth = (ym) => {
    if (!ym) return '';
    const [year, month] = ym.split('-');
    return `${year} 年 ${month} 月`;
};

const formatDateFull = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    if (Number.isNaN(date.getTime())) return String(timeStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const fetchArchives = async () => {
    loading.value = true;
    try {
        const res = await getArchives();
        total.value = res.data.total;
        archives.value = res.data.archives;
    } catch (error) {
        console.error('获取归档失败:', error);
    } finally {
        loading.value = false;
    }
};

const goToDetail = (id) => {
    router.push(`/article/${id}`);
};

const goToRandomArticle = () => {
    const all = allFlatArticles.value;
    if (all.length > 0) {
        const rand = all[Math.floor(Math.random() * all.length)];
        router.push(`/article/${rand.id}`);
    }
};

const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => {
    fetchArchives();
});
</script>

<style scoped>
.page-container {
    max-width: 1160px;
    margin: 0 auto;
    padding: var(--navbar-clearance) 20px 60px;
}

/* ==================== 顶部时光罗盘 Toolbar ==================== */
.archive-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.toolbar-label {
    font-size: 13px;
    font-weight: 800;
    color: #0E2926;
    display: flex;
    align-items: center;
    gap: 4px;
}

.pulse-icon {
    color: var(--miku-teal);
    animation: pulseIcon 1.6s ease-in-out infinite alternate;
}

@keyframes pulseIcon {
    from { opacity: 0.5; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1.2); }
}

.year-pills {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.pill-btn {
    border: none;
    background: rgba(255, 255, 255, 0.8);
    color: #14322F;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.25s ease;
}

.pill-btn:hover {
    border-color: var(--miku-teal);
    color: var(--miku-deep);
    background: #E3F7F4;
}

.pill-btn.active {
    background: linear-gradient(90deg, var(--miku-teal), var(--miku-deep));
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.3);
}

.view-mode-group {
    display: flex;
    align-items: center;
    background: rgba(235, 248, 246, 0.9);
    padding: 3px;
    border-radius: 14px;
    border: none;
}

.mode-btn {
    border: none;
    background: transparent;
    font-size: 12px;
    font-weight: 700;
    color: #557873;
    padding: 5px 12px;
    border-radius: 11px;
    cursor: pointer;
    transition: all 0.25s ease;
}

.mode-btn.active {
    background: #ffffff;
    color: var(--miku-deep);
    box-shadow: 0 2px 8px rgba(57, 197, 187, 0.25);
}

/* ==================== 双栏主体排版 ==================== */
.archives-main-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 28px;
    align-items: start;
}

/* ==================== 卡片基座 ==================== */
/* 列表卡片：去掉 backdrop-filter；开 content-visibility 让离屏卡跳过渲染 */
.glass-miku-card {
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.92);
    content-visibility: auto;
    contain-intrinsic-size: auto 200px;
    border: none;
    box-shadow: 0 10px 30px rgba(57, 197, 187, 0.1);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.archives-list {
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.year-group {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

/* ==================== 炫酷月份 Header（带 4K 壁纸） ==================== */
.year-header {
    position: relative;
    overflow: hidden;
    padding: 16px 24px;
}

.year-bg-wrap {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.year-bg-ambient {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 22%;
    opacity: 0.14;
    filter: blur(10px) saturate(1.16) brightness(1.05);
    transform: scale(1.05);
    transition: opacity 0.4s ease, filter 0.4s ease;
}

.year-bg-img {
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 100%;
    object-fit: cover;
    object-position: center 20%;
    opacity: 0.18;
    filter: saturate(1.05) blur(1.5px);
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.78) 28%, #000000 58%);
    mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.78) 28%, #000000 58%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease;
}

.year-bg-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(125deg, rgba(255, 255, 255, 0.68) 0%, rgba(232, 252, 249, 0.48) 54%, rgba(255, 236, 245, 0.28) 100%);
    opacity: 0.92;
    transition: opacity 0.35s ease;
}

.year-header:hover .year-bg-ambient {
    opacity: 0.48;
    filter: blur(7px) saturate(1.36) brightness(1.03);
}

.year-header:hover .year-bg-img {
    transform: scale(1.06) rotate(0.8deg);
    opacity: 0.92;
    filter: saturate(1.28) contrast(1.05) blur(0px);
}

.year-header:hover .year-bg-mask {
    opacity: 0.54;
}

.year-header-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 14px;
}

.year-icon {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    flex-shrink: 0;
    background: #E3F7F4;
    color: var(--miku-deep);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.25);
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.year-header:hover .year-icon {
    transform: rotate(-10deg) scale(1.08);
}

.icon-vinyl {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1.5px dashed rgba(57, 197, 187, 0.5);
    animation: vinylSpin 10s linear infinite;
    pointer-events: none;
}

@keyframes vinylSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.year-title {
    font-size: 20px;
    font-weight: 900;
    color: #0E2926;
    text-shadow: 0 1px 4px rgba(255, 255, 255, 0.95);
    margin: 0;
}

.year-code {
    font-family: 'Audiowide', sans-serif;
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.6px;
    color: #ffffff;
    background: linear-gradient(90deg, #FF7E9D, #ff5c81);
    padding: 3px 8px;
    border-radius: 5px;
    box-shadow: 0 2px 8px rgba(255, 126, 157, 0.4);
    flex-shrink: 0;
}

.year-eq {
    display: flex;
    align-items: flex-end;
    gap: var(--eq-gap);
    height: 18px;
    opacity: 0.75;
    transition: opacity 0.3s ease;
}

.year-eq i {
    width: var(--eq-bar-w);
    border-radius: 2px;
    background: linear-gradient(180deg, var(--miku-teal) 0%, #FF7E9D 100%);
    animation: yearEqPulse 1.3s ease-in-out infinite alternate;
}

@keyframes yearEqPulse {
    from { height: 20%; opacity: 0.5; }
    to { height: 100%; opacity: 1; }
}

.year-header:hover .year-eq {
    opacity: 1;
}

.year-count-chip {
    font-family: 'Audiowide', sans-serif;
    font-size: 12px;
    font-weight: 800;
    color: #ffffff;
    background: linear-gradient(90deg, var(--miku-teal), var(--miku-deep));
    padding: 4px 14px;
    border-radius: 14px;
    margin-left: auto;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.35);
    flex-shrink: 0;
}

.year-no {
    font-family: 'Audiowide', sans-serif;
    font-size: 26px;
    line-height: 1;
    color: var(--miku-teal);
    opacity: 0.35;
    text-shadow: 0 0 10px rgba(57, 197, 187, 0.3);
    pointer-events: none;
    flex-shrink: 0;
}

/* ==================== 声波时间轴列表 ==================== */
.article-timeline-list {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-left: 8px;
}

.article-timeline-list::before {
    content: '';
    position: absolute;
    left: 27px;
    top: 12px;
    bottom: 12px;
    width: 2.5px;
    border-radius: 3px;
    background: linear-gradient(180deg,
            rgba(57, 197, 187, 0.1) 0%,
            rgba(57, 197, 187, 0.7) 20%,
            rgba(255, 126, 157, 0.6) 80%,
            rgba(255, 126, 157, 0.1) 100%);
    pointer-events: none;
}

.archive-item {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    cursor: pointer;
    animation: itemRiseIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.archive-bg-wrap {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
}

.archive-bg-ambient {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 22%;
    opacity: 0.14;
    filter: blur(10px) saturate(1.16) brightness(1.06);
    transform: scale(1.04);
    transition: opacity 0.35s ease, filter 0.35s ease;
}

.archive-bg-img {
    position: absolute;
    top: 0;
    right: 0;
    width: 260px;
    height: 100%;
    object-fit: cover;
    object-position: center 18%;
    opacity: 0.16;
    filter: saturate(1.04) blur(1.5px);
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.78) 28%, #000000 58%);
    mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.78) 28%, #000000 58%);
    transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, filter 0.35s ease;
}

.archive-scrim-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(125deg,
            rgba(255, 255, 255, 0.72) 0%,
            rgba(235, 252, 249, 0.56) 52%,
            rgba(255, 238, 246, 0.32) 100%);
    opacity: 0.94;
    transition: opacity 0.35s ease;
}

.archive-holo-sweep {
    position: absolute;
    inset: 0;
    background: linear-gradient(112deg,
            transparent 28%,
            rgba(255, 255, 255, 0.46) 46%,
            rgba(57, 197, 187, 0.26) 52%,
            rgba(255, 126, 157, 0.22) 58%,
            transparent 72%);
    transform: translateX(-130%);
    transition: transform 0.72s cubic-bezier(0.22, 1, 0.36, 1);
}

.archive-item:hover .archive-bg-ambient {
    opacity: 0.44;
    filter: blur(7px) saturate(1.36) brightness(1.03);
}

.archive-item:hover .archive-bg-img {
    opacity: 0.90;
    filter: saturate(1.28) contrast(1.06) blur(0px);
    transform: scale(1.05);
}

.archive-item:hover .archive-scrim-mask {
    opacity: 0.52;
}

.archive-item:hover .archive-holo-sweep {
    transform: translateX(130%);
}

@keyframes itemRiseIn {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
}

.archive-item:hover {
    transform: translateX(8px);
    border-color: rgba(57, 197, 187, 0.6);
    box-shadow: 0 12px 32px rgba(57, 197, 187, 0.22), 0 0 18px rgba(57, 197, 187, 0.15);
}

.item-dot-glow {
    position: relative;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--miku-teal);
    box-shadow: 0 0 12px var(--miku-teal);
    transition: background 0.25s ease, box-shadow 0.25s ease;
    z-index: 2;
}

.item-dot-glow::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1.5px solid rgba(57, 197, 187, 0.7);
    animation: dotHalo 2.2s ease-out infinite;
}

@keyframes dotHalo {
    0% { transform: scale(0.6); opacity: 0.9; }
    100% { transform: scale(1.8); opacity: 0; }
}

.archive-item:hover .item-dot-glow {
    background: #FF7E9D;
    box-shadow: 0 0 14px #FF7E9D;
}

.item-cover-thumb {
    position: relative;
    width: 56px;
    height: 38px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    border: none;
    z-index: 2;
}

.thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.archive-item:hover .thumb-img {
    transform: scale(1.1);
}

.thumb-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.archive-item:hover .thumb-overlay {
    opacity: 1;
}

.thumb-spin-vinyl {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px dashed #ffffff;
    animation: vinylSpin 3s linear infinite;
}

.item-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 2;
}

.item-meta-top {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11.5px;
}

.item-date {
    font-family: 'Audiowide', monospace;
    font-weight: 800;
    color: #00687d;
    text-shadow: 0 1px 3px rgba(255, 255, 255, 0.95);
}

.item-cat-badge {
    font-weight: 700;
    color: var(--miku-deep);
    background: rgba(57, 197, 187, 0.16);
    padding: 1px 7px;
    border-radius: 6px;
}

.item-views {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: #6a8c87;
    font-weight: 600;
}

.item-title {
    font-size: 15.5px;
    font-weight: 900;
    color: #0E2926;
    text-shadow: 0 1px 3px rgba(255, 255, 255, 0.95);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.hover-underline-miku:hover {
    color: var(--miku-deep);
}

.item-arrow {
    font-weight: 900;
    font-size: 16px;
    color: var(--miku-teal);
    flex-shrink: 0;
    z-index: 2;
    transition: transform 0.2s ease, color 0.2s ease;
}

.archive-item:hover .item-arrow {
    transform: translateX(6px);
    color: #FF7E9D;
}

/* ==================== 动漫卡片网格模式 ==================== */
.archives-grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
}

.grid-card {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    animation: itemRiseIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.grid-card:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: rgba(57, 197, 187, 0.6);
    box-shadow: 0 14px 36px rgba(57, 197, 187, 0.25);
}

.grid-card-banner {
    position: relative;
    height: 140px;
    overflow: hidden;
}

.banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
}

.grid-card:hover .banner-img {
    transform: scale(1.08);
}

.banner-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(14, 41, 38, 0.6) 100%);
}

.grid-cat-tag {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 11px;
    font-weight: 800;
    color: #ffffff;
    background: linear-gradient(90deg, var(--miku-teal), var(--miku-deep));
    padding: 3px 10px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.grid-card-content {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}

.grid-date-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11.5px;
    color: #7A9E99;
}

.grid-date {
    font-family: 'Audiowide', monospace;
    font-weight: 700;
    color: var(--miku-teal);
}

.grid-card-title {
    font-size: 15px;
    font-weight: 900;
    color: #0E2926;
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.grid-card-footer {
    margin-top: auto;
    padding-top: 8px;
    display: flex;
    justify-content: flex-end;
}

.read-link {
    font-size: 12px;
    font-weight: 800;
    color: var(--miku-teal);
    transition: color 0.2s ease;
}

.grid-card:hover .read-link {
    color: #FF7E9D;
}

/* ==================== Q 版初音陪伴挂件 ==================== */
.miku-side-companion {
    position: sticky;
    top: calc(var(--navbar-clearance) + 10px);
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.companion-card {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.95) 0%, rgba(227, 247, 244, 0.9) 100%);
}

.companion-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 10px;
}

.cyber-chip {
    font-family: 'Audiowide', sans-serif;
    font-size: 10px;
    font-weight: 800;
    color: var(--miku-deep);
    background: rgba(57, 197, 187, 0.18);
    padding: 3px 8px;
    border-radius: 6px;
    border: none;
}

.note-bounce {
    font-size: 16px;
    color: #FF7E9D;
    animation: noteBounce 1.8s ease-in-out infinite alternate;
}

@keyframes noteBounce {
    from { transform: translateY(0) rotate(-6deg); }
    to { transform: translateY(-6deg) rotate(8deg); }
}

.chibi-avatar-wrap {
    position: relative;
    width: 140px;
    height: 150px;
    margin: 4px 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.chibi-miku-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: none;
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.companion-bubble {
    position: relative;
    background: #ffffff;
    border: none;
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 14px;
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.12);
    width: 100%;
}

.bubble-text {
    font-size: 12px;
    color: #0E2926;
    font-weight: 800;
    line-height: 1.5;
    margin: 0;
}

.companion-actions {
    display: flex;
    gap: 8px;
    width: 100%;
    margin-bottom: 12px;
}

.action-mini-btn {
    flex: 1;
    border: none;
    background: #ffffff;
    color: #14322F;
    font-size: 11px;
    font-weight: 800;
    padding: 6px 4px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-mini-btn:hover {
    background: #E3F7F4;
    border-color: var(--miku-teal);
    color: var(--miku-deep);
    transform: translateY(-2px);
}

.companion-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-top: 10px;
    border-top: 1px dashed rgba(57, 197, 187, 0.25);
}

.stats-mini {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.mini-label {
    font-family: 'Audiowide', sans-serif;
    font-size: 8.5px;
    color: #7A9E99;
}

.mini-val {
    font-family: 'Audiowide', sans-serif;
    font-size: 11px;
    font-weight: 800;
    color: var(--miku-deep);
}

.music-wave-bar {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 14px;
}

.music-wave-bar i {
    width: 3px;
    border-radius: 2px;
    background: var(--miku-teal);
    animation: waveBar 1.2s ease-in-out infinite alternate;
}

.music-wave-bar i:nth-child(1) { height: 40%; animation-delay: 0.1s; }
.music-wave-bar i:nth-child(2) { height: 80%; animation-delay: 0.3s; }
.music-wave-bar i:nth-child(3) { height: 50%; animation-delay: 0.2s; }
.music-wave-bar i:nth-child(4) { height: 100%; animation-delay: 0.4s; }

@keyframes waveBar {
    from { opacity: 0.4; transform: scaleY(0.5); }
    to { opacity: 1; transform: scaleY(1); }
}

/* ==================== Miku 二次元 Cyber 日历模块 ==================== */
.miku-calendar-card {
    padding: 16px;
    background: linear-gradient(165deg, rgba(255, 255, 255, 0.94) 0%, rgba(227, 247, 244, 0.88) 100%);
    border: none;
}

.calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px dashed rgba(57, 197, 187, 0.25);
}

.cal-title-box {
    display: flex;
    align-items: center;
    gap: 8px;
}

.cal-hud-badge {
    font-family: 'Audiowide', sans-serif;
    font-size: 9px;
    font-weight: 800;
    color: #ffffff;
    background: linear-gradient(90deg, #FF7E9D, #ff5c81);
    padding: 2px 6px;
    border-radius: 4px;
}

.cal-month-text {
    font-family: 'Audiowide', sans-serif;
    font-size: 13px;
    font-weight: 800;
    color: #0E2926;
}

.cal-nav-btns {
    display: flex;
    gap: 4px;
}

.cal-nav-btn {
    border: none;
    background: #ffffff;
    color: var(--miku-deep);
    font-size: 14px;
    font-weight: 800;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cal-nav-btn:hover {
    background: var(--miku-teal);
    color: #ffffff;
    border-color: transparent;
}

.calendar-week-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    margin-bottom: 8px;
}

.week-cell {
    font-size: 11px;
    font-weight: 800;
    color: #00687d;
}

.calendar-days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    text-align: center;
}

.day-cell {
    position: relative;
    height: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 700;
    color: #0E2926;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid transparent;
    transition: all 0.2s ease;
    user-select: none;
}

.day-cell.other-month {
    opacity: 0.3;
}

.day-cell.is-today {
    background: linear-gradient(135deg, var(--miku-teal) 0%, var(--miku-deep) 100%);
    color: #ffffff;
    font-weight: 900;
    box-shadow: 0 3px 10px rgba(57, 197, 187, 0.4);
}

.day-cell.has-article {
    border-color: rgba(255, 126, 157, 0.5);
    background: rgba(255, 240, 245, 0.9);
    cursor: pointer;
}

.day-cell.has-article:hover {
    transform: scale(1.12);
    border-color: #FF7E9D;
    box-shadow: 0 4px 12px rgba(255, 126, 157, 0.35);
    z-index: 2;
}

.day-note-dot {
    position: absolute;
    bottom: 1px;
    font-size: 9px;
    color: #FF7E9D;
    line-height: 1;
}

.calendar-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed rgba(57, 197, 187, 0.2);
    font-size: 10.5px;
    color: #7A9E99;
}

.cal-legend {
    display: flex;
    align-items: center;
    gap: 4px;
}

.legend-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #FF7E9D;
    display: inline-block;
}

.cal-tag {
    font-family: 'Audiowide', sans-serif;
    font-size: 8.5px;
}

/* ==================== 骨架屏 ==================== */
.skeleton-timeline {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.skeleton-group {
    padding: 16px 20px;
    pointer-events: none;
}

.skeleton-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
}

.skeleton-circle-sm,
.skeleton-line,
.skeleton-chip {
    border-radius: 8px;
    background: linear-gradient(90deg,
            rgba(57, 197, 187, 0.10) 25%,
            rgba(57, 197, 187, 0.24) 37%,
            rgba(57, 197, 187, 0.10) 63%);
    background-size: 400% 100%;
    animation: shimmerSweep 1.4s ease infinite;
}

.skeleton-circle-sm {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    flex-shrink: 0;
}

.skeleton-line {
    height: 14px;
}

.skeleton-line.short {
    width: 46%;
}

.skeleton-chip {
    width: 56px;
    height: 20px;
    border-radius: 12px;
    margin-left: auto;
}

@keyframes shimmerSweep {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
}

/* ==================== 空状态 ==================== */
.empty-state-box {
    padding: 60px 20px;
    text-align: center;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.empty-text {
    font-size: 15px;
    color: #4B6B66;
    font-weight: 700;
}

.empty-note {
    display: block;
    margin-top: 10px;
    font-size: 14px;
    letter-spacing: 4px;
    color: var(--miku-teal);
    opacity: 0.6;
}

/* ==================== 响应式 ==================== */
@media (max-width: 860px) {
    .archives-main-layout {
        grid-template-columns: 1fr;
    }

    .miku-side-companion {
        display: none;
    }
}

@media (max-width: 640px) {
    .archive-toolbar {
        flex-direction: column;
        align-items: flex-start;
    }

    .year-header-content {
        flex-wrap: wrap;
        gap: 8px;
    }

    .year-title {
        font-size: 17px;
    }

    .year-eq,
    .year-code {
        display: none;
    }

    .archive-item {
        padding: 13px 16px;
        gap: 11px;
    }

    .item-cover-thumb {
        width: 44px;
        height: 32px;
    }

    .item-body {
        gap: 2px;
    }

    .item-title {
        white-space: normal;
        line-height: 1.45;
    }

    .article-timeline-list::before {
        left: 21px;
    }
}
</style>
