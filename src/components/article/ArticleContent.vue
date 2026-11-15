<template>
    <div class="article-body">
        <div class="inner-html" ref="contentRef" v-html="safeContent"></div>
        <el-image-viewer
            v-if="showViewer"
            :url-list="viewerImgList"
            :initial-index="viewerIndex"
            @close="showViewer = false"
        />
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { sanitizeHtml } from '../../utils/sanitize';
import { ElMessage } from 'element-plus';
import { applyLazy, unobserveLazy } from '../../directives/lazy';

const props = defineProps({
    content: {
        type: String,
        default: ''
    }
});

const safeContent = computed(() => sanitizeHtml(props.content));
const emit = defineEmits(['headingsReady']);
const contentRef = ref(null);

const showViewer = ref(false);
const viewerImgList = ref([]);
const viewerIndex = ref(0);

function enhanceArticleDom() {
    if (!contentRef.value) return;

    // 提取目录锚点
    const headings = contentRef.value.querySelectorAll('h1, h2, h3, h4');
    const list = [];
    headings.forEach((el, index) => {
        const id = `heading-${index}`;
        el.id = id;
        list.push({
            id,
            text: el.textContent,
            level: parseInt(el.tagName.charAt(1)),
            offsetTop: el.offsetTop
        });
    });
    emit('headingsReady', list);

    // 增强代码块：增加语言标签与复制按钮
    const preBlocks = contentRef.value.querySelectorAll('pre');
    preBlocks.forEach((pre) => {
        if (pre.querySelector('.terminal-header')) return;

        let codeEl = pre.querySelector('code');
        // 若富文本直接将文本放进 <pre> 而缺少 <code> 包裹，先移入 <code> 以保证仅代码正文横向滚动且顶栏固定
        if (!codeEl) {
            codeEl = document.createElement('code');
            while (pre.firstChild) {
                codeEl.appendChild(pre.firstChild);
            }
            pre.appendChild(codeEl);
        }

        let lang = 'CODE';
        const match = (codeEl.className + ' ' + pre.className).match(/language-([a-zA-Z0-9_-]+)/i);
        if (match) {
            lang = match[1].toUpperCase();
        }

        const header = document.createElement('div');
        header.className = 'terminal-header';
        header.innerHTML = `
            <div class="terminal-left">
                <div class="terminal-dots">
                    <span class="dot dot-red"></span>
                    <span class="dot dot-yellow"></span>
                    <span class="dot dot-green"></span>
                </div>
                <span class="terminal-lang-badge">${lang}</span>
            </div>
            <button class="terminal-copy-btn tactile-btn" type="button" title="复制代码">复制</button>
        `;

        const copyBtn = header.querySelector('.terminal-copy-btn');
        copyBtn.addEventListener('click', () => {
            const codeText = pre.querySelector('code')?.innerText || pre.innerText;
            navigator.clipboard.writeText(codeText).then(() => {
                copyBtn.innerText = '已复制';
                setTimeout(() => { copyBtn.innerText = '复制'; }, 2000);
                ElMessage.success('代码已复制到剪贴板');
            }).catch(() => {
                ElMessage.error('复制失败，请手动选择复制');
            });
        });

        pre.insertBefore(header, pre.firstChild);
    });

    // 增强文库 Callout 笔记提示块
    const blockquotes = contentRef.value.querySelectorAll('blockquote');
    blockquotes.forEach((bq) => {
        if (bq.classList.contains('callout-block')) return;
        const rawHtml = bq.innerHTML.trim();
        if (rawHtml.includes('[!NOTE]') || rawHtml.includes('[NOTE]')) {
            bq.classList.add('callout-block', 'callout-note');
            bq.innerHTML = `
                <div class="callout-header">
                    <span class="callout-icon">📌</span>
                    <span class="callout-label">随笔批注</span>
                </div>
                <div class="callout-content">
                    ${rawHtml.replace(/\[!NOTE\]|\[NOTE\]/gi, '')}
                </div>
            `;
        } else if (rawHtml.includes('[!TIP]') || rawHtml.includes('[TIP]')) {
            bq.classList.add('callout-block', 'callout-tip');
            bq.innerHTML = `
                <div class="callout-header">
                    <span class="callout-icon">💡</span>
                    <span class="callout-label">实用提示</span>
                </div>
                <div class="callout-content">
                    ${rawHtml.replace(/\[!TIP\]|\[TIP\]/gi, '')}
                </div>
            `;
        } else if (rawHtml.includes('[!WARNING]') || rawHtml.includes('[WARNING]')) {
            bq.classList.add('callout-block', 'callout-warning');
            bq.innerHTML = `
                <div class="callout-header">
                    <span class="callout-icon">⚠️</span>
                    <span class="callout-label">注意事项</span>
                </div>
                <div class="callout-content">
                    ${rawHtml.replace(/\[!WARNING\]|\[WARNING\]/gi, '')}
                </div>
            `;
        }
    });

    // 图片懒加载与点击放大支持
    const bodyImgs = contentRef.value.querySelectorAll('img');
    const imgUrls = [];
    bodyImgs.forEach((img, idx) => {
        if (img.dataset.lazyEnhanced) return;
        img.dataset.lazyEnhanced = '1';
        const realSrc = img.getAttribute('src');
        if (realSrc) {
            imgUrls.push(realSrc);
            img.removeAttribute('src');
            applyLazy(img, realSrc, false);
        }
        img.addEventListener('click', () => {
            const currentSrc = img.getAttribute('src') || realSrc;
            if (currentSrc) {
                viewerImgList.value = imgUrls.length > 0 ? imgUrls : [currentSrc];
                viewerIndex.value = idx;
                showViewer.value = true;
            }
        });
    });
}

