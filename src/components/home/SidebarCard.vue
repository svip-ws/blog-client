<template>
    <div class="sidebar-card card-tier-elevated">
        <div class="sidebar-header">
            <div class="sidebar-title-group">
                <span class="sidebar-icon" v-if="$slots.icon">
                    <slot name="icon" />
                </span>
                <span class="sidebar-title">{{ title }}</span>
            </div>
            <slot name="extra" />
        </div>
        <div class="sidebar-body">
            <slot />
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        required: true
    }
});
</script>

<style scoped>
.sidebar-card {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(238, 250, 248, 0.94) 100%);
    border-radius: 20px;
    padding: 18px 20px;
    border: none;
    box-shadow: 0 10px 28px rgba(8, 90, 87, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-card:hover {
    box-shadow: 0 14px 34px rgba(57, 197, 187, 0.18), inset 0 1px 0 #FFFFFF;
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: none;
}

.sidebar-title-group {
    display: flex;
    align-items: center;
    gap: 6px;
}

.sidebar-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #12A79C;
    font-size: 14px;
}

.sidebar-title {
    font-size: 14.5px;
    font-weight: 800;
    color: #14322F;
    letter-spacing: 0.5px;
}

.sidebar-body {
    position: relative;
}
</style>