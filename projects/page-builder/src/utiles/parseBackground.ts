export function parseBackground(background: string): {
  color?: string;
  gradient?: string;
  image?: string;
} {
  const result: { color?: string; gradient?: string; image?: string } = {};

  if (!background) return result;
  const src = background.trim();

  // 1) پیدا کردن gradient با اسکن برای بستن پرانتزها
  const gradientTypes = ['linear-gradient', 'radial-gradient', 'conic-gradient'];
  for (const g of gradientTypes) {
    const idx = src.indexOf(g + '(');
    if (idx !== -1) {
      let i = idx + g.length + 1; // موقعیت بعد از '('
      let depth = 1;
      while (i < src.length && depth > 0) {
        const ch = src[i];
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        i++;
      }
      // i الان به اولین کاراکتر بعد از پرانتز بسته رسیده
      if (depth === 0) {
        result.gradient = src.substring(idx, i).trim();
        break;
      } else {
        // اگر پرانتزها بسته نشده بودند، fallback به regex ساده
        const fallback = src.match(new RegExp(`${g}\\([^)]*\\)`));
        if (fallback) result.gradient = fallback[0];
      }
    }
  }

  // 2) پیدا کردن image (url(...)) — مشابهاً handle quotes داخل url
  const urlMatch = src.match(/url\(\s*(['"]?)[^)]+?\1\s*\)/);
  if (urlMatch) {
    result.image = urlMatch[0];
  }

  // 3) پیدا کردن رنگ صریح (hex, rgb(a), hsl(a))
  //    از اولین occurrence که خارج از gradient/url باشه استفاده می‌کنیم
  const colorRegex = /(?:(rgba?|hsla?)\([^)]+\)|#[0-9a-fA-F]{3,8})/g;
  let colorMatch;
  while ((colorMatch = colorRegex.exec(src)) !== null) {
    const found = colorMatch[0];
    // اگر داخل gradient قرار نگرفته باشد (وگرنه قبلاً gradient استخراج شده)
    if (
      result.gradient &&
      src.indexOf(result.gradient) <= src.indexOf(found) &&
      src.indexOf(found) < src.indexOf(result.gradient) + result.gradient.length
    ) {
      // این رنگ در داخل gradient است — نادیده بگیر
      continue;
    }
    // همچنین اگر داخل url باشه نادیده بگیر
    if (
      result.image &&
      src.indexOf(result.image) <= src.indexOf(found) &&
      src.indexOf(found) < src.indexOf(result.image) + result.image.length
    ) {
      continue;
    }
    result.color = found;
    break;
  }

  return result;
}
