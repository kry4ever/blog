# 个人技术博客 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Astro 4.x 搭建一个极简风格的个人技术博客，部署到 Cloudflare Pages，支持 Markdown 写作、首页置顶、标签、归档、RSS、Pagefind 搜索。

**Architecture:** 静态站点（SSG）。本地写 Markdown → Git → GitHub Actions（build + astro check + lychee 死链检查） → Cloudflare Pages 自动部署到全球 CDN。无服务器、无数据库。所有客户端 JS（仅代码复制按钮 + 按需加载的 Pagefind 搜索）按需启用，正常阅读页面零 JS。

**Tech Stack:** Astro 4.x、TypeScript、Zod schema（内容集合）、Shiki（代码高亮）、`@astrojs/mdx` `@astrojs/sitemap` `@astrojs/rss`、Pagefind（搜索）、marked（仅渲染 frontmatter overview 内联 Markdown）、GitHub Actions、lychee（死链检查）、Cloudflare Pages、Cloudflare Web Analytics。

**Spec 来源:** `docs/superpowers/specs/2026-05-30-personal-blog-design.md`

---

## File Structure

下面是计划完成后项目应有的文件清单（按职责分组）。

### 配置文件
- `package.json` —— 依赖与脚本（dev/build/preview/check）
- `astro.config.mjs` —— Astro 集成与 markdown 配置
- `tsconfig.json` —— TS 配置（继承 Astro `strict`）
- `.gitignore`
- `.github/workflows/ci.yml` —— CI 流水线
- `README.md` —— 项目说明（本地起步、写文章流程）

### 内容
- `src/content/config.ts` —— 内容集合 schema (Zod)
- `src/content/blog/2026-05-30-hello-world.md` —— 首篇文章（用作冒烟测试 + 上线第一篇）
- `src/pages/about.md` —— 关于页（占位内容）

### 路由（页面）
- `src/pages/index.astro` —— 首页：自我介绍 + 置顶文章列表
- `src/pages/archive.astro` —— 归档：按年分组
- `src/pages/tags/index.astro` —— 标签总览
- `src/pages/tags/[tag].astro` —— 标签详情
- `src/pages/posts/[slug].astro` —— 文章详情
- `src/pages/rss.xml.ts` —— RSS feed
- `src/pages/404.astro` —— 自定义 404

### 布局
- `src/layouts/BaseLayout.astro` —— 全站基础（head/header/footer）
- `src/layouts/PostLayout.astro` —— 文章详情专用（含 TOC + 元信息）

### 组件
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/PostCard.astro` —— 列表卡片（归档/标签页用）
- `src/components/PinnedPostCard.astro` —— 首页置顶卡片（含 overview）
- `src/components/PostMeta.astro` —— 日期 + 阅读时长 + 标签
- `src/components/TagList.astro` —— 标签胶囊列表
- `src/components/TableOfContents.astro` —— 文章 TOC
- `src/components/CodeCopyButton.astro` —— 代码块复制按钮（少量 JS）
- `src/components/Search.astro` —— Pagefind 搜索框（按需加载）

### 工具库
- `src/lib/site.ts` —— 站点元信息常量
- `src/lib/getPosts.ts` —— 文章数据访问统一入口
- `src/lib/readingTime.ts` —— 阅读时长估算
- `src/lib/inlineMarkdown.ts` —— inline-only Markdown 渲染（用于 overview）

### 样式 / 静态
- `src/styles/global.css` —— CSS 变量 + 重置 + 排版基础
- `public/favicon.svg`
- `public/robots.txt`
- `public/og-default.png` —— 默认 og:image（占位 SVG/PNG）

### 测试
- `tests/lib/readingTime.test.ts`
- `tests/lib/inlineMarkdown.test.ts`
- `tests/lib/getPosts.test.ts`

> 说明：spec 第 13 节明确"不写单元测试，靠构建即测试"。但 `readingTime.ts` / `inlineMarkdown.ts` / `getPosts.ts` 三个**纯函数模块**逻辑略复杂（中文计字符、过滤草稿优先级、inline-only Markdown 安全性），值得各自一个 vitest 测试文件作为 TDD 红绿循环的载体。其他都靠 `astro check` + `npm run build` + 手动预览覆盖。

---

## 执行顺序与原则

- 严格 TDD：每个有逻辑的模块**先写失败测试**，再写实现，再确认通过，再 commit。
- 每完成一个 Task 立即 `git commit`，commit message 用约定式（`feat:` `chore:` `docs:`）。
- 整个 Plan 分为 **15 个 Task**，前 2 个建项目骨架，3-6 写核心库（带测试），7-13 写页面与组件，14 写 CI，15 部署上线。

---

## Task 1: 项目脚手架与基础配置

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/env.d.ts`
- Create: `README.md`

- [ ] **Step 1: 运行 Astro 官方脚手架**

Run:
```bash
cd /Users/bytedance/workspace/blog
npm create astro@latest . -- --template minimal --typescript strict --install --no-git
```

期望：当前目录被填上 Astro 最小模板。脚手架会创建 `package.json` `astro.config.mjs` `tsconfig.json` `.gitignore` `src/pages/index.astro` `src/env.d.ts` 等文件。

- [ ] **Step 2: 安装项目其余依赖**

Run:
```bash
cd /Users/bytedance/workspace/blog
npm install @astrojs/mdx @astrojs/sitemap @astrojs/rss
npm install marked
npm install -D pagefind vitest @types/node
```

期望：`package.json` 的 `dependencies` / `devDependencies` 增加上述包；`node_modules/` 安装成功。

- [ ] **Step 3: 改写 `package.json` 脚本**

将 `package.json` 的 `scripts` 段替换为：

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  }
}
```

- [ ] **Step 4: 改写 `astro.config.mjs`**

文件内容覆盖为：

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://example.pages.dev',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
```

> `site` 字段在 Task 15 部署后改成实际 URL。

- [ ] **Step 5: 追加 `.gitignore`**

将以下内容追加到现有 `.gitignore`（去重保留）：

```
.astro/
.superpowers/
.DS_Store
.env
.env.local
```

- [ ] **Step 6: 创建简单的 `README.md`**

`README.md` 内容：

```markdown
# 个人技术博客

基于 Astro + Cloudflare Pages 的极简博客。

## 本地开发

\`\`\`bash
npm install
npm run dev    # 启动开发服务器（默认 4321 端口）
npm run check  # 类型与 frontmatter schema 校验
npm run build  # 生产构建
\`\`\`

## 写一篇新文章

新建 \`src/content/blog/YYYY-MM-DD-<slug>.md\`，按 \`src/content/config.ts\` 定义的 frontmatter schema 填字段。

## 部署

主分支 push 后由 Cloudflare Pages 自动构建并发布。
```

- [ ] **Step 7: 验证脚手架可启动**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run dev
```

期望：终端打印 `Local: http://localhost:4321/`，没有报错。按 Ctrl-C 退出。

- [ ] **Step 8: Commit**

```bash
cd /Users/bytedance/workspace/blog
git init
git add .
git commit -m "chore: scaffold Astro project with deps and scripts"
```

---

## Task 2: 站点常量与基础样式

**Files:**
- Create: `src/lib/site.ts`
- Create: `src/styles/global.css`
- Create: `public/robots.txt`

- [ ] **Step 1: 写 `src/lib/site.ts`**

```ts
// src/lib/site.ts
// 站点元信息常量。改一处即可影响全站标题、描述、作者。

export const SITE = {
  title: '我的技术博客',
  description: '关于编程、系统、与读源码的笔记。',
  author: '站点作者',
  // 部署后填实际 URL；本地开发用占位
  url: 'https://example.pages.dev',
  // 首页副标题（自我介绍）
  bio: '工程师 / 在这里记一些想清楚之后的笔记。',
  // RSS 中显示的语言
  language: 'zh-CN',
} as const;
```

