# 个人技术博客 — 设计文档

- **作者**：站点拥有者（待填）
- **日期**：2026-05-30
- **状态**：设计已确认，待实现
- **目录**：`/Users/bytedance/workspace/blog`

---

## 1. 目标与非目标

### 目标
- 为站点拥有者搭建一个**个人技术写作 / 知识沉淀**型博客。
- 读者体验优先：极致加载速度、无干扰阅读、SEO 友好、无追踪 cookie。
- 写作工作流贴近开发者习惯：本地 Markdown + Git + 自动部署。
- 第一版用最小可行集合上线，留好将来扩展的接口。

### 非目标（YAGNI，明确不做）
- 多语言 i18n 切换（仅中文）。
- 评论系统（如有需要后续接 Giscus，工作量小）。
- 双向链接 / 数字花园式 backlinks。
- 嵌入式交互组件（MDX 已留扩展能力，但本期不写交互组件）。
- Newsletter 订阅 / 邮件推送（需要服务端，违背静态站初衷）。
- 实时文章访问数公开展示。
- 人工调整置顶顺序（按 `pubDate` 倒序自然排序，将来真需要再加 `pin_order`）。
- 单元测试 / 端到端测试（靠"构建即测试"覆盖）。

---

## 2. 关键决策

| # | 项 | 决定 | 理由 |
|---|---|---|---|
| 1 | 站点类型 | 静态站点（SSG） | 性能、零成本、零维护、内容归属清晰 |
| 2 | 框架 | **Astro 4.x** | 默认零 JS、内容集合 + Zod schema、生态活跃 |
| 3 | 视觉风格 | 极简素净（白底黑字、大留白、系统字体） | 与"技术写作"目的最契合 |
| 4 | 主题 | 仅浅色 | 简单、与极简风格一致 |
| 5 | 评论 | 无 | 第一版不要 |
| 6 | Analytics | Cloudflare Web Analytics | 隐私友好、零成本、与部署平台同生态 |
| 7 | 部署 | Cloudflare Pages | CDN 全球、免费额度大、与 Analytics 一键集成 |
| 8 | 域名 | `*.pages.dev`（暂时） | 零成本起步，将来可绑自定义域 |
| 9 | CI | GitHub Actions：build + astro check + 死链检查（lychee） | 防止坏内容上线、零成本 |
| 10 | 语言 | 仅中文 | 不引入 i18n 复杂度 |
| 11 | 字体 | 系统字体栈 | 最快、不出错、各平台原生美 |

---

## 3. 架构总览

### 3.1 高层结构

```
┌────────────────────────────────────────────────────┐
│ 本地开发（Node 20 / Astro 4.x）                     │
│   src/content/blog/*.md  ←  作者写的 Markdown       │
│   src/pages/             ←  路由                    │
│   src/layouts/           ←  布局模板                │
│   src/components/        ←  Astro 组件             │
│           ↓ git push                               │
└────────────────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────────────┐
│ GitHub 仓库（content + code 同仓）                  │
│   Pull Request 触发 CI：build + check + 死链检查    │
│   主分支保护：CI 全绿才能合并                        │
└────────────────────────────────────────────────────┘
           ↓ Webhook
┌────────────────────────────────────────────────────┐
│ Cloudflare Pages                                   │
│   1. 拉代码 → npm ci → npm run build               │
│   2. 把 dist/ 推到全球边缘 CDN                      │
│   3. 自动签发 HTTPS 证书                            │
│   ↓                                                │
│   读者 → https://xxx.pages.dev/（CDN 边缘命中）     │
│   Web Analytics beacon 在边缘记一次访问             │
└────────────────────────────────────────────────────┘
```

### 3.2 数据流（一篇文章从写到读者看到）

1. 本地新建 `src/content/blog/<slug>.md`，写 frontmatter + 正文。
2. `npm run dev` 实时预览。
3. `git commit && git push`。
4. CI 跑 build / astro check / 死链检查。通过则可合并。
5. 合并到主分支后，Cloudflare Pages 自动构建并部署，约 1-2 分钟内全网生效。
6. 读者访问 → CDN 边缘节点直接返回 HTML → Cloudflare Web Analytics 在边缘记一次访问。

### 3.3 关键依赖

- **运行时**：Node 20（仅本地和 CI 需要，生产无运行时）。
- **核心**：
  - `astro` ^4.x
  - `@astrojs/mdx`（保留扩展能力）
  - `@astrojs/sitemap`
  - `@astrojs/rss`
