import { ref, computed } from "vue";

// 游客每日（本地）免费提问额度
export const GUEST_AI_LIMIT = 2;

// 设备级游客标识（用于服务端按设备统计额度）
export function getGuestId() {
  let gid = localStorage.getItem("ai_guest_id");
  if (!gid) {
    gid = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : "g-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    localStorage.setItem("ai_guest_id", gid);
  }
  return gid;
}

function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function checkAndResetDailyQuota() {
  const today = getTodayDateStr();
  const savedDate = localStorage.getItem("ai_guest_date");
  if (savedDate !== today) {
    localStorage.setItem("ai_guest_date", today);
    localStorage.setItem("ai_guest_count", "0");
    return 0;
  }
  return parseInt(localStorage.getItem("ai_guest_count") || "0", 10);
}

export function useGuestQuota() {
  const guestUsedCount = ref(checkAndResetDailyQuota());
  const remainingGuestCount = computed(() =>
    Math.max(0, GUEST_AI_LIMIT - guestUsedCount.value)
  );

  // 当前已用次数
  function used() {
    return checkAndResetDailyQuota();
  }

  // 尝试消耗一次额度，超限返回 false
  function consume() {
    const count = used();
    if (count >= GUEST_AI_LIMIT) return false;
    const next = count + 1;
    localStorage.setItem("ai_guest_date", getTodayDateStr());
    localStorage.setItem("ai_guest_count", String(next));
    guestUsedCount.value = next;
    return true;
  }

  return { guestUsedCount, remainingGuestCount, used, consume };
}
