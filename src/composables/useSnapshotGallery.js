import { ref, reactive, onUnmounted } from "vue";
import { getSnapshotList, getSnapshotCategories } from "../api/snapshot";

/**
 * 随拍画廊：列表加载、分类/搜索/排序/分页、滚动揭示、卡片悬浮倾斜、封面处理
 */
export function useSnapshotGallery() {
  const loading = ref(false);
  const cardList = ref([]);
  const categories = ref(["全部", "初音壁纸", "Vocaloid同人", "葱绿瞬间", "全息舞台", "二次元", "赛博朋克"]);
  const activeCategory = ref("全部");
  const keyword = ref("");
  const activeSort = ref("default");
  const currentPage = ref(1);
  const pageSize = ref(12);
  const totalCount = ref(0);
  const displayedTotalCount = ref(0);

  // Miku 专属相册插画与壁纸库（封面缺失/失败时兜底）
  const MIKU_SNAPSHOT_WALLPAPERS = [
    "/images/miku/miku_wp_1.jpg", "/images/miku/miku_wp_2.jpg",
    "/images/miku/miku_wp_3.jpg", "/images/miku/miku_wp_4.jpg",
    "/images/miku/miku_wp_5.jpg", "/images/miku/miku_wp_6.jpg",
    "/images/miku/miku_wp_7.jpg", "/images/miku/miku_wp_8.jpg",
    "/images/miku/miku_wp_9.jpg", "/images/miku/miku_wp_10.jpg",
    "/images/miku/miku_wp_11.jpg",
  ];

  const imgBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return imgBase ? `${imgBase}${url}` : url;
  };

  const getMikuCardCover = (card, index) => {
    // 优先后端签名字段 cover_url，回退到原始 cover / 其他别名
    const rawCover = card?.cover_url || card?.cover || card?.url || card?.img || card?.image_url || card?.src;
    if (rawCover) return getImageUrl(rawCover);
    return MIKU_SNAPSHOT_WALLPAPERS[index % MIKU_SNAPSHOT_WALLPAPERS.length];
  };

  const getMikuThemeIcon = (index) => {
    const icons = ["♪", "♫", "🎧", "✦", "🌸", "39", "⚡"];
    return icons[index % icons.length];
  };

  const getCategoryClass = (cat) => {
    if (cat === "赛博朋克") return "cat-cyber";
    if (cat === "二次元") return "cat-anime";
    if (cat === "风景") return "cat-scenery";
    if (cat === "人物") return "cat-portrait";
    return "cat-default";
  };

  const formatCardDate = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal).split(" ")[0] || String(dateVal);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  const handleImgError = (e) => {
    if (e && e.target) {
      e.target.onerror = null;
      const randIdx = Math.floor(Math.random() * MIKU_SNAPSHOT_WALLPAPERS.length);
      e.target.src = MIKU_SNAPSHOT_WALLPAPERS[randIdx];
    }
  };

  // 数字平滑滚动
  const animateCounter = (target) => {
    const start = displayedTotalCount.value;
    const duration = 800;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      displayedTotalCount.value = Math.floor(start + (target - start) * easeProgress);
      if (progress < 1) requestAnimationFrame(step);
      else displayedTotalCount.value = target;
    };
    requestAnimationFrame(step);
  };

  // 卡片 refs / 滚动揭示
  const cardRefs = reactive({});
  const cachedCardRects = reactive({});
  const revealedIds = ref(new Set());
  let observer = null;

  // 组件卸载时断开观察，避免泄漏
  onUnmounted(() => {
    if (observer) observer.disconnect();
  });

  const initIntersectionObserver = () => {
    if (typeof window === "undefined") return;
    if (observer) observer.disconnect();
    setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute("data-card-id");
              if (id) revealedIds.value.add(Number(id));
            }
          });
        },
        { threshold: 0.1 }
      );
      document.querySelectorAll(".vault-card-item").forEach((el) => observer.observe(el));
    }, 100);
  };

  const fetchCards = async () => {
    loading.value = true;
    try {
      const res = await getSnapshotList({
        page: currentPage.value,
        pageSize: pageSize.value,
        category: activeCategory.value,
        keyword: keyword.value,
        sort: activeSort.value,
      });
      if (res && res.data) {
        cardList.value = res.data.list || [];
        totalCount.value = res.data.total || 0;
        animateCounter(totalCount.value);
        initIntersectionObserver();
      }
    } catch (err) {
      console.error("获取随拍卡片失败:", err);
    } finally {
      loading.value = false;
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getSnapshotCategories();
      if (res && res.data && res.data.length > 0) categories.value = res.data;
    } catch (e) {}
  };

  const handleCategoryChange = (cat) => {
    activeCategory.value = cat;
    currentPage.value = 1;
    fetchCards();
  };
  const handleSearch = () => { currentPage.value = 1; fetchCards(); };
  const handleSortChange = () => { currentPage.value = 1; fetchCards(); };
  const resetFilters = () => {
    keyword.value = "";
    activeCategory.value = "全部";
    currentPage.value = 1;
    fetchCards();
  };
  const handlePageChange = (page) => { currentPage.value = page; fetchCards(); };
  const handleSizeChange = (size) => {
    pageSize.value = size;
    currentPage.value = 1;
    fetchCards();
  };

  // 卡片 Hover Tilt（缓存 rect，零 Reflow）
  const onCardMouseEnter = (e, card) => {
    const el = cardRefs[card.id];
    if (el) cachedCardRects[card.id] = el.getBoundingClientRect();
  };
  const onCardMouseMove = (e, card) => {
    const el = cardRefs[card.id];
    const rect = cachedCardRects[card.id];
    if (!el || !rect) return;
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `perspective(800px) rotateX(${((-y / rect.height) * 12).toFixed(1)}deg) rotateY(${((x / rect.width) * 12).toFixed(1)}deg) translate3d(0, -8px, 0) scale(1.02)`;
  };
  const onCardMouseLeave = (e, card) => {
    const el = cardRefs[card.id];
    if (el) el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0) scale(1)";
  };

  return {
    loading, cardList, categories, activeCategory, keyword, activeSort,
    currentPage, pageSize, totalCount, displayedTotalCount,
    cardRefs, revealedIds,
    fetchCards, fetchCategories,
    handleCategoryChange, handleSearch, handleSortChange, resetFilters,
    handlePageChange, handleSizeChange,
    onCardMouseEnter, onCardMouseMove, onCardMouseLeave,
    getMikuCardCover, getMikuThemeIcon, getCategoryClass,
    formatCardDate, handleImgError,
  };
}