- **代码高亮**：Astro 内置 Shiki（`github-light` 主题）。
- **搜索**：`pagefind`（构建后扫产物生成索引，前端按需加载）。
- **死链检查**：`lycheeverse/lychee-action@v2`（仅 CI 用）。
- **inline Markdown 渲染**：`marked`（构建期使用，仅渲染 frontmatter 中 `overview` 字段）。
- **无外部数据库、无外部 API、无服务器**。

---

## 4. 目录结构

```
blog/
├─ .github/
│  └─ workflows/
│     └─ ci.yml                    ← CI: build + check + 死链
├─ public/
│  ├─ favicon.svg
│  ├─ robots.txt
│  ├─ og-default.png               ← 文章无封面时的兜底 og:image
│  └─ assets/                      ← 不需要构建处理的静态资源
├─ src/
│  ├─ content/
│  │  ├─ config.ts                 ← 内容集合 schema
│  │  └─ blog/
│  │     ├─ 2026-05-30-hello-world.md
│  │     └─ ...
│  ├─ pages/
│  │  ├─ index.astro               → /                 首页（置顶文章）
│  │  ├─ about.md                  → /about            关于我（Markdown 页面）
│  │  ├─ archive.astro             → /archive          全部文章归档
│  │  ├─ rss.xml.ts                → /rss.xml          RSS feed
│  │  ├─ 404.astro                 → 自定义 404
│  │  ├─ posts/
│  │  │  └─ [slug].astro           → /posts/<slug>     文章详情
│  │  └─ tags/
│  │     ├─ index.astro            → /tags             标签总览
│  │     └─ [tag].astro            → /tags/<tag>       某个标签下的文章
│  ├─ layouts/
│  │  ├─ BaseLayout.astro          ← 全站基础布局
│  │  └─ PostLayout.astro          ← 文章详情专用布局
│  ├─ components/
│  │  ├─ Header.astro
│  │  ├─ Footer.astro
│  │  ├─ PostCard.astro            ← 列表卡片（归档/标签页用）
│  │  ├─ PinnedPostCard.astro      ← 首页置顶卡片（含 overview）
│  │  ├─ PostMeta.astro            ← 日期 + 阅读时长 + 标签
│  │  ├─ TagList.astro             ← 标签胶囊列表
│  │  ├─ TableOfContents.astro     ← 文章 TOC
│  │  ├─ CodeCopyButton.astro      ← 代码块复制按钮（含极少量 JS）
│  │  └─ Search.astro              ← Pagefind 搜索框（按需加载）
│  ├─ lib/
│  │  ├─ getPosts.ts               ← 文章数据访问统一入口
│  │  ├─ readingTime.ts            ← 计算阅读时长
│  │  ├─ inlineMarkdown.ts         ← inline-only Markdown 渲染（用于 overview）
│  │  └─ site.ts                   ← 站点元信息常量
│  ├─ styles/
│  │  └─ global.css                ← CSS 变量 + 重置 + 排版基础
│  └─ env.d.ts
├─ astro.config.mjs
├─ tsconfig.json
├─ package.json
├─ .gitignore
└─ README.md
```

### 设计原则
- **每个组件单一职责**：`PinnedPostCard` 与 `PostCard` 分离，因为前者要渲染 overview、后者用于密集列表，视觉与字段都不同。
- **数据访问统一走 `lib/getPosts.ts`**：所有页面想拿文章列表都从这一处取。
- **站点常量集中在 `lib/site.ts`**：作者名、站点标题、URL 改一处即可。
- **零客户端 JS 优先**：除 `CodeCopyButton`（必须 JS）和 `Search`（按需加载 Pagefind）外，其他组件都是 `.astro` 编译期渲染。

---

## 5. 内容模型（Frontmatter Schema）

### 5.1 schema 定义

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

### 5.2 字段含义

| 字段 | 必填 | 用途 |
|---|---|---|
| `title` | ✅ | 文章标题；用于 `<h1>`、`<title>`、`og:title`、卡片、RSS。 |
| `pubDate` | ✅ | 首次发布日期；用于排序、显示、JSON-LD `datePublished`。 |
| `description` | ✅ | 1-2 句摘要；用于 `<meta description>`、`og:description`、所有列表卡片副标题、RSS 描述。 |
| `updatedDate` | | 修订日期；显示"最后更新于 ..."、JSON-LD `dateModified`。 |
| `tags` | | 标签数组；驱动 `/tags/*` 页面、文章页底部的标签胶囊。 |
| `cover` | | 封面图（Astro `image()` 自动多尺寸/WebP 优化）。 |
| `coverAlt` | | 封面图无障碍替代文本。 |
| `draft` | | `true` 时仅本地预览可见，生产构建跳过。 |
| `pinned` | | `true` 时出现在首页置顶列表。 |
| `overview` | | 首页卡片的"概览与介绍"段落，约 100-300 字 Markdown 文本（仅支持 inline 格式：`**bold**` / `*em*` / `[link](url)` / `\`code\``）。仅 `pinned: true` 时被消费。 |