onMounted(() => {
    nextTick(enhanceArticleDom);
});

watch(() => props.content, () => {
    nextTick(enhanceArticleDom);
});

onUnmounted(() => {
    if (contentRef.value) {
        contentRef.value.querySelectorAll('img').forEach((img) => unobserveLazy(img));
    }
});
</script>

<style scoped>
.article-body {
    position: relative;
    padding: 10px 0;
}

/* 全新设计的呼吸感与层次感阅读排版 */
.inner-html {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    font-size: 16px;
    line-height: 1.95;
    letter-spacing: 0.015em;
    color: #1C3330;
    word-break: break-word;
}

/* 段落：呼吸感行距、适度段落下边距与两端对齐 */
.inner-html :deep(p) {
    margin: 0 0 24px;
    color: #1C3330;
    line-height: 1.95;
    text-align: justify;
    text-justify: inter-word;
}

/* 首段引导调优 */
.inner-html :deep(p:first-of-type) {
    font-size: 16.5px;
    color: #123835;
    font-weight: 500;
}

/* 标题层次与二次元初音渐变标记 */
.inner-html :deep(h1),
.inner-html :deep(h2) {
    color: #0C2825;
    font-weight: 900;
    margin: 48px 0 20px;
    padding: 8px 14px;
    border-bottom: 1px solid rgba(57, 197, 187, 0.22);
    background: linear-gradient(90deg, rgba(57, 197, 187, 0.08) 0%, transparent 100%);
    border-radius: 10px;
    line-height: 1.4;
    scroll-margin-top: 100px;
    letter-spacing: 0.5px;
}

.inner-html :deep(h1) { font-size: 25px; }
.inner-html :deep(h2) { font-size: 21.5px; }

.inner-html :deep(h3),
.inner-html :deep(h4) {
    color: #0E2E2A;
    font-weight: 800;
    margin: 36px 0 16px;
    padding-left: 0;
    line-height: 1.4;
    scroll-margin-top: 100px;
}

.inner-html :deep(h3) { font-size: 18.5px; }
.inner-html :deep(h4) { font-size: 16.5px; }

/* 列表规范 */
.inner-html :deep(ul),
.inner-html :deep(ol) {
    margin: 18px 0 26px;
    padding-left: 26px;
}

.inner-html :deep(li) {
    margin-bottom: 10px;
    line-height: 1.85;
    color: #1C3330;
}

.inner-html :deep(ul li::marker) {
    color: #12A79C;
    font-size: 1.1em;
}

.inner-html :deep(ol li::marker) {
    color: #FF007F;
    font-weight: 800;
}

/* 强调与高亮文本 */
.inner-html :deep(strong) {
    color: #0C2825;
    font-weight: 800;
    background: linear-gradient(180deg, transparent 65%, rgba(57, 197, 187, 0.25) 65%);
    padding: 0 3px;
}

.inner-html :deep(em) {
    color: #FF007F;
    font-style: italic;
    padding: 0 2px;
}

.inner-html :deep(code:not(pre code)) {
    background: rgba(57, 197, 187, 0.12);
    color: #007F75;
    border-radius: 6px;
    padding: 2px 7px;
    font-family: 'Fira Code', Consolas, Monaco, monospace;
    font-size: 0.9em;
    font-weight: 700;
    border: none;
}

.inner-html :deep(a) {
    color: #12A79C;
    font-weight: 700;
    text-decoration: underline;
    text-decoration-color: rgba(57, 197, 187, 0.4);
    text-underline-offset: 4px;
    transition: color 0.2s ease, text-decoration-color 0.2s ease;
}

