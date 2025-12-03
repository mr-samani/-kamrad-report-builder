import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PageItem } from '../../models/PageItem';
import { ISourceOptions } from '../../models/SourceItem';

export interface ImportOptions {
  /**
   * لیست attribute های مجاز برای نگه‌داری
   */
  allowedAttributes?: string[];
  /**
   * آیا استایل‌های inline را حفظ کنیم؟
   */
  preserveInlineStyles?: boolean;
  /**
   * آیا استایل‌های computed را استخراج کنیم؟
   */
  extractComputedStyles?: boolean;
  /**
   * فیلتر کردن استایل‌های خاص
   */
  styleFilter?: (propertyName: string, value: string) => boolean;
  /**
   * استفاده از CORS proxy برای دور زدن مشکل CORS
   */
  useCorsProxy?: boolean;
  /**
   * آدرس CORS proxy سفارشی
   */
  corsProxyUrl?: string;
  /**
   * زمان انتظار برای رندر شدن SPA (میلی‌ثانیه)
   */
  spaWaitTime?: number;
  /**
   * استفاده از iframe برای رندر کردن SPA
   */
  useSpaRenderer?: boolean;
}

export interface ImportResult {
  success: boolean;
  data?: PageItem[];
  error?: string;
  warnings?: string[];
}

@Injectable()
export class ImportHtmlService {
  private readonly NOT_ALLOWED_TAGS = [
    'style',
    'link',
    'script',
    'meta',
    'title',
    'html',
    'head',
    'body',
  ];

  // لیست پیش‌فرض attribute های مجاز
  private readonly DEFAULT_ALLOWED_ATTRIBUTES = [
    'src',
    'href',
    'alt',
    'title',
    'colspan',
    'rowspan',
    'target',
    'rel',
    'type',
    'name',
    'value',
    'placeholder',
    'disabled',
    'readonly',
    'checked',
    'selected',
    'multiple',
    'min',
    'max',
    'step',
    'pattern',
    'required',
    'maxlength',
    'width',
    'height',
    // 'data-*',
    'aria-*',
    'role',

    //svg
    'xmlns',
    'viewBox',
  ];

  // استایل‌هایی که معمولاً مفید هستند
  private readonly USEFUL_STYLES = [
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'border',
    'border-width',
    'border-style',
    'border-color',
    'border-radius',
    'background',
    'background-color',
    'background-image',
    'background-size',
    'background-position',
    'color',
    'font-size',
    'font-weight',
    'font-family',
    'line-height',
    'text-align',
    'text-decoration',
    'text-transform',
    'letter-spacing',
    'word-spacing',
    'flex',
    'flex-direction',
    'flex-wrap',
    'justify-content',
    'align-items',
    'gap',
    'grid',
    'grid-template-columns',
    'grid-template-rows',
    'grid-gap',
    'overflow',
    'overflow-x',
    'overflow-y',
    'z-index',
    'opacity',
    'cursor',
    'transform',
    'transition',
    'animation',
    'box-shadow',
    'text-shadow',
  ];

