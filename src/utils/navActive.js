/**
 * 导航选中态的唯一判定来源。
 * 桌面导航（NavBar）、移动端抽屉、底部标签栏（BottomTabBar）全部共用，
 * 避免三处各写一套 startsWith 规则导致同一页面在不同端高亮不一致。
 *
 * key 与各菜单项一一对应；新增菜单项时只需在此补齐一条。
 */

// 归一化：去掉尾部斜杠（'/tags/' 与 '/tags' 视为同一路由）
const normalize = (path) => {
    const p = path || '/';
    return p.length > 1 ? p.replace(/\/+$/, '') : p;
};

export const NAV_MATCHERS = {
    '/': (p) => p === '/',

    // 文章列表 + 文章详情 + 文章编辑，都归属「文章」
    '/articles': (p) => p === '/articles' || p.startsWith('/article/'),

    // 分类 / 标签 / 归档三项：桌面聚合为「发现」，抽屉里各自平铺
    '/categories': (p) => p === '/categories',
    '/tags': (p) => p === '/tags' || p.startsWith('/tag/'),
    '/archives': (p) => p === '/archives',
    discover: (p) => ['/categories', '/tags', '/archives'].includes(p) || p.startsWith('/tag/'),

    '/messages': (p) => p === '/messages',
    '/snapshots': (p) => p === '/snapshots',
    '/about': (p) => p === '/about',
    '/profile': (p) => p === '/profile',
};

/**
 * @param {string} key  菜单项标识（路由 path 或 'discover' 这类聚合 key）
 * @param {string} path 当前 route.path
 * @returns {boolean}
 */
export const isNavActive = (key, path) => !!NAV_MATCHERS[key]?.(normalize(path));
