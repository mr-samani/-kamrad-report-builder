import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
interface PrintConfig {
  html: HTMLElement | string;
  title?: string;
  useStyles?: boolean;
  orientation?: 'portrait' | 'landscape';
  size?: 'A4' | 'A5' | 'Letter';
}
@Injectable({
  providedIn: 'root',
})
export class PrintService {
  private renderer: Renderer2;

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  /**
   * چاپ ایمن، سازگار با تمام مرورگرها و موبایل‌ها
   * @param html عنصر DOM یا رشته HTML
   * @param title عنوان صفحه چاپ (اختیاری)
   */
  print(config: PrintConfig): void {
    let size = config.size ?? 'A4';
    let orientation = config.orientation ?? 'portrait';
    try {
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        alert('Popup blocked! Please allow popups for printing.');
        return;
      }

      // آماده‌سازی HTML برای چاپ
      const content =
        typeof config.html === 'string' ? config.html : (config.html as HTMLElement).outerHTML;

      // جمع‌آوری استایل‌ها و لینک‌های CSS از parent document
      const styles = !config.useStyles
        ? ''
        : Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map((el) => el.outerHTML)
            .join('\\n');

      // محتوای کامل HTML برای پرینت
      const fullHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
    <title>${config.title ?? 'Print Preview'}</title>
    ${styles}
    <style>
      @page { 
        size: auto;
        margin: 15mm; 
        size: ${size};
        orientation: ${orientation}; 
      }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html, body { height: 100%; width: 100%; }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`;

      // نوشتن HTML در پنجره جدید
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();

      // صبر کن تا محتوای DOM آماده بشه
      const doPrint = () => {
        try {
          printWindow.focus();
          // مخصوص iOS Safari: بدون تأخیر ممکنه print نکنه
          setTimeout(() => {
            printWindow.print();
            // در اکثر مرورگرها بهتره بعد از اندکی تأخیر بسته بشه
            // setTimeout(() => {
            printWindow.close();
            //  }, 500);
          }, 300);
        } catch (err) {
          console.error('Print error:', err);
        }
      };

      // اگر مرورگر onload پشتیبانی می‌کنه
      if ('onload' in printWindow) {
        printWindow.onload = doPrint;
      } else {
        // fallback: صبر کوتاه برای آماده شدن محتوا
        setTimeout(doPrint, 600);
      }
    } catch (err) {
      console.error('Failed to open print window:', err);
    }
  }
}
