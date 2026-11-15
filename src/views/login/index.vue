<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h2>欢迎回来</h2>
                <p>登录你的初音小站账号</p>
            </div>

            <el-form :model="loginForm" :rules="rules" ref="formRef" label-width="0" size="large">
                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" placeholder="用户名" prefix-icon="User" />
                </el-form-item>
                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" type="password" placeholder="密码" prefix-icon="Lock"
                        show-password @keyup.enter="handleLogin" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
                        登录
                    </el-button>
                </el-form-item>
            </el-form>

            <div class="login-footer">
                <span>还没有账号？</span>
                <el-button type="primary" link class="auth-link-btn" @click="goToRegister">立即注册</el-button>
            </div>

            <!-- 整屏页不套导航栏，补一个回站内的入口 -->
            <div class="auth-back-home">
                <el-button link @click="router.push('/')">← 返回首页</el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login } from '../../api/user';
import { useUserStore } from '../../stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const formRef = ref(null);

const loginForm = reactive({
    username: '',
    password: ''
});

const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名需为 3~20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
    ]
};

const handleLogin = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;
        loading.value = true;
        try {
            const res = await login(loginForm);
            userStore.setLoginData(res.data.token, res.data.user);
            ElMessage.success('登录成功！');
            // 若因鉴权被拦下（?redirect=/profile），登录后回到原目标页
            const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
            router.push(redirect && redirect.startsWith('/') ? redirect : '/');
        } catch (error) {
            console.error('登录失败:', error);
        } finally {
            loading.value = false;
        }
    });
};

const goToRegister = () => {
    router.push('/register');
};
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: radial-gradient(circle at 50% 20%, rgba(100, 196, 255, 0.15) 0%, transparent 60%),
                linear-gradient(135deg, #f0f7ff 0%, #eaf3ff 50%, #f7faff 100%);
    position: relative;
    overflow: hidden;
}

.login-card {
    width: 420px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 24px;
    padding: 44px 38px;
    box-shadow: 0 16px 45px rgba(75, 141, 255, 0.12);
    border: 1px solid rgba(75, 141, 255, 0.25);
    position: relative;
    z-index: 2;
}

.login-header {
    text-align: center;
    margin-bottom: 32px;
}

.login-header h2 {
    font-size: 26px;
    font-weight: 900;
    color: #1e293b;
    margin: 0 0 8px;
    background: linear-gradient(135deg, #1e293b 0%, #2563eb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.login-header p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

.login-btn {
    width: 100%;
    height: 46px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    background: linear-gradient(135deg, #4b8dff, #64c4ff);
    color: #fff;
    border: none;
    box-shadow: 0 6px 20px rgba(75, 141, 255, 0.35);
    transition: all 0.3s;
}

.login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(75, 141, 255, 0.5);
}

.login-footer {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: #64748b;
}

.login-footer :deep(.auth-link-btn),
.login-footer :deep(.el-button) {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 2px !important;
    margin-left: 4px !important;
    height: auto !important;
    line-height: inherit !important;
    color: #39C5BB !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    text-decoration: underline !important;
    text-underline-offset: 4px !important;
    cursor: pointer !important;
}

.login-footer :deep(.auth-link-btn:hover),
.login-footer :deep(.auth-link-btn:focus),
.login-footer :deep(.el-button:hover),
.login-footer :deep(.el-button:focus) {
    background: transparent !important;
    background-color: transparent !important;
    color: #12A79C !important;
    text-decoration: underline !important;
    text-underline-offset: 4px !important;
    box-shadow: none !important;
}

/* 整屏鉴权页无导航栏，补一个回首页的轻量入口 */
.auth-back-home {
    margin-top: 14px;
    padding-top: 14px;
    text-align: center;
    border-top: 1px dashed rgba(100, 116, 139, 0.22);
}

.auth-back-home :deep(.el-button) {
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
}

.auth-back-home :deep(.el-button:hover) {
    color: #409EFF;
}
</style>