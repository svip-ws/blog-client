<template>
    <div class="register-container">
        <div class="register-card">
            <div class="register-header">
                <h2>创建账号</h2>
                <p>加入初音小站，开启你的二次元灵感之旅</p>
            </div>

            <el-form :model="registerForm" :rules="rules" ref="formRef" label-width="0" size="large">
                <el-form-item prop="username">
                    <el-input v-model="registerForm.username" placeholder="用户名" prefix-icon="User" />
                </el-form-item>
                <el-form-item prop="nickname">
                    <el-input v-model="registerForm.nickname" placeholder="昵称（选填）" prefix-icon="UserFilled" />
                </el-form-item>
                <el-form-item prop="password">
                    <el-input v-model="registerForm.password" type="password" placeholder="密码 (不少于8位，包含字母与数字)" prefix-icon="Lock"
                        show-password />
                </el-form-item>
                <el-form-item prop="confirmPassword">
                    <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码"
                        prefix-icon="Lock" show-password @keyup.enter="handleRegister" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" class="register-btn" :loading="loading" @click="handleRegister">
                        注册
                    </el-button>
                </el-form-item>
            </el-form>

            <div class="register-footer">
                <span>已有账号？</span>
                <el-button type="primary" link class="auth-link-btn" @click="goToLogin">去登录</el-button>
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
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { register } from '../../api/user';

const router = useRouter();
const loading = ref(false);
const formRef = ref(null);

const registerForm = reactive({
    username: '',
    nickname: '',
    password: '',
    confirmPassword: ''
});

// 自定义确认密码校验
const validateConfirm = (rule, value, callback) => {
    if (value !== registerForm.password) {
        callback(new Error('两次输入的密码不一致'));
    } else {
        callback();
    }
};

const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度需在 3 到 20 个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名仅支持字母、数字、下划线与中文', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 8, message: '密码长度不能少于 8 位', trigger: 'blur' },
        { pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/, message: '密码必须同时包含英文字母和数字', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        { validator: validateConfirm, trigger: 'blur' }
    ]
};

const handleRegister = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;
        loading.value = true;
        try {
            await register({
                username: registerForm.username,
                password: registerForm.password,
                nickname: registerForm.nickname || undefined
            });
            ElMessage.success('注册成功！请登录');
            router.push('/login');
        } catch (error) {
            console.error('注册失败:', error);
        } finally {
            loading.value = false;
        }
    });
};

const goToLogin = () => {
    router.push('/login');
};
</script>

<style scoped>
.register-container {
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

.register-card {
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

.register-header {
    text-align: center;
    margin-bottom: 32px;
}

.register-header h2 {
    font-size: 26px;
    font-weight: 900;
    color: #1e293b;
    margin: 0 0 8px;
    background: linear-gradient(135deg, #1e293b 0%, #2563eb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.register-header p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

.register-btn {
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

.register-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(75, 141, 255, 0.5);
}

.register-footer {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: #64748b;
}

.register-footer :deep(.auth-link-btn),
.register-footer :deep(.el-button) {
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

.register-footer :deep(.auth-link-btn:hover),
.register-footer :deep(.auth-link-btn:focus),
.register-footer :deep(.el-button:hover),
.register-footer :deep(.el-button:focus) {
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
    color: #4b8dff;
}
</style>