- [ ] **Step 2: 写 `src/styles/global.css`**

```css
/* src/styles/global.css */
/* 极简风格：白底黑字、大留白、系统字体。仅浅色主题。 */

:root {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-text-muted: #666666;
  --color-border: #e5e5e5;
  --color-accent: #0066cc;
  --color-code-bg: #f6f8fa;

  --font-sans:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Microsoft YaHei", system-ui, sans-serif;
  --font-mono:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

  --max-content-width: 720px;
  --reading-width: 68ch;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--color-accent);
  text-decoration: none;
}
a:hover { text-decoration: underline; }

main {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 32px 24px 64px;
}

h1, h2, h3, h4 { line-height: 1.3; font-weight: 600; }
h1 { font-size: 2rem; margin-top: 0; }
h2 { font-size: 1.5rem; margin-top: 2.5em; }
h3 { font-size: 1.2rem; margin-top: 2em; }

p, ul, ol, blockquote { margin: 1em 0; }

blockquote {
  border-left: 3px solid var(--color-border);
  padding-left: 1em;
  color: var(--color-text-muted);
}

img { max-width: 100%; height: auto; }

code {
  font-family: var(--font-mono);
  font-size: 0.92em;
  background: var(--color-code-bg);
  padding: 0.15em 0.35em;
  border-radius: 3px;
}

pre {
  background: var(--color-code-bg);
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  position: relative;
}
pre code {
  background: transparent;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.6;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}
th, td {
  border: 1px solid var(--color-border);
  padding: 8px 12px;
  text-align: left;
}

hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 2.5em 0;
}

/* 标签胶囊 */
.tag-pill {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  background: var(--color-code-bg);
  padding: 2px 10px;
  border-radius: 12px;
  margin-right: 6px;
}
.tag-pill:hover { color: var(--color-accent); }

/* 文章日期/元信息 */
.post-meta {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-bottom: 1.5em;
}

/* 焦点环：保留无障碍 */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

- [ ] **Step 3: 写 `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://example.pages.dev/sitemap-index.xml
```

> 部署后改成实际域名。

- [ ] **Step 4: 验证不报错**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run check
```

期望：astro check 通过（可能 0 errors / 0 warnings）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/site.ts src/styles/global.css public/robots.txt
git commit -m "feat: add site constants, base styles, robots.txt"
```

---

## Task 3: 内容集合 Schema

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/blog/.gitkeep`

- [ ] **Step 1: 写 `src/content/config.ts`**

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    // 必填
    title: z.string().min(1).max(100),
    pubDate: z.date(),
    description: z.string().min(1).max(200),

    // 可选
    updatedDate: z.date().optional(),
    tags: z.array(z.string()).default([]),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    draft: z.boolean().default(false),

    // 首页置顶
    pinned: z.boolean().default(false),
    overview: z.string().optional(),
  }),
});

export const collections = { blog };
```

- [ ] **Step 2: 创建占位文件让目录被 git 跟踪**

Run:
```bash
touch /Users/bytedance/workspace/blog/src/content/blog/.gitkeep
```

- [ ] **Step 3: 验证 schema 编译通过**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run check
```

期望：astro check 通过。

- [ ] **Step 4: Commit**

```bash
git add src/content/config.ts src/content/blog/.gitkeep
git commit -m "feat: add blog content collection schema"
```

---

## Task 4: `readingTime` 工具（TDD）

**Files:**
- Create: `tests/lib/readingTime.test.ts`
- Create: `src/lib/readingTime.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: 写 `vitest.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: 写失败测试 `tests/lib/readingTime.test.ts`**

```ts
// tests/lib/readingTime.test.ts
import { describe, it, expect } from 'vitest';
import { estimateReadingMinutes } from '../../src/lib/readingTime';

describe('estimateReadingMinutes', () => {
  it('returns at least 1 minute for short content', () => {
    expect(estimateReadingMinutes('你好')).toBe(1);
  });

  it('estimates ~1 minute for ~400 chinese characters', () => {
    const text = '中'.repeat(400);
    expect(estimateReadingMinutes(text)).toBe(1);
  });

  it('estimates ~2 minutes for ~800 chinese characters', () => {
    const text = '中'.repeat(800);
    expect(estimateReadingMinutes(text)).toBe(2);
  });

  it('counts english words separately at ~250 wpm', () => {
    // 500 个英文单词 ≈ 2 分钟
    const text = ('hello '.repeat(500)).trim();
    expect(estimateReadingMinutes(text)).toBe(2);
  });

  it('handles mixed chinese and english', () => {
    // 400 中文 (1 分钟) + 250 英文 (1 分钟) ≈ 2 分钟
    const text = '中'.repeat(400) + ' ' + ('word '.repeat(250)).trim();
    expect(estimateReadingMinutes(text)).toBe(2);
  });

  it('returns 1 minute for empty string (sane minimum)', () => {
    expect(estimateReadingMinutes('')).toBe(1);
  });
});
```

- [ ] **Step 3: 跑测试看它失败**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm test -- readingTime
```

期望：FAIL，提示 `Cannot find module '../../src/lib/readingTime'`。

- [ ] **Step 4: 实现 `src/lib/readingTime.ts`**

```ts
// src/lib/readingTime.ts
// 阅读时长估算：中文按 400 字/分钟，英文按 250 词/分钟。
// 中文字符通过 Unicode 范围识别（CJK 统一表意文字 + 标点）。

const CHINESE_CHARS_PER_MINUTE = 400;
const ENGLISH_WORDS_PER_MINUTE = 250;

const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/g;

export function estimateReadingMinutes(text: string): number {
  if (!text) return 1;

  const chineseChars = (text.match(CJK_REGEX) || []).length;

  // 去掉中文字符后按空白分词数英文词
  const englishText = text.replace(CJK_REGEX, ' ');
  const englishWords = englishText
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w)).length;

  const minutes =
    chineseChars / CHINESE_CHARS_PER_MINUTE +
    englishWords / ENGLISH_WORDS_PER_MINUTE;

  return Math.max(1, Math.round(minutes));
}
```

- [ ] **Step 5: 跑测试看它通过**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm test -- readingTime
```

期望：6 tests passed。

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/lib/readingTime.test.ts src/lib/readingTime.ts
git commit -m "feat: add readingTime utility with tests"
```

---

## Task 5: `inlineMarkdown` 工具（TDD）

**Files:**
- Create: `tests/lib/inlineMarkdown.test.ts`
- Create: `src/lib/inlineMarkdown.ts`

只在首页 `PinnedPostCard` 渲染 frontmatter 的 `overview` 字段时使用。仅支持 inline 元素（`**bold**` `*em*` `[link](url)` `\`code\``），不支持代码块/图片，避免卡片视觉爆开。

- [ ] **Step 1: 写失败测试 `tests/lib/inlineMarkdown.test.ts`**