### 5.3 衍生数据（运行时计算，不进 frontmatter）

- **`readingMinutes`**：由 `lib/readingTime.ts` 基于正文字数估算（中文按 ~400 字/分钟，代码块按更慢速度）。
- **`headings`**：Astro 编译 Markdown 时自动抽取，传给 `TableOfContents`。
- **`url`**：Astro 自动生成的页面 URL。

### 5.4 文章样例

```markdown
---
title: "理解 Go 调度器的 GMP 模型"
pubDate: 2026-05-30
description: "从 runtime 源码出发，拆解 G、M、P 三者的关系。"
tags: ["golang", "runtime", "调度"]
cover: ./images/gmp-cover.png
coverAlt: "GMP 模型示意图"
pinned: true
overview: |
  这篇文章把我读 Go runtime 半年的笔记整理成了一个连贯的故事。
  如果你想理解 GMP，从这里开始最省力——我尽量避免了"先讲所有概念再讲关系"的常见反模式。
---

## 引言

本文从 ...
```

### 5.5 内容存放约定

- 所有 `.md` 在 `src/content/blog/` 下平铺，**不分子目录**。
- 文件名：`YYYY-MM-DD-<slug>.md`（slug 用作 URL）。
- 每篇文章相关图片放 `src/content/blog/images/<slug>/`，封面相对路径 `./images/<slug>/cover.png`。

### 5.6 草稿工作流

- `draft: true` 时：
  - `npm run dev` 本地预览**可见**。
  - `npm run build` 生产构建**跳过**（不进 sitemap / RSS / 搜索索引）。
- 实现：`lib/getPosts.ts` 内统一过滤：`import.meta.env.PROD ? !post.data.draft : true`。

---

## 6. 页面与功能详细设计

### 6.1 首页 `/`

**结构（从上到下）：**
1. 顶部导航：`Logo / 站点标题` + 链接（`归档` / `标签` / `关于` / `RSS` 图标）+ 搜索图标。
2. 简短自我介绍：1-2 行（取自 `lib/site.ts`）。
3. **置顶文章列表**（由作者通过 `pinned: true` 手动选定）：每张卡片字段：
   - 日期 · 阅读时长
   - 标题
   - description（短摘要）
   - **overview**（作者手写的"概览与介绍"段落，渲染 inline Markdown）
   - 标签胶囊
4. 列表底部："查看全部 →"链接到 `/archive`。

**排序**：`pinned: true` 的文章按 `pubDate` 降序。**不引入额外的 `pin_order` 字段**（YAGNI）。

**边界情况：**
- 零置顶文章：显示提示文字"还没有推荐文章，去 [归档](/archive) 看看"。
- `pinned: true` 但缺 `overview`：构建时 `console.warn`，不阻塞构建；卡片只渲染 description。
- `draft: true && pinned: true`：草稿过滤优先，生产首页不显示。

### 6.2 文章详情页 `/posts/<slug>`

**桌面端布局（≥ 1024px）：**

```
┌─────────────────────────────────────────────┐
│  Header                                     │
├──────────────┬──────────────────────────────┤
│              │   <h1>标题</h1>              │
│  Table of    │   PostMeta                   │
│  Contents    │   正文 ...                   │
│  (sticky)    │   ── updatedDate 提示 ──     │
│              │   ── 标签胶囊 ──             │
├──────────────┴──────────────────────────────┤
│  Footer                                     │
└─────────────────────────────────────────────┘
```

**移动端（< 1024px）**：TOC 放在 `<details>` 折叠块里置于标题下方。

**功能要点：**
- 正文最大宽度 ~68ch（约 700px）。
- 代码块右上角悬浮**复制按钮**（`CodeCopyButton`，唯一的客户端 JS 之一）。
- 代码块行号默认开；行高亮通过 Markdown 扩展语法 `\`\`\`go {3,5-7}` 控制。
- 文章末尾若 `updatedDate` 存在，显示"本文最后更新于 YYYY-MM-DD"。
- TOC 在桌面端 `position: sticky`，点击锚点平滑滚动。

### 6.3 全部归档 `/archive`

按**年份分组**倒序，每年下紧凑列表：

```
2026
  05-30  理解 Go 调度器的 GMP 模型
  05-12  TCP 三次握手再读
  ...

2025
  12-04  Pagefind 接入小记
  ...
```

