// src/lib/site.ts
// 站点元信息常量。改一处即可影响全站标题、描述、作者。

export const SITE = {
  title: '我的技术博客',
  description: '关于编程、系统、与读源码的笔记。',
  author: '站点作者',
  // 部署后填实际 URL；本地开发用占位
  url: 'https://kry4ever.github.io/blog',
  // 首页副标题（自我介绍）
  bio: '工程师 / 在这里记一些想清楚之后的笔记。',
  // RSS 中显示的语言
  language: 'zh-CN',
} as const;
