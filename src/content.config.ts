// src/content.config.ts
// Astro v6 Content Layer API. The blog collection loads markdown/mdx files
// from src/content/blog/ via the glob loader.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
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