```ts
// tests/lib/inlineMarkdown.test.ts
import { describe, it, expect } from 'vitest';
import { renderInlineMarkdown } from '../../src/lib/inlineMarkdown';

describe('renderInlineMarkdown', () => {
  it('returns empty string for undefined or empty input', () => {
    expect(renderInlineMarkdown(undefined)).toBe('');
    expect(renderInlineMarkdown('')).toBe('');
  });

  it('renders plain text unchanged (escaped)', () => {
    expect(renderInlineMarkdown('hello world')).toBe('hello world');
  });

  it('renders bold', () => {
    expect(renderInlineMarkdown('**bold**')).toBe('<strong>bold</strong>');
  });

  it('renders italic', () => {
    expect(renderInlineMarkdown('*em*')).toBe('<em>em</em>');
  });

  it('renders link', () => {
    expect(renderInlineMarkdown('[a](https://x)')).toBe(
      '<a href="https://x">a</a>'
    );
  });

  it('renders inline code', () => {
    expect(renderInlineMarkdown('`code`')).toBe('<code>code</code>');
  });

  it('does not render block-level markdown (code fence)', () => {
    const out = renderInlineMarkdown('```\nfoo\n```');
    // 不允许出现 <pre>
    expect(out).not.toContain('<pre>');
  });

  it('does not render images', () => {
    const out = renderInlineMarkdown('![alt](x.png)');
    expect(out).not.toContain('<img');
  });
});
```

- [ ] **Step 2: 跑测试看它失败**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm test -- inlineMarkdown
```

期望：FAIL（模块未找到）。

- [ ] **Step 3: 实现 `src/lib/inlineMarkdown.ts`**

```ts
// src/lib/inlineMarkdown.ts
// 仅渲染 frontmatter 中 overview 字段的 inline Markdown。
// 安全前提:输入来自仓库的可信 frontmatter,无 XSS 风险。
// 我们仍主动剥离 HTML 标签,保证即便作者写错也只产生纯文本。

import { marked } from 'marked';

export function renderInlineMarkdown(input: string | undefined): string {
  if (!input) return '';

  // 1. 剥离作者可能误写的 HTML 标签(粗暴但简单且安全)
  const stripped = input.replace(/<[^>]*>/g, '');

  // 2. 移除图片语法(行内或块级):![alt](url)
  const noImages = stripped.replace(/!\[[^\]]*\]\([^)]*\)/g, '');

  // 3. 用 marked 的 inline 模式渲染
  const html = marked.parseInline(noImages, { async: false }) as string;

  return html.trim();
}
```

- [ ] **Step 4: 跑测试看它通过**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm test -- inlineMarkdown
```

期望：8 tests passed。

- [ ] **Step 5: Commit**

```bash
git add tests/lib/inlineMarkdown.test.ts src/lib/inlineMarkdown.ts
git commit -m "feat: add inline-only markdown renderer for overview"
```

---

## Task 6: `getPosts` 文章数据访问层（TDD）

**Files:**
- Create: `tests/lib/getPosts.test.ts`
- Create: `src/lib/getPosts.ts`

由于 `getCollection` 是 Astro 注入的运行时 API，测试里需要把它 mock 掉。

- [ ] **Step 1: 写失败测试 `tests/lib/getPosts.test.ts`**

```ts
// tests/lib/getPosts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 用工厂 mock astro:content 的 getCollection。每个测试用 mockReturnValue 注入数据。
const getCollectionMock = vi.fn();

vi.mock('astro:content', () => ({
  getCollection: (name: string, filter?: (entry: any) => boolean) =>
    getCollectionMock(name, filter),
}));

// 帮助构造测试用的 entry
function makeEntry(slug: string, data: Partial<any>) {
  return {
    slug,
    data: {
      title: 't',
      pubDate: new Date(),
      description: 'd',
      tags: [],
      draft: false,
      pinned: false,
      ...data,
    },
    body: '正文'.repeat(200),
  };
}

beforeEach(() => {
  getCollectionMock.mockReset();
  vi.stubEnv('PROD', 'true');
});

describe('getPosts', () => {
  it('getAllPosts filters out drafts in production', async () => {
    getCollectionMock.mockImplementation(async (_name, filter) => {
      const entries = [
        makeEntry('a', { pubDate: new Date('2026-01-01') }),
        makeEntry('b', { pubDate: new Date('2026-02-01'), draft: true }),
        makeEntry('c', { pubDate: new Date('2026-03-01') }),
      ];
      return filter ? entries.filter(filter) : entries;
    });

    const { getAllPosts } = await import('../../src/lib/getPosts');
    const posts = await getAllPosts();
    expect(posts.map((p) => p.slug)).toEqual(['c', 'a']); // 按 pubDate 倒序
  });

  it('getAllPosts sorts by pubDate descending', async () => {
    getCollectionMock.mockImplementation(async () => [
      makeEntry('old', { pubDate: new Date('2025-01-01') }),
      makeEntry('new', { pubDate: new Date('2026-01-01') }),
      makeEntry('mid', { pubDate: new Date('2025-06-01') }),
    ]);

    const { getAllPosts } = await import('../../src/lib/getPosts');
    const posts = await getAllPosts();
    expect(posts.map((p) => p.slug)).toEqual(['new', 'mid', 'old']);
  });

  it('getPinnedPosts returns only pinned, sorted desc', async () => {
    getCollectionMock.mockImplementation(async () => [
      makeEntry('a', { pubDate: new Date('2026-01-01'), pinned: true }),
      makeEntry('b', { pubDate: new Date('2026-02-01'), pinned: false }),
      makeEntry('c', { pubDate: new Date('2026-03-01'), pinned: true }),
    ]);

    const { getPinnedPosts } = await import('../../src/lib/getPosts');
    const posts = await getPinnedPosts();
    expect(posts.map((p) => p.slug)).toEqual(['c', 'a']);
  });

  it('getPostsByTag filters and sorts', async () => {
    getCollectionMock.mockImplementation(async () => [
      makeEntry('a', { pubDate: new Date('2026-01-01'), tags: ['go'] }),
      makeEntry('b', { pubDate: new Date('2026-02-01'), tags: ['rust'] }),
      makeEntry('c', { pubDate: new Date('2026-03-01'), tags: ['go', 'runtime'] }),
    ]);

    const { getPostsByTag } = await import('../../src/lib/getPosts');
    const posts = await getPostsByTag('go');
    expect(posts.map((p) => p.slug)).toEqual(['c', 'a']);
  });

  it('getAllTags returns counts sorted desc', async () => {
    getCollectionMock.mockImplementation(async () => [
      makeEntry('a', { tags: ['go', 'runtime'] }),
      makeEntry('b', { tags: ['go'] }),
      makeEntry('c', { tags: ['rust'] }),
      makeEntry('d', { tags: ['go'] }),
    ]);

    const { getAllTags } = await import('../../src/lib/getPosts');
    const tags = await getAllTags();
    expect(tags).toEqual([
      { tag: 'go', count: 3 },
      { tag: 'rust', count: 1 },
      { tag: 'runtime', count: 1 },
    ]);
  });
});
```

- [ ] **Step 2: 跑测试看它失败**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm test -- getPosts
```

期望：FAIL（模块未找到）。

- [ ] **Step 3: 实现 `src/lib/getPosts.ts`**

```ts
// src/lib/getPosts.ts
// 文章数据访问统一入口。所有页面想拿文章列表都从这里取,
// 草稿过滤、排序、标签聚合等逻辑只在这一处维护。

import { getCollection, type CollectionEntry } from 'astro:content';
import { estimateReadingMinutes } from './readingTime';

export type Post = CollectionEntry<'blog'> & {
  readingMinutes: number;
};

function attachReadingTime(entry: CollectionEntry<'blog'>): Post {
  return {
    ...entry,
    readingMinutes: estimateReadingMinutes(entry.body),
  };
}

function sortByPubDateDesc<T extends { data: { pubDate: Date } }>(a: T, b: T) {
  return b.data.pubDate.getTime() - a.data.pubDate.getTime();
}

// 草稿过滤:生产构建剔除草稿,本地开发保留以便预览。
const includeEntry = (entry: CollectionEntry<'blog'>) =>
  import.meta.env.PROD ? !entry.data.draft : true;

