import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getMusicPlaylist } from "../api/music";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

/** 把后端返回的相对音频地址解析成可播放地址 */
export const resolveAudioUrl = (raw) => {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/uploads/")) return API_ORIGIN ? `${API_ORIGIN}${raw}` : raw;
  return raw;
};

const DEFAULT_NOTES = [523.25, 659.25, 783.99, 880.0];

/** 后端不可用时的本地兜底歌单（public/music 下真实文件） */
const FALLBACK_PLAYLIST = [
  {
    id: 1,
    title: "甩葱歌 (Ievan Polkka)",
    artist: "初音ミク",
    album: "Vocaloid Classic",
    duration_sec: 147,
    duration_str: "02:27",
    url: "/music/shuaicong.mp3",
    cover: "/images/miku/miku_wp_1.jpg",
    notes: [659.25, 659.25, 659.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 587.33, 659.25],
  },
  {
    id: 2,
    title: "千本桜 (Senbonzakura)",
    artist: "初音ミク",
    album: "WhiteFlame",
    duration_sec: 244,
    duration_str: "04:04",
    url: "/music/miku_ievan_polkka.mp3",
    cover: "/images/miku/miku_wp_2.jpg",
    notes: [659.25, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25],
  },
  {
    id: 3,
    title: "Tell Your World",
    artist: "初音ミク",
    album: "Livetune",
    duration_sec: 257,
    duration_str: "04:17",
    url: "/music/shuaicong.mp3",
    cover: "/images/miku/miku_wp_3.jpg",
    notes: [783.99, 880.0, 1046.5, 880.0, 783.99, 659.25, 587.33, 659.25],
  },
  {
    id: 4,
    title: "メルト (Melt)",
    artist: "初音ミク",
    album: "ryo (supercell)",
    duration_sec: 315,
    duration_str: "05:15",
    url: "/music/miku_ievan_polkka.mp3",
    cover: "/images/miku/miku_wp_4.jpg",
    notes: [523.25, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25, 587.33],
  },
];

/**
 * 全站单实例音乐播放器。
 * audio 元素由 store 持有（不进任何页面 DOM），因此路由切换时音乐不会中断。
 */
