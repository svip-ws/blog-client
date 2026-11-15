import { ref } from "vue";
import { ElMessage } from "element-plus";

/**
 * 导航栏搜索：关键词、聚焦态、热搜推荐、回车/按钮检索
 */
export function useNavSearch(router) {
  const searchKeyword = ref("");
  const isSearchFocused = ref(false);

  const hotSearchTags = [
    "#初音未来#", "#VOCALOID#", "#千本樱#",
    "#音乐创作#", "#美学笔记#", "#二次元随拍#",
  ];

  function handleSearch() {
    if (!searchKeyword.value.trim()) {
      ElMessage.warning("请输入搜索关键词");
      return;
    }
    router.push({
      path: "/search",
      query: { keyword: searchKeyword.value.trim() },
    });
  }

  function quickSearch(tag) {
    searchKeyword.value = tag.replace(/^#|#$/g, "");
    handleSearch();
  }

  function handleSearchBlur() {
    setTimeout(() => { isSearchFocused.value = false; }, 200);
  }

  return {
    searchKeyword, isSearchFocused, hotSearchTags,
    handleSearch, quickSearch, handleSearchBlur,
  };
}