export async function getAllPosts(): Promise<Post[]> {
  const entries = await getCollection('blog', includeEntry);
  return entries.sort(sortByPubDateDesc).map(attachReadingTime);
}

export async function getPinnedPosts(): Promise<Post[]> {
  const all = await getAllPosts();
  return all.filter((p) => p.data.pinned);
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const all = await getAllPosts();
  return all.filter((p) => p.data.tags.includes(tag));
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const all = await getAllPosts();
  const counts = new Map<string, number>();
  for (const p of all) {
    for (const tag of p.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
```

- [ ] **Step 4: 跑测试看它通过**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm test -- getPosts
```

期望：5 tests passed。

- [ ] **Step 5: 跑全部测试确认无回归**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm test
```

期望：3 个测试文件全绿（readingTime + inlineMarkdown + getPosts，共 19 tests）。

- [ ] **Step 6: Commit**

```bash
git add tests/lib/getPosts.test.ts src/lib/getPosts.ts
git commit -m "feat: add getPosts data access layer"
```

---

## Task 7: 基础布局与公共组件

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`

- [ ] **Step 1: 写 `src/components/Header.astro`**

```astro
---
import { SITE } from '../lib/site';
---
<header class="site-header">
  <div class="inner">
    <a href="/" class="brand">{SITE.title}</a>
    <nav>
      <a href="/archive">归档</a>
      <a href="/tags">标签</a>
      <a href="/about">关于</a>
      <a href="/rss.xml" aria-label="RSS feed">RSS</a>
    </nav>
  </div>
</header>

<style>
  .site-header {
    border-bottom: 1px solid var(--color-border);
  }
  .inner {
    max-width: var(--max-content-width);
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand {
    font-weight: 600;
    color: var(--color-text);
  }
  nav a {
    margin-left: 16px;
    color: var(--color-text-muted);
    font-size: 0.95rem;
  }
  nav a:hover { color: var(--color-accent); }
</style>
```

- [ ] **Step 2: 写 `src/components/Footer.astro`**

```astro
---
import { SITE } from '../lib/site';
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <p>© {year} {SITE.author} · <a href="/rss.xml">RSS</a></p>
</footer>

<style>
  .site-footer {
    border-top: 1px solid var(--color-border);
    padding: 24px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }
</style>
```

- [ ] **Step 3: 写 `src/layouts/BaseLayout.astro`**

```astro
---
import { SITE } from '../lib/site';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';

export interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  // 文章页传入 jsonLd 字符串(JSON.stringify 后的 Article schema)
  jsonLd?: string;
}

const {
  title,
  description = SITE.description,
  ogImage,
  jsonLd,
} = Astro.props;

const fullTitle = title === SITE.title ? title : `${title} — ${SITE.title}`;
const canonical = new URL(Astro.url.pathname, SITE.url).toString();
const ogImageUrl = ogImage
  ? new URL(ogImage, SITE.url).toString()
  : new URL('/og-default.png', SITE.url).toString();
---
<!doctype html>
<html lang={SITE.language}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- OpenGraph -->
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImageUrl} />
    <meta property="og:type" content="website" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />

    <!-- RSS auto-discovery -->
    <link
      rel="alternate"
      type="application/rss+xml"
      title={SITE.title}
      href="/rss.xml"
    />

    {jsonLd && <script type="application/ld+json" set:html={jsonLd} />}
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 4: 创建占位 favicon 与 og-default**

写 `public/favicon.svg`：

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#1a1a1a"/>
  <text x="32" y="42" text-anchor="middle" font-family="system-ui" font-size="32" fill="#fff">B</text>
</svg>
```

写 `public/og-default.svg`（暂时用 SVG，部署前可换成 PNG）：

> 注意：`og:image` 主流社交平台兼容性偏好 PNG/JPG。我们先用一个 1200x630 的 SVG 作为占位，并在 `BaseLayout` 用 `og-default.png`——所以现在直接生成一个 PNG 就好。

由于不能在脚本里造 PNG，**先用一个 1×1 透明占位**：

Run:
```bash
cd /Users/bytedance/workspace/blog
# 1x1 透明 PNG (base64) 作为占位,避免 og:image 404
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xfc\xff\xff?\x00\x05\xfe\x02\xfe\xa3oc7\x00\x00\x00\x00IEND\xaeB`\x82' > public/og-default.png
```

> 上线前替换为真正的 1200×630 站点封面图。

- [ ] **Step 5: 修改默认首页测试基础布局**

把 `src/pages/index.astro`（脚手架已生成）替换为：

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { SITE } from '../lib/site';
---
<BaseLayout title={SITE.title}>
  <h1>{SITE.title}</h1>
  <p>{SITE.bio}</p>
</BaseLayout>
```

- [ ] **Step 6: 验证可启动**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run dev
```

打开 http://localhost:4321 ，应能看到 Header（带导航）、main 中的 H1 和简介、Footer。

按 Ctrl-C 退出。

- [ ] **Step 7: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/Header.astro src/components/Footer.astro src/pages/index.astro public/favicon.svg public/og-default.png
git commit -m "feat: add base layout, header, footer, favicon"
```

---

## Task 8: 文章卡片与元信息组件

**Files:**
- Create: `src/components/PostMeta.astro`
- Create: `src/components/TagList.astro`
- Create: `src/components/PostCard.astro`
- Create: `src/components/PinnedPostCard.astro`

- [ ] **Step 1: 写 `src/components/TagList.astro`**

```astro
---
export interface Props {
  tags: string[];
}
const { tags } = Astro.props;
---
{tags.length > 0 && (
  <span class="tag-list">
    {tags.map((tag) => (
      <a href={`/tags/${encodeURIComponent(tag)}`} class="tag-pill">#{tag}</a>
    ))}
  </span>
)}
```

- [ ] **Step 2: 写 `src/components/PostMeta.astro`**

```astro
---
import TagList from './TagList.astro';

export interface Props {
  pubDate: Date;
  updatedDate?: Date;
  readingMinutes: number;
  tags: string[];
}

const { pubDate, updatedDate, readingMinutes, tags } = Astro.props;

const fmt = (d: Date) =>
  d.toISOString().slice(0, 10);
---
<div class="post-meta">
  <time datetime={pubDate.toISOString()}>{fmt(pubDate)}</time>
  <span> · </span>
  <span>{readingMinutes} min read</span>
  {updatedDate && (
    <>
      <span> · </span>
      <span>updated {fmt(updatedDate)}</span>
    </>
  )}
  {tags.length > 0 && (
    <>
      <span> · </span>
      <TagList tags={tags} />
    </>
  )}
</div>
```

- [ ] **Step 3: 写 `src/components/PostCard.astro`**

```astro
---
import PostMeta from './PostMeta.astro';

export interface Props {
  title: string;
  description?: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  slug: string;
  readingMinutes: number;
}

const { title, description, pubDate, updatedDate, tags, slug, readingMinutes } =
  Astro.props;
---
<article class="post-card">
  <a href={`/posts/${slug}`} class="title-link">
    <h2>{title}</h2>
  </a>
  <PostMeta {pubDate} {updatedDate} {readingMinutes} {tags} />
  {description && <p class="desc">{description}</p>}
</article>

<style>
  .post-card {
    padding: 24px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .post-card:last-child { border-bottom: none; }
  .title-link { color: var(--color-text); }
  .post-card h2 {
    font-size: 1.25rem;
    margin: 0 0 8px;
  }
  .post-card .desc {
    color: var(--color-text-muted);
    margin: 8px 0 0;
  }
</style>
```

- [ ] **Step 4: 写 `src/components/PinnedPostCard.astro`**

```astro
---
import PostMeta from './PostMeta.astro';
import { renderInlineMarkdown } from '../lib/inlineMarkdown';

export interface Props {
  title: string;
  description: string;
  overview?: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  slug: string;
  readingMinutes: number;
}

const {
  title, description, overview, pubDate, updatedDate, tags, slug, readingMinutes,
} = Astro.props;

const overviewHtml = renderInlineMarkdown(overview);

if (overview && !overviewHtml) {
  // 不阻塞构建,只警告
  console.warn(`[PinnedPostCard] overview present but rendered empty for slug "${slug}"`);
}
---
<article class="pinned-card">
  <a href={`/posts/${slug}`} class="title-link">
    <h2>{title}</h2>
  </a>
  <PostMeta {pubDate} {updatedDate} {readingMinutes} {tags} />
  <p class="desc">{description}</p>
  {overviewHtml && (
    <p class="overview" set:html={overviewHtml} />
  )}
</article>

<style>
  .pinned-card {
    padding: 28px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .pinned-card:last-child { border-bottom: none; }
  .title-link { color: var(--color-text); }
  .pinned-card h2 {
    font-size: 1.4rem;
    margin: 0 0 8px;
  }
  .desc {
    color: var(--color-text-muted);
    font-style: italic;
    margin: 8px 0;
  }
  .overview {
    margin: 12px 0 0;
    line-height: 1.7;
  }
</style>
```

- [ ] **Step 5: `npm run check`**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run check
```

期望：通过。

- [ ] **Step 6: Commit**

```bash
git add src/components/PostMeta.astro src/components/TagList.astro src/components/PostCard.astro src/components/PinnedPostCard.astro
git commit -m "feat: add post card components"
```

---

## Task 9: 首页（置顶列表 + 警告 + 兜底）

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/content/blog/2026-05-30-hello-world.md`

- [ ] **Step 1: 写第一篇示例文章**

`src/content/blog/2026-05-30-hello-world.md`:

```markdown
---
title: "Hello, world"
pubDate: 2026-05-30
description: "这是博客的第一篇文章。也是个排版冒烟测试。"
tags: ["meta"]
pinned: true
overview: |
  这篇文章用来验证博客的基础排版与构建链路。其中包含 **粗体**、`内联代码`、[外链](https://astro.build)、列表、代码块等元素。
---

## 引言

欢迎来到本博客。本文用来验证排版。

## 列表

- 第一项
- 第二项
- 第三项

## 代码块

\`\`\`go
package main

import "fmt"

func main() {
    fmt.Println("hello, world")
}
\`\`\`

## 表格

| 项目 | 值 |
| --- | --- |
| 名称 | 博客 |
| 框架 | Astro |
```

- [ ] **Step 2: 重写 `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PinnedPostCard from '../components/PinnedPostCard.astro';
import { getPinnedPosts } from '../lib/getPosts';
import { SITE } from '../lib/site';

const pinned = await getPinnedPosts();
---
<BaseLayout title={SITE.title}>
  <section class="intro">
    <h1>{SITE.title}</h1>
    <p>{SITE.bio}</p>
  </section>

  <section class="pinned">
    {pinned.length === 0 ? (
      <p class="empty">还没有推荐文章,去 <a href="/archive">归档</a> 看看。</p>
    ) : (
      pinned.map((post) => (
        <PinnedPostCard
          title={post.data.title}
          description={post.data.description}
          overview={post.data.overview}
          pubDate={post.data.pubDate}
          updatedDate={post.data.updatedDate}
          tags={post.data.tags}
          slug={post.slug}
          readingMinutes={post.readingMinutes}
        />
      ))
    )}
  </section>

  <p class="see-all">
    <a href="/archive">查看全部 →</a>
  </p>
</BaseLayout>

<style>
  .intro {
    margin-bottom: 32px;
  }
  .intro h1 {
    font-size: 1.6rem;
  }
  .intro p {
    color: var(--color-text-muted);
  }
  .empty {
    color: var(--color-text-muted);
    padding: 24px 0;
  }
  .see-all {
    margin-top: 32px;
    text-align: right;
  }
</style>
```

- [ ] **Step 3: 启动 dev 验证**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run dev
```

打开 http://localhost:4321 ，应看到：
- 简介段
- 一张 PinnedPostCard（标题 "Hello, world"、日期、5 min read 左右、description、overview 渲染了粗体/链接）
- 底部 "查看全部 →"

按 Ctrl-C 退出。

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro src/content/blog/2026-05-30-hello-world.md
git commit -m "feat: implement homepage with pinned post list"
```

---

## Task 10: 文章详情页 + TOC + 复制按钮

**Files:**
- Create: `src/components/TableOfContents.astro`
- Create: `src/components/CodeCopyButton.astro`
- Create: `src/layouts/PostLayout.astro`
- Create: `src/pages/posts/[slug].astro`

- [ ] **Step 1: 写 `src/components/TableOfContents.astro`**

```astro
---
export interface Props {
  headings: { depth: number; slug: string; text: string }[];
}
const { headings } = Astro.props;
const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
---
{items.length > 0 && (
  <nav class="toc" aria-label="目录">
    <p class="toc-title">目录</p>
    <ul>
      {items.map((h) => (
        <li class={`depth-${h.depth}`}>
          <a href={`#${h.slug}`}>{h.text}</a>
        </li>
      ))}
    </ul>
  </nav>
)}

