import { marked } from "marked";
import { sanitizeHtml } from "../utils/sanitize";

/**
 * AI 消息 Markdown 工业级解析与渲染引擎
 * ------------------------------------------------------------------
 * 1. 采用标准 marked (GFM) 引擎，完整支持表格、任务列表、嵌套列表、行内代码与代码块；
 * 2. 自定义代码块与标题渲染，1:1 对齐界面美学 (.code-block-box, .md-h* 等)；
 * 3. 全量经由 DOMPurify.sanitize 进行 XSS 脱敏拦截；
 * 4. 配合 WeakMap 缓存已渲染结果，避免逐帧打字机重绘开销。
 */
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const renderer = {
  heading(token) {
    const depth = token.depth || 1;
    const text = this.parser.parseInline(token.tokens || []);
    return `<h${depth} class="md-h${depth}">${text}</h${depth}>`;
  },
  code(token) {
    const lang = (token.lang || "code").split(/\s+/)[0];
    const text = escapeHtml(token.text || "");
    return `<div class="code-block-box"><div class="code-head"><span>${lang}</span></div><pre><code>${text}</code></pre></div>`;
  },
  codespan(token) {
    return `<code class="inline-code">${escapeHtml(token.text)}</code>`;
  },
};

marked.use({
  gfm: true,
  breaks: true,
  renderer,
});

function renderMarkdown(content) {
  if (!content) return "";
  try {
    return marked.parse(content);
  } catch (err) {
    console.error("[useMarkdown] 解析异常:", err);
    return escapeHtml(content);
  }
}

const msgContentCache = new WeakMap();

export function getMsgHtml(msg) {
  if (!msg) return "";
  // 正文只渲染答案内容；思考过程由独立的折叠面板展示（不再回退到 reasoning，避免重复）
  const targetText =
    msg.displayedContent !== undefined && msg.displayedContent !== ""
      ? msg.displayedContent
      : msg.content || "";

  if (!targetText) return "";

  const now = Date.now();
  const cached = msgContentCache.get(msg);
  if (cached && cached.text === targetText) return cached.html;

  // 渲染与打字机解耦：
  // 1) 打字机已追平正文（含生成结束最后一次）→ 强制渲染，保证最终完整
  // 2) 生成中未追平时，增量过小且距上次渲染很近 → 复用旧 html，下一帧再渲染，降低 CPU 压力
  const caughtUp = !!msg.content && msg.displayedContent === msg.content;
  if (!caughtUp && cached) {
    const grew = targetText.length - cached.text.length;
    if (grew > 0 && grew < 24 && now - cached.time < 120) {
      return cached.html;
    }
  }

  const rawHtml = renderMarkdown(targetText);
  const html = sanitizeHtml(rawHtml);
  msgContentCache.set(msg, { text: targetText, html, time: now });
  return html;
}
