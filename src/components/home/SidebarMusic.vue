<template>
    <div
        ref="cardRef"
        class="music-player-card glass-miku-card sidebar-music-cyber"
        :style="card3DStyle"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
    >
        <!-- 粒子爆炸 Canvas -->
        <canvas ref="particleCanvas" class="particle-canvas"></canvas>

        <!-- 音频由全局 music store 持有，路由切换不断曲 -->

        <!-- 4K 壁纸全息背景遮罩 -->
        <div class="card-holo-bg">
            <img src="/images/miku/miku_wp_11.jpg" class="holo-img" alt="Holo BG" loading="lazy" decoding="async" />
            <div class="holo-scanlines"></div>
            <div class="holo-mask"></div>
        </div>

        <!-- Q版初音立绘与对话框 -->
        <div class="music-chibi-mascot" @click="triggerMascotTalk">
            <div class="speech-bubble" v-if="mascotSpeech">
                <span>{{ mascotSpeech }}</span>
            </div>
            <img
                src="/images/miku/miku_chibi_main.png"
                alt="Miku Music Mascot"
                class="chibi-img"
                :class="{ 'dancing': isPlaying }"
            />
        </div>

        <!-- 播放器头部信息（带有管理端联动标识） -->
        <div class="player-header">
            <div class="header-left">
                <div class="header-disc-box">
                    <span class="header-icon-disc" :class="{ 'spinning': isPlaying }"></span>
                    <span class="disc-glow"></span>
                </div>
                <div class="title-group">
                    <span class="header-title">初音唱片机</span>
                </div>
            </div>
            <div class="header-right">
                <span class="admin-link-badge" title="曲目总数">
                    {{ playlist.length }} 首曲目
                </span>
            </div>
        </div>

        <!-- 3D 黑胶唱片机主体与唱针 -->
        <div class="vinyl-turntable-container">
            <div class="vinyl-record-box" :class="{ 'playing': isPlaying }">
                <div class="vinyl-disk">
                    <div class="disk-grooves"></div>
                    <div class="disk-center-label">
                        <img
                            :src="currentSong.cover || '/images/miku/miku_wp_1.jpg'"
                            class="cover-img"
                            alt="Song Cover"
                            @error="(e) => { e.target.onerror = null; e.target.src = '/images/miku/miku_wp_1.jpg'; }"
                        />
                        <span class="center-hole"></span>
                    </div>
                </div>
                <div class="vinyl-glow-ring"></div>

                <!-- 飘出的浮动音符 (播放时触发) -->
                <div class="floating-notes-container" v-if="isPlaying">
                    <span class="f-note n1">♪</span>
                    <span class="f-note n2">♫</span>
                    <span class="f-note n3">♩</span>
                    <span class="f-note n4">♬</span>
                </div>
            </div>

            <!-- 唱片机唱针 (Tonearm) -->
            <div class="vinyl-tonearm-box" :class="{ 'arm-on-record': isPlaying }">
                <div class="tonearm-pivot"></div>
                <div class="tonearm-arm"></div>
                <div class="tonearm-head"></div>
            </div>

            <!-- 右侧歌曲信息与操作区 -->
            <div class="turntable-meta">
                <h4 class="song-title" :title="currentSong.title">{{ currentSong.title }}</h4>
                <p class="song-artist">
                    <span class="artist-name">♪ {{ currentSong.artist }}</span>
                    <span class="album-tag" v-if="currentSong.album">「{{ currentSong.album }}」</span>
                </p>
                <div class="song-time-display">
                    <span class="time-current">{{ formatTime(currentTime) }}</span>
                    <span class="time-sep">/</span>
                    <span class="time-total">{{ formatTime(effectiveDuration) }}</span>
                    <span class="synth-chip" v-if="useSynth" title="原生音频异常，已开启 Web Audio 合成器兜底">
                        合成音源 ⚡
                    </span>
                </div>
            </div>
        </div>

        <!-- 播放控制工具栏 -->
        <div class="player-controls-bar">
            <!-- 模式切换按钮 (单曲 / 列表 / 随机) -->
            <button class="ctrl-btn sub-btn tactile-btn" @click="togglePlayMode" :title="playModeTitle">
                <span class="mode-icon">{{ playModeIcon }}</span>
            </button>

            <!-- 上一首 -->
            <button class="ctrl-btn prev-btn tactile-btn" @click="prevSong" title="上一首">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
            </button>

            <!-- 主播放/暂停 -->
            <button
                class="ctrl-btn main-play-btn tactile-btn"
                :class="{ 'is-playing': isPlaying }"
                @click="onPlayButtonClick($event)"
                :title="isPlaying ? '暂停' : '播放'"
            >
                <svg v-if="!isPlaying" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
            </button>

            <!-- 下一首 -->
            <button class="ctrl-btn next-btn tactile-btn" @click="nextSong" title="下一首">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
            </button>

            <!-- 打开管理端歌单弹窗抽屉 -->
            <button class="ctrl-btn sub-btn playlist-btn tactile-btn" @click="togglePlaylistDrawer" title="展开歌单列表 (管理端可同步编辑)">
                <span class="playlist-icon">📜</span>
            </button>
        </div>

        <!-- 进度条 -->
        <div class="player-progress-bar" @click="seek">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }">
                <span class="progress-thumb"></span>
            </div>
        </div>

        <!-- 歌单快速选择抽屉弹窗 (抽屉滑动展示 admin/music 最新曲目) -->
        <div class="playlist-drawer" :class="{ 'open': drawerOpen }">
            <div class="drawer-header">
                <span class="drawer-title">播放列表 ({{ playlist.length }})</span>
                <button class="drawer-close" @click="drawerOpen = false">✕</button>
            </div>
            <div class="drawer-list">
                <div
                    v-for="(song, idx) in playlist"
                    :key="song.id || idx"
                    class="drawer-item tactile-btn"
                    :class="{ 'active': idx === currentIndex }"
                    @click="selectSong(idx)"
                >
                    <span class="item-num">{{ String(idx + 1).padStart(2, '0') }}</span>
                    <div class="item-info">
                        <span class="item-title">{{ song.title }}</span>
                        <span class="item-artist">{{ song.artist || '初音ミク' }}</span>
                    </div>
                    <span class="item-playing-icon" v-if="idx === currentIndex && isPlaying">▶</span>
                    <span class="item-duration">{{ song.duration_str || song.durationStr || '02:27' }}</span>
                </div>
            </div>
        </div>

        <!-- 底部 Cyber 音响频谱条 -->
        <div class="cyber-spectrum-bar" :class="{ 'paused': !isPlaying }">
            <div
                v-for="i in 8"
                :key="i"
                class="spectrum-column"
                :style="{ animationDuration: (0.5 + (i % 4) * 0.15) + 's' }"
            ></div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useMusicStore } from '../../stores/music';

