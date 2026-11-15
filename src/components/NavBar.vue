<template>
    <header class="navbar-wrapper" :class="{ scrolled: isScrolled, 'is-hidden': navHidden }">
        <div class="navbar-container">

            <!-- 左侧品牌区 (Logo on the left) -->
            <div class="nav-left" @click="goHome">
                <div class="brand-logo-mark">
                    <span class="logo-note">♪</span>
                </div>
                <div class="brand-text-group">
                    <span class="brand-name">初音小站</span>
                </div>
            </div>

            <!-- 中间导航区 -->
            <nav class="nav-center">
                <div class="nav-tab-track">
                    <router-link to="/" class="nav-tab-item" :class="{ active: isNavActive('/', route.path) }" @mouseenter="prefetchRoute('/')">
                        <span class="nav-tab-label">首页</span>
                    </router-link>

                    <router-link to="/articles" class="nav-tab-item" :class="{ active: isNavActive('/articles', route.path) }" @mouseenter="prefetchRoute('/articles')">
                        <span class="nav-tab-label">文章</span>
                    </router-link>

                    <!-- 发现下拉菜单：active 必须挂在内层 .nav-tab-item 上，否则 .nav-tab-item.active 永远命不中 -->
                    <el-dropdown trigger="hover" class="nav-tab-dropdown">
                        <span class="nav-tab-item dropdown-trigger" :class="{ active: isNavActive('discover', route.path) }" @mouseenter="prefetchRoute('/categories'); prefetchRoute('/tags'); prefetchRoute('/archives')">
                            <span class="nav-tab-label">发现</span>
                            <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu class="anime-dropdown-menu">
                                <el-dropdown-item @click="goToPage('/categories')">
                                    <el-icon><Grid /></el-icon>
                                    <span>分类</span>
                                </el-dropdown-item>
                                <el-dropdown-item @click="goToPage('/tags')">
                                    <el-icon><PriceTag /></el-icon>
                                    <span>标签</span>
                                </el-dropdown-item>
                                <el-dropdown-item @click="goToPage('/archives')">
                                    <el-icon><Clock /></el-icon>
                                    <span>归档</span>
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>

                    <router-link to="/messages" class="nav-tab-item" :class="{ active: isNavActive('/messages', route.path) }" @mouseenter="prefetchRoute('/messages')">
                        <span class="nav-tab-label">留言墙</span>
                    </router-link>

                    <router-link to="/snapshots" class="nav-tab-item" :class="{ active: isNavActive('/snapshots', route.path) }" @mouseenter="prefetchRoute('/snapshots')">
                        <span class="nav-tab-label">随拍</span>
                    </router-link>

                    <router-link to="/about" class="nav-tab-item" :class="{ active: isNavActive('/about', route.path) }" @mouseenter="prefetchRoute('/about')">
                        <span class="nav-tab-label">关于</span>
                    </router-link>
                </div>
            </nav>

            <!-- 右侧功能区 (搜索、发文、用户信息) -->
            <div class="nav-right">
                <div class="search-miku-wrapper" :class="{ 'is-focused': isSearchFocused }">
                    <div class="search-capsule">
                        <!-- 跳动的迷你声波 -->
                        <div class="miku-mini-eq" aria-hidden="true">
                            <span class="eq-dot dot-1"></span>
                            <span class="eq-dot dot-2"></span>
                            <span class="eq-dot dot-3"></span>
                        </div>

                        <input
                            v-model="searchKeyword"
                            type="text"
                            placeholder="搜索文章或标签..."
                            class="search-input-field"
                            @focus="isSearchFocused = true"
                            @blur="handleSearchBlur"
                            @keyup.enter="handleSearch"
                        />

                        <button class="search-btn tactile-btn shine-effect" @click="handleSearch">
                            <el-icon class="btn-search-icon"><Search /></el-icon>
                            <span class="btn-text">检索</span>
                        </button>
                    </div>

                    <!-- 初音热搜与快捷推荐浮层 -->
                    <transition name="dropdownPop">
                        <div class="search-miku-popover glass-miku-card" v-if="isSearchFocused && !searchKeyword">
                            <!-- 初音二次元壁纸背景层 (悬浮变清晰) -->
                            <div class="popover-miku-bg-wrap" aria-hidden="true">
                                <img src="/images/miku/miku_wp_7.jpg" alt="Miku Search Popover" class="popover-miku-bg-img" loading="lazy" decoding="async" />
                                <div class="popover-scrim-mask"></div>
                            </div>

                            <div class="popover-head">
                                <span class="popover-title">🎵 热门搜索</span>
                            </div>

                            <div class="hot-search-chips">
                                <span
                                    v-for="tag in hotSearchTags"
                                    :key="tag"
                                    class="hot-chip"
                                    @mousedown.prevent="quickSearch(tag)"
                                >
                                    {{ tag }}
                                </span>
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- 初音 AI 专属页面按钮 -->
                <button
                    class="nav-btn btn-ai tactile-btn"
                    :class="{ active: route.path === '/ai' }"
                    @mouseenter="prefetchRoute('/ai')"
                    @click="goToPage('/ai')"
                >
                    <el-icon><Cpu /></el-icon>
                    <span>初音 AI</span>
                </button>

                <!-- 写文章主操作 (按设计规范始终展示) -->
                <button
                    class="nav-btn btn-publish tactile-btn"
                    @mouseenter="prefetchRoute('/publish')"
                    @click="handlePublish"
                >
                    <el-icon><EditPen /></el-icon>
                    <span>写文章</span>
                </button>

                <template v-if="!userStore.isLoggedIn">
                    <button class="nav-btn btn-login tactile-btn" @click="router.push('/login')">
                        登录
                    </button>
                    <button class="nav-btn btn-register tactile-btn" @click="router.push('/register')">
                        注册
                    </button>
                </template>

                <template v-else>
                    <el-dropdown trigger="click" @command="handleCommand">
                        <div class="user-avatar-btn tactile-btn" title="个人中心">
                            <div class="user-avatar-ring">
                                <el-avatar :size="32" :src="userStore.userInfo?.avatar_url" :alt="userStore.userInfo?.nickname || '用户头像'" class="user-avatar">
                                    {{ userStore.userInfo?.nickname?.charAt(0) || '初' }}
                                </el-avatar>
                                <span class="user-online-led"></span>
                            </div>
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu class="anime-dropdown-menu">
                                <div class="dropdown-user-header">
                                    <div class="user-header-avatar">
                                        <el-avatar :size="36" :src="userStore.userInfo?.avatar_url">
                                            {{ userStore.userInfo?.nickname?.charAt(0) || '初' }}
                                        </el-avatar>
                                    </div>
                                    <div class="user-header-info">
                                        <span class="user-header-name">{{ userStore.userInfo?.nickname || '初音小帅' }}</span>
                                    </div>
                                </div>
                                <el-dropdown-item command="profile">
                                    <el-icon><User /></el-icon>个人主页
                                </el-dropdown-item>
                                <el-dropdown-item command="publish">
                                    <el-icon><EditPen /></el-icon>写新文章
                                </el-dropdown-item>
                                <el-dropdown-item command="logout" divided>
                                    <el-icon><SwitchButton /></el-icon>退出登录
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </template>

                <!-- 移动端灵动岛右侧菜单按钮 (Right Side Menu Button) -->
                <div class="hamburger-btn tactile-btn" :class="{ 'is-open': menuOpen }" @click="menuOpen = !menuOpen" title="菜单">
                    <el-icon :size="18">
                        <Close v-if="menuOpen" />
                        <MenuIcon v-else />
                    </el-icon>
                </div>
            </div>

        </div>
    </header>

    <!-- 初音未来主题 · 移动端赛博晶透抽屉 (MIKU TEAL CYBER DRAWER) -->
    <teleport to="body">
        <transition name="slide-drawer">
            <div class="mobile-drawer-overlay" v-if="menuOpen" @click.self="menuOpen = false">
                <div class="mobile-drawer-panel glass-miku-panel">
                    <!-- 背景原画与氛围气泡 -->
                    <div class="drawer-miku-bg" aria-hidden="true">
                        <img src="/images/miku/miku_wp_5.jpg" alt="Miku Drawer Bg" class="drawer-bg-img" loading="lazy" decoding="async" />
                        <div class="drawer-bg-mask"></div>
                    </div>

                    <!-- 顶部品牌区 -->
                    <div class="drawer-header">
                        <div class="drawer-brand" @click="goHome">
                            <div class="drawer-logo-mark">
                                <span class="logo-note">♪</span>
                            </div>
                            <div class="drawer-brand-text">
                                <div class="brand-top-row">
                                    <span class="drawer-brand-name">初音小站</span>
                                    <span class="miku-tag-chip"><img src="/images/miku/miku_chibi_main.png" alt="Q版初音" class="chibi-chip-img" /></span>
                                </div>
                            </div>
                        </div>
                        <button class="drawer-close-btn tactile-btn" @click="menuOpen = false" aria-label="关闭菜单">✕</button>
                    </div>

                    <!-- 初音 AI 入口 -->
                    <div class="drawer-ai-hud tactile-btn" @click="goToPage('/ai')">
                        <div class="hud-left">
                            <div class="hud-icon-wrap">
                                <el-icon :size="15"><Cpu /></el-icon>
                            </div>
                            <div class="hud-text-box">
                                <span class="hud-title">初音 AI 助手</span>
                            </div>
                        </div>
                        <div class="hud-eq-bars" aria-hidden="true">
                            <span v-for="i in 5" :key="i" class="hud-eq-bar" :style="{ animationDuration: (0.4 + i * 0.12) + 's' }"></span>
                        </div>
                    </div>

                    <!-- 导航链接列表 -->
                    <div class="drawer-nav-list">
                        <div
                            v-for="item in mobileMenus"
                            :key="item.path"
                            class="drawer-nav-item tactile-btn"
                            :class="{ active: isNavActive(item.path, route.path) }"
                            @click="goToPage(item.path)"
                        >
                            <span class="nav-symbol">{{ item.symbol }}</span>
                            <span class="drawer-item-label">{{ item.label }}</span>
                            <span v-if="isNavActive(item.path, route.path)" class="drawer-active-dot">当前</span>
                            <span v-else class="drawer-arrow-right">›</span>
                        </div>
                    </div>

                    <!-- 底部用户与操作栏 -->
                    <div class="drawer-footer" v-if="!userStore.isLoggedIn">
                        <button class="drawer-action-btn login tactile-btn" @click="goToPage('/login')">
                            <span>登录</span>
                        </button>
                        <button class="drawer-action-btn register tactile-btn" @click="goToPage('/register')">
                            <span>注册</span>
                        </button>
                    </div>

                    <div class="drawer-footer" v-else>
                        <div class="drawer-user-card tactile-btn" @click="goToPage('/profile')">
                            <div class="user-avatar-ring">
                                <el-avatar :size="36" :src="userStore.userInfo?.avatar_url" class="drawer-avatar">
                                    {{ userStore.userInfo?.nickname?.charAt(0) || '拾' }}
                                </el-avatar>
                                <span class="user-online-led"></span>
                            </div>
                            <div class="drawer-user-text">
                                <span class="drawer-user-name">{{ userStore.userInfo?.nickname || '学者' }}</span>
                                <span class="drawer-user-sub">前往个人主页 →</span>
                            </div>
                        </div>
                        <div class="drawer-btn-group">
                            <button class="drawer-action-btn publish tactile-btn" @click="goToPage('/publish')">
                                <el-icon><EditPen /></el-icon>
                                <span>写文章</span>
                            </button>
                            <button class="drawer-action-btn logout tactile-btn" @click="handleLogout">
                                <span>退出</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { prefetchRoute } from '../router';
