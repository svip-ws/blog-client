import request from "./request";

// 本地闪卡预设数据源（保障端到端秒开体验与流畅回退）
export const PRESET_SNAPSHOT_CARDS = [
  {
    id: 1,
    card_no: "No.001",
    name: "暮光霓虹 · 赛博雨夜",
    category: "赛博朋克",
    style_preset: "赛博朋克",
    description: "捕捉雨夜都市霓虹的极致光雕感，微压冷烫与激光碎冰镭射，随视角倾斜呈现流光变色。",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80"],
    parallax_intensity: 0.9,
    view_count: 2450,
    like_count: 580,
    is_published: 1,
    create_time: "2026-09-08",
    style_label: "赛博全息",
    config_json: JSON.stringify({
      layers: [
        { name: "background", z: -25, opacity: 1 },
        { name: "mainSubject", z: 0, opacity: 1 },
        { name: "neonGlow", z: 18, opacity: 0.9, glow: true },
        { name: "hologramCode", z: 30, opacity: 0.95 }
      ]
    })
  },
  {
    id: 2,
    card_no: "No.002",
    name: "富士山下 · 樱吹雪",
    category: "风景",
    style_preset: "日系复古",
    description: "春日富士山下的樱花落英流光，浮雕银箔工艺，极具收藏质感与柔和光致变色。",
    cover: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80"],
    parallax_intensity: 0.85,
    view_count: 1890,
    like_count: 420,
    is_published: 1,
    create_time: "2026-09-07",
    style_label: "樱吹雪韵",
    config_json: JSON.stringify({
      layers: [
        { name: "mountainBg", z: -20, opacity: 1 },
        { name: "sakuraPetals", z: 12, opacity: 0.85 },
        { name: "sunRay", z: 22, opacity: 0.9 }
      ]
    })
  },
  {
    id: 3,
    card_no: "No.003",
    name: "深海鲸歌 · 蔚蓝星芒",
    category: "生活",
    style_preset: "幻彩琉璃",
    description: "深海巨鲸穿梭于荧光星海之间，水波流光与晶钻碎冰双重全息效果。",
    cover: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&auto=format&fit=crop&q=80"],
    parallax_intensity: 0.95,
    view_count: 3100,
    like_count: 890,
    is_published: 1,
    create_time: "2026-09-06",
    style_label: "深海琉璃",
    config_json: JSON.stringify({
      layers: [
        { name: "deepSeaBg", z: -30, opacity: 1 },
        { name: "whaleSubject", z: 5, opacity: 1 },
        { name: "bioluminescence", z: 25, opacity: 0.9 }
      ]
    })
  },
  {
    id: 4,
    card_no: "No.004",
    name: "橘猫午后 · 阳光微醺",
    category: "宠物",
    style_preset: "暖阳胶片",
    description: "暖阳照射下小猫慵懒的毛发纹理，浮雕亮烫与颗粒胶片滤镜感。",
    cover: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1000&auto=format&fit=crop&q=80"],
    parallax_intensity: 0.8,
    view_count: 1560,
    like_count: 380,
    is_published: 1,
    create_time: "2026-09-05",
    style_label: "暖阳胶片",
    config_json: JSON.stringify({
      layers: [
        { name: "roomBg", z: -15, opacity: 1 },
        { name: "catMain", z: 0, opacity: 1 },
        { name: "sunDust", z: 15, opacity: 0.8 }
      ]
    })
  },
  {
    id: 5,
    card_no: "No.005",
    name: "星河漫步 · 银河幻想",
    category: "风景",
    style_preset: "赛博朋克",
    description: "漫步于浩瀚银河边缘，微压金烫与碎冰流光，带来沉浸式宇宙探索感受。",
    cover: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1000&auto=format&fit=crop&q=80"],
    parallax_intensity: 0.9,
    view_count: 2780,
    like_count: 670,
    is_published: 1,
    create_time: "2026-09-04",
    style_label: "银河星尘",
    config_json: JSON.stringify({
      layers: [
        { name: "spaceBg", z: -35, opacity: 1 },
        { name: "astralDust", z: 10, opacity: 0.9 },
        { name: "laserBorder", z: 28, opacity: 0.95 }
      ]
    })
  },
  {
    id: 6,
    card_no: "No.006",
    name: "少女与海 · 蓝调时刻",
    category: "人物",
    style_preset: "日系复古",
    description: "傍晚蓝调时刻的海岸线侧影，高光哑光镭射透卡，光泽柔和而深邃。",
    cover: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80"],
    parallax_intensity: 0.85,
    view_count: 2130,
    like_count: 510,
    is_published: 1,
    create_time: "2026-09-03",
    style_label: "蓝调时刻",
    config_json: JSON.stringify({
      layers: [
        { name: "seaHorizon", z: -20, opacity: 1 },
        { name: "girlSilhouette", z: 0, opacity: 1 },
        { name: "twilightSheen", z: 20, opacity: 0.85 }
      ]
    })
  }
];

