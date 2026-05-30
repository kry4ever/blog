// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getAllPosts } from '../lib/getPosts';
import { SITE } from '../lib/site';
import { url } from '../lib/url';
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
      link: url(`/posts/${post.id}`),
      content: (post as any).body ?? '', // 完整正文(Markdown 源码;读者用 RSS 阅读器多数能正确渲染)
    })),
    customData: `<language>${SITE.language}</language>`,
  });
}
