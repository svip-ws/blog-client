<template>
    <div class="sidebar-card glass-miku-card sidebar-calendar-ultimate" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" :style="cardTiltStyle">
        <!-- 4K 壁纸全息背景与扫频光束 -->
        <div class="cal-holo-bg">
            <img src="/images/miku/miku_wp_1.jpg" class="holo-img" alt="Miku Wallpaper" loading="lazy" decoding="async" />
            <div class="holo-scanline"></div>
            <div class="holo-glow-mask"></div>
        </div>

        <!-- 1. 顶部：实时数字钟 + 月份切换 -->
        <div class="cal-hud-header">
            <div class="clock-box">
                <span class="clock-live-dot"></span>
                <span class="clock-time">{{ liveTimeStr }}</span>
            </div>
            
            <div class="month-selector">
                <button class="nav-arrow-btn" @click="prevMonth" title="上个月">‹</button>
                <span class="month-hud-text">{{ headerMonthTitle }}</span>
                <button class="nav-arrow-btn" @click="nextMonth" title="下个月">›</button>
            </div>
        </div>

        <!-- 2. 夸张二次元 Q 版初音 3D 浮动人像与台词 -->
        <div class="miku-hero-stage">
            <div class="chibi-avatar-3d tactile-btn" :class="{ 'is-jumping': isMikuJumping }" @click="triggerMikuAction" title="点击初音爆发粒子舞步！">
                <img src="/images/miku/miku_chibi_main.png" alt="Q版初音" class="miku-chibi-hero" />
                
                <!-- 粒子爆发浮层 -->
                <div v-for="p in particles" :key="p.id" class="pop-particle" :style="p.style">{{ p.char }}</div>
            </div>

            <div class="miku-speech-bubble-cyber">
                <p class="bubble-text">{{ currentQuote }}</p>
            </div>
        </div>

        <!-- 3. 六边形/晶体赛博日历网格 -->
        <div class="cal-days-container">
            <div class="cal-week-row">
                <span v-for="w in ['日','一','二','三','四','五','六']" :key="w" class="week-pill">{{ w }}</span>
            </div>

            <div class="cal-days-grid">
                <div v-for="(item, idx) in daysList" :key="idx"
                    class="day-hex-cell"
                    :class="{
                        'other-month': !item.isCurrentMonth,
                        'is-today': item.isToday,
                        'is-selected': selectedDayStr === item.dateStr,
                        'has-event': item.hasEvent
                    }"
                    @click="onDayClick(item)">
                    <span class="day-num">{{ item.day }}</span>
                    <span v-if="item.isToday" class="today-halo">39</span>
                    <span v-else-if="item.hasEvent" class="event-sparkle">♫</span>
                </div>
            </div>
        </div>

        <!-- 4. 选中日期详情 -->
        <div v-if="selectedDayInfo" class="day-quantum-panel">
            <div class="panel-header">
                <span class="panel-date">{{ selectedDayInfo.dateStr }}</span>
            </div>
            <p class="panel-desc">{{ selectedDayInfo.hasEvent ? '当日有文章更新记录' : '保持热爱，记录今日灵感' }}</p>
        </div>

        <!-- 5. 今日运势签 -->
        <div class="miku-gacha-section">
            <button class="gacha-btn tactile-btn shine-effect" @click="drawGachaCard">
                <span class="gacha-disc"></span>
                <span class="gacha-btn-text">抽取今日运势签</span>
            </button>

            <!-- Gacha 卡牌展示弹层 -->
            <transition name="gacha-flip">
                <div v-if="gachaCard" class="gacha-card-result">
                    <div class="gacha-card-inner">
                        <div class="gacha-header">
                            <span class="gacha-rank">{{ gachaCard.rank }}</span>
                            <span class="gacha-title">{{ gachaCard.title }}</span>
                        </div>
                        <p class="gacha-desc">{{ gachaCard.desc }}</p>
                        <div class="gacha-footer">
                            <span>幸运指数：{{ gachaCard.score }}</span>
                            <span class="gacha-close" @click="gachaCard = null">✕ 关闭</span>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const currentDate = ref(new Date());