// 全站单实例播放器（audio 由 store 持有，路由切换不断曲）
const music = useMusicStore();
const {
    playlist, currentIndex, currentSong, isPlaying, currentTime,
    effectiveDuration, progressPercent, playModeIcon, playModeTitle, useSynth,
} = storeToRefs(music);
const {
    togglePlay, seek, formatTime, loadPlaylist,
    togglePlayMode: storeTogglePlayMode,
    nextSong: storeNextSong,
    prevSong: storePrevSong,
    selectSong: storeSelectSong,
} = music;

const drawerOpen = ref(false);

const togglePlayMode = () => {
    storeTogglePlayMode();
    mascotSpeech.value = `切换模式：${playModeTitle.value} ♪`;
};

// 3D 倾斜
const cardRef = ref(null);
const tiltX = ref(0);
const tiltY = ref(0);

let musicTiltRaf = null;
const handleMouseMove = (e) => {
    if (!cardRef.value || musicTiltRaf) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    musicTiltRaf = requestAnimationFrame(() => {
        musicTiltRaf = null;
        if (!cardRef.value) return;
        const rect = cardRef.value.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        tiltX.value = ((y - centerY) / centerY) * -5;
        tiltY.value = ((x - centerX) / centerX) * 5;
    });
};

const handleMouseLeave = () => {
    if (musicTiltRaf) {
        cancelAnimationFrame(musicTiltRaf);
        musicTiltRaf = null;
    }
    tiltX.value = 0;
    tiltY.value = 0;
};

const card3DStyle = computed(() => {
    return {
        transform: `perspective(1000px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg) translateZ(0)`,
        transition: tiltX.value === 0 && tiltY.value === 0 ? 'transform 0.5s ease' : 'none'
    };
});

// Q版立绘对话
const mascotSpeech = ref('欢迎收听初音音乐台 ♪');
const speechList = [
    '正在为你播放精选旋律 ♪',
    '享受音乐，让旋律伴你阅读 ♪',
    '随时点击歌单挑选喜爱的歌曲',
    '音符正在随心律动 ♪'
];

