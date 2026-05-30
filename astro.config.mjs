import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerMetaHighlight,
} from '@shikijs/transformers';

export default defineConfig({
  site: 'https://blog.479718269.workers.dev',
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
        transformerMetaHighlight(),
      ],
    },
  },
});
