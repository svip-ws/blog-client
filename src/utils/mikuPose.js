/**
 * 帖子卡片 · 初音主题映射工具
 *
 * stageFor  卡片序号 → 舞台底图（复用 public/images/miku 既有 banner，无新增资产）
 */

/** 卡片底图：从既有 miku banner 资产里选 5 张青粉霓虹调、可无缝循环的 */
export const STAGE_BACKGROUNDS = [
    '/images/miku/miku_archives_banner.jpg',   // 抽象数据球 + 霓虹网络（无人物，水印最干净）
    '/images/miku/miku_articles_banner.jpg',   // Miku 人像 + 城市霓虹虚化
    '/images/miku/miku_categories_banner.jpg', // 夜色窗边 + 城市灯火
    '/images/miku/miku_messages_banner.jpg',   // 留言墙 · 暖色霓虹
    '/images/miku/miku_tags_banner.jpg'        // 标签云 · 青粉光点
];

/** @param {number} i 卡片序号 @returns {string} 底图地址 */
export const stageFor = (i) => STAGE_BACKGROUNDS[((i % STAGE_BACKGROUNDS.length) + STAGE_BACKGROUNDS.length) % STAGE_BACKGROUNDS.length];
