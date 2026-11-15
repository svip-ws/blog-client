import request from "./request";

// 获取留言列表
export function getActiveMessages() {
  return request({ url: "/message/active", method: "get" });
}

// 发表留言
export function createMessage(data) {
  return request({ url: "/message", method: "post", data });
}

// 点赞留言
export function likeMessage(id) {
  return request({ url: `/message/${id}/like`, method: "post" });
}

// 回复留言
export function replyMessage(id, data) {
  return request({ url: `/message/${id}/reply`, method: "post", data });
}

// 删除自己发表的留言
export function deleteMyMessage(id) {
  return request({ url: `/message/${id}`, method: "delete" });
}

// 获取用户点赞状态
export function getLikedStatus() {
  return request({ url: "/message/liked", method: "get" });
}

export function getImageFullUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  // 生产环境：VITE_API_BASE_URL=/api → 取 origin 根路径，图片走同源 /uploads（经 Nginx 反代）
  // 开发环境：VITE_API_BASE_URL=http://localhost:3001/api → 取 http://localhost:3001 直连后端
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
  return base ? `${base}${url}` : url;
}
