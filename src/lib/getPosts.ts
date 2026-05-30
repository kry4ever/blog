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
    readingMinutes: estimateReadingMinutes((entry as any).body ?? ''),
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
    .reverse()
    .sort((a, b) => b.count - a.count);
}