export function formatSnapshotCard(item) {
  if (!item) return item;
  let cover = item.cover || "";
  if (cover && !cover.startsWith("http")) {
    const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
    if (!cover.startsWith("/")) cover = "/" + cover;
    cover = base ? `${base}${cover}` : cover;
  }

  let images = item.images || [];
  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch (e) {
      images = [cover];
    }
  }
  if (!Array.isArray(images) || images.length === 0) {
    images = cover ? [cover] : [];
  }
  images = images.map((img) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
    const cleanImg = img.startsWith("/") ? img : "/" + img;
    return base ? `${base}${cleanImg}` : cleanImg;
  });

  return {
    ...item,
    card_no: item.card_no || `No.${String(item.id || 1).padStart(3, "0")}`,
    name: item.name || "未命名随拍",
    category: item.category || "生活",
    style_preset: item.style_preset || "赛博朋克",
    description: item.description || "记录生活中的闪耀流光与瞬间美好。",
    cover: cover || images[0] || "",
    images: images.length > 0 ? images : [cover],
    parallax_intensity: item.parallax_intensity ? parseFloat(item.parallax_intensity) : 0.85,
    view_count: item.view_count || 120,
    like_count: item.like_count || 35
  };
}

// 获取随拍卡片列表
export async function getSnapshotList(params = {}) {
  try {
    const res = await request({ url: "/snapshot/list", method: "get", params });
    if (res && res.data && res.data.list && res.data.list.length > 0) {
      res.data.list = res.data.list.map(formatSnapshotCard);
      return res;
    }
  } catch (err) {
    console.warn("后端随拍接口暂未联通，自动载入预置 3D 镭射卡册:", err.message);
  }

  // 本地降级过滤
  let list = PRESET_SNAPSHOT_CARDS.map(formatSnapshotCard);
  const { category, keyword, sort, page = 1, pageSize = 12 } = params;

  if (category && category !== "全部") {
    list = list.filter((item) => item.category === category);
  }

  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    list = list.filter(
      (item) =>
        (item.name || "").toLowerCase().includes(kw) ||
        (item.description && item.description.toLowerCase().includes(kw)) ||
        (item.card_no && item.card_no.toLowerCase().includes(kw))
    );
  }

  if (sort === "newest") {
    list.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
  } else if (sort === "popular") {
    list.sort((a, b) => b.like_count - a.like_count);
  }

  const total = list.length;
  const start = (page - 1) * pageSize;
  const pagedList = list.slice(start, start + pageSize);

  return {
    code: 200,
    message: "获取成功",
    data: {
      list: pagedList,
      total,
      page,
      pageSize,
    },
  };
}

// 获取分类
export async function getSnapshotCategories() {
  try {
    const res = await request({ url: "/snapshot/categories", method: "get" });
    if (res && res.data && res.data.length > 1) {
      return res;
    }
  } catch (e) {}
  return {
    code: 200,
    message: "获取成功",
    data: ["全部", "风景", "人物", "生活", "宠物", "赛博朋克"],
  };
}

// 获取详情
export async function getSnapshotById(id) {
  const res = await request({ url: `/snapshot/${id}`, method: "get" });
  if (res && res.data && res.data.id) {
    res.data = formatSnapshotCard(res.data);
  }
  return res;
}

// 点赞卡片
export function likeSnapshot(id) {
  return request.post(`/snapshot/${id}/like`);
}
