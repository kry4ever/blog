// src/lib/url.ts
// 统一处理 base path 的 URL 辅助函数。
// Astro 的 `base` 配置不会自动重写组件里写死的 href，需要手动包一下。

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * 给路径加上站点 base 前缀。
 * url('/about') -> '/blog/about'
 * url('about') -> '/blog/about'
 */
export function url(path: string): string {
  if (!path.startsWith('/')) path = '/' + path;
  return BASE + path;
}
