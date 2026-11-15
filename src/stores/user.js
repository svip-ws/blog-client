import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getUserInfo } from "../api/user";

export const useUserStore = defineStore("client_user", () => {
  const token = ref(localStorage.getItem("client_token") || "");
  const userInfo = ref(
    JSON.parse(localStorage.getItem("client_user") || "null"),
  );

  const isLoggedIn = ref(!!token.value);

  // 是否管理员：管理员在客户端可直接发布，普通用户提交后进入待审核
  const isAdmin = computed(() => userInfo.value?.role === "admin");

  const setLoginData = (tokenStr, user) => {
    token.value = tokenStr;
    userInfo.value = user;
    isLoggedIn.value = true;
    localStorage.setItem("client_token", tokenStr);
    localStorage.setItem("client_user", JSON.stringify(user));
  };

  const logout = () => {
    token.value = "";
    userInfo.value = null;
    isLoggedIn.value = false;
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_user");
  };

  // 启动时静默刷新：更新 COS 预签名（2 小时过期），避免头像裂图
  const refreshUserInfo = async () => {
    try {
      const res = await getUserInfo();
      // 合并保留已有字段，用后端最新数据（含新 avatar_url）覆盖
      userInfo.value = { ...userInfo.value, ...res.data };
      localStorage.setItem("client_user", JSON.stringify(userInfo.value));
    } catch (e) {
      // 静默失败，不打断使用（401 由拦截器统一处理）
    }
  };

  return { token, userInfo, isLoggedIn, isAdmin, setLoginData, logout, refreshUserInfo };
});
