<template>
    <div class="page-404">
        <div class="error-bg">
            <div class="error-orb orb-1"></div>
            <div class="error-orb orb-2"></div>
            <div class="error-grid"></div>
        </div>
        <div class="error-content">
            <div class="error-code">
                <span class="code-digit">4</span>
                <span class="code-emoji">😭</span>
                <span class="code-digit">4</span>
            </div>
            <h1 class="error-title">好像走到知识世界的边界了……</h1>
            <p class="error-desc">访问的知识档案不存在或已转移，请返回主页继续浏览</p>
            <div class="error-actions">
                <button class="btn-home tactile-btn" @click="router.push('/')">
                    返回首页
                </button>
                <button class="btn-back tactile-btn" @click="router.back()">
                    ← 返回上一页
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<style scoped>
.page-404 {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    position: relative;
    overflow: hidden;
}

.error-bg {
    position: absolute;
    inset: 0;
}

.error-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
}

.error-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.6;
}

.orb-1 {
    width: 300px;
    height: 300px;
    background: #00f0ff;
    top: -80px;
    left: 10%;
    animation: orbFloat 8s ease-in-out infinite;
}

.orb-2 {
    width: 250px;
    height: 250px;
    background: #38bdf8;
    bottom: -60px;
    right: 10%;
    animation: orbFloat 8s ease-in-out infinite reverse;
}

@keyframes orbFloat {

    0%,
    100% {
        transform: translate(0, 0);
    }

    50% {
        transform: translate(30px, -30px);
    }
}

.error-content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 20px;
    animation: fadeInUp 0.8s ease both;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(40px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.error-code {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
}

.code-digit {
    font-size: 120px;
    font-weight: 900;
    background: linear-gradient(135deg, #4b8dff, #64c4ff, #8f84ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    animation: codePulse 3s ease-in-out infinite;
}

@keyframes codePulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.03);
    }
}

.code-emoji {
    font-size: 80px;
    animation: emojiBounce 2s ease-in-out infinite;
}

@keyframes emojiBounce {
    0%, 100% {
        transform: translateY(0) rotate(0deg);
    }
    25% {
        transform: translateY(-12px) rotate(-5deg);
    }
    75% {
        transform: translateY(-6px) rotate(5deg);
    }
}

.error-title {
    font-size: 28px;
    font-weight: 900;
    color: #1e293b;
    margin: 0 0 12px;
}

.error-desc {
    font-size: 15px;
    color: #64748b;
    margin: 0 0 40px;
    line-height: 1.6;
}

.error-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
}

.btn-home,
.btn-back {
    padding: 14px 32px;
    border: none;
    border-radius: 30px;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-home {
    background: linear-gradient(135deg, #4b8dff, #64c4ff);
    color: #ffffff;
    box-shadow: 0 6px 20px rgba(75, 141, 255, 0.35);
}

.btn-home:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(75, 141, 255, 0.5);
}

.btn-back {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #1e293b;
    border: 1px solid rgba(75, 141, 255, 0.25);
    box-shadow: 0 4px 14px rgba(75, 141, 255, 0.08);
}

.btn-back:hover {
    border-color: #4b8dff;
    color: #2563eb;
    transform: translateY(-3px);
}
</style>