  // لیست CORS Proxy های عمومی
  private readonly CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
  ];

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
      const pageItems = await this.convertElementToPageItem(element as HTMLElement, options);

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
    const proxyUrl = options?.corsProxyUrl || this.CORS_PROXIES[0];
    const proxiedUrl = proxyUrl + encodeURIComponent(url);

    try {
      return await firstValueFrom(this.http.get(proxiedUrl, { responseType: 'text' }));
    } catch (error) {
      // اگر اولین proxy کار نکرد، بقیه رو امتحان کن
      for (let i = 1; i < this.CORS_PROXIES.length; i++) {
        try {
          const altProxiedUrl = this.CORS_PROXIES[i] + encodeURIComponent(url);
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
      return await this.importFromHtml(response.html, options);
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
  async importFromHtml(htmlString: string, options?: ImportOptions): Promise<ImportResult> {
    try {
      if (!htmlString || htmlString.trim().length === 0) {
        return {
          success: false,
          error: 'Html content is empty!',
        };
      }

      // پارس کردن HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');

      // گرفتن body یا اولین المنت
      const rootElement = doc.body.children.length > 0 ? doc.body : doc.documentElement;

      if (!rootElement || rootElement.children.length === 0) {
        return {
          success: false,
          error: 'Invalid html structure!',
        };
      }

      // تبدیل تمام المنت‌های اصلی
      const pageItems: PageItem[] = [];
      const warnings: string[] = [];

      for (let i = 0; i < rootElement.children.length; i++) {
        const child = rootElement.children[i] as HTMLElement;

        // نادیده گرفتن script و style tags
        if (this.NOT_ALLOWED_TAGS.includes(child.tagName.toLowerCase())) {
          continue;
        }

        try {
          const pageItem = await this.convertElementToPageItem(child, options);
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
        error: `Error on process HTML: ${error.message || 'Unknow Error'}`,
      };
    }
  }

  /**
   * تبدیل HTMLElement به PageItem
   */
  private async convertElementToPageItem(
    element: HTMLElement,
    options?: ImportOptions,
  ): Promise<PageItem | null> {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    // نادیده گرفتن script و style tags
    if (this.NOT_ALLOWED_TAGS.includes(element.tagName.toLowerCase())) {
      return null;
    }

    const pageItem = new PageItem();
    pageItem.tag = element.tagName.toLowerCase();

    // تعیین canHaveChild بر اساس تگ
    pageItem.canHaveChild = this.canHaveChildren(pageItem.tag);

    // استخراج محتوای متنی (فقط برای تگ‌های بدون فرزند)
    if (!pageItem.canHaveChild || element.children.length === 0) {
      const textContent = this.getDirectTextContent(element);
      if (textContent) {
        pageItem.content = textContent;
      }
    }

    // استخراج options (attributes, inputs, outputs)
    pageItem.options = this.extractOptions(element, options);

    // استخراج استایل‌ها
    pageItem.style = await this.extractStyles(element, options);

    // پردازش فرزندان
    if (pageItem.canHaveChild && element.children.length > 0) {
      pageItem.children = [];

      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i] as HTMLElement;
        const childPageItem = await this.convertElementToPageItem(child, options);

        if (childPageItem) {
          childPageItem.parent = pageItem;
          pageItem.children.push(childPageItem);
        }
      }
    }

    return pageItem;
  }

  /**
   * استخراج options از المنت
   */
  private extractOptions(element: HTMLElement, options?: ImportOptions): ISourceOptions {
    const allowedAttrs = options?.allowedAttributes || this.DEFAULT_ALLOWED_ATTRIBUTES;
    const attributes: Record<string, any> = {};

    // استخراج attribute ها
    Array.from(element.attributes).forEach((attr) => {
      const attrName = attr.name;

      // بررسی مجاز بودن attribute
      const isAllowed = allowedAttrs.some((allowed) => {
        if (allowed.endsWith('*')) {
          // برای الگوهای wildcard مثل data-* و aria-*
          const prefix = allowed.slice(0, -1);
          return attrName.startsWith(prefix);
        }
        return attrName === allowed;
      });

      if (isAllowed) {
        attributes[attrName] = attr.value;
      }
    });

    const sourceOptions: ISourceOptions = {};

    if (Object.keys(attributes).length > 0) {
      sourceOptions.attributes = attributes;
    }

    return sourceOptions;
  }

  /**
   * استخراج استایل‌های المنت
   */
  private async extractStyles(
    element: HTMLElement,
    options?: ImportOptions,
  ): Promise<string | undefined> {
    const styles: Record<string, string> = {};

    // 1. استایل‌های inline
    if (options?.preserveInlineStyles !== false && element.style.length > 0) {
      for (let i = 0; i < element.style.length; i++) {
        const propertyName = element.style[i];
        const value = element.style.getPropertyValue(propertyName);

        if (this.shouldIncludeStyle(propertyName, value, options)) {
          styles[propertyName] = value;
        }
      }
    }

    // 2. استایل‌های computed (اختیاری)
    if (options?.extractComputedStyles && typeof window !== 'undefined') {
      try {
        const computedStyles = window.getComputedStyle(element);

        this.USEFUL_STYLES.forEach((propertyName) => {
          const value = computedStyles.getPropertyValue(propertyName);

          // فقط استایل‌هایی که مقدار غیر پیش‌فرض دارند
          if (
            value &&
            value !== 'none' &&
            value !== 'initial' &&
            value !== 'normal' &&
            !styles[propertyName] && // اگر از قبل نداریم
            this.shouldIncludeStyle(propertyName, value, options)
          ) {
            styles[propertyName] = value;
          }
        });
      } catch (error) {
        console.warn('Error on export computed styles:', error);
      }
    }

    // تبدیل به string CSS
    if (Object.keys(styles).length > 0) {
      return Object.entries(styles)
        .map(([prop, value]) => `${prop}: ${value};`)
        .join(' ');
    }

    return undefined;
  }

  /**
   * بررسی اینکه آیا استایل باید شامل شود
   */
  private shouldIncludeStyle(
    propertyName: string,
    value: string,
    options?: ImportOptions,
  ): boolean {
    // اگر فیلتر سفارشی داریم
    if (options?.styleFilter) {
      return options.styleFilter(propertyName, value);
    }

    // فیلتر پیش‌فرض: فقط استایل‌های مفید
    return this.USEFUL_STYLES.includes(propertyName);
  }

  /**
   * گرفتن محتوای مستقیم متنی (بدون فرزندان)
   */
  private getDirectTextContent(element: HTMLElement): string {
    let text = '';

    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      }
    });

    return text.trim();
  }

  /**
   * تعیین اینکه تگ می‌تواند فرزند داشته باشد
   */
  private canHaveChildren(tag: string): boolean {
    const noChildTags = [
      'img',
      'input',
      'br',
      'hr',
      'meta',
      'link',
      'area',
      'base',
      'col',
      'embed',
      'param',
      'source',
      'track',
      'wbr',
    ];

    return !noChildTags.includes(tag.toLowerCase());
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

  /**
   * تبدیل PageItem به JSON
   */
  exportToJson(pageItem: PageItem | PageItem[]): string {
    return JSON.stringify(pageItem, this.jsonReplacer, 2);
  }

  /**
   * Replacer برای حذف فیلدهای غیر ضروری در JSON
   */
  private jsonReplacer(key: string, value: any): any {
    // حذف parent برای جلوگیری از circular reference
    if (key === 'parent') {
      return undefined;
    }
    // حذف el (HTMLElement)
    if (key === 'el') {
      return undefined;
    }
    return value;
  }

  /**
   * Import از JSON
   */
  importFromJson(jsonString: string): ImportResult {
    try {
      const parsed = JSON.parse(jsonString);
      const pageItems = Array.isArray(parsed) ? parsed : [parsed];

      // بازسازی روابط parent-child
      pageItems.forEach((item) => this.reconstructParentRelations(item));

      return {
        success: true,
        data: pageItems,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error on process JSON: ${error.message}`,
      };
    }
  }

  /**
   * بازسازی روابط parent در ساختار
   */
  private reconstructParentRelations(pageItem: PageItem, parent?: PageItem): void {
    if (parent) {
      pageItem.parent = parent;
    }

    if (pageItem.children && pageItem.children.length > 0) {
      pageItem.children.forEach((child) => {
        this.reconstructParentRelations(child, pageItem);
      });
    }
  }
}
