/**
 * 相对时间格式化
 * @param {string} timeStr - 时间字符串
 * @returns {string} - 比如 "3 分钟前"、"2 天前"
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  if (Number.isNaN(date.getTime())) return String(timeStr);
  const now = new Date();
  const diff = now - date;
  if (diff < 0) return formatDate(timeStr);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return formatDate(timeStr);
};

/**
 * 日期格式化
 * @param {string} timeStr - 时间字符串
 * @returns {string} - 比如 "2026-06-23"
 */
export const formatDate = (timeStr) => {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  if (Number.isNaN(date.getTime())) return String(timeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/**
 * 日期时间格式化（精确到分）
 * @param {string} timeStr - 时间字符串
 * @returns {string} - 比如 "2026-06-23 14:30"
 */
export const formatDateTime = (timeStr) => {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  if (Number.isNaN(date.getTime())) return String(timeStr);
  return `${formatDate(timeStr)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

/**
 * 加入时间格式化
 * @param {string} timeStr - 时间字符串
 * @returns {string} - 比如 "2026年06月"
 */
export const formatJoinDate = (timeStr) => {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  if (Number.isNaN(date.getTime())) return String(timeStr);
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月`;
};

/**
 * 价格格式化
 * @param {number} price
 * @returns {string} - 整数不带小数，小数保留两位
 */
export const formatPrice = (price) => {
    const num = Number(price);
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
};

/**
 * 紧凑数字格式化（>=10000 显示 w，>=1000 显示 k）
 * 用于大访问量、累计计数等紧凑展示
 * @param {number} n
 * @returns {string}
 */
export const formatCompactNumber = (n) => {
    if (n === null || n === undefined || isNaN(n)) return "0";
    const num = Number(n);
    if (num >= 10000) {
        const v = (num / 10000).toFixed(1);
        return v.replace(/\.0$/, "") + "w";
    }
    if (num >= 1000) {
        const v = (num / 1000).toFixed(1);
        return v.replace(/\.0$/, "") + "k";
    }
    return String(num);
};