<style>
  .toc {
    font-size: 0.9rem;
  }
  .toc-title {
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    margin: 0 0 8px;
  }
  .toc ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .toc li { margin: 4px 0; }
  .toc li.depth-3 { padding-left: 14px; }
  .toc a {
    color: var(--color-text-muted);
  }
  .toc a:hover { color: var(--color-accent); }

  @media (min-width: 1024px) {
    .toc {
      position: sticky;
      top: 24px;
    }
  }
</style>
```

- [ ] **Step 2: 写 `src/components/CodeCopyButton.astro`**

这是站内**唯一**的客户端 JS。它在页面加载后扫描所有 `<pre>` 元素并注入复制按钮。

```astro
<script>
  document.querySelectorAll('main pre').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText ?? '';
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = 'Copy'), 1500);
      } catch {
        btn.textContent = 'Failed';
        setTimeout(() => (btn.textContent = 'Copy'), 1500);
      }
    });
    (pre as HTMLElement).appendChild(btn);
  });
</script>

<style is:global>
  main pre { position: relative; }
  main pre .copy-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    border: 1px solid var(--color-border);
    background: #fff;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
  }
  main pre:hover .copy-btn { opacity: 1; }
  main pre .copy-btn:hover { color: var(--color-accent); }
</style>
```

- [ ] **Step 3: 写 `src/layouts/PostLayout.astro`**

```astro
---
import BaseLayout from './BaseLayout.astro';
import PostMeta from '../components/PostMeta.astro';
import TableOfContents from '../components/TableOfContents.astro';
import CodeCopyButton from '../components/CodeCopyButton.astro';
import TagList from '../components/TagList.astro';
import { SITE } from '../lib/site';

export interface Props {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  readingMinutes: number;
  headings: { depth: number; slug: string; text: string }[];
  ogImage?: string;
}