每行只显示日期 + 标题，**单页全列**，不分页。

### 6.4 标签页

- `/tags`：所有标签胶囊云，按文章数排序，显示形如 `#golang (12)`。不做字号视觉权重。
- `/tags/<tag>`：该标签下所有文章，用 `<PostCard />` 渲染，按时间倒序。

### 6.5 关于页 `/about`

- 内容存放为 `src/pages/about.md`（Astro 支持 `.md` 文件作为页面），由 `BaseLayout.astro` 包裹，与文章正文复用同一套排版样式。
- 内容由作者后续填写：自我介绍、联系方式（邮箱、GitHub 等）、本博客的目的。

### 6.6 RSS `/rss.xml`

- 用 `@astrojs/rss`。
- 包含**最近 20 篇**：标题、链接、`pubDate`、description、完整正文 HTML。
- 草稿不进 feed。
- 顶部导航有 RSS 图标链接到此。

### 6.7 站内搜索（Pagefind）

- 构建后跑 `pagefind --site dist`，自动生成索引。
- 前端 `<Search />` 组件**按需加载**（点击搜索图标才下载约 70KB gzip）。
- 索引存储在 `dist/pagefind/`，与站点同 CDN，零额外服务。
- 弹层式搜索框：键盘 `Cmd+K` / `Ctrl+K` 唤起，`Esc` 关闭，输入即搜，结果带高亮片段。

### 6.8 Sitemap `/sitemap-index.xml`

- `@astrojs/sitemap` 集成自动生成。
- 含所有发布页（首页、归档、标签、关于、每篇文章）。草稿排除。

### 6.9 404 页

- `src/pages/404.astro`：句俏皮话 + 搜索框 + "回首页"链接。

### 6.10 SEO 与社交分享

`BaseLayout.astro` 集中处理每页 `<head>`：
- `<title>`：页面标题 — 站点标题。
- `<meta name="description">`。
- `<link rel="canonical">`：当前页绝对 URL。
- **OpenGraph**：`og:title` / `og:description` / `og:image` / `og:type` / `og:url`。
- **Twitter Card**：`summary_large_image`。
- **JSON-LD 结构化数据**（仅文章页）：`Article` 类型，含 `headline` / `datePublished` / `dateModified` / `author`。
- 文章无 `cover` 时 og:image 用 `public/og-default.png`。

### 6.11 Cloudflare Web Analytics

- 在 Cloudflare Pages 控制台勾选"Web Analytics"。
- Cloudflare 自动注入 beacon 脚本，**代码不需要改动**。
- Beacon 不阻塞渲染、不用 cookie。

---

## 7. 组件接口

```ts
// PinnedPostCard.astro
interface Props {
  title: string;
  description: string;
  overview?: string;       // Markdown 字符串，inline 渲染
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  slug: string;
  readingMinutes: number;
}

// PostCard.astro
interface Props {
  title: string;
  description?: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  slug: string;
  readingMinutes: number;
}

// PostMeta.astro
interface Props {
  pubDate: Date;
  updatedDate?: Date;
  readingMinutes: number;
  tags: string[];
}

// TableOfContents.astro
interface Props {
  headings: { depth: number; slug: string; text: string }[];
}
```

```ts
// lib/getPosts.ts
export function getAllPosts(): Promise<Post[]>;       // 已发布全部，按时间倒序
export function getPinnedPosts(): Promise<Post[]>;    // pinned=true，按时间倒序
export function getPostsByTag(tag: string): Promise<Post[]>;
export function getAllTags(): Promise<{ tag: string; count: number }[]>;
```

`Post` 类型在 `src/content/config.ts` 由 Astro 推导得出。

---

## 8. 构建配置

### 8.1 `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://<your-project>.pages.dev',  // 部署后填实际值
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

### 8.2 `package.json` 脚本

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check"
  }
}
```

### 8.3 `.gitignore`

```
node_modules/
dist/
.astro/
.superpowers/
.DS_Store
.env
.env.local
```

---

## 9. CI（GitHub Actions）

`.github/workflows/ci.yml`:

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
      - run: npm ci
      - run: npm run check
      - run: npm run build
      - name: 死链检查
        uses: lycheeverse/lychee-action@v2
        with:
          args: >-
            --no-progress
            --max-concurrency 8
            --exclude-mail
            './dist/**/*.html'
          fail: true
```

**门禁规则**：GitHub 仓库设置 → Branches → 保护 `main`：CI 全绿才能合并。

---

## 10. 部署（Cloudflare Pages）