const triggerMascotTalk = () => {
    const randomText = speechList[Math.floor(Math.random() * speechList.length)];
    mascotSpeech.value = randomText;
};

// 粒子爆炸
const particleCanvas = ref(null);
const onPlayButtonClick = (e) => {
    createParticles(e);
    togglePlay();
    mascotSpeech.value = isPlaying.value
        ? `正在播放：《${currentSong.value.title}》🎵`
        : '唱片针已升起，暂停中... ☕';
};

const createParticles = (e) => {
    if (!particleCanvas.value || !cardRef.value) return;
    const canvas = particleCanvas.value;
    const ctx = canvas.getContext('2d');
    const rect = cardRef.value.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const colors = ['#39C5BB', '#FF7E9D', '#00F3FF', '#FFE600', '#FFFFFF'];
    const particles = [];
    
    for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push({
            x: clickX,
            y: clickY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            life: Math.random() * 20 + 20
        });
    }
    
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            if (p.alpha > 0) {
                alive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 1 / p.life;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        if (alive) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
    animate();
};

// 切歌 / 播放（保留吉祥物语音提示）
const nextSong = () => {
    storeNextSong();
    mascotSpeech.value = `切歌成功！《${currentSong.value.title}》✨`;
};

const prevSong = () => {
    storePrevSong();
    mascotSpeech.value = `上一首：《${currentSong.value.title}》✨`;
};

const selectSong = (idx) => {
    storeSelectSong(idx);
    drawerOpen.value = false;
    mascotSpeech.value = `已为你切至：《${currentSong.value.title}》🎵`;
};

const togglePlaylistDrawer = () => {
    drawerOpen.value = !drawerOpen.value;
};

onMounted(async () => {
    await loadPlaylist();
    mascotSpeech.value = playlist.value.length
        ? `成功调取管理端 ${playlist.value.length} 首歌单曲目！🎵`
        : '使用本地兜底歌单 ♪';
});
</script>

<style scoped>
.sidebar-music-cyber {
    position: relative;
    padding: 18px 20px 22px;
    margin-bottom: 22px;
    border-radius: 24px;
    background: linear-gradient(145deg, rgba(13, 86, 82, 0.94) 0%, rgba(16, 114, 108, 0.92) 52%, rgba(12, 68, 74, 0.96) 100%);
    border: none;
    box-shadow: 0 14px 36px rgba(18, 128, 120, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.22);
    color: #FFFFFF;
    overflow: hidden;
    transform-style: preserve-3d;
}

.particle-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 10;
}

/* 4K 全息壁纸背景 */
.card-holo-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
}

.holo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.22;
    filter: saturate(1.4) contrast(1.1);
}

.holo-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
        0deg,
        rgba(57, 197, 187, 0.05),
        rgba(57, 197, 187, 0.05) 1px,
        transparent 1px,
        transparent 4px
    );
}

.holo-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(155deg, rgba(12, 82, 78, 0.78) 0%, rgba(10, 62, 66, 0.86) 100%);
}

/* HUD 边角装饰 */
.hud-corner {
    position: absolute;
    font-family: monospace;
    font-size: 14px;
    font-weight: 900;
    color: rgba(57, 197, 187, 0.6);
    pointer-events: none;
    z-index: 3;
    line-height: 1;
}
.top-left { top: 6px; left: 8px; }
.top-right { top: 6px; right: 8px; }
.bottom-left { bottom: 6px; left: 8px; }
.bottom-right { bottom: 6px; right: 8px; }

/* Q版吉祥物 */
.music-chibi-mascot {
    position: absolute;
    top: 2px;
    right: 8px;
    z-index: 4;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.chibi-img {
    width: 46px;
    height: 46px;
    object-fit: contain;
    filter: none;
    transition: transform 0.2s ease;
}

.chibi-img.dancing {
    animation: mikuDance 1.2s ease-in-out infinite alternate;
}

@keyframes mikuDance {
    0% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-6px) rotate(-6deg); }
    100% { transform: translateY(-2px) rotate(6deg); }
}