.inner-html :deep(a:hover) {
    color: #FF007F;
    text-decoration-color: #FF007F;
}

/* 文章插图：干净呈现，100% 完整显示不裁剪 */
.inner-html :deep(img) {
    max-width: 100%;
    height: auto;
    object-fit: contain;
    display: block;
    margin: 32px auto;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(57, 197, 187, 0.16);
    transition: all 0.3s ease;
    cursor: zoom-in;
    border: none;
}

.inner-html :deep(img:hover) {
    transform: scale(1.015);
    box-shadow: 0 14px 40px rgba(57, 197, 187, 0.28);
}

/* 代码块：青绿细边框与高亮黑极客终端 */
.inner-html :deep(pre) {
    position: relative;
    background: rgba(12, 19, 32, 0.96);
    color: #E2E8F0;
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
    font-size: 13.5px;
    line-height: 1.75;
    margin: 32px 0;
    border: none;
    box-shadow: 0 8px 32px rgba(57, 197, 187, 0.12), 0 4px 16px rgba(12, 19, 32, 0.2);
}

.inner-html :deep(.terminal-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 18px;
    background: rgba(8, 13, 22, 0.92);
    border-bottom: 1px solid rgba(57, 197, 187, 0.25);
    user-select: none;
}

.inner-html :deep(.terminal-left) {
    display: flex;
    align-items: center;
    gap: 12px;
}

.inner-html :deep(.terminal-dots) {
    display: flex;
    gap: 6px;
}

.inner-html :deep(.dot) {
    width: 9px;
    height: 9px;
    border-radius: 50%;
}
.inner-html :deep(.dot-red) { background: #FF5F56; }
.inner-html :deep(.dot-yellow) { background: #FFBD2E; }
.inner-html :deep(.dot-green) { background: #27C93F; }

.inner-html :deep(.terminal-lang-badge) {
    font-family: monospace;
    font-size: 11px;
    font-weight: 800;
    color: #39C5BB;
    letter-spacing: 1px;
}

.inner-html :deep(.terminal-copy-btn) {
    background: rgba(57, 197, 187, 0.15);
    border: none;
    color: #39C5BB;
    font-size: 11px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.inner-html :deep(.terminal-copy-btn:hover) {
    background: rgba(57, 197, 187, 0.3);
    color: #FFFFFF;
    box-shadow: 0 0 8px rgba(57, 197, 187, 0.4);
}

.inner-html :deep(pre code) {
    display: block;
    padding: 18px 22px;
    overflow-x: auto;
    font-family: 'Fira Code', Consolas, Monaco, monospace;
}

/* 引用提示块 Callout 规范 */
.inner-html :deep(.callout-block) {
    margin: 28px 0;
    padding: 18px 22px;
    border-radius: 14px;
    border: none;
    background: rgba(230, 250, 247, 0.85);
}

.inner-html :deep(.callout-header) {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    font-size: 13.5px;
    color: #12A79C;
    margin-bottom: 6px;
}

.inner-html :deep(.callout-content) {
    font-size: 14.5px;
    color: #1C3330;
    line-height: 1.85;
}

.inner-html :deep(.callout-tip) {
    border-left-color: #27C93F;
    background: rgba(235, 250, 238, 0.85);
}
.inner-html :deep(.callout-tip .callout-header) { color: #1E8E2D; }

.inner-html :deep(.callout-warning) {
    border-left-color: #FF9800;
    background: rgba(255, 248, 235, 0.85);
}
.inner-html :deep(.callout-warning .callout-header) { color: #E65100; }

@media (max-width: 768px) {
    .inner-html {
        font-size: 15px;
        line-height: 1.8;
    }
    .inner-html :deep(p) {
        margin-bottom: 18px;
        line-height: 1.8;
    }
    .inner-html :deep(h1) { font-size: 20px; margin: 24px 0 14px; }
    .inner-html :deep(h2) { font-size: 18px; margin: 20px 0 12px; }
    .inner-html :deep(h3) { font-size: 16px; margin: 16px 0 10px; }
    .inner-html :deep(pre) {
        margin: 16px 0;
        border-radius: 12px;
        max-width: 100%;
        overflow: hidden;
    }
    .inner-html :deep(pre code) {
        padding: 14px 16px;
        font-size: 12.5px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    .inner-html :deep(table) {
        display: block;
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        margin: 16px 0;
        border-radius: 8px;
    }
    .inner-html :deep(img) {
        max-width: 100%;
        height: auto;
        border-radius: 12px;
        margin: 14px 0;
    }
    .inner-html :deep(.callout-block) {
        margin: 18px 0;
        padding: 14px 16px;
        border-radius: 12px;
    }
}
</style>