const liveTimeStr = ref('');
let clockTimer = null;

// 更新实时高精数字钟
const updateClock = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    liveTimeStr.value = `${hh}:${mm}:${ss}`;
};

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth() + 1);

const headerMonthTitle = computed(() => {
    return `${currentYear.value}年${String(currentMonth.value).padStart(2, '0')}月`;
});

const prevMonth = () => {
    currentDate.value = new Date(currentYear.value, currentDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
    currentDate.value = new Date(currentYear.value, currentDate.value.getMonth() + 1, 1);
};

/* 3D 视差倾斜特效 */
const tiltX = ref(0);
const tiltY = ref(0);
const cardTiltStyle = computed(() => ({
    transform: `perspective(1000px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg)`
}));

let calTiltRaf = null;
const handleMouseMove = (e) => {
    if (calTiltRaf) return;
    const target = e.currentTarget;
    const clientX = e.clientX;
    const clientY = e.clientY;
    calTiltRaf = requestAnimationFrame(() => {
        calTiltRaf = null;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const x = clientX - rect.left - rect.width / 2;
        const y = clientY - rect.top - rect.height / 2;
        tiltX.value = (y / rect.height) * -8;
        tiltY.value = (x / rect.width) * 8;
    });
};

const handleMouseLeave = () => {
    if (calTiltRaf) {
        cancelAnimationFrame(calTiltRaf);
        calTiltRaf = null;
    }
    tiltX.value = 0;
    tiltY.value = 0;
};

/* 日常语录与运势签 */
const QUOTES = [
    '用代码和文字记录值得回味的每一天。',
    '保持专注，写下今天的思考与收获。',
    '把零散的灵感整理成有温度的文章。',
    '慢慢打磨作品，时间会给出答案。',
    '今天也适合学点新东西，写一篇笔记。'
];
const quoteIdx = ref(0);
const currentQuote = computed(() => QUOTES[quoteIdx.value]);
const isMikuJumping = ref(false);
const particles = ref([]);

const triggerMikuAction = (e) => {
    quoteIdx.value = (quoteIdx.value + 1) % QUOTES.length;
    isMikuJumping.value = true;
    setTimeout(() => { isMikuJumping.value = false; }, 600);

    // 触发粒子爆发
    spawnParticles();
};

const spawnParticles = () => {
    const chars = ['♪', '♫', '✦', '★', '39', '🌸', '⚡'];
    for (let i = 0; i < 7; i++) {
        const pId = Date.now() + Math.random();
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 60;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 30;
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        particles.value.push({
            id: pId,
            char,
            style: {
                transform: `translate(${tx}px, ${ty}px) scale(${0.8 + Math.random() * 0.5})`,
                opacity: 0
            }
        });
        
        setTimeout(() => {
            particles.value = particles.value.filter(p => p.id !== pId);
        }, 800);
    }
};

/* 选中日期 */
const selectedDayStr = ref('');
const selectedDayInfo = ref(null);

const onDayClick = (item) => {
    if (!item.isCurrentMonth) return;
    selectedDayStr.value = item.dateStr;
    selectedDayInfo.value = item;
    triggerMikuAction();
};

/* 抽卡抽签 Gacha 模块 */
const GACHA_CARDS = [
    { rank: '上上签', title: '思路通畅 · 一气呵成', desc: '写代码调试顺利，技术难题很快就能理清思路。', score: '98 分' },
    { rank: '大吉签', title: '灵感涌现 · 适合沉淀', desc: '适合梳理项目架构与源码笔记，写一篇好文章吧。', score: '95 分' },
    { rank: '吉签', title: '节奏平稳 · 稳步推进', desc: '戴上耳机专注编码，一步一步完成今日目标。', score: '90 分' },
    { rank: '中吉签', title: '性能调优 · 细节打磨', desc: '适合重构旧代码、优化页面体验与排查小问题。', score: '86 分' }
];

const gachaCard = ref(null);
const drawGachaCard = () => {
    spawnParticles();
    const rand = Math.floor(Math.random() * GACHA_CARDS.length);
    gachaCard.value = GACHA_CARDS[rand];
};

/* 计算日历网格数据 */
const daysList = computed(() => {
    const year = currentYear.value;
    const month = currentDate.value.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const days = [];

    // 上个月补齐
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayWeek - 1; i >= 0; i--) {
        days.push({
            day: prevLastDay - i,
            isCurrentMonth: false,
            dateStr: '',
            isToday: false,
            hasEvent: false
        });
    }

    // 当月天数
    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasEvent = d % 5 === 3 || d % 7 === 2 || d === 39;
        days.push({
            day: d,
            isCurrentMonth: true,
            dateStr,
            isToday: dateStr === todayStr,
            hasEvent: hasEvent && dateStr !== todayStr
        });
    }

    // 下个月补齐
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({
            day: i,
            isCurrentMonth: false,
            dateStr: '',
            isToday: false,
            hasEvent: false
        });
    }

    return days;
});

