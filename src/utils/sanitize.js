import DOMPurify from "dompurify";

/**
 * 富文本消毒：去除 <script>、事件属性（onerror/onclick 等）、javascript: 协议等
 * XSS 载体，保留正常的排版标签（标题/图片/代码块/链接等），供 v-html 渲染前调用。
 *
 * 所有传给 v-html 的内容都必须先经过这里，不允许直接渲染后端/用户数据。
 */
export function sanitizeHtml(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: false, mathMl: false },
    ADD_ATTR: ["target"], // 保留链接的 target="_blank"
    FORBID_TAGS: ["style", "form", "input", "iframe"],
  });
}

/**
 * HTML 转义：把纯文本安全地变成可插入 innerHTML 的字符串。
 * 用于"纯文本 + 高亮标签"这类自产 HTML 场景（如搜索关键词高亮）。
 */
export function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