- 关联 GitHub 仓库，选 `main` 为生产分支。
- 构建命令：`npm run build`。
- 构建输出目录：`dist`。
- 环境变量：`NODE_VERSION=20`。
- 在 Pages 项目设置里勾选 **Web Analytics**。
- 主分支 push → 自动构建部署；PR → 自动 Preview 部署。

---

## 11. 错误处理策略

| 失败场景 | 行为 | 设计意图 |
|---|---|---|
| Frontmatter 字段缺失/类型错 | `npm run check` 报错，构建失败 | 错误 schema 不许上线 |
| 死链（站内或站外 404） | CI lychee 步骤报错，PR 不能合并 | 死链影响信誉 |
| Markdown 语法错 | Astro 构建报错指向具体行 | 不让坏渲染上线 |
| `pinned: true` 但缺 `overview` | 构建时 `console.warn`，**不阻塞** | 软规范，允许"先置顶后补介绍" |
| 没有任何置顶文章 | 首页显示提示文字 | 避免空白看起来像 bug |
| 读者访问不存在的 URL | 命中 404.astro，展示自定义页 + 搜索 | 不让读者撞空白 |
| Cloudflare Pages 构建失败 | 自动保留上一版本在线；CF 邮件通知 | 失败的部署不顶替正常版本 |
| 用户 JS 失败（复制按钮） | 按钮无反应，但正文正常 | 渐进增强 |

---

## 12. 性能与可访问性目标

- **Lighthouse 指标**（CI 中不强制，作为非阻塞参考）：
  - Performance ≥ 95
  - Accessibility ≥ 95
  - SEO = 100
  - Best Practices ≥ 95
- **首屏 JS 体积**（无搜索激活时）：< 5KB。
- **可访问性**：
  - 颜色对比度 ≥ WCAG AA。
  - 所有图片必须有 `alt`；封面图通过 `coverAlt` 强约束。
  - 键盘可导航；搜索框 `Cmd+K` / `Ctrl+K` 唤起；`Esc` 关闭。
  - 语义化 HTML：`<article>` / `<nav>` / `<main>` / `<aside>` / `<time>`。

---

## 13. 测试策略

不写单元测试；**靠"构建即测试"覆盖**：

1. **schema 校验**：`astro check` 跑过即说明所有 frontmatter 合法。
2. **链接校验**：lychee 在 CI 跑过即说明所有链接活。
3. **构建校验**：`npm run build` 跑过即说明所有 Markdown 渲染、图片引用、组件 props 正确。
4. **手动校验**：本地 `npm run preview` 抽查首页 / 详情 / 归档 / 标签 / 搜索 5 条关键路径。

---

## 14. 上线流程

```
1. 本地: npm create astro@latest blog -- --template minimal --typescript strict
2. 按本设计搭好目录、组件、schema、配置、CI yml
3. 写 src/content/blog/2026-05-30-hello-world.md（第一篇文章）
4. 本地 npm run dev 验证
5. git init && git remote add ... && git push（首次推送到 GitHub）
6. Cloudflare Pages 控制台 → "Connect to Git" → 选仓库
   构建命令 npm run build；输出 dist；NODE_VERSION=20
7. 等首次部署完成 → 访问 https://<project>.pages.dev → 确认上线
8. Pages 项目里勾选 Web Analytics
```

之后日常工作流：

```
写新文章: 创建 md → 本地 dev 看效果 → git push → 等 CI + CF 自动部署 → 上线
推荐文章: 在已有 md 加 pinned: true 和 overview → push → 同上
```

---

## 15. 已确认决定汇总（再列一次便于追溯）

| # | 项目 | 决定 |
|---|---|---|
| 1 | 博客目的 | 技术写作 / 知识沉淀 |
| 2 | 技术路线 | 静态站点生成器 |
| 3 | 工具 | Astro 4.x |
| 4 | 页面 | 首页、文章详情、归档、标签、关于、RSS、搜索、Sitemap、404 |
| 5 | 文章能力 | 代码高亮、内联代码、图片优化、链接/列表/表格/引用、TOC、复制按钮、行号+行高亮 |
| 6 | 视觉风格 | 极简素净 |
| 7 | 主题 | 仅浅色 |
| 8 | 评论 | 无 |
| 9 | Analytics | Cloudflare Web Analytics |
| 10 | 部署 | Cloudflare Pages |
| 11 | 域名 | `*.pages.dev`（暂时） |
| 12 | CI | build + astro check + 死链检查（lychee） |
| 13 | SEO/草稿/阅读时间/封面/更新时间/404 | 全开 |
| 14 | 语言 | 仅中文 |
| 15 | 字体 | 系统字体栈 |
| 16 | 首页文章列表 | 作者手动置顶（`pinned: true`），含 description + 作者手写 overview |
