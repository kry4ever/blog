// src/lib/site.ts
// 站点元信息常量。改一处即可影响全站标题、描述、作者。

export const SITE = {
  title: 'guyan‘s Tech Blog',
  description: '关于移动端代码架构、性能优化、AICoding 相关的思考与分享',
  author: 'guyan',
  // 部署后填实际 URL；本地开发用占位
  url: 'https://kry4ever.github.io/blog',
  // 首页副标题（自我介绍）
  bio: '作者：腾讯3年，字节8年，专注于Android客户端架构与性能体验，最近开始研究AICoding，愿我们可以在AI时代一起成长！',
  // RSS 中显示的语言
  language: 'zh-CN',
} as const;
