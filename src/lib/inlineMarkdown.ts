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
