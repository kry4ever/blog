# 个人技术博客

基于 Astro + Cloudflare Pages 的极简博客。

## 本地开发

```bash
npm install
npm run dev    # 启动开发服务器（默认 4321 端口）
npm run check  # 类型与 frontmatter schema 校验
npm run build  # 生产构建
```

## 写一篇新文章

新建 `src/content/blog/YYYY-MM-DD-<slug>.md`，按 `src/content/config.ts` 定义的 frontmatter schema 填字段。

## 部署

主分支 push 后由 Cloudflare Pages 自动构建并发布。