.speech-bubble {
    position: absolute;
    bottom: 48px;
    right: 0;
    white-space: nowrap;
    background: linear-gradient(135deg, #0E2926, #1C4D46);
    color: #00F3FF;
    font-size: 10.5px;
    font-weight: 800;
    padding: 5px 10px;
    border-radius: 12px;
    border: 1px solid #39C5BB;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    animation: bubblePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: none;
}

.speech-bubble::after {
    content: '';
    position: absolute;
    bottom: -5px;
    right: 18px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid #1C4D46;
}

@keyframes bubblePop {
    from { opacity: 0; transform: scale(0.6) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

/* 头部 */
.player-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 50px 10px 0;
    margin-bottom: 12px;
    border-bottom: 1.5px dashed rgba(57, 197, 187, 0.35);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-disc-box {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-icon-disc {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px dashed #39C5BB;
}

.header-icon-disc.spinning {
    animation: vinylSpin 6s linear infinite;
}

.disc-glow {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(57, 197, 187, 0.4), transparent);
}

@keyframes vinylSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.title-group {
    display: flex;
    flex-direction: column;
}

.header-title {
    font-size: 14.5px;
    font-weight: 900;
    color: #FFFFFF;
    letter-spacing: 0.5px;
}

.header-sub {
    font-family: 'Audiowide', sans-serif;
    font-size: 8px;
    font-weight: 800;
    color: #39C5BB;
    letter-spacing: 1px;
}

.admin-link-badge {
    font-family: 'Audiowide', monospace;
    font-size: 8.5px;
    font-weight: 800;
    color: #00F3FF;
    background: rgba(0, 243, 255, 0.12);
    padding: 2px 7px;
    border-radius: 6px;
    border: 1px solid rgba(0, 243, 255, 0.3);
}

/* 3D 黑胶唱片机与唱针主体 */
.vinyl-turntable-container {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
    background: rgba(255, 255, 255, 0.10);
    padding: 12px;
    border-radius: 18px;
    border: 1px solid rgba(123, 227, 218, 0.32);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* 唱片黑胶盘 */
.vinyl-record-box {
    position: relative;
    width: 72px;
    height: 72px;
    flex-shrink: 0;
}

.vinyl-disk {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, #222 0%, #000 65%, #111 100%);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(57, 197, 187, 0.3);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: transform 0.5s ease;
}

.playing .vinyl-disk {
    animation: vinylSpin 8s linear infinite;
}

.disk-grooves {
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    border: 1px dashed rgba(255, 255, 255, 0.15);
    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.05);
}

.disk-center-label {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    overflow: hidden;
    position: relative;
    border: 2px solid #39C5BB;
}

.cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.center-hole {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #000000;
    border: 1px solid rgba(255, 255, 255, 0.6);
}

.vinyl-glow-ring {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(57, 197, 187, 0.3), transparent 70%);
    pointer-events: none;
}

/* 飘出音符 */
.floating-notes-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.f-note {
    position: absolute;
    font-size: 13px;
    animation: floatNote 2s ease-out infinite;
    opacity: 0;
}
.n1 { top: 0; left: 10px; animation-delay: 0s; color: #39C5BB; }
.n2 { top: 10px; right: 0; animation-delay: 0.5s; color: #FF7E9D; }
.n3 { bottom: 0; left: 20px; animation-delay: 1s; color: #00F3FF; }
.n4 { top: -10px; left: 30px; animation-delay: 1.5s; color: #FFE600; }

@keyframes floatNote {
    0% { transform: translateY(0) scale(0.6); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(-24px) scale(1.2); opacity: 0; }
}

/* 唱头 */
.vinyl-tonearm-box {
    position: absolute;
    top: 6px;
    left: 64px;
    width: 32px;
    height: 50px;
    pointer-events: none;
    z-index: 5;
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform-origin: 26px 6px;
    transform: rotate(-32deg);
}

.vinyl-tonearm-box.arm-on-record {
    transform: rotate(0deg);
}

.tonearm-pivot {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #39C5BB;
    box-shadow: 0 0 6px #39C5BB;
}

.tonearm-arm {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 2px;
    height: 38px;
    background: linear-gradient(180deg, #FFFFFF 0%, #39C5BB 100%);
    transform: rotate(15deg);
    transform-origin: top center;
}

.tonearm-head {
    position: absolute;
    bottom: 4px;
    left: 4px;
    width: 7px;
    height: 10px;
    background: #FF7E9D;
    border-radius: 2px;
}

/* 歌曲元数据 */
.turntable-meta {
    flex: 1;
    min-width: 0;
}

.song-title {
    font-size: 14px;
    font-weight: 800;
    color: #FFFFFF;
    margin: 0 0 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.song-artist {
    font-size: 11.5px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 6px;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.artist-name {
    font-weight: 700;
    color: #39C5BB;
}

.album-tag {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.55);
}

.song-time-display {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: 'Audiowide', monospace;
    font-size: 11px;
    color: #39C5BB;
}

.time-sep {
    color: rgba(255, 255, 255, 0.3);
}

.time-total {
    color: rgba(255, 255, 255, 0.6);
}

.synth-chip {
    font-size: 8px;
    color: #FF7E9D;
    background: rgba(255, 126, 157, 0.18);
    padding: 1px 4px;
    border-radius: 4px;
    border: 1px solid rgba(255, 126, 157, 0.3);
    margin-left: 4px;
}

/* 控制按钮栏 */
.player-controls-bar {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.ctrl-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.sub-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: rgba(57, 197, 187, 0.12);
    border: 1px solid rgba(57, 197, 187, 0.25);
    color: #39C5BB;
    font-size: 14px;
}

.sub-btn:hover {
    background: rgba(57, 197, 187, 0.25);
    transform: scale(1.08);
}

.prev-btn, .next-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
}

.prev-btn:hover, .next-btn:hover {
    background: rgba(57, 197, 187, 0.3);
    color: #39C5BB;
    transform: scale(1.08);
}

.main-play-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #39C5BB 0%, #00687d 100%);
    color: #FFFFFF;
    box-shadow: 0 4px 16px rgba(57, 197, 187, 0.5);
}

.main-play-btn:hover {
    transform: scale(1.12);
    box-shadow: 0 6px 20px rgba(57, 197, 187, 0.7);
}

.main-play-btn.is-playing {
    background: linear-gradient(135deg, #FF7E9D 0%, #FF3366 100%);
    box-shadow: 0 4px 16px rgba(255, 126, 157, 0.6);
}

/* 进度条 */
.player-progress-bar {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 7px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    margin-bottom: 8px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #39C5BB 0%, #00F3FF 50%, #FF7E9D 100%);
    border-radius: 4px;
    position: relative;
    transition: width 0.25s linear;
}

.progress-thumb {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(50%, -50%);
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #FFFFFF;
    box-shadow: 0 0 8px rgba(0, 243, 255, 0.9);
}

/* 歌单抽屉弹窗 */
.playlist-drawer {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: rgba(10, 28, 26, 0.98);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    opacity: 0;
}

.playlist-drawer.open {
    transform: translateY(0);
    pointer-events: auto;
    opacity: 1;
}

.drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    border-bottom: 1px dashed rgba(57, 197, 187, 0.3);
}

.drawer-title {
    font-size: 13px;
    font-weight: 800;
    color: #39C5BB;
}

.drawer-close {
    background: none;
    border: none;
    color: #FF7E9D;
    font-size: 14px;
    font-weight: 900;
    cursor: pointer;
}

.drawer-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.drawer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(57, 197, 187, 0.15);
    cursor: pointer;
    transition: all 0.2s ease;
}

.drawer-item:hover, .drawer-item.active {
    background: rgba(57, 197, 187, 0.2);
    border-color: #39C5BB;
}

.item-num {
    font-family: 'Audiowide', monospace;
    font-size: 11px;
    color: #39C5BB;
    font-weight: 800;
}

.item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.item-title {
    font-size: 12px;
    font-weight: 800;
    color: #FFFFFF;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-artist {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.55);
}

.item-playing-icon {
    font-size: 10px;
    color: #FF7E9D;
}

.item-duration {
    font-family: 'Audiowide', monospace;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.45);
}

/* 底部 Cyber 音强律动条 */
.cyber-spectrum-bar {
    position: relative;
    z-index: 2;
    height: 10px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 2px;
    pointer-events: none;
    opacity: 0.75;
}

.cyber-spectrum-bar.paused .spectrum-column {
    animation-play-state: paused;
    height: 20% !important;
    opacity: 0.3;
}

.spectrum-column {
    flex: 1;
    height: 100%;
    background: linear-gradient(0deg, #39C5BB 0%, #FF7E9D 100%);
    border-radius: 2px;
    animation: spectrumBounce 0.6s ease-in-out infinite alternate;
}

@keyframes spectrumBounce {
    0% { height: 15%; opacity: 0.3; }
    100% { height: 95%; opacity: 0.95; }
}
</style>

