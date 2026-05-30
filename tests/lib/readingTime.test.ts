// tests/lib/readingTime.test.ts
import { describe, it, expect } from 'vitest';
import { estimateReadingMinutes } from '../../src/lib/readingTime';

describe('estimateReadingMinutes', () => {
  it('returns at least 1 minute for short content', () => {
    expect(estimateReadingMinutes('你好')).toBe(1);
  });

  it('estimates ~1 minute for ~400 chinese characters', () => {
    const text = '中'.repeat(400);
    expect(estimateReadingMinutes(text)).toBe(1);
  });

  it('estimates ~2 minutes for ~800 chinese characters', () => {
    const text = '中'.repeat(800);
    expect(estimateReadingMinutes(text)).toBe(2);
  });

  it('counts english words separately at ~250 wpm', () => {
    // 500 个英文单词 ≈ 2 分钟
    const text = ('hello '.repeat(500)).trim();
    expect(estimateReadingMinutes(text)).toBe(2);
  });

  it('handles mixed chinese and english', () => {
    // 400 中文 (1 分钟) + 250 英文 (1 分钟) ≈ 2 分钟
    const text = '中'.repeat(400) + ' ' + ('word '.repeat(250)).trim();
    expect(estimateReadingMinutes(text)).toBe(2);
  });

  it('returns 1 minute for empty string (sane minimum)', () => {
    expect(estimateReadingMinutes('')).toBe(1);
  });
});
