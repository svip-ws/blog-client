import { ref, reactive } from "vue";
import {
  getActiveMessages, createMessage, likeMessage, replyMessage, getLikedStatus, deleteMyMessage,
} from "../api/message";
import { ElMessage, ElMessageBox } from "element-plus";

const FALLBACK_AVATAR = "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png";
const TEMP_PREFIX = "temp-";
const isTempId = (id) => id === null || id === undefined || String(id).startsWith(TEMP_PREFIX);

// 把后端返回的留言统一成视图结构（回复走同一套字段，避免两处不一致）
function normalizeMessage(item, likedSet = new Set()) {
  const id = item.id ?? `${TEMP_PREFIX}${Date.now()}`;
  return {
    id,
    nickname: item.nickname || item.user_name || "初音骑士",
    content: item.content || "",
    avatar: item.avatar || "",
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || "",
    likes: typeof item.likes === "number" ? item.likes : (item.likes_count || 0),
    isLiked: likedSet.has(item.id) || !!item.isLiked,
    is_featured: !!item.is_featured,
    image_url: item.image_url || "",
    user_id: item.user_id ?? null,
    replies: (item.replies || []).map((r) => normalizeReply(r)),
  };
}

function normalizeReply(r) {
  return {
    id: r.id ?? `${TEMP_PREFIX}reply-${Date.now()}`,
    nickname: r.nickname || "初音骑士",
    content: r.content || "",
    created_at: r.created_at || new Date().toISOString(),
  };
}

/**
 * 留言板：列表加载、点赞、回复、发新留言
 * @param {object} userStore 用户 store（取默认头像）
 */
export function useMessageBoard(userStore) {
  const messageList = ref([]);
  const newMsgForm = reactive({ nickname: "", content: "" });
  const showSendModal = ref(false);
  const activeReplyTarget = ref(null);
  const replyFormContent = ref("");
  const likePending = new Set();

  const handleLike = async (msg) => {
    // 未落库的临时留言不能点赞（后端没有这个 id）
    if (isTempId(msg.id)) return;
    if (likePending.has(msg.id)) return; // 防连点重复 toggle
    likePending.add(msg.id);
    try {
      const res = await likeMessage(msg.id);
      if (res && res.data) {
        msg.isLiked = !!res.data.liked;
        msg.likes = typeof res.data.likes === "number" ? res.data.likes : msg.likes;
      }
    } catch (e) {
      console.error("点赞留言失败:", e);
    } finally {
      likePending.delete(msg.id);
    }
  };

  const openSendModal = () => { showSendModal.value = true; };

  const submitNewMessage = async () => {
    if (!newMsgForm.content.trim()) return;
    const nickname = newMsgForm.nickname.trim() || "初音骑士39号";
    const content = newMsgForm.content.trim();

    // 乐观插入：先占位，标一个临时 id；失败会整体撤回
    const tempId = `${TEMP_PREFIX}${Date.now()}`;
    messageList.value.unshift({
      id: tempId,
      nickname,
      content,
      avatar: userStore?.userInfo?.avatar_url || userStore?.userInfo?.avatar || FALLBACK_AVATAR,
      created_at: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      is_featured: false,
      replies: [],
    });

    const rollback = () => {
      const idx = messageList.value.findIndex((m) => m.id === tempId);
      if (idx > -1) messageList.value.splice(idx, 1);
    };

    try {
      const res = await createMessage({ nickname, content });
      const saved = res?.data;
      const pendingReview = !!saved && Number(saved.status) === 2;
      if (saved && saved.id) {
        const idx = messageList.value.findIndex((m) => m.id === tempId);
        if (idx > -1) {
          // 待审核的留言按规则不展示在墙上，直接撤掉占位项
          if (pendingReview) messageList.value.splice(idx, 1);
          else messageList.value.splice(idx, 1, normalizeMessage(saved));
        }
      } else {
        // 后端没回对象时以服务端为准重新拉取，避免留下脏的临时项
        rollback();
        await loadMessages();
      }

      newMsgForm.nickname = "";
      newMsgForm.content = "";
      showSendModal.value = false;
      if (pendingReview) {
        ElMessage.success("留言已提交，审核通过后就会出现在墙上 ✦");
      } else {
        ElMessage.success("♪ 告白发射成功！已经展示在留言墙上啦！");
      }
      return true;
    } catch (err) {
      // 失败提示已由 request 拦截器统一弹出，这里只负责撤回界面上的假数据
      rollback();
      console.error("发表留言失败:", err);
      return false;
    }
  };

  const openReplyModal = (msg) => {
    activeReplyTarget.value = msg;
    replyFormContent.value = "";
  };

  const submitReply = async () => {
    if (!replyFormContent.value.trim() || !activeReplyTarget.value) return;
    const target = activeReplyTarget.value;
    if (isTempId(target.id)) {
      ElMessage.warning("这条留言还没保存成功，请稍后再回复");
      return;
    }

    const content = replyFormContent.value.trim();
    const tempId = `${TEMP_PREFIX}reply-${Date.now()}`;
    if (!target.replies) target.replies = [];
    target.replies.push({ id: tempId, nickname: "初音骑士", content, created_at: new Date().toISOString() });

    try {
      const res = await replyMessage(target.id, { content });
      const idx = target.replies.findIndex((r) => r.id === tempId);
      if (res?.data && idx > -1) {
        target.replies.splice(idx, 1, normalizeReply(res.data));
      }
      activeReplyTarget.value = null;
      replyFormContent.value = "";
      ElMessage.success("回复成功");
      return true;
    } catch (e) {
      const idx = target.replies.findIndex((r) => r.id === tempId);
      if (idx > -1) target.replies.splice(idx, 1);
      console.error("回复留言失败:", e);
      return false;
    }
  };

  // 加载后端留言，返回原始数据（供视图做气泡等衍生展示）
  async function loadMessages() {
    try {
      const [msgRes, likedRes] = await Promise.all([
        getActiveMessages(),
        getLikedStatus().catch(() => ({ data: { likedIds: [] } })),
      ]);
      const likedSet = new Set(likedRes?.data?.likedIds || []);
      const rows = Array.isArray(msgRes?.data) ? msgRes.data : [];

      // 空数组也要覆盖：后端没有留言就是没有，不再保留本地预置数据
      messageList.value = rows.map((item) => normalizeMessage(item, likedSet));
      return rows;
    } catch (e) {
      console.error("加载留言板异常:", e);
      messageList.value = [];
      return null;
    }
  }

  // 是否为当前登录用户自己发的留言
  const isOwnMessage = (msg) => {
    const uid = userStore?.userInfo?.id;
    return !!uid && !!msg && msg.user_id === uid;
  };

  // 删除自己发表的留言（后端会校验归属，前端只做入口控制）
  const removeMyMessage = async (msg) => {
    if (!isOwnMessage(msg)) {
      ElMessage.warning("只能删除自己发表的留言");
      return false;
    }
    try {
      await ElMessageBox.confirm("确认删除这条留言吗？删除后无法恢复。", "提示", { type: "warning" });
    } catch (_) {
      return false;
    }
    try {
      await deleteMyMessage(msg.id);
      const idx = messageList.value.findIndex((m) => m.id === msg.id);
      if (idx > -1) messageList.value.splice(idx, 1);
      ElMessage.success("留言已删除");
      return true;
    } catch (e) {
      return false;
    }
  };

  return {
    messageList, newMsgForm, showSendModal,
    activeReplyTarget, replyFormContent,
    handleLike, openSendModal, submitNewMessage,
    openReplyModal, submitReply, loadMessages,
    isOwnMessage, removeMyMessage,
  };
}
