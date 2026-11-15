/**
 * 初音未来 (Hatsune Miku) 图片自动化兜底与随机分配工具类
 */

export const MIKU_SCENE_WALLPAPERS = [
  '/images/miku/miku_wp_1.jpg',
  '/images/miku/miku_wp_2.jpg',
  '/images/miku/miku_wp_3.jpg',
  '/images/miku/miku_wp_4.jpg',
  '/images/miku/miku_wp_5.jpg',
  '/images/miku/miku_wp_6.jpg',
  '/images/miku/miku_wp_7.jpg',
  '/images/miku/miku_wp_8.jpg',
  '/images/miku/miku_wp_9.jpg',
  '/images/miku/miku_wp_10.jpg',
  '/images/miku/miku_wp_11.jpg'
];

export const MIKU_AVATARS = [
  '/images/miku/miku_chibi_main.png',
  '/images/miku/miku_chibi_wave.png',
  '/images/miku/miku_chibi_category_card.png',
  '/images/miku/miku_chibi_tag_card.png'
];

/**
 * 根据 ID 或索引计算哈希，获取确定性随机的初音壁纸
 * @param {number|string} seed
 * @returns {string}
 */
export const getMikuWallpaper = (seed = 0) => {
  if (typeof seed === 'number' && !isNaN(seed)) {
    return MIKU_SCENE_WALLPAPERS[Math.abs(Math.floor(seed)) % MIKU_SCENE_WALLPAPERS.length];
  }
  if (typeof seed === 'string' && seed.length > 0) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return MIKU_SCENE_WALLPAPERS[Math.abs(hash) % MIKU_SCENE_WALLPAPERS.length];
  }
  return MIKU_SCENE_WALLPAPERS[Math.floor(Math.random() * MIKU_SCENE_WALLPAPERS.length)];
};

/**
 * 获取安全有效的封面图片，若无封面或加载失败，自动补充初音未来壁纸
 * @param {string} coverUrl
 * @param {number|string} seed
 * @returns {string}
 */
export const getSafeCover = (coverUrl, seed = 0) => {
  if (coverUrl && typeof coverUrl === 'string' && coverUrl.trim() !== '') {
    return coverUrl;
  }
  return getMikuWallpaper(seed);
};