const {
  title, description, pubDate, updatedDate, tags, readingMinutes, headings, ogImage,
} = Astro.props;

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  datePublished: pubDate.toISOString(),
  ...(updatedDate ? { dateModified: updatedDate.toISOString() } : {}),
  author: { '@type': 'Person', name: SITE.author },
});
---
<BaseLayout {title} {description} {ogImage} {jsonLd}>
  <article class="post">
    <div class="toc-mobile">
      <details>
        <summary>目录</summary>
        <TableOfContents {headings} />
      </details>
    </div>

    <div class="post-grid">
      <aside class="toc-desktop">
        <TableOfContents {headings} />
      </aside>

      <div class="post-body">
        <h1>{title}</h1>
        <PostMeta {pubDate} {updatedDate} {readingMinutes} {tags} />
        <slot />
        {updatedDate && (
          <p class="updated-note">本文最后更新于 {updatedDate.toISOString().slice(0, 10)}</p>
        )}
        <hr />
        <TagList {tags} />
      </div>
    </div>
  </article>

  <CodeCopyButton />
</BaseLayout>

<style>
  .post-grid { display: block; }
  .post-body { max-width: var(--reading-width); }
  .updated-note {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    font-style: italic;
    margin-top: 32px;
  }
  .toc-mobile {
    margin-bottom: 16px;
  }
  .toc-desktop { display: none; }

  @media (min-width: 1024px) {
    .post-grid {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 48px;
    }
    .toc-mobile { display: none; }
    .toc-desktop { display: block; }
  }
</style>
```

- [ ] **Step 4: 写 `src/pages/posts/[slug].astro`**

```astro
---
import PostLayout from '../../layouts/PostLayout.astro';
import { getAllPosts } from '../../lib/getPosts';

export async function getStaticPaths() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content, headings } = await post.render();
---
<PostLayout
  title={post.data.title}
  description={post.data.description}
  pubDate={post.data.pubDate}
  updatedDate={post.data.updatedDate}
  tags={post.data.tags}
  readingMinutes={post.readingMinutes}
  ogImage={post.data.cover?.src}
  {headings}
>
  <Content />
</PostLayout>
```

- [ ] **Step 5: dev 验证**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run dev
```

访问 http://localhost:4321/posts/2026-05-30-hello-world ，确认：
- 标题、PostMeta、正文渲染。
- 代码块鼠标悬浮可见 Copy 按钮。
- 桌面宽度下右侧有 sticky TOC。
- 标签胶囊在底部显示。

Ctrl-C 退出。

- [ ] **Step 6: Commit**

```bash
git add src/components/TableOfContents.astro src/components/CodeCopyButton.astro src/layouts/PostLayout.astro src/pages/posts/[slug].astro
git commit -m "feat: implement post detail page with TOC and copy button"
```

---

## Task 11: 归档、标签、关于、404 页

**Files:**
- Create: `src/pages/archive.astro`
- Create: `src/pages/tags/index.astro`
- Create: `src/pages/tags/[tag].astro`
- Create: `src/pages/about.md`
- Create: `src/pages/404.astro`

- [ ] **Step 1: 写 `src/pages/archive.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getAllPosts } from '../lib/getPosts';

const posts = await getAllPosts();

// 按年份分组(已是降序),保持降序遍历后产出按年降序的 Map
const byYear = new Map<number, typeof posts>();
for (const p of posts) {
  const y = p.data.pubDate.getFullYear();
  if (!byYear.has(y)) byYear.set(y, []);
  byYear.get(y)!.push(p);
}

const fmt = (d: Date) => d.toISOString().slice(5, 10); // MM-DD
---
<BaseLayout title="归档" description="全部文章按年份归档">
  <h1>归档</h1>
  {[...byYear.entries()].map(([year, posts]) => (
    <section class="year-section">
      <h2>{year}</h2>
      <ul class="archive-list">
        {posts.map((p) => (
          <li>
            <time datetime={p.data.pubDate.toISOString()}>{fmt(p.data.pubDate)}</time>
            <a href={`/posts/${p.slug}`}>{p.data.title}</a>
          </li>
        ))}
      </ul>
    </section>
  ))}
</BaseLayout>

<style>
  .year-section { margin-bottom: 32px; }
  .year-section h2 {
    font-size: 1.2rem;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 6px;
  }
  .archive-list {
    list-style: none;
    padding: 0;
  }
  .archive-list li {
    display: flex;
    gap: 16px;
    padding: 6px 0;
  }
  .archive-list time {
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.9rem;
    min-width: 60px;
  }
</style>
```

- [ ] **Step 2: 写 `src/pages/tags/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getAllTags } from '../../lib/getPosts';

const tags = await getAllTags();
---
<BaseLayout title="标签" description="全部标签">
  <h1>标签</h1>
  {tags.length === 0 ? (
    <p>还没有标签。</p>
  ) : (
    <div class="tag-cloud">
      {tags.map(({ tag, count }) => (
        <a href={`/tags/${encodeURIComponent(tag)}`} class="tag-pill">
          #{tag} ({count})
        </a>
      ))}
    </div>
  )}
</BaseLayout>

<style>
  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 4px;
    margin-top: 16px;
  }
  .tag-cloud .tag-pill { font-size: 0.95rem; }
</style>
```

- [ ] **Step 3: 写 `src/pages/tags/[tag].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostCard from '../../components/PostCard.astro';
import { getAllPosts, getPostsByTag } from '../../lib/getPosts';

export async function getStaticPaths() {
  const posts = await getAllPosts();
  const tags = new Set<string>();
  posts.forEach((p) => p.data.tags.forEach((t) => tags.add(t)));
  return [...tags].map((tag) => ({ params: { tag } }));
}

const { tag } = Astro.params;
const posts = await getPostsByTag(tag!);
---
<BaseLayout title={`#${tag}`} description={`全部带 #${tag} 标签的文章`}>
  <h1>#{tag}</h1>
  <p class="post-meta">{posts.length} 篇文章</p>
  {posts.map((p) => (
    <PostCard
      title={p.data.title}
      description={p.data.description}
      pubDate={p.data.pubDate}
      updatedDate={p.data.updatedDate}
      tags={p.data.tags}
      slug={p.slug}
      readingMinutes={p.readingMinutes}
    />
  ))}
</BaseLayout>
```

- [ ] **Step 4: 写 `src/pages/about.md`**

```markdown
---
layout: ../layouts/BaseLayout.astro
title: "关于"
description: "关于本站和作者"
---

# 关于

这里是个人技术博客。作者:站点作者(待填)。

## 联系

- Email: <待填>
- GitHub: <待填>

## 关于本博客

待作者后续完善。
```

- [ ] **Step 5: 写 `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="404" description="页面不存在">
  <h1>404</h1>
  <p>这里什么也没有。</p>
  <p><a href="/">回到首页</a></p>
</BaseLayout>
```

- [ ] **Step 6: dev 全路径冒烟测试**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run dev
```

依次访问：
- `/archive` —— 看到 2026 年下面的 hello-world 一行
- `/tags` —— 看到 `#meta (1)`
- `/tags/meta` —— 看到 hello-world 卡片
- `/about` —— 看到关于页内容
- `/this-page-does-not-exist` —— 看到自定义 404

Ctrl-C 退出。

- [ ] **Step 7: Commit**

```bash
git add src/pages/archive.astro src/pages/tags/ src/pages/about.md src/pages/404.astro
git commit -m "feat: add archive, tag, about, 404 pages"
```

---

## Task 12: RSS Feed

**Files:**
- Create: `src/pages/rss.xml.ts`

- [ ] **Step 1: 写 `src/pages/rss.xml.ts`**

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getAllPosts } from '../lib/getPosts';
import { SITE } from '../lib/site';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getAllPosts()).slice(0, 20);

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/posts/${post.slug}`,
      content: post.body, // 完整正文(Markdown 源码;读者用 RSS 阅读器多数能正确渲染)
    })),
    customData: `<language>${SITE.language}</language>`,
  });
}
```