onMounted(() => {
    updateClock();
    clockTimer = setInterval(updateClock, 1000);
});

onUnmounted(() => {
    if (clockTimer) clearInterval(clockTimer);
});
</script>

<style scoped>
.sidebar-calendar-ultimate {
    position: relative;
    padding: 18px;
    margin-bottom: 22px;
    border: none;
    border-radius: 24px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 16px 40px rgba(57, 197, 187, 0.18), 0 0 25px rgba(57, 197, 187, 0.12);
    transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
    transform-style: preserve-3d;
}

/* ==================== 4K 壁纸全息背景 ==================== */
.cal-holo-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

.holo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.16;
    filter: saturate(1.4) contrast(1.1);
}

.holo-scanline {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(57, 197, 187, 0.15) 50%, transparent 100%);
    will-change: transform;
    animation: scanlineSweep 4s linear infinite;
}

@keyframes scanlineSweep {
    0% { transform: translateY(-100%) translateZ(0); }
    100% { transform: translateY(100%) translateZ(0); }
}

.holo-glow-mask {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 80% 20%, rgba(255, 126, 157, 0.12) 0%, transparent 60%),
                radial-gradient(circle at 20% 80%, rgba(57, 197, 187, 0.15) 0%, transparent 60%);
}

/* 科技角标装饰 */
.hud-bracket {
    position: absolute;
    font-family: 'Audiowide', monospace;
    font-size: 9px;
    font-weight: 900;
    color: var(--miku-teal);
    opacity: 0.7;
    pointer-events: none;
}

.top-left { top: 6px; left: 10px; }
.top-right { top: 6px; right: 10px; }
.bottom-left { bottom: 6px; left: 10px; }
.bottom-right { bottom: 6px; right: 10px; }

/* ==================== 1. 赛博量子数字钟 Header ==================== */
.cal-hud-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1.5px dashed rgba(57, 197, 187, 0.3);
    margin-bottom: 14px;
}

.clock-box {
    display: flex;
    align-items: center;
    gap: 6px;
}

.clock-live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #FF7E9D;
    box-shadow: 0 0 8px #FF7E9D;
    animation: dotPulse 1.2s ease-in-out infinite alternate;
}

@keyframes dotPulse {
    from { opacity: 0.4; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1.2); }
}

.clock-time {
    font-family: 'Audiowide', monospace;
    font-size: 15px;
    font-weight: 900;
    color: #0E2926;
    text-shadow: 0 0 8px rgba(57, 197, 187, 0.4);
}