import { useUserStore } from '../stores/user';
import { isNavActive } from '../utils/navActive';
import { useNavScroll } from '../composables/useNavScroll';
import { useNavSearch } from '../composables/useNavSearch';
import {
    Menu as MenuIcon, Close, Grid, PriceTag, Clock, Search,
    User, EditPen, SwitchButton, ArrowDown, Cpu
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 滚动形态 / 搜索
const { isScrolled, navHidden } = useNavScroll(route);
const {
    searchKeyword, isSearchFocused, hotSearchTags,
    handleSearch, quickSearch, handleSearchBlur,
} = useNavSearch(router);

const menuOpen = ref(false);

const mobileMenus = [
    { path: '/', label: '首页', symbol: '♫' },
    { path: '/articles', label: '文章', symbol: '♪' },
    { path: '/categories', label: '分类', symbol: '✦' },
    { path: '/tags', label: '标签', symbol: '🏷️' },
    { path: '/archives', label: '归档', symbol: '📜' },
    { path: '/messages', label: '留言墙', symbol: '💬' },
    { path: '/snapshots', label: '随拍', symbol: '📷' },
    { path: '/about', label: '关于', symbol: '🌸' }
];

const goHome = () => { menuOpen.value = false; router.push('/'); };
const goToPage = (path) => { menuOpen.value = false; router.push(path); };

const handleCommand = (command) => {
    if (command === 'profile') router.push('/profile');
    else if (command === 'publish') router.push('/publish');
    else if (command === 'logout') {
        userStore.logout();
        ElMessage.success('已安全登出');
        router.push('/');
    }
};

const handleLogout = () => {
    menuOpen.value = false;
    userStore.logout();
    ElMessage.success('已安全登出');
    router.push('/');
};

const handlePublish = () => {
    if (!userStore.isLoggedIn) {
        ElMessage.info('请先登录后再进行发文创作');
        router.push('/login');
    } else {
        router.push('/publish');
    }
};

// 路由变化：关抽屉；离开搜索页清空关键词（滚动形态由 useNavScroll 自行重算）
watch(() => route.fullPath, () => {
    menuOpen.value = false;
    if (!route.path.startsWith('/search')) searchKeyword.value = '';
});

// 视口拉宽回桌面后抽屉同步收起
const handleResize = () => {
    if (window.innerWidth > 768) menuOpen.value = false;
};
onMounted(() => window.addEventListener('resize', handleResize));
onUnmounted(() => window.removeEventListener('resize', handleResize));
</script>
<style scoped>
/* ================= 动态灵动岛 ↔ 宽版吸顶 导航栏 ================= */
.navbar-wrapper {
    position: fixed;
    top: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    width: min(1220px, 92vw);
    height: 64px;
    /* 性能：去掉 backdrop-filter（fixed 导航栏在整页滚动时逐帧重模糊背后内容 = 全局卡顿源）
       提高背景不透明度保持可读性，视觉仍是半透明胶囊 */
    background: rgba(18, 42, 40, 0.74);
    border: none;
    border-radius: 40px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18);
    transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.navbar-container {
    max-width: 1280px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    gap: 16px;
    transition: padding 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ================= 页面滑动后：自动变为常规宽版吸顶导航栏 ================= */
.navbar-wrapper.scrolled {
    top: 0;
    width: 100%;
    height: 76px;
    border-radius: 0px;
    background: rgba(227, 247, 244, 0.90);
    border: none;
    box-shadow: 0 8px 28px rgba(8, 90, 87, 0.09);
}

.navbar-wrapper.scrolled .navbar-container {
    padding: 0 28px;
}

/* ================= 首页：顶部整体上移隐藏 =================
   仅首页生效。初始/回顶时整体移出视口；下滑越过阈值后移除该类，
   胶囊由顶部滑入复位。transform 用组合写法保留 translateX(-50%) 的居中。 */
.navbar-wrapper.is-hidden {
    /* -100% 自身高度 + 顶部 18px 偏移 + 12px 余量 → 完全移出视口，无投影残留 */
    transform: translate(-50%, calc(-100% - 30px));
    opacity: 0;
    pointer-events: none;
}

/* ================= 汉堡按钮 ================= */
.hamburger-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: var(--radius-pill);
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: #FFFFFF;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.45s ease;
}

.navbar-wrapper.scrolled .hamburger-btn {
    background: rgba(57, 197, 187, 0.14);
    color: #12A79C;
}

/* ================= 品牌标志 ================= */
.nav-left {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    flex-shrink: 0;
    user-select: none;
}

.brand-logo-mark {
    width: 38px;
    height: 38px;
    border-radius: var(--radius-sm);
    background: #FFFFFF;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.45s ease;
}

.logo-note {
    font-size: 20px;
    font-weight: 900;
    color: #12A79C;
}

.brand-text-group {
    display: flex;
    flex-direction: column;
}

.brand-name {
    font-size: 17.5px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: 0.5px;
    line-height: 1.2;
    transition: color 0.45s ease;
}

.navbar-wrapper.scrolled .brand-name {
    color: #14322F;
}

.brand-sub {
    font-size: 8.5px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 1.5px;
    transition: color 0.45s ease;
}

.navbar-wrapper.scrolled .brand-sub {
    color: #5C837F;
}

/* ================= 中间导航 ================= */
.nav-center {
    flex: 1;
    display: flex;
    justify-content: center;
    min-width: 0;
}

/* 性能/无边化：移除 nav-tab-track / search-capsule / popover 边框，改用纯净悬浮投影 */
.nav-tab-track {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 4px 6px;
    background: rgba(255, 255, 255, 0.16);
    border: none;
    border-radius: var(--radius-pill);
    transition: all 0.45s ease;
}

.navbar-wrapper.scrolled .nav-tab-track {
    background: rgba(57, 197, 187, 0.10);
}

.nav-tab-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 15px;
    border-radius: var(--radius-pill);
    font-size: 13.5px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.92);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
    cursor: pointer;
}

