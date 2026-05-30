import { describe, it, expect, vi, beforeEach } from 'vitest';

// 用工厂 mock astro:content 的 getCollection。每个测试用 mockReturnValue 注入数据。
const getCollectionMock = vi.fn();

vi.mock('astro:content', () => ({
  getCollection: (name: string, filter?: (entry: any) => boolean) =>
    getCollectionMock(name, filter),
}));

// 帮助构造测试用的 entry（v6: id 替代 slug）
function makeEntry(id: string, data: Partial<any>) {
  return {
    id,
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
  vi.stubEnv('PROD', true);
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
    expect(posts.map((p) => p.id)).toEqual(['c', 'a']); // 按 pubDate 倒序
  });

  it('getAllPosts sorts by pubDate descending', async () => {
    getCollectionMock.mockImplementation(async () => [
      makeEntry('old', { pubDate: new Date('2025-01-01') }),
      makeEntry('new', { pubDate: new Date('2026-01-01') }),
      makeEntry('mid', { pubDate: new Date('2025-06-01') }),
    ]);

    const { getAllPosts } = await import('../../src/lib/getPosts');
    const posts = await getAllPosts();
    expect(posts.map((p) => p.id)).toEqual(['new', 'mid', 'old']);
  });

  it('getPinnedPosts returns only pinned, sorted desc', async () => {
    getCollectionMock.mockImplementation(async () => [
      makeEntry('a', { pubDate: new Date('2026-01-01'), pinned: true }),
      makeEntry('b', { pubDate: new Date('2026-02-01'), pinned: false }),
      makeEntry('c', { pubDate: new Date('2026-03-01'), pinned: true }),
    ]);

    const { getPinnedPosts } = await import('../../src/lib/getPosts');
    const posts = await getPinnedPosts();
    expect(posts.map((p) => p.id)).toEqual(['c', 'a']);
  });

  it('getPostsByTag filters and sorts', async () => {
    getCollectionMock.mockImplementation(async () => [
      makeEntry('a', { pubDate: new Date('2026-01-01'), tags: ['go'] }),
      makeEntry('b', { pubDate: new Date('2026-02-01'), tags: ['rust'] }),
      makeEntry('c', { pubDate: new Date('2026-03-01'), tags: ['go', 'runtime'] }),
    ]);

    const { getPostsByTag } = await import('../../src/lib/getPosts');
    const posts = await getPostsByTag('go');
    expect(posts.map((p) => p.id)).toEqual(['c', 'a']);
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