.clock-label {
    font-family: 'Audiowide', sans-serif;
    font-size: 8px;
    color: var(--miku-teal);
    background: rgba(57, 197, 187, 0.16);
    padding: 2px 5px;
    border-radius: 4px;
}

.month-selector {
    display: flex;
    align-items: center;
    gap: 6px;
}

.month-hud-text {
    font-family: 'Audiowide', monospace;
    font-size: 14px;
    font-weight: 900;
    color: var(--miku-deep);
}

.nav-arrow-btn {
    border: none;
    background: #ffffff;
    color: var(--miku-deep);
    font-size: 15px;
    font-weight: 900;
    width: 24px;
    height: 24px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.nav-arrow-btn:hover {
    background: linear-gradient(90deg, var(--miku-teal), var(--miku-deep));
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 3px 10px rgba(57, 197, 187, 0.35);
}

/* ==================== 2. 夸张 Q 版初音 3D 舞台 ==================== */
.miku-hero-stage {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    padding: 10px 12px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(227, 247, 244, 0.9) 100%);
    border-radius: 16px;
    border: none;
    box-shadow: 0 6px 18px rgba(57, 197, 187, 0.15);
}

.chibi-avatar-3d {
    position: relative;
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.miku-chibi-hero {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: none;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 2;
}

.chibi-avatar-3d.is-jumping .miku-chibi-hero {
    animation: mikuJump 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes mikuJump {
    0% { transform: translateY(0) rotate(0deg) scale(1); }
    40% { transform: translateY(-16px) rotate(-10deg) scale(1.2); }
    70% { transform: translateY(-6px) rotate(6deg) scale(1.1); }
    100% { transform: translateY(0) rotate(0deg) scale(1); }
}

.pop-particle {
    position: absolute;
    font-size: 14px;
    font-weight: 900;
    color: #FF7E9D;
    text-shadow: 0 0 6px rgba(255, 126, 157, 0.8);
    pointer-events: none;
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 5;
}

.miku-speech-bubble-cyber {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.bubble-tag {
    font-family: 'Audiowide', sans-serif;
    font-size: 8px;
    font-weight: 900;
    color: var(--miku-teal);
}

.bubble-text {
    font-size: 11.5px;
    font-weight: 800;
    color: #0E2926;
    line-height: 1.35;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.eq-mini-bars {
    display: flex;
    align-items: flex-end;
    gap: 2.5px;
    height: 10px;
    margin-top: 2px;
}

.eq-mini-bars i {
    width: 2.5px;
    border-radius: 2px;
    background: linear-gradient(180deg, var(--miku-teal), #FF7E9D);
    animation: waveBar 1.1s ease-in-out infinite alternate;
}

.eq-mini-bars i:nth-child(1) { height: 40%; animation-delay: 0.1s; }
.eq-mini-bars i:nth-child(2) { height: 80%; animation-delay: 0.3s; }
.eq-mini-bars i:nth-child(3) { height: 60%; animation-delay: 0.2s; }
.eq-mini-bars i:nth-child(4) { height: 100%; animation-delay: 0.4s; }
.eq-mini-bars i:nth-child(5) { height: 50%; animation-delay: 0.15s; }

@keyframes waveBar {
    from { opacity: 0.4; transform: scaleY(0.5); }
    to { opacity: 1; transform: scaleY(1); }
}

/* ==================== 3. 晶体赛博日历网格 ==================== */
.cal-days-container {
    position: relative;
    z-index: 2;
}

.cal-week-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    margin-bottom: 6px;
}

.week-pill {
    font-family: 'Audiowide', sans-serif;
    font-size: 9px;
    font-weight: 900;
    color: #00687d;
}

.cal-days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4.5px;
    text-align: center;
}

.day-hex-cell {
    position: relative;
    height: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 11.5px;
    font-weight: 800;
    color: #0E2926;
    background: rgba(255, 255, 255, 0.72);
    border: none;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
}

.day-hex-cell.other-month {
    opacity: 0.25;
}

.day-hex-cell:hover {
    background: #E3F7F4;
    transform: translateY(-3px) scale(1.08);
    box-shadow: 0 6px 14px rgba(57, 197, 187, 0.3);
    z-index: 3;
}

.day-hex-cell.is-today {
    background: linear-gradient(135deg, var(--miku-teal) 0%, var(--miku-deep) 100%);
    color: #ffffff;
    font-weight: 900;
    box-shadow: 0 4px 14px rgba(57, 197, 187, 0.5);
}

.today-halo {
    position: absolute;
    bottom: 1px;
    font-family: 'Audiowide', sans-serif;
    font-size: 7px;
    color: #ffffff;
    line-height: 1;
}

.day-hex-cell.is-selected {
    box-shadow: 0 0 14px rgba(255, 126, 157, 0.55);
    background: rgba(255, 240, 245, 0.95);
}

.event-sparkle {
    position: absolute;
    bottom: 1px;
    font-size: 8.5px;
    color: #FF7E9D;
    line-height: 1;
}

/* ==================== 4. 选中量子面板 ==================== */
.day-quantum-panel {
    position: relative;
    z-index: 2;
    margin-top: 12px;
    padding: 10px 12px;
    background: #ffffff;
    border: none;
    border-radius: 12px;
    box-shadow: 0 6px 18px rgba(255, 126, 157, 0.2);
    animation: panelPop 0.3s ease;
}

@keyframes panelPop {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
}

.panel-date {
    font-family: 'Audiowide', monospace;
    font-size: 11.5px;
    font-weight: 900;
    color: var(--miku-deep);
}

.panel-energy {
    font-family: 'Audiowide', sans-serif;
    font-size: 8px;
    font-weight: 900;
    color: #FF7E9D;
}

.panel-desc {
    font-size: 11px;
    font-weight: 700;
    color: #0E2926;
    margin: 0;
    line-height: 1.35;
}

/* ==================== 5. 39 赛博求签抽卡盘 ==================== */
.miku-gacha-section {
    position: relative;
    z-index: 2;
    margin-top: 14px;
}

.gacha-btn {
    width: 100%;
    border: none;
    background: linear-gradient(90deg, var(--miku-teal), var(--miku-deep));
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
    padding: 9px 12px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 6px 18px rgba(57, 197, 187, 0.35);
    transition: all 0.25s ease;
}

.gacha-btn:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 24px rgba(57, 197, 187, 0.5);
}

.gacha-disc {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1.5px dashed #FF7E9D;
    animation: vinylSpin 3s linear infinite;
}

.gacha-card-result {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background: linear-gradient(145deg, #0E2926 0%, #17423d 100%);
    border: 2px solid #39C5BB;
    border-radius: 14px;
    padding: 12px;
    color: #ffffff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(57, 197, 187, 0.5);
}

.gacha-flip-enter-active, .gacha-flip-leave-active {
    transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.gacha-flip-enter-from, .gacha-flip-leave-to {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
}

.gacha-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.gacha-rank {
    font-family: 'Audiowide', sans-serif;
    font-size: 10px;
    font-weight: 900;
    color: #ffffff;
    background: linear-gradient(90deg, #FF7E9D, #ff5c81);
    padding: 2px 7px;
    border-radius: 4px;
}

.gacha-title {
    font-size: 13px;
    font-weight: 900;
    color: #39C5BB;
}

.gacha-desc {
    font-size: 11.5px;
    color: #e0f5f2;
    margin: 0 0 10px;
    line-height: 1.4;
}

.gacha-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'Audiowide', monospace;
    font-size: 9px;
    color: #39C5BB;
    border-top: 1px dashed rgba(57, 197, 187, 0.3);
    padding-top: 6px;
}

.gacha-close {
    cursor: pointer;
    color: #FF7E9D;
    font-weight: 900;
}

.gacha-close:hover {
    text-decoration: underline;
}
</style>