.navbar-wrapper.scrolled .nav-tab-item {
    color: #285450;
}

.nav-tab-item:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.25);
}

.navbar-wrapper.scrolled .nav-tab-item:hover {
    color: #39C5BB;
    background: rgba(255, 255, 255, 0.7);
}

.nav-tab-item.active {
    color: #FFFFFF;
    background: #39C5BB;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.35);
    font-weight: 700;
}

.dropdown-trigger {
    border: none;
    background: transparent;
}

.dropdown-arrow {
    font-size: 10px;
    margin-left: 2px;
    transition: transform 0.2s ease;
}

.nav-tab-dropdown:hover .dropdown-arrow {
    transform: rotate(180deg);
}

/* ================= 右侧操作区 ================= */
.nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}

/* ================= 初音未来赛博音节全息搜索框 ================= */
.search-miku-wrapper {
    position: relative;
}

.search-capsule {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(18, 42, 40, 0.42);
    border: none;
    border-radius: var(--radius-pill);
    padding: 3px 6px 3px 10px;
    width: 230px;
    box-shadow: 0 4px 16px rgba(57, 197, 187, 0.14);
    transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.navbar-wrapper.scrolled .search-capsule {
    background: rgba(255, 255, 255, 0.92);
    width: 230px;
    box-shadow: 0 4px 18px rgba(8, 90, 87, 0.08);
}

.search-miku-wrapper.is-focused .search-capsule,
.search-capsule:focus-within {
    width: 270px !important;
    background: #FFFFFF !important;
    box-shadow: 0 0 26px rgba(57, 197, 187, 0.38), 0 6px 20px rgba(18, 167, 156, 0.22) !important;
}

.miku-search-badge {
    font-family: monospace;
    font-size: 10px;
    font-weight: 900;
    color: #FFFFFF;
    background: linear-gradient(135deg, #0B7A73, #08635D);
    padding: 2px 7px;
    border-radius: 9999px;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(11, 122, 115, 0.3);
}

.miku-mini-eq {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
    flex-shrink: 0;
}

.eq-dot {
    width: 2.5px;
    height: 100%;
    background: #39C5BB;
    border-radius: 2px;
    animation: miniEqPulse 1s ease-in-out infinite alternate;
}

.dot-1 { animation-delay: 0s; }
.dot-2 { animation-delay: 0.3s; background: #12A79C; }
.dot-3 { animation-delay: 0.6s; }

@keyframes miniEqPulse {
    0% { height: 30%; opacity: 0.4; }
    100% { height: 100%; opacity: 1; }
}

.search-input-field {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: 12.5px;
    font-weight: 600;
    color: #FFFFFF;
    transition: color 0.45s ease;
}

.navbar-wrapper.scrolled .search-input-field {
    color: #14322F;
}

.search-capsule:focus-within .search-input-field {
    color: #0F3B37 !important;
}

.search-input-field::placeholder {
    color: rgba(255, 255, 255, 0.75);
}

.navbar-wrapper.scrolled .search-input-field::placeholder {
    color: #357268;
}

.search-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: linear-gradient(135deg, #0B7A73 0%, #08635D 100%);
    color: #FFFFFF;
    border-radius: var(--radius-pill);
    padding: 5px 12px;
    font-size: 11.5px;
    font-weight: 800;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.25s ease;
    box-shadow: 0 2px 8px rgba(57, 197, 187, 0.3);
}

.search-btn:hover {
    background: linear-gradient(135deg, #39C5BB, #12A79C);
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.45);
    transform: translateY(-1px);
}

.btn-search-icon {
    font-size: 12px;
}

/* 热搜与快捷推荐浮层 */
.search-miku-popover {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    width: 290px;
    padding: 16px;
    border-radius: 20px;
    z-index: 1000;
    overflow: hidden;
    isolation: isolate;
    border: none;
    box-shadow: 0 16px 40px rgba(8, 90, 87, 0.22);
}

.popover-miku-bg-wrap {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
}

.popover-miku-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.16;
    filter: blur(2.5px);
    transition: transform 0.4s ease, opacity 0.4s ease, filter 0.4s ease;
}

.popover-scrim-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 252, 250, 0.94) 100%);
}

