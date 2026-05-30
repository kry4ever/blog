// src/lib/readingTime.ts
// 阅读时长估算：中文按 400 字/分钟，英文按 250 词/分钟。
// 中文字符通过 Unicode 范围识别（CJK 统一表意文字 + 标点）。

const CHINESE_CHARS_PER_MINUTE = 400;
const ENGLISH_WORDS_PER_MINUTE = 250;

const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/g;

export function estimateReadingMinutes(text: string): number {
  if (!text) return 1;

  const chineseChars = (text.match(CJK_REGEX) || []).length;

  // 去掉中文字符后按空白分词数英文词
  const englishText = text.replace(CJK_REGEX, ' ');
  const englishWords = englishText
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w)).length;

  const minutes =
    chineseChars / CHINESE_CHARS_PER_MINUTE +
    englishWords / ENGLISH_WORDS_PER_MINUTE;

  return Math.max(1, Math.round(minutes));
}
