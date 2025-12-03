import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PageItem } from '../../models/PageItem';
import { ImportOptions } from './ImportOptions';
import { ImportResult } from './ImportResult';
import { CORS_PROXIES, NOT_ALLOWED_TAGS } from './allowed-consts';
import { HtmlImporter } from './import-helper';

@Injectable()
export class ImportHtmlService {
  constructor(private http: HttpClient) {}

  /**
   * Import از URL با querySelector
   */
  async importFromUrl(
    url: string,
    querySelector: string,
    options?: ImportOptions,
  ): Promise<ImportResult> {
    try {
      // اعتبارسنجی URL
      if (!this.isValidUrl(url)) {
        return {
          success: false,
          error: 'Invalid Url Address!',
        };
      }

      let htmlContent: string;

      // اگر باید از SPA Renderer استفاده کنیم
      if (options?.useSpaRenderer) {
        htmlContent = await this.fetchWithSpaRenderer(url, options);
      } else {
        // تلاش برای دریافت مستقیم
        try {
          htmlContent = await this.fetchUrl(url);
        } catch (corsError) {
          // اگر CORS error داشت، از proxy استفاده کن
          if (options?.useCorsProxy !== false) {
            console.warn('CORS error detected, trying with proxy...');
            htmlContent = await this.fetchWithCorsProxy(url, options);
          } else {
            throw corsError;
          }
        }
      }

      // ساخت یک DOM موقت
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // پیدا کردن المنت با querySelector
      const element = doc.querySelector(querySelector);

      if (!element) {
        return {
          success: false,
          error: `Element with this selector "${querySelector}"not found!`,
          warnings: [
            'احتمالاً صفحه یک SPA است و نیاز به رندر دارد. گزینه useSpaRenderer را فعال کنید.',
          ],
        };
      }

      // تبدیل به PageItem
      const pageItems = await HtmlImporter.convertElementToPageItem(
        element as HTMLElement,
        options,
      );

      return {
        success: true,
        data: pageItems ? [pageItems] : [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error on get data from Url: ${error.message || 'Unknow Error'}`,
      };
    }
  }

  /**
   * دریافت محتوا با استفاده از CORS Proxy
   */
  private async fetchWithCorsProxy(url: string, options?: ImportOptions): Promise<string> {
    const proxyUrl = options?.corsProxyUrl || CORS_PROXIES[0];
    const proxiedUrl = proxyUrl + encodeURIComponent(url);

    try {
      return await firstValueFrom(this.http.get(proxiedUrl, { responseType: 'text' }));
    } catch (error) {
      // اگر اولین proxy کار نکرد، بقیه رو امتحان کن
      for (let i = 1; i < CORS_PROXIES.length; i++) {
        try {
          const altProxiedUrl = CORS_PROXIES[i] + encodeURIComponent(url);
          return await firstValueFrom(this.http.get(altProxiedUrl, { responseType: 'text' }));
        } catch (e) {
          continue;
        }
      }
      throw new Error('تمام CORS Proxy ها ناموفق بودند');
    }
  }

  /**
   * دریافت محتوای URL به صورت مستقیم
   */
  private async fetchUrl(url: string): Promise<string> {
    return await firstValueFrom(this.http.get(url, { responseType: 'text' }));
  }

  /**
   * دریافت و رندر کردن SPA با استفاده از iframe
   */
  private async fetchWithSpaRenderer(url: string, options?: ImportOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      // ساخت iframe مخفی
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.position = 'absolute';
      iframe.style.width = '1920px';
      iframe.style.height = '1080px';

      // تنظیم sandbox برای امنیت
      iframe.sandbox.add('allow-same-origin', 'allow-scripts');

      document.body.appendChild(iframe);

      let timeoutId: any;
      let resolved = false;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      };

      // Timeout برای رندر شدن
      const waitTime = options?.spaWaitTime || 10000; // پیش‌فرض 10 ثانیه

      iframe.onload = () => {
        try {
          // منتظر بمانیم تا JavaScript ها اجرا شوند
          timeoutId = setTimeout(() => {
            if (resolved) return;
            resolved = true;

            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

              if (!iframeDoc) {
                cleanup();
                reject(
                  new Error('دسترسی به محتوای iframe امکان‌پذیر نیست (احتمالاً به دلیل CORS)'),
                );
                return;
              }

              const html = iframeDoc.documentElement.outerHTML;
              cleanup();
              resolve(html);
            } catch (error: any) {
              cleanup();
              reject(new Error(`خطا در خواندن محتوای iframe: ${error.message}`));
            }
          }, waitTime);
        } catch (error: any) {
          cleanup();
          reject(error);
        }
      };

      iframe.onerror = (error) => {
        cleanup();
        reject(new Error('خطا در بارگذاری iframe'));
      };

      // بارگذاری URL
      try {
        iframe.src = url;
      } catch (error) {
        cleanup();
        reject(error);
      }

      // Timeout کلی
      setTimeout(() => {
        if (!resolved) {
          cleanup();
          reject(new Error('Timeout: زمان انتظار برای بارگذاری صفحه تمام شد'));
        }
      }, waitTime + 5000);
    });
  }

  /**
   * Import از URL با استفاده از Puppeteer/Playwright proxy
   * این متد نیاز به یک backend API دارد
   */
  async importFromUrlWithBackend(
    url: string,
    querySelector: string,
    backendApiUrl: string,
    options?: ImportOptions,
  ): Promise<ImportResult> {
    try {
      // ارسال درخواست به backend
      const response = await firstValueFrom(
        this.http.post<{ html: string; success: boolean; error?: string }>(backendApiUrl, {
          url: url,
          waitForSelector: querySelector,
          waitTime: options?.spaWaitTime || 10000,
        }),
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'خطا در دریافت محتوا از backend',
        };
      }

      // پردازش HTML دریافتی
      return await this.importFromHtml(response.html, querySelector, options);
    } catch (error: any) {
      return {
        success: false,
        error: `خطا در ارتباط با backend: ${error.message}`,
      };
    }
  }

  /**
   * Import از HTML String
   */
  async importFromHtml(
    htmlString: string,
    querySelector: string,
    options?: ImportOptions,
  ): Promise<ImportResult> {
    try {
      if (!htmlString || htmlString.trim().length === 0) {
        return {
          success: false,
          error: 'Html content is empty!',
        };
      }

      let doc: Document;
      // اگر useSpaRenderer فعال باشه، از iframe استفاده کن
      if (options?.useSpaRenderer) {
        doc = await HtmlImporter.renderHtmlInIframe(htmlString, options);
      } else {
        // پارس کردن معمولی HTML
        const parser = new DOMParser();
        doc = parser.parseFromString(htmlString, 'text/html');
      }

      // گرفتن body یا اولین المنت
      const rootElement = doc.body.children.length > 0 ? doc.body : doc.documentElement;

      if (!rootElement || rootElement.children.length === 0) {
        return {
          success: false,
          error: 'Invalid html structure!',
        };
      }

      // پیدا کردن المنت با querySelector
      const elChilds = rootElement.querySelectorAll(querySelector);
      debugger;

      if (!elChilds || elChilds.length == 0) {
        return {
          success: false,
          error: `Element with this selector "${querySelector}"not found!`,
          warnings: [
            'احتمالاً صفحه یک SPA است و نیاز به رندر دارد. گزینه useSpaRenderer را فعال کنید.',
          ],
        };
      }

      // تبدیل تمام المنت‌های اصلی
      const pageItems: PageItem[] = [];
      const warnings: string[] = [];

      for (let i = 0; i < elChilds.length; i++) {
        const child = elChilds[i] as HTMLElement;

        // نادیده گرفتن script و style tags
        if (NOT_ALLOWED_TAGS.includes(child.tagName.toLowerCase())) {
          continue;
        }

        try {
          const pageItem = await HtmlImporter.convertElementToPageItem(child, options);
          if (pageItem) {
            pageItems.push(pageItem);
          }
        } catch (error: any) {
          warnings.push(`Error on convert element ${child.tagName}: ${error.message}`);
        }
      }

      return {
        success: true,
        data: pageItems,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error on process HTML: ${error.message || 'Unknown Error'}`,
      };
    }
  }

  /**
   * اعتبارسنجی URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