- [ ] **Step 2: 验证构建**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run build
```

期望：构建成功；`dist/rss.xml` 存在并包含 hello-world 条目。

Run:
```bash
cd /Users/bytedance/workspace/blog && head -50 dist/rss.xml
```

期望：看到 `<rss>` 头与一个 `<item>`。

> 注意:`npm run build` 还会跑 `pagefind --site dist`。如果 pagefind 报"找不到内容选择器"是正常的(我们 Task 13 才接它),但不会让构建失败。如果它真的失败,可临时把 build 脚本里 `&& pagefind --site dist` 拿掉,Task 13 再加回来。**优先方案:Task 13 一并完成,这样 build 一直完整**。

- [ ] **Step 3: Commit**

```bash
git add src/pages/rss.xml.ts
git commit -m "feat: add RSS feed"
```

---

## Task 13: 站内搜索（Pagefind）

**Files:**
- Create: `src/components/Search.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/layouts/BaseLayout.astro`（给 main 加可选属性给 pagefind 识别）

- [ ] **Step 1: 给 `BaseLayout` 的 `<main>` 添加 pagefind 属性**

打开 `src/layouts/BaseLayout.astro`，把 `<main>` 改为：

```astro
<main data-pagefind-body>
  <slot />
</main>
```

> `data-pagefind-body` 告诉 Pagefind:"以这个元素为内容主体建索引"。

- [ ] **Step 2: 写 `src/components/Search.astro`**

```astro
<button id="search-toggle" type="button" aria-label="打开搜索">🔍</button>

<div id="search-modal" class="search-modal" hidden>
  <div class="search-overlay" data-close></div>
  <div class="search-panel">
    <div id="pagefind-search"></div>
  </div>
</div>

<script>
  // 按需加载 Pagefind UI:首次唤起搜索时才下载 ~70KB。
  let pagefindLoaded = false;

  async function ensurePagefind() {
    if (pagefindLoaded) return;
    pagefindLoaded = true;
    // pagefind UI 通过 module import 加载
    // @ts-ignore
    const { PagefindUI } = await import(
      /* @vite-ignore */ '/pagefind/pagefind-ui.js'
    );
    new PagefindUI({
      element: '#pagefind-search',
      showImages: false,
      showSubResults: true,
      translations: {
        placeholder: '搜索文章...',
        zero_results: '没有找到匹配的结果',
      },
    });
  }

  function openSearch() {
    document.getElementById('search-modal')?.removeAttribute('hidden');
    ensurePagefind();
    setTimeout(() => {
      const input = document.querySelector('#pagefind-search input') as HTMLInputElement | null;
      input?.focus();
    }, 50);
  }

  function closeSearch() {
    document.getElementById('search-modal')?.setAttribute('hidden', '');
  }

  document.getElementById('search-toggle')?.addEventListener('click', openSearch);
  document.querySelectorAll('[data-close]').forEach((el) =>
    el.addEventListener('click', closeSearch)
  );
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  });
</script>

<link rel="stylesheet" href="/pagefind/pagefind-ui.css" />

<style>
  #search-toggle {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    margin-left: 16px;
    padding: 0;
    color: var(--color-text-muted);
  }
  #search-toggle:hover { color: var(--color-accent); }

  .search-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
  }
  .search-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
  }
  .search-panel {
    position: relative;
    max-width: 640px;
    margin: 80px auto 0;
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }
</style>
```

- [ ] **Step 3: 在 `Header.astro` 里挂 `Search`**

修改 `src/components/Header.astro`,在 `nav` 末尾(`</nav>` 之前)插入:

```astro
---
import { SITE } from '../lib/site';
import Search from './Search.astro';
---
<header class="site-header">
  <div class="inner">
    <a href="/" class="brand">{SITE.title}</a>
    <nav>
      <a href="/archive">归档</a>
      <a href="/tags">标签</a>
      <a href="/about">关于</a>
      <a href="/rss.xml" aria-label="RSS feed">RSS</a>
      <Search />
    </nav>
  </div>
</header>

