<template>
    <el-dialog :model-value="visible" title="编辑精选" width="720px" @update:model-value="$emit('update:visible', $event)"
        @open="onOpen">
        <div class="edit-featured">
            <!-- 当前精选（排序 / 移除，最多 4 篇） -->
            <div class="block-title">
                精选文章（最多 4 篇，按展示顺序）
                <span class="count-tag">{{ selected.length }} / 4</span>
            </div>
            <div v-if="selected.length === 0" class="empty-tip">尚未选择任何精选文章</div>
            <ul class="selected-list">
                <li v-for="(item, idx) in selected" :key="item.id" class="selected-item">
                    <span class="order-badge">{{ idx + 1 }}</span>
                    <span class="cover-thumb">
                        <img v-if="item.cover_url" :src="item.cover_url" alt="" />
                        <span v-else class="thumb-empty">无封面</span>
                    </span>
                    <span class="item-title">{{ item.title }}</span>
                    <span class="item-cat">{{ item.category_name || '未分类' }}</span>
                    <div class="item-ops">
                        <el-button size="small" :disabled="idx === 0" @click="move(idx, -1)">上移</el-button>
                        <el-button size="small" :disabled="idx === selected.length - 1" @click="move(idx, 1)">下移</el-button>
                        <el-button size="small" type="danger" @click="removeAt(idx)">移除</el-button>
                    </div>
                </li>
            </ul>

            <!-- 搜索添加 -->
            <div class="add-area">
                <div class="block-title">从已发布文章中添加</div>
                <div class="search-bar">
                    <el-input v-model="keyword" placeholder="输入标题搜索" clearable @keyup.enter="search"
                        style="width: 240px;" />
                    <el-button type="primary" @click="search">搜索</el-button>
                </div>
                <div v-loading="searching" class="search-result">
                    <div v-for="art in results" :key="art.id" class="result-item">
                        <span class="cover-thumb">
                            <img v-if="art.cover_url" :src="art.cover_url" alt="" />
                            <span v-else class="thumb-empty">无封面</span>
                        </span>
                        <span class="item-title">{{ art.title }}</span>
                        <span class="item-cat">{{ art.category_name || '未分类' }}</span>
                        <el-button size="small" type="success" :disabled="selected.length >= 4 || isSelected(art.id)"
                            @click="add(art)">
                            {{ isSelected(art.id) ? '已添加' : '添加' }}
                        </el-button>
                    </div>
                    <el-empty v-if="!searching && results.length === 0" description="搜索以添加文章" :image-size="60" />
                </div>
            </div>
        </div>

        <template #footer>
            <el-button @click="$emit('update:visible', false)">取消</el-button>
            <el-button type="primary" :loading="saving" @click="save">保存并同步到首页</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import request, { authHeader } from '../../api/request';

const props = defineProps({
    visible: { type: Boolean, default: false },
    // 当前首页精选（含 id / title / category_name），用于初始化
    featured: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:visible', 'saved']);

const selected = ref([]);
const keyword = ref('');
const results = ref([]);
const searching = ref(false);
const saving = ref(false);

// 弹窗打开时用当前精选初始化（保留顺序）
watch(
    () => props.visible,
    (v) => {
        if (v) onOpen();
    }
);

const onOpen = () => {
    selected.value = (props.featured || []).map((a) => ({
        id: a.id,
        title: a.title,
        category_name: a.category_name,
        cover_url: a.cover_url || '',
    }));
    keyword.value = '';
    results.value = [];
};

const isSelected = (id) => selected.value.some((s) => s.id === id);

const add = (art) => {
    if (selected.value.length >= 4) return;
    selected.value.push({
        id: art.id,
        title: art.title,
        category_name: art.category_name,
        cover_url: art.cover_url || art.cover || '',
    });
};

const removeAt = (idx) => selected.value.splice(idx, 1);

const move = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= selected.value.length) return;
    const arr = selected.value;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
};

const search = async () => {
    searching.value = true;
    try {
        const res = await request.get('/article', {
            params: { title: keyword.value, status: 1, pageSize: 20, page: 1 },
        });
        const list = res.data.list || [];
        results.value = list.filter((a) => !isSelected(a.id));
    } catch (error) {
        console.error('搜索文章失败:', error);
    } finally {
        searching.value = false;
    }
};

// 写回管理端推荐文章列表：调用批量设置接口（携带 admin_token）
const save = async () => {
    saving.value = true;
    try {
        const res = await request.put(
            '/article/recommend/batch',
            { ids: selected.value.map((s) => s.id) },
            { headers: { Authorization: authHeader('admin_token') } }
        );
        if (res.code === 200) {
            ElMessage.success(res.message || '编辑精选已更新');
            emit('saved');
        } else {
            ElMessage.error(res.message || '保存失败');
        }
    } catch (error) {
        ElMessage.error(error.message || error.response?.data?.message || '保存失败');
    } finally {
        saving.value = false;
    }
};
</script>

<style scoped>
.edit-featured {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.block-title {
    font-size: 14px;
    font-weight: 700;
    color: #14322f;
    margin-bottom: 10px;
}

.empty-tip {
    font-size: 13px;
    color: #99a;
    padding: 12px 0;
}

.selected-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.selected-item,
.result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid rgba(57, 197, 187, 0.2);
    border-radius: 12px;
    background: #fff;
}

.order-badge {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 50%;
    background: #39c5bb;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.item-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-cat {
    font-size: 12px;
    color: #5c837f;
    flex-shrink: 0;
}

.count-tag {
    margin-left: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #39c5bb;
}

.cover-thumb {
    width: 64px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
    background: #eef7f6;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.cover-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.thumb-empty {
    font-size: 11px;
    color: #8aa;
    letter-spacing: 1px;
}

.item-ops {
    display: inline-flex;
    gap: 6px;
    flex-shrink: 0;
}

.add-area {
    border-top: 1px dashed #e3f7f4;
    padding-top: 16px;
}

.search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
}

.search-result {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 60px;
}
</style>