export const useMusicStore = defineStore("music", () => {
  // ---------- 状态 ----------
  const playlist = ref([]); // 原始后端数据（保留 play_url/cover_url 等字段）
  const currentIndex = ref(0);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const playMode = ref(0); // 0 列表循环 / 1 单曲循环 / 2 随机播放
  const useSynth = ref(false);
  const isLoaded = ref(false);
  const isLoading = ref(false);
  const isMetaReady = ref(false);

  // ---------- 非响应式内部资源（单例） ----------
  let audio = null;
  let audioCtx = null;
  let synthTimer = null;
  let synthTickTimer = null;
  let noteStep = 0;
  let watchdogTimer = null;

  // ---------- 派生 ----------
  const normalizeSong = (song = {}) => ({
    id: song.id,
    title: song.title || song.name || "初音未来神曲",
    artist: song.artist || song.singer || "初音ミク",
    album: song.album || "Vocaloid Stage",
    durationSec: Number(song.duration_sec ?? song.durationSec ?? 0) || 0,
    durationStr: song.duration_str || song.durationStr || "",
    // 播放地址优先用后端签名的 play_url，其次兼容历史字段
    url: song.play_url || song.url || song.music_url || song.file_url || song.src || "",
    cover: song.cover_url || song.cover || "",
    notes: Array.isArray(song.notes) ? song.notes : null,
  });

  const currentSong = computed(() => {
    if (!playlist.value.length) return normalizeSong(FALLBACK_PLAYLIST[0]);
    return normalizeSong(playlist.value[currentIndex.value] || playlist.value[0]);
  });

  const currentSongUrl = computed(() => resolveAudioUrl(currentSong.value.url));

  const effectiveDuration = computed(() => {
    if (duration.value > 0 && isFinite(duration.value)) return duration.value;
    return currentSong.value.durationSec || 147;
  });

  const progressPercent = computed(() => {
    if (!effectiveDuration.value) return 0;
    return Math.min(100, (currentTime.value / effectiveDuration.value) * 100);
  });

  const isShuffle = computed(() => playMode.value === 2);
  const isRepeat = computed(() => playMode.value === 1);

  const playModeIcon = computed(() => {
    if (playMode.value === 1) return "🔂";
    if (playMode.value === 2) return "🔀";
    return "🔁";
  });
  const playModeTitle = computed(() => {
    if (playMode.value === 1) return "单曲循环";
    if (playMode.value === 2) return "随机播放";
    return "列表循环";
  });

  // ---------- 单例 audio ----------
  function getAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = "metadata";

    audio.addEventListener("timeupdate", () => {
      if (!useSynth.value) currentTime.value = Math.floor(audio.currentTime || 0);
    });
    audio.addEventListener("loadedmetadata", () => {
      isMetaReady.value = true;
      if (audio.duration && isFinite(audio.duration)) duration.value = audio.duration;
      delete audio.dataset.switching;
    });
    audio.addEventListener("playing", () => {
      useSynth.value = false;
      isPlaying.value = true;
      delete audio.dataset.switching;
    });
    audio.addEventListener("pause", () => {
      // 切歌/重新加载过程中的短暂 pause 不代表用户暂停
      if (audio.dataset.switching === "1" || audio.ended) return;
      isPlaying.value = false;
    });
    audio.addEventListener("ended", () => onSongEnded());
    audio.addEventListener("error", () => {
      if (isPlaying.value && !useSynth.value) activateSynthFallback();
    });
    return audio;
  }

  /** 确保单例 audio 指向当前曲目（地址变化时才重设，避免重复加载） */
  function syncSource() {
    const a = getAudio();
    const url = currentSongUrl.value;
    if (!url) return a;
    if (a.dataset.songUrl !== url) {
      a.dataset.switching = "1";
      a.dataset.songUrl = url;
      a.src = url;
      currentTime.value = 0;
      duration.value = currentSong.value.durationSec || 0;
      isMetaReady.value = false;
    }
    return a;
  }

  // ---------- Web Audio 合成器兜底（原生音频异常时仍能出声） ----------
  function ensureAudioContext() {
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    } catch (e) {}
    return audioCtx;
  }

  function playSynthNote() {
    const ctx = audioCtx;
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const notes = currentSong.value.notes || DEFAULT_NOTES;
      const freq = notes[noteStep % notes.length];
      noteStep += 1;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    } catch (e) {}
  }

  function startSynthMelody() {
    stopSynth();
    synthTimer = setInterval(() => {
      if (isPlaying.value && useSynth.value) playSynthNote();
    }, 450);
  }

  function stopSynth() {
    if (synthTimer) {
      clearInterval(synthTimer);
      synthTimer = null;
    }
  }

  function startSynthTick() {
    if (synthTickTimer) clearInterval(synthTickTimer);
    synthTickTimer = setInterval(() => {
      if (isPlaying.value && useSynth.value) {
        currentTime.value += 1;
        if (currentTime.value >= effectiveDuration.value) onSongEnded();
      }
    }, 1000);
  }

  function activateSynthFallback() {
    useSynth.value = true;
    ensureAudioContext();
    startSynthMelody();
    startSynthTick();
  }

  function deactivateSynthFallback() {
    if (useSynth.value) {
      useSynth.value = false;
      stopSynth();
      if (synthTickTimer) {
        clearInterval(synthTickTimer);
        synthTickTimer = null;
      }
    }
    clearWatchdog();
  }

  function startWatchdog() {
    clearWatchdog();
    const baseTime = audio ? audio.currentTime : 0;
    watchdogTimer = setTimeout(() => {
      if (!isPlaying.value || useSynth.value) return;
      const a = audio;
      if (!a) return;
      // 只有"标记为播放中但进度没推进 / 报错"才算原生失败，避免切歌加载瞬间误判
      const progressed = a.currentTime > baseTime + 0.3;
      if (a.error || !progressed || a.readyState < 2) activateSynthFallback();
    }, 3500);
  }

  function clearWatchdog() {
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
  }

  // ---------- 播放控制 ----------
  function playCurrent() {
    const a = syncSource();
    if (useSynth.value) {
      startSynthMelody();
      return;
    }
    const p = a.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // play() 被切歌/加载打断是正常现象，延迟确认是否真的无法出声再兜底
        setTimeout(() => {
          if (isPlaying.value && !useSynth.value && audio && (audio.paused || audio.error)) {
            activateSynthFallback();
          }
        }, 1200);
      });
    }
    startWatchdog();
  }

  function pause() {
    isPlaying.value = false;
    clearWatchdog();
    deactivateSynthFallback();
    if (audio) {
      try {
        audio.pause();
      } catch (e) {}
    }
  }

  function togglePlay() {
    if (isPlaying.value) {
      pause();
      return;
    }
    isPlaying.value = true;
    noteStep = 0;
    playCurrent();
  }

  function nextSong() {
    if (!playlist.value.length) return;
    currentIndex.value =
      playMode.value === 2
        ? Math.floor(Math.random() * playlist.value.length)
        : (currentIndex.value + 1) % playlist.value.length;
    currentTime.value = 0;
    if (isPlaying.value) playCurrent();
    else syncSource();
  }

  function prevSong() {
    if (!playlist.value.length) return;
    currentIndex.value =
      playMode.value === 2
        ? Math.floor(Math.random() * playlist.value.length)
        : (currentIndex.value - 1 + playlist.value.length) % playlist.value.length;
    currentTime.value = 0;
    if (isPlaying.value) playCurrent();
    else syncSource();
  }

  function selectSong(index) {
    if (!playlist.value.length) return;
    currentIndex.value = Math.max(0, Math.min(Number(index) || 0, playlist.value.length - 1));
    currentTime.value = 0;
    isPlaying.value = true;
    noteStep = 0;
    playCurrent();
  }

  function onSongEnded() {
    if (playMode.value === 1) {
      // 单曲循环
      currentTime.value = 0;
      if (audio) {
        try {
          audio.currentTime = 0;
        } catch (e) {}
      }
      if (isPlaying.value) playCurrent();
      return;
    }
    nextSong();
  }

  function togglePlayMode() {
    playMode.value = (playMode.value + 1) % 3;
  }

  function toggleShuffle() {
    playMode.value = playMode.value === 2 ? 0 : 2;
  }

  function toggleRepeat() {
    playMode.value = playMode.value === 1 ? 0 : 1;
  }

  function seekRatio(ratio) {
    const r = Math.max(0, Math.min(1, Number(ratio) || 0));
    const target = Math.floor(r * effectiveDuration.value);
    currentTime.value = target;
    if (!useSynth.value && audio && isFinite(audio.duration) && audio.duration > 0) {
      try {
        audio.currentTime = Math.min(target, Math.max(0, audio.duration - 0.2));
      } catch (e) {}
    }
  }

  /** 兼容 messages 页：点击进度区域自动换算比例 */
  function seekProgress(e) {
    if (!e || !e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekRatio(ratio);
  }

  /** 兼容 SidebarMusic：模板直接 @click="seek" */
  function seek(e) {
    seekProgress(e);
  }

  function formatTime(seconds) {
    const s = Number(seconds);
    if (!s || isNaN(s) || s <= 0) return "00:00";
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  // ---------- 数据加载 ----------
  /**
   * 拉取管理端歌单（全局只请求一次，后续页面复用）
   * @param {boolean} force 强制刷新
   */
  async function loadPlaylist(force = false) {
    if (isLoading.value) return playlist.value;
    if (isLoaded.value && !force) return playlist.value;
    isLoading.value = true;
    try {
      const res = await getMusicPlaylist();
      const list = res && Array.isArray(res.data) ? res.data : [];
      if (list.length) {
        playlist.value = list;
        currentIndex.value = 0;
        isLoaded.value = true;
        if (isPlaying.value || audio) syncSource();
        if (isPlaying.value) playCurrent();
      }
    } catch (e) {
      console.warn("获取后端歌单失败，使用本地兜底歌单", e);
    } finally {
      if (!playlist.value.length) playlist.value = FALLBACK_PLAYLIST;
      isLoading.value = false;
    }
    return playlist.value;
  }

  /** 兼容旧接口：外部直接传入歌单数据 */
  function setPlaylist(list) {
    if (!Array.isArray(list) || !list.length) return;
    playlist.value = list;
    currentIndex.value = 0;
    if (isPlaying.value) playCurrent();
    else syncSource();
  }

  // 曲目切换统一由各播放 action 内部 syncSource 处理，不再额外 watch，避免重复 load 打断播放

  return {
    // state
    playlist,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    playMode,
    useSynth,
    isLoaded,
    isLoading,
    isMetaReady,
    // getters
    currentSong,
    currentSongUrl,
    effectiveDuration,
    progressPercent,
    isShuffle,
    isRepeat,
    playModeIcon,
    playModeTitle,
    // actions
    loadPlaylist,
    setPlaylist,
    getAudio,
    togglePlay,
    pause,
    nextSong,
    prevSong,
    selectSong,
    onSongEnded,
    togglePlayMode,
    toggleShuffle,
    toggleRepeat,
    seekRatio,
    seekProgress,
    seek,
    formatTime,
  };
});