<style>
  .site-header { border-bottom: 1px solid var(--color-border); }
  .inner {
    max-width: var(--max-content-width);
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand { font-weight: 600; color: var(--color-text); }
  nav { display: flex; align-items: center; }
  nav a {
    margin-left: 16px;
    color: var(--color-text-muted);
    font-size: 0.95rem;
  }
  nav a:hover { color: var(--color-accent); }
</style>
```

- [ ] **Step 4: 完整构建并预览**

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run build
```

期望：构建通过；末尾 pagefind 输出 `Indexed N pages`（N≥1）。

Run:
```bash
cd /Users/bytedance/workspace/blog && npm run preview
```

打开 http://localhost:4321 ，点右上角 🔍 或按 `Cmd+K`/`Ctrl+K`，搜索"hello"应能搜到第一篇文章。`Esc` 关闭。

Ctrl-C 退出。

- [ ] **Step 5: Commit**

```bash
git add src/components/Search.astro src/components/Header.astro src/layouts/BaseLayout.astro
git commit -m "feat: add Pagefind search with on-demand loading"
```

---

## Task 14: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/lychee.toml`

- [ ] **Step 1: 写 `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install
        run: npm ci

      - name: Type & schema check
        run: npm run check

      - name: Unit tests
        run: npm test

      - name: Build
        run: npm run build

      - name: 死链检查 (lychee)
        uses: lycheeverse/lychee-action@v2
        with:
          args: >-
            --no-progress
            --max-concurrency 8
            --exclude-mail
            --config .github/lychee.toml
            './dist/**/*.html'
          fail: true
```

- [ ] **Step 2: 写 `.github/lychee.toml`**

```toml
# .github/lychee.toml
# 死链检查配置:容忍临时网络抖动,排除 localhost 等

max_retries = 2
retry_wait_time = 5
timeout = 20

# 排除常见私有/本地链接
exclude = [
  "^https?://localhost",
  "^https?://127\\.0\\.0\\.1",
  "^https?://0\\.0\\.0\\.0",
]
```

- [ ] **Step 3: 本地预跑一次完整流程**

Run:
```bash
cd /Users/bytedance/workspace/blog
npm run check && npm test && npm run build
```

期望:三步都通过,`dist/` 完整生成。

> CI 实际跑要等 push 到 GitHub 后看结果。

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml .github/lychee.toml
git commit -m "ci: add build, check, test, and link checking workflow"
```

---

## Task 15: 上线到 Cloudflare Pages

> 这个 Task 是**人机协作**:agent 准备好材料,人在 Cloudflare 控制台与 GitHub 网页操作。

**Files:**
- Modify: `astro.config.mjs`（部署后填实际 URL）
- Modify: `src/lib/site.ts`（部署后填实际 URL）
- Modify: `public/robots.txt`（部署后填实际域名）

- [ ] **Step 1: 推送到 GitHub**

人工操作（在 GitHub 创建空仓库 `<your-username>/blog` 后）：

```bash
cd /Users/bytedance/workspace/blog
git branch -M main
git remote add origin git@github.com:<your-username>/blog.git
git push -u origin main
```

期望：仓库可见、CI 自动开始跑。

- [ ] **Step 2: 在 GitHub 设置主分支保护**

Settings → Branches → Add rule for `main`：
- ✅ Require status checks to pass before merging
- 选择 `build` workflow

- [ ] **Step 3: 在 Cloudflare Pages 创建项目**

在 https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git：
- Repository: 选刚才推上去的仓库
- Production branch: `main`
- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables:
  - `NODE_VERSION` = `20`

点 "Save and Deploy"。等首次部署完成（约 1-2 分钟），记下分配的 URL（形如 `<project-name>.pages.dev`）。

- [ ] **Step 4: 启用 Web Analytics**

Cloudflare 控制台 → 你的 Pages 项目 → Settings → Web Analytics → Enable。

> 启用后无需在代码里加任何 script，Cloudflare 会自动注入 beacon。

- [ ] **Step 5: 用实际 URL 更新代码中的占位**

把以下三处 `https://example.pages.dev` 替换为实际 URL（假设是 `https://my-blog.pages.dev`）：

修改 `astro.config.mjs`：

```js
site: 'https://my-blog.pages.dev',
```

修改 `src/lib/site.ts`：

```ts
url: 'https://my-blog.pages.dev',
```

修改 `public/robots.txt`：

```
User-agent: *
Allow: /

Sitemap: https://my-blog.pages.dev/sitemap-index.xml
```

- [ ] **Step 6: 验证、提交、推送**

Run:
```bash
cd /Users/bytedance/workspace/blog
npm run build
```

期望：构建通过。

```bash
git add astro.config.mjs src/lib/site.ts public/robots.txt
git commit -m "chore: set production site URL after deploy"
git push
```

等 Cloudflare Pages 二次构建完成，访问 `https://my-blog.pages.dev`：
- 首页 → 看到置顶 hello-world 文章
- 点开文章 → TOC、复制按钮工作
- `/archive` `/tags` `/about` `/rss.xml` `/sitemap-index.xml` 都可访问
- 控制台 Web Analytics 几小时后开始有数据

- [ ] **Step 7: 完成上线**

至此,博客已上线。日常工作流:

```
新写文章: 创建 src/content/blog/<date>-<slug>.md → npm run dev 验证 → git push → CI + CF 自动部署
推荐文章: 在某篇 md 里加 pinned: true 与 overview → push → 同上
```

---

## Self-Review

读一遍 spec 与本 plan,核对是否覆盖完整。

### 1. Spec 章节覆盖核对

| Spec 章节 | 由哪个 Task 覆盖 |
|---|---|
| 3 架构总览(本地→GitHub→CF Pages) | Task 1 + 14 + 15 |
| 4 目录结构 | Task 1 / 2 / 3 / 7 / 8 / 9 / 10 / 11 / 12 / 13 |
| 5 Frontmatter Schema | Task 3 |
| 5.3 readingMinutes | Task 4 |
| 5.6 草稿过滤 | Task 6（getAllPosts 内部） |
| 6.1 首页置顶 | Task 9 |
| 6.2 文章详情 + TOC + 行号/行高亮 | Task 10 + Astro/Shiki 默认（行号通过 Shiki transformers 默认开启;行高亮通过 \`\`\`go {3,5-7} 语法） |
| 6.3 归档 | Task 11 |
| 6.4 标签页 | Task 11 |
| 6.5 关于页 | Task 11 |
| 6.6 RSS | Task 12 |
| 6.7 搜索 | Task 13 |
| 6.8 Sitemap | Task 1（`@astrojs/sitemap` 集成自动生成） |
| 6.9 404 | Task 11 |
| 6.10 SEO + JSON-LD | Task 7（BaseLayout）+ Task 10（PostLayout 注入 jsonLd） |
| 6.11 CF Web Analytics | Task 15 |
| 7 组件接口 | Task 8 |
| 8 构建配置 | Task 1 |
| 9 CI | Task 14 |
| 10 部署 | Task 15 |
| 11 错误处理 | Task 9（empty pinned）+ Task 8（overview warn）+ Task 11（404）+ Task 14（CI 阻塞）|
| 12 性能/可访问性 | Task 7（语义 HTML、focus-visible）+ Task 2（CSS 对比）|
| 13 测试策略（构建即测试 + 三个纯函数单测） | Task 4 / 5 / 6 + Task 14（CI 跑全套）|

**潜在缺口检查：**
- 行号显示：Astro 4 的 Shiki 不默认显示行号；要么用 `transformerNotationDiff` 等内置 transformer，要么用 `shiki:transformers` 包。Task 1 的 `astro.config.mjs` 仅配置了 `theme` + `wrap`，**实际没开行号**。spec 第 6.2 节提到"行号默认开"。

  → **修正方案**：在 Task 1 Step 4 的 `astro.config.mjs` 里加上 `@shikijs/transformers` 处理行号；或承认行号是"可视上的列号样式"，用 CSS counter 在 Task 2 实现。
  → **本 plan 采取后者(CSS counter)** 因为更轻、不引入新依赖。需要在 Task 2 的 `global.css` 里追加：

  ```css
  /* 代码块行号(纯 CSS counter) */
  pre code {
    counter-reset: line;
  }
  pre code .line {
    counter-increment: line;
  }
  pre code .line::before {
    content: counter(line);
    display: inline-block;
    width: 2em;
    margin-right: 1em;
    text-align: right;
    color: var(--color-text-muted);
    user-select: none;
  }
  ```

  但 Shiki 默认每行 `<span class="line">` 是开的，所以这就够了。**修正:把上面这段 CSS 追加进 Task 2 Step 2 的 global.css 末尾**(plan 已隐含但没写出来,**人工执行时请记得加**)。

- 行高亮：Shiki 在 Astro 中支持 fence 语法 `\`\`\`go {3,5-7}` 需要装 `@shikijs/transformers`。spec 第 6.2 节说"行高亮通过 Markdown 扩展语法"。**plan 中 Task 1 没装这个 transformer**。

  → **修正**:Task 1 Step 2 增加一行依赖安装,Task 1 Step 4 修改 astro.config.mjs。

我把这两个修正补丁直接列在下面（属于本 self-review 的输出）。

### 2. 修正补丁(已在以下并入,**请按这个版本执行 Task 1/2**)

**Task 1 Step 2 增加**:

```bash
npm install -D @shikijs/transformers
```

**Task 1 Step 4 改为**:

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerMetaHighlight,
} from '@shikijs/transformers';

export default defineConfig({
  site: 'https://example.pages.dev',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerMetaHighlight(), // 启用 ```go {3,5-7} 语法
      ],
    },
  },
});
```

**Task 2 Step 2 在 global.css 末尾追加**:

```css
/* Shiki 行号 (基于每行 <span class="line"> + CSS counter) */
pre code {
  counter-reset: line;
  display: block;
}
pre code .line {
  counter-increment: line;
  display: inline-block;
  width: 100%;
}
pre code .line::before {
  content: counter(line);
  display: inline-block;
  width: 2em;
  margin-right: 1em;
  text-align: right;
  color: var(--color-text-muted);
  user-select: none;
}

/* Shiki transformerMetaHighlight 给被高亮行加 .highlighted */
pre code .line.highlighted {
  background: rgba(255, 220, 100, 0.3);
  margin: 0 -16px;
  padding: 0 16px;
}
```

### 3. 占位符扫描

通读 plan,无 "TBD/TODO/implement later" 字样,所有代码块都给出完整代码,所有命令都明确,所有期望产出都列出。Task 15 的 `<your-username>` `my-blog.pages.dev` 是**人工执行时的真实占位**(用户特定值),不是计划占位符。

### 4. 类型一致性

- `Post` 类型在 Task 6 定义为 `CollectionEntry<'blog'> & { readingMinutes: number }`,Task 9/10/11/12 都正确使用了 `post.data.X` + `post.readingMinutes` + `post.slug`,一致。
- 组件 props 接口(`PostCard` / `PinnedPostCard` / `PostMeta` / `TableOfContents`)在 Task 8/10 定义,在 Task 9/10/11 调用,字段名一致。
- `getAllPosts` / `getPinnedPosts` / `getPostsByTag` / `getAllTags` 在 Task 6 定义,在 Task 9/11/12 调用,签名一致。

无类型不一致问题。

---

## Plan complete and saved to `docs/superpowers/plans/2026-05-30-personal-blog.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
