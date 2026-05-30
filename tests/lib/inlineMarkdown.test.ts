import { describe, it, expect } from 'vitest';
import { renderInlineMarkdown } from '../../src/lib/inlineMarkdown';

describe('renderInlineMarkdown', () => {
  it('returns empty string for undefined or empty input', () => {
    expect(renderInlineMarkdown(undefined)).toBe('');
    expect(renderInlineMarkdown('')).toBe('');
  });

  it('renders plain text unchanged (escaped)', () => {
    expect(renderInlineMarkdown('hello world')).toBe('hello world');
  });

  it('renders bold', () => {
    expect(renderInlineMarkdown('**bold**')).toBe('<strong>bold</strong>');
  });

  it('renders italic', () => {
    expect(renderInlineMarkdown('*em*')).toBe('<em>em</em>');
  });

  it('renders link', () => {
    expect(renderInlineMarkdown('[a](https://x)')).toBe(
      '<a href="https://x">a</a>'
    );
  });

  it('renders inline code', () => {
    expect(renderInlineMarkdown('`code`')).toBe('<code>code</code>');
  });

  it('does not render block-level markdown (code fence)', () => {
    const out = renderInlineMarkdown('```\nfoo\n```');
    // 不允许出现 <pre>
    expect(out).not.toContain('<pre>');
  });

  it('does not render images', () => {
    const out = renderInlineMarkdown('![alt](x.png)');
    expect(out).not.toContain('<img');
  });
});