.search-miku-popover:hover .popover-miku-bg-img {
    transform: scale(1.05);
    opacity: 0.48;
    filter: blur(0px) brightness(1.06) saturate(1.25);
}

.popover-head {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px dashed rgba(57, 197, 187, 0.3);
}

.popover-title {
    font-size: 12.5px;
    font-weight: 900;
    color: #0B3B37;
}

.popover-sub {
    font-family: monospace;
    font-size: 9.5px;
    font-weight: 800;
    color: #39C5BB;
}

.hot-search-chips {
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.hot-chip {
    padding: 4px 10px;
    border-radius: 9999px;
    border: none;
    background: rgba(234, 249, 248, 0.92);
    color: #0F4F49;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(8, 90, 87, 0.06);
    transition: all 0.2s ease;
}

.hot-chip:hover {
    background: linear-gradient(135deg, #0B7A73, #08635D);
    color: #FFFFFF;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.32);
}

/* 按钮组 */
.nav-btn {
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 700;
    border-radius: var(--radius-pill);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    transition: all 0.25s ease;
}

.btn-login {
    background: rgba(57, 197, 187, 0.14);
    color: #12A79C;
    border: none;
}

.btn-login:hover {
    background: rgba(57, 197, 187, 0.2);
    color: #14322F;
}

.btn-register {
    background: #39C5BB;
    color: #FFFFFF;
    font-weight: 800;
    box-shadow: 0 4px 12px rgba(57, 197, 187, 0.35);
}

.btn-register:hover {
    background: #12A79C;
    box-shadow: 0 6px 18px rgba(57, 197, 187, 0.5);
}

.btn-publish {
    background: linear-gradient(135deg, #39C5BB 0%, #12A79C 100%);
    color: #FFFFFF;
    font-weight: 800;
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.4);
}

.btn-publish:hover {
    background: linear-gradient(135deg, #12A79C 0%, #0F8A81 100%);
    box-shadow: 0 6px 20px rgba(57, 197, 187, 0.6);
    transform: translateY(-1px);
}

/* ================= 全质感初音霓光二次元头像按钮 (PC & Mobile 统一仅保留头像) ================= */
.user-avatar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    user-select: none;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.user-avatar-ring {
    position: relative;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(135deg, #00F3FF 0%, #39C5BB 50%, #FF7E9D 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 12px rgba(57, 197, 187, 0.45);
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.user-avatar {
    background: #0E2926;
    color: #FFFFFF;
    font-weight: 800;
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
}

.user-online-led {
    position: absolute;
    bottom: 0px;
    right: 0px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00F3FF;
    border: 1.5px solid #FFFFFF;
    box-shadow: 0 0 8px #00F3FF;
    animation: ledPulse 2s ease-in-out infinite;
}

@keyframes ledPulse {
    0%, 100% { transform: scale(1); opacity: 0.9; box-shadow: 0 0 6px #00F3FF; }
    50% { transform: scale(1.18); opacity: 1; box-shadow: 0 0 12px #00F3FF, 0 0 18px rgba(57, 197, 187, 0.8); }
}

.user-avatar-btn:hover {
    transform: translateY(-2px) scale(1.08);
}

.user-avatar-btn:hover .user-avatar-ring {
    background: linear-gradient(135deg, #FF7E9D 0%, #00F3FF 50%, #39C5BB 100%);
    box-shadow: 0 0 18px rgba(0, 243, 255, 0.75), 0 0 30px rgba(255, 126, 157, 0.45);
}

/* 下拉菜单头部用户卡片 */
.dropdown-user-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px 12px;
    border-bottom: 1px dashed rgba(57, 197, 187, 0.25);
    margin-bottom: 6px;
}

.user-header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.user-header-name {
    font-size: 13.5px;
    font-weight: 800;
    color: #14322F;
}

.user-header-badge {
    font-family: 'Audiowide', monospace;
    font-size: 9px;
    font-weight: 800;
    color: #12A79C;
    letter-spacing: 0.5px;
}

/* ================= 初音未来主题 · 移动端赛博晶透抽屉 (MIKU TEAL CYBER DRAWER) ================= */
.mobile-drawer-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(8, 22, 21, 0.85);
}

.mobile-drawer-panel {
    position: absolute;
    top: 0;
    left: 0;
    width: min(320px, 86vw);
    height: 100%;
    background: linear-gradient(180deg, rgba(14, 41, 38, 0.95) 0%, rgba(10, 28, 26, 0.98) 100%);
    border-right: 1px solid rgba(57, 197, 187, 0.35);
    box-shadow: 10px 0 40px rgba(0, 0, 0, 0.45);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* 1. 背景美图与渐变罩层 */
.drawer-miku-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
}

.drawer-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: right top;
    opacity: 0.22;
    filter: saturate(1.2) brightness(0.9);
}

.drawer-bg-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg,
        rgba(14, 41, 38, 0.75) 0%,
        rgba(10, 28, 26, 0.92) 50%,
        rgba(8, 22, 21, 0.98) 100%);
}

/* 2. Drawer Header */
.drawer-header {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 18px 16px;
    border-bottom: 1px dashed rgba(57, 197, 187, 0.25);
}

.drawer-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}

.drawer-logo-mark {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    border: 1.5px solid rgba(57, 197, 187, 0.35);
}

.drawer-logo-mark .logo-note {
    font-size: 18px;
    font-weight: 900;
    color: #12A79C;
}

.drawer-brand-text {
    display: flex;
    flex-direction: column;
}

.brand-top-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.drawer-brand-name {
    font-size: 17px;
    font-weight: 900;
    color: #EAF9F8;
    letter-spacing: 0.5px;
}

.miku-tag-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.chibi-chip-img {
    width: 14px;
    height: 14px;
    object-fit: contain;
}

.drawer-brand-sub {
    font-size: 9px;
    font-weight: 700;
    color: #39C5BB;
    letter-spacing: 1.2px;
}

.drawer-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(57, 197, 187, 0.35);
    background: rgba(57, 197, 187, 0.12);
    color: #EAF9F8;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;
}

.drawer-close-btn:hover {
    background: #FF7E9D;
    color: #FFFFFF;
    border-color: transparent;
    transform: rotate(90deg);
}

/* 3. 初音 AI 专属 HUD 挂件 */
.drawer-ai-hud {
    position: relative;
    z-index: 1;
    margin: 14px 16px 8px;
    padding: 10px 14px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(57, 197, 187, 0.2) 0%, rgba(255, 126, 157, 0.15) 100%);
    border: 1px solid rgba(57, 197, 187, 0.4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(8, 90, 87, 0.2);
    transition: all 0.25s ease;
}

.drawer-ai-hud:hover {
    background: linear-gradient(135deg, rgba(57, 197, 187, 0.35) 0%, rgba(255, 126, 157, 0.25) 100%);
    border-color: #00F3FF;
    transform: translateY(-1px);
}

.hud-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.hud-icon-wrap {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #39C5BB;
    color: #14322F;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
}

.hud-text-box {
    display: flex;
    flex-direction: column;
}

.hud-title {
    font-size: 12.5px;
    font-weight: 800;
    color: #FFFFFF;
}

.hud-sub {
    font-family: monospace;
    font-size: 8.5px;
    color: #39C5BB;
}

.hud-eq-bars {
    display: flex;
    align-items: flex-end;
    gap: 2.5px;
    height: 14px;
}

.hud-eq-bar {
    width: 2.5px;
    height: 30%;
    background: #00F3FF;
    border-radius: 1px;
    animation: drawerEqPulse 0.8s ease-in-out infinite alternate;
}

@keyframes drawerEqPulse {
    0% { height: 20%; background: #39C5BB; }
    100% { height: 100%; background: #FF7E9D; }
}

/* 4. 导航菜单列表 */
.drawer-nav-list {
    position: relative;
    z-index: 1;
    flex: 1;
    overflow-y: auto;
    padding: 8px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.drawer-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(57, 197, 187, 0.15);
    color: #B2D8D5;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-symbol {
    font-size: 14px;
    color: #39C5BB;
    width: 18px;
    text-align: center;
}

.drawer-item-label {
    flex: 1;
}

.drawer-arrow-right {
    color: rgba(57, 197, 187, 0.4);
    font-size: 14px;
    transition: transform 0.2s ease;
}

.drawer-nav-item:hover {
    background: rgba(57, 197, 187, 0.12);
    border-color: rgba(57, 197, 187, 0.35);
    color: #FFFFFF;
    transform: translateX(3px);
}

.drawer-nav-item:hover .drawer-arrow-right {
    color: #39C5BB;
    transform: translateX(2px);
}

.drawer-nav-item.active {
    background: linear-gradient(135deg, rgba(57, 197, 187, 0.35) 0%, rgba(18, 167, 156, 0.25) 100%);
    border-color: #39C5BB;
    color: #FFFFFF;
    box-shadow: 0 4px 16px rgba(57, 197, 187, 0.3);
}

.drawer-nav-item.active .nav-symbol {
    color: #FF7E9D;
}

.drawer-active-dot {
    font-family: 'Audiowide', monospace;
    font-size: 9px;
    font-weight: 900;
    color: #00F3FF;
    background: rgba(0, 243, 255, 0.2);
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid rgba(0, 243, 255, 0.5);
    box-shadow: 0 0 8px rgba(0, 243, 255, 0.4);
}

/* 5. 底部 User & Actions Footer */
.drawer-footer {
    position: relative;
    z-index: 1;
    padding: 14px 16px 20px;
    border-top: 1px dashed rgba(57, 197, 187, 0.25);
    background: rgba(8, 22, 21, 0.5);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.drawer-user-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 16px;
    background: rgba(57, 197, 187, 0.1);
    border: 1px solid rgba(57, 197, 187, 0.3);
    cursor: pointer;
    transition: all 0.25s ease;
}

.drawer-user-card:hover {
    background: rgba(57, 197, 187, 0.2);
    border-color: #00F3FF;
}

.drawer-user-text {
    display: flex;
    flex-direction: column;
}

.drawer-user-name {
    font-size: 14px;
    font-weight: 800;
    color: #FFFFFF;
}

.drawer-user-sub {
    font-size: 11px;
    color: #39C5BB;
    font-weight: 600;
}

.drawer-btn-group {
    display: flex;
    gap: 8px;
}

.drawer-action-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    border-radius: var(--radius-pill);
    font-size: 13px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    transition: all 0.25s ease;
}

.drawer-action-btn.login {
    background: rgba(57, 197, 187, 0.15);
    color: #39C5BB;
    border: 1px solid rgba(57, 197, 187, 0.35);
}

.drawer-action-btn.login:hover {
    background: #39C5BB;
    color: #FFFFFF;
}

.drawer-action-btn.register {
    background: linear-gradient(135deg, #39C5BB, #12A79C);
    color: #FFFFFF;
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.4);
}

.drawer-action-btn.publish {
    background: linear-gradient(135deg, #39C5BB, #12A79C);
    color: #FFFFFF;
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.4);
}

.drawer-action-btn.logout {
    flex: 0 0 64px;
    background: rgba(255, 255, 255, 0.08);
    color: #8BA8A5;
    border: 1px solid rgba(255, 255, 255, 0.15);
}

.drawer-action-btn.logout:hover {
    background: rgba(255, 126, 157, 0.2);
    color: #FF7E9D;
    border-color: #FF7E9D;
}

/* 抽屉过渡动画 */
.slide-drawer-enter-active,
.slide-drawer-leave-active {
    transition: opacity 0.25s ease;
}

.slide-drawer-enter-active .mobile-drawer-panel {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-drawer-leave-active .mobile-drawer-panel {
    transition: transform 0.25s ease;
}

.slide-drawer-enter-from,
.slide-drawer-leave-to {
    opacity: 0;
}

.slide-drawer-enter-from .mobile-drawer-panel,
.slide-drawer-leave-to .mobile-drawer-panel {
    transform: translateX(-100%);
}

/* ================= 响应式适配 (MOBILE RESPONSIVENESS) ================= */
@media (max-width: 992px) {
    .hamburger-btn {
        display: flex !important;
    }
    .nav-center {
        display: none !important;
    }
    .search-miku-wrapper {
        display: none !important;
    }
    .btn-ai,
    .btn-register,
    .btn-publish {
        display: none !important;
    }
    .user-bg-layer,
    .user-overlay-layer,
    .user-arrow,
    .user-nickname,
    .user-cyber-badge {
        display: none !important;
    }
}

@media (max-width: 768px) {
    /* 移动端灵动岛浮岛外观 (Mobile Cyber Dynamic Island) */
    .navbar-wrapper {
        top: 10px;
        width: calc(100vw - 20px);
        height: 52px;
        border-radius: 9999px;
        background: rgba(18, 42, 40, 0.88);
        border: 1.5px solid rgba(57, 197, 187, 0.45);
        box-shadow: 0 8px 24px rgba(57, 197, 187, 0.25), 0 2px 10px rgba(0, 0, 0, 0.18);
    }

    .navbar-wrapper.scrolled {
        top: 0;
        width: 100%;
        height: 56px;
        border-radius: 0 0 16px 16px;
        background: rgba(227, 247, 244, 0.95);
        border-top: none;
        border-left: none;
        border-right: none;
        box-shadow: 0 4px 20px rgba(8, 90, 87, 0.12);
    }

    .navbar-container {
        padding: 0 12px;
        justify-content: space-between;
        gap: 8px;
    }

    .navbar-wrapper.scrolled .navbar-container {
        padding: 0 14px;
    }

    /* 左侧 Logo 区 */
    .nav-left {
        gap: 8px;
    }

    .brand-logo-mark {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #FFFFFF !important;
        border: 1.5px solid rgba(57, 197, 187, 0.35) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .logo-note {
        font-size: 17px !important;
        font-weight: 900 !important;
        color: #12A79C !important;
    }

    .brand-name {
        font-size: 14.5px !important;
        font-weight: 900 !important;
        letter-spacing: 0.5px;
    }

    .navbar-wrapper:not(.scrolled) .brand-name {
        color: #ffffff !important;
    }

    .navbar-wrapper.scrolled .brand-name {
        color: #0B3B37 !important;
    }

    .brand-sub {
        display: none !important;
    }

    /* 右侧 菜单 & 用户区 */
    .nav-right {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-right: 0;
    }

    .hamburger-btn {
        display: flex !important;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        cursor: pointer;
    }

    .navbar-wrapper:not(.scrolled) .hamburger-btn {
        background: rgba(57, 197, 187, 0.22);
        border: 1.2px solid rgba(57, 197, 187, 0.45);
        color: #ffffff;
    }

    .navbar-wrapper.scrolled .hamburger-btn {
        background: rgba(57, 197, 187, 0.14);
        border: 1.2px solid rgba(57, 197, 187, 0.35);
        color: #0B7A73;
    }

    .hamburger-btn.is-open {
        background: #C2185B !important;
        border-color: #FF7E9D !important;
        color: #ffffff !important;
        transform: rotate(90deg);
        box-shadow: 0 0 14px rgba(255, 126, 157, 0.6);
    }

    .btn-login {
        display: inline-flex !important;
        padding: 5px 12px;
        font-size: 12px;
        border-radius: 9999px;
    }

    .user-avatar-ring {
        padding: 1.5px;
        box-shadow: 0 0 10px rgba(57, 197, 187, 0.5);
    }
}

@media (max-width: 480px) {
    .navbar-wrapper {
        top: 10px;
        width: calc(100vw - 20px);
    }

    .navbar-container {
        padding: 0 10px;
        gap: 8px;
    }

    .brand-name {
        font-size: 14px !important;
    }
}

/* ================= 动效克制（系统偏好 / html.reduce-motion 双写） =================
   灵动岛浮现/隐藏与形态切换都是位移动画，降级时改为瞬时完成。 */
@media (prefers-reduced-motion: reduce) {
    .navbar-wrapper {
        transition: none;
    }
}

html.reduce-motion .navbar-wrapper {
    transition: none;
}
</style>
