import { ref, computed, nextTick, reactive } from "vue";
import request, { authHeader } from "../api/request";
import { ElMessage, ElMessageBox } from "element-plus";
import { useGuestQuota, getGuestId, GUEST_AI_LIMIT } from "./useGuestQuota";
import { useChatScroll } from "./useChatScroll";
import { useTypewriter } from "./useTypewriter";
import { getMsgHtml } from "./useMarkdown";

/**
 * AI 聊天编排：会话 / 消息 / SSE 流式 / 输入 / 额度
 * @param {object} userStore Pinia 用户 store
 * @param {object} router vue-router（用于游客超限引导登录）
 */
export function useAiChat(userStore, router) {
  const isLoggedIn = computed(() => !!userStore.token && !!userStore.userInfo);

  // 状态
  const conversations = ref([]);
  const activeConvId = ref(null);
  const messages = ref([]);
  const inputQuery = ref("");
  const isGenerating = ref(false);
  const isWebSearch = ref(true); // 默认开启极速联网
  const latestChunk = ref("");
  const abortController = ref(null);
  const textareaRef = ref(null);

  // 额度 / 滚动 / 打字机
  const quota = useGuestQuota();
  const {
    viewportRef, showScrollArrow, handleScroll,
    scrollToBottom, scrollToBottomSmooth, scrollToBottomThrottled,
  } = useChatScroll();
  const { startTypewriterLoop } = useTypewriter(messages, isGenerating, {
    scrollThrottled: scrollToBottomThrottled,
    scrollFinal: () => scrollToBottom(true),
  });

  // 历史对话时间格式化
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
    const p = (n) => String(n).padStart(2, "0");
    const timePart = `${p(date.getHours())}:${p(date.getMinutes())}`;
    if (isToday) return timePart;
    if (isYesterday) return `昨天 ${timePart}`;
    return `${p(date.getMonth() + 1)}-${p(date.getDate())} ${timePart}`;
  };

  const fetchConversations = async () => {
    try {
      const res = await request.get(
        `/ai/conversations?t=${Date.now()}&guestId=${encodeURIComponent(getGuestId())}`
      );
      if (res && res.data) conversations.value = res.data;
    } catch (err) {
      console.error("获取历史对话失败:", err);
    }
  };

  // 拆分历史消息中的 <think> 思考内容，并过滤残留的检索前缀
  const parseMessageContent = (rawContent = "") => {
    let reasoning = "";
    let content = (rawContent || "").replace(/^🌐\s*正在全网检索.*?\n\n/g, "");
    if (content.includes("<think>")) {
      const parts = content.split("</think>");
      if (parts.length > 1) {
        reasoning = parts[0].replace(/<think>/g, "").trim();
        content = parts.slice(1).join("</think>").trim();
      } else {
        reasoning = content.replace(/<think>/g, "").trim();
        content = "";
      }
    }
    return { reasoning, content };
  };

  const autoCloseSidebarOnMobile = (setCollapsed) => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) setCollapsed(true);
  };

  const selectConversation = async (id, setCollapsed) => {
    autoCloseSidebarOnMobile(setCollapsed);
    activeConvId.value = id;
    try {
      const res = await request.get(
        `/ai/conversations/${id}/messages?t=${Date.now()}&guestId=${encodeURIComponent(getGuestId())}`
      );
      if (res && res.data) {
        messages.value = res.data.map((m) => {
          if (m.role === "model") {
            const { reasoning, content } = parseMessageContent(m.content);
            let weather = null;
            try {
              const meta = typeof m.meta === "string" ? JSON.parse(m.meta) : m.meta;
              if (meta && meta.weather) weather = meta.weather;
            } catch (_) {
              weather = null;
            }
            return reactive({
              role: "model", reasoning, displayedReasoning: reasoning,
              content, displayedContent: content,
              isThinking: false, thinkingTime: 1, thinkingCollapsed: true,
              weather,
            });
          }
          return reactive({ role: "user", content: m.content });
        });
        scrollToBottom(true);
      }
    } catch (err) {
      console.error("获取消息失败:", err);
    }
  };

  const stopGeneration = () => {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }
    isGenerating.value = false;
    latestChunk.value = "";
  };

  // 思考过程面板：展开 / 收起切换
  const toggleThinking = (msg) => {
    if (!msg) return;
    msg.thinkingCollapsed = !msg.thinkingCollapsed;
  };

  const startNewChat = (setCollapsed) => {
    autoCloseSidebarOnMobile(setCollapsed);
    stopGeneration();
    activeConvId.value = null;
    messages.value = [];
    clearInput();
  };

  const deleteConv = async (id) => {
    try {
      await request.delete(
        `/ai/conversations/${id}?guestId=${encodeURIComponent(getGuestId())}`
      );
      ElMessage.success("已删除对话");
      if (activeConvId.value === id) {
        activeConvId.value = null;
        messages.value = [];
        clearInput();
      }
      await fetchConversations();
    } catch (err) {
      ElMessage.error("删除失败");
    }
  };

  const confirmDelete = (id) => {
    ElMessageBox.confirm("删除后不可恢复，确定要继续吗？", "删除对话", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
      confirmButtonClass: "el-button--danger",
    })
      .then(() => deleteConv(id))
      .catch(() => {});
  };

  // 输入框自适应高度
  const autoGrow = (e) => {
    const el = e ? e.target : textareaRef.value;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };
  const resetTextareaHeight = () => {
    nextTick(() => {
      if (textareaRef.value) textareaRef.value.style.height = "auto";
    });
  };
  const clearInput = () => {
    inputQuery.value = "";
    resetTextareaHeight();
  };

  const sendPreset = (text) => {
    inputQuery.value = text;
    nextTick(() => {
      autoGrow();
      handleSendMessage();
    });
  };

  let lastSendTriggerTime = 0;
  const triggerSendOrStop = () => {
    const now = Date.now();
    if (now - lastSendTriggerTime < 200) return;
    lastSendTriggerTime = now;
    if (isGenerating.value) stopGeneration();
    else if (inputQuery.value.trim()) handleSendMessage();
  };
  const onSendClick = () => triggerSendOrStop();
  const onSendTouch = () => triggerSendOrStop();
  const handleKeydownEnter = (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    triggerSendOrStop();
  };

  const handleSendMessage = async () => {
    const query = inputQuery.value.trim();
    if (!query || isGenerating.value) return;

    // 游客额度校验
    if (!isLoggedIn.value) {
      if (quota.used() >= GUEST_AI_LIMIT) {
        ElMessageBox.confirm(
          `未登录用户最多支持免费体验 ${GUEST_AI_LIMIT} 次 AI 提问，请前往登录后解锁无限对话！`,
          "体验次数超限",
          {
            confirmButtonText: "前往登录",
            cancelButtonText: "暂不登录",
            type: "warning",
            confirmButtonClass: "el-button--primary",
          }
        )
          .then(() => router.push("/login"))
          .catch(() => {});
        return;
      }
      quota.consume();
    }

    // 历史上下文
    const history = messages.value.slice(-6).map((m) => ({
      role: m.role,
      content: m.role === "model" ? (m.content || m.displayedContent || "") : m.content,
    }));

    // 用户消息上屏
    messages.value.push(reactive({ role: "user", content: query }));
    inputQuery.value = "";
    resetTextareaHeight();
    isGenerating.value = true;
    latestChunk.value = "";
    showScrollArrow.value = false;
    scrollToBottom(true);

    const modelMsg = reactive({
      role: "model", reasoning: "", displayedReasoning: "",
      content: "", displayedContent: "",
      searchStatus: isWebSearch.value ? "searching" : null,
      searchTitle: isWebSearch.value ? "正在全网检索最新信息…" : "",
      isThinking: true, thinkingTime: 0,
      thinkingCollapsed: false, inThinkTag: false,
    });
    messages.value.push(modelMsg);

    const thinkingTimer = setInterval(() => {
      if (modelMsg.isThinking) modelMsg.thinkingTime++;
    }, 1000);

    startTypewriterLoop();
    abortController.value = new AbortController();
    let streamError = "";

    const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
    const streamUrl = apiBase.endsWith("/api") ? `${apiBase}/ai/chat/stream` : `${apiBase}/api/ai/chat/stream`;

    try {
      const response = await fetch(streamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader() },
        body: JSON.stringify({
          conversationId: activeConvId.value,
          message: query,
          history,
          guestId: getGuestId(),
          webSearch: isWebSearch.value,
        }),
        signal: abortController.value.signal,
      });

      if (!response.ok) {
        let errMsg = `响应异常 (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.message) errMsg = errJson.message;
        } catch {}
        throw new Error(errMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          const clean = line.trim();
          if (!clean) continue;
          if (clean === "data: [DONE]") break;
          if (clean.startsWith("data: ")) {
            try {
              const data = JSON.parse(clean.slice(6));
              if (data.conversationId) activeConvId.value = data.conversationId;
              if (data.error) { streamError = data.error; break; }

              if (data.searchStatus) {
                modelMsg.searchStatus = data.searchStatus;
                if (data.searchTitle) modelMsg.searchTitle = data.searchTitle;
              }

              if (data.weather) {
                modelMsg.weather = data.weather;
              }

              if (data.reasoning) {
                modelMsg.isThinking = true;
                modelMsg.reasoning += data.reasoning;
                startTypewriterLoop();
              }

              if (data.text) {
                if (modelMsg.searchStatus === "searching") {
                  modelMsg.searchStatus = "completed";
                }
                let textChunk = data.text;
                if (textChunk.includes("<think>")) {
                  modelMsg.isThinking = true;
                  modelMsg.inThinkTag = true;
                  const parts = textChunk.split("<think>");
                  if (parts[0]) modelMsg.content += parts[0];
                  if (parts[1].includes("</think>")) {
                    const subParts = parts[1].split("</think>");
                    modelMsg.reasoning += subParts[0];
                    modelMsg.content += subParts.slice(1).join("</think>");
                    modelMsg.inThinkTag = false;
                    modelMsg.isThinking = false;
                  } else {
                    modelMsg.reasoning += parts[1];
                  }
                } else if (modelMsg.inThinkTag) {
                  if (textChunk.includes("</think>")) {
                    const parts = textChunk.split("</think>");
                    modelMsg.reasoning += parts[0];
                    modelMsg.content += parts.slice(1).join("</think>");
                    modelMsg.inThinkTag = false;
                    modelMsg.isThinking = false;
                  } else {
                    modelMsg.reasoning += textChunk;
                  }
                } else {
                  if (modelMsg.reasoning && modelMsg.isThinking) {
                    modelMsg.isThinking = false;
                  }
                  modelMsg.content += textChunk;
                }
                startTypewriterLoop();
              }
            } catch (e) {}
          }
        }
        if (streamError) break;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        streamError = "";
      } else {
        streamError = streamError || err.message || "AI 推理超时";
      }
    } finally {
      clearInterval(thinkingTimer);
      modelMsg.isThinking = false;
      if (modelMsg.searchStatus === "searching") {
        modelMsg.searchStatus = "completed";
      }
      isGenerating.value = false;
      abortController.value = null;

      if (streamError) {
        if (!modelMsg.content && !modelMsg.reasoning) {
          modelMsg.content = `⚠️ ${streamError}`;
          modelMsg.displayedContent = modelMsg.content;
        }
        ElMessage.error(streamError);
      } else if (!modelMsg.content && !modelMsg.reasoning) {
        const idx = messages.value.indexOf(modelMsg);
        if (idx > -1) messages.value.splice(idx, 1);
      }

      modelMsg.displayedReasoning = modelMsg.reasoning;
      modelMsg.displayedContent = modelMsg.content;

      scrollToBottom(true);
      fetchConversations();
    }
  };

  return {
    // 状态
    conversations, activeConvId, messages, inputQuery, isGenerating,
    isLoggedIn, viewportRef, textareaRef,
    quota,
    // 会话
    fetchConversations, selectConversation, startNewChat,
    confirmDelete, formatTime,
    // 滚动
    showScrollArrow, handleScroll, scrollToBottomSmooth,
    // 输入 / 发送
    autoGrow, sendPreset, onSendClick, onSendTouch,
    handleKeydownEnter, stopGeneration,
    // 联网
    isWebSearch, toggleWebSearch: () => { isWebSearch.value = !isWebSearch.value; },
    // 思考过程
    toggleThinking,
    // 渲染
    getMsgHtml,
  };
}
