<template>
    <div v-if="data" class="weather-card">
        <!-- 头部：城市 + 更新时间 -->
        <div class="wc-head">
            <span class="wc-city">{{ data.city }}</span>
            <span class="wc-time">{{ shortTime }}</span>
        </div>

        <!-- 主区：当前温度 + 今日区间 -->
        <div class="wc-main">
            <div class="wc-icon">{{ weatherEmoji(nowText) }}</div>
            <div class="wc-temp">
                <span class="wc-now">{{ data.now.temp }}<small>°C</small></span>
                <span class="wc-desc">{{ data.now.text }} · 体感 {{ data.now.feelsLike }}°C</span>
            </div>
            <div v-if="data.today" class="wc-range">
                <span class="wc-hi">最高 {{ data.today.tempMax }}°</span>
                <span class="wc-lo">最低 {{ data.today.tempMin }}°</span>
            </div>
        </div>

        <!-- 指标行 -->
        <div class="wc-meta">
            <span>湿度 {{ data.now.humidity }}%</span>
            <i class="wc-dot"></i>
            <span>{{ data.now.windDir }} {{ data.now.windScale }}级</span>
            <template v-if="data.today">
                <i class="wc-dot"></i>
                <span>紫外线 {{ data.today.uvIndex }}</span>
                <i class="wc-dot"></i>
                <span>降水 {{ data.today.precip }}%</span>
            </template>
        </div>

        <!-- 日出日落 -->
        <div v-if="data.today" class="wc-sun">
            <span class="wc-sun-item"><i class="wc-arrow up"></i>日出 {{ data.today.sunrise }}</span>
            <span class="wc-sun-item"><i class="wc-arrow down"></i>日落 {{ data.today.sunset }}</span>
        </div>

        <!-- 未来两天 -->
        <div v-if="data.daily && data.daily.length > 1" class="wc-daily">
            <div v-for="d in data.daily.slice(1)" :key="d.date" class="wc-day">
                <span class="wc-day-label">{{ dayLabel(d.date) }}</span>
                <span class="wc-day-icon">{{ weatherEmoji(d.textDay) }}</span>
                <span class="wc-day-text">{{ d.textDay }}</span>
                <span class="wc-day-temp">{{ d.tempMin }}° ~ {{ d.tempMax }}°</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    data: { type: Object, default: null }
});

const nowText = computed(() => props.data?.now?.text || '');

const shortTime = computed(() => {
    const t = props.data?.obsTime || '';
    const m = t.match(/T?(\d{2}:\d{2})/);
    return m ? `更新于 ${m[1]}` : '';
});

const weatherEmoji = (text) => {
    const t = text || '';
    if (/雷/.test(t)) return '⛈️';
    if (/雪/.test(t)) return '❄️';
    if (/雨/.test(t)) return '🌧️';
    if (/雾|霾/.test(t)) return '🌫️';
    if (/阴/.test(t)) return '☁️';
    if (/多云/.test(t)) return '⛅';
    if (/晴/.test(t)) return '☀️';
    return '🌤️';
};

const dayLabel = (dateStr) => {
    if (!dateStr) return '';
    const target = new Date(`${dateStr}T00:00:00`);
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((target - base) / 86400000);
    return ['今天', '明天', '后天'][diff] ?? dateStr.slice(5).replace('-', '/');
};
</script>

<style scoped>
.weather-card {
    width: min(420px, 100%);
    margin: 2px 0 12px;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgba(57, 197, 187, 0.28);
    background: linear-gradient(160deg, #ffffff 0%, #f2fbfa 100%);
    box-shadow: 0 8px 24px rgba(8, 90, 87, 0.08);
    color: #14322f;
    font-size: 13px;
}

.wc-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
}

.wc-city {
    font-size: 14px;
    font-weight: 700;
}

.wc-time {
    font-size: 11px;
    color: #8aa;
}

.wc-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.wc-icon {
    font-size: 34px;
    line-height: 1;
}

.wc-temp {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.wc-now {
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
    color: #0f766e;
}

.wc-now small {
    font-size: 13px;
    font-weight: 600;
    margin-left: 2px;
    color: #48756f;
}

.wc-desc {
    font-size: 12px;
    color: #5c837f;
}

.wc-range {
    display: flex;
    gap: 8px;
    margin-left: auto;
    flex-wrap: wrap;
}

.wc-hi,
.wc-lo {
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
}

.wc-hi {
    color: #b45309;
    background: #fff4e5;
}

.wc-lo {
    color: #1e3a8a;
    background: #eef2ff;
}

.wc-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    font-size: 12px;
    color: #5c837f;
}

.wc-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #b9d6d2;
    display: inline-block;
}

.wc-sun {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    font-size: 12px;
    color: #5c837f;
    flex-wrap: wrap;
}

.wc-sun-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.wc-arrow {
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
}

.wc-arrow.up {
    border-bottom: 7px solid #e6a23c;
}

.wc-arrow.down {
    border-top: 7px solid #8a7fe8;
}

.wc-daily {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed rgba(57, 197, 187, 0.3);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.wc-day {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #5c837f;
}

.wc-day-label {
    width: 32px;
    flex-shrink: 0;
    font-weight: 700;
    color: #14322f;
}

.wc-day-icon {
    font-size: 14px;
}

.wc-day-text {
    min-width: 40px;
}

.wc-day-temp {
    margin-left: auto;
    font-weight: 600;
    color: #0f766e;
}
</style>
