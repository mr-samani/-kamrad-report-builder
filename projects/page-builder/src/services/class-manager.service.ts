import { DOCUMENT, Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { parseCssToRecord } from '../utiles/css-parser';
import { CSSStyleHelper } from '../helper/CSSStyle';
interface ICssFiles {
  name: string;
  data: Record<string, string>;
}
@Injectable({
  providedIn: 'root',
})
export class ClassManagerService {
  availableClasses: string[] = [];

  cssFileData: ICssFiles[] = [
    {
      name: 'default',
      data: {
        'a[href=""],#b.a,a~b': 'color:red;',
        button: `color: red;
            
            background-color: #eecec;

            box-shadow   :    0 0 10px     1px red;
            `,
        '#btn': 'border:1px solid red;color:red;padding:10px 20px',
        '.btn-primary': 'background:blue;color:white',
        '.btn-large': 'font-size:18px;padding:15px 30px',
      },
    },
  ];

  private renderer: Renderer2;
  private styleElement: HTMLStyleElement | null = null;
  private styleSheet: CSSStyleSheet | null = null;
  private rulesMap = new Map<string, number>(); // className -> ruleIndex
  private debounceTimers = new Map<string, any>();
  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private doc: Document,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.availableClasses = [];
    for (let item of this.cssFileData) {
      // filter get only classes
      const classes = Object.keys(item.data)
        .filter((x) => x.startsWith('.'))
        // remove dot from first class name
        .map((m) => m.replace('.', ''));
      this.availableClasses.push(...classes);
    }
  }

  public async addCssFile(name: string, content: string) {
    name = this.validateName(name);
    this.addStyleToDocument(content);
    const data = await parseCssToRecord(content);
    if (Object.entries(data).length > 0) {
      this.cssFileData.push({
        name,
        data,
      });
    }
  }

  private validateName(name: string): string {
    // جدا کردن baseName و شماره‌ی انتهایی (اگر وجود داشت)
    const match = name.match(/^(.*?)(?:_(\d+))?$/);
    const baseName = match?.[1] ?? name;

    let index = 0;
    let finalName = baseName;

    while (this.cssFileData.some((x) => x.name.toLowerCase() === finalName.toLowerCase())) {
      index++;
      finalName = `${baseName}_${index}`;
    }

    return finalName;
  }

  private addStyleToDocument(css: string) {
    let existingStyle = this.doc.querySelector('style#NgxPageBuilderClassUI') as HTMLStyleElement;

    if (!existingStyle) {
      existingStyle = this.doc.createElement('style');
      existingStyle.id = 'NgxPageBuilderClassUI';
      existingStyle.innerHTML = css;
      this.doc.head.appendChild(existingStyle);
    }

    this.styleElement = existingStyle;
    this.styleSheet = existingStyle.sheet as CSSStyleSheet;

    // ساخت map از rules موجود (اگر داریم)
    this.rebuildRulesMap();
  }

  public getClassValue(selectedClass: string): string {
    for (let i = 0; i < this.cssFileData.length; i++) {
      let found = this.cssFileData[i].data[`.${selectedClass}`];
      if (found) {
        return found;
      }
    }
    return '';
  }
  public getAllCss(): string {
    let css = '';
    for (let i = 0; i < this.cssFileData.length; i++) {
      Object.entries(this.cssFileData[i].data).forEach((c) => {
        css += `${c[0]} { ${c[1]} }`;
      });
    }
    return css;
  }
  /**
   * ساخت مجدد map از rules موجود
   */
  private rebuildRulesMap(): void {
    this.rulesMap.clear();

    if (!this.styleSheet) return;

    try {
      const rules = this.styleSheet.cssRules || this.styleSheet.rules;
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i] as CSSStyleRule;
        if (rule.selectorText) {
          this.rulesMap.set(rule.selectorText, i);
        }
      }
    } catch (e) {
      console.warn('Cannot access stylesheet rules:', e);
    }
  }

  /**
   * آپدیت یا اضافه کردن یک کلاس - روش اصلی و پرفورمنس بالا
   * این متد مستقیما با CSSOM کار میکنه (خیلی سریع!)
   */
  updateClass(className: string, styles: Partial<CSSStyleDeclaration> | string): void {
    if (!this.styleSheet) {
      console.error('StyleSheet not initialized');
      return;
    }

    // تبدیل styles به CSS string
    const cssText = typeof styles === 'string' ? styles : this.styleObjectToString(styles);

    // ساخت rule کامل
    const selector =
      className.startsWith('.') || className.startsWith('#') ? className : `.${className}`;

    const ruleText = `${selector} { ${cssText} }`;

    try {
      // چک کنیم rule وجود داره یا نه
      const existingIndex = this.rulesMap.get(selector);

      if (existingIndex !== undefined) {
        // آپدیت rule موجود
        this.styleSheet.deleteRule(existingIndex);
        this.styleSheet.insertRule(ruleText, existingIndex);
      } else {
        // اضافه کردن rule جدید
        const newIndex = this.styleSheet.cssRules.length;
        this.styleSheet.insertRule(ruleText, newIndex);
        this.rulesMap.set(selector, newIndex);
      }
    } catch (e) {
      console.error('Error updating CSS rule:', e);
    }
  }

  /**
   * آپدیت با debounce - برای تغییرات realtime مثل color picker
   * این باعث میشه هر 16ms (60fps) یک بار آپدیت بشه نه هر بار که تغییر میکنه
   */
  updateClassDebounced(
    className: string,
    styles: Partial<CSSStyleDeclaration> | string,
    delay: number = 16, // 16ms = 60fps
  ): void {
    // پاک کردن timer قبلی
    const existingTimer = this.debounceTimers.get(className);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // ست کردن timer جدید
    const timer = setTimeout(() => {
      this.updateClass(className, styles);
      this.debounceTimers.delete(className);
    }, delay);

    this.debounceTimers.set(className, timer);
  }

  /**
   * آپدیت فوری بدون debounce (برای استفاده در requestAnimationFrame)
   * این بهترین روش برای smooth animations هست
   */
  updateClassImmediate(className: string, styles: Partial<CSSStyleDeclaration> | string): void {
    requestAnimationFrame(() => {
      this.updateClass(className, styles);
    });
  }

  /**
   * Batch update - آپدیت چند کلاس به صورت همزمان
   * این خیلی بهتر از آپدیت تک تک هست
   */
  updateClasses(classes: Record<string, Partial<CSSStyleDeclaration> | string>): void {
    // استفاده از requestAnimationFrame برای بهینه سازی
    requestAnimationFrame(() => {
      Object.entries(classes).forEach(([className, styles]) => {
        this.updateClass(className, styles);
      });
    });
  }

  /**
   * حذف یک کلاس
   */
  removeClass(className: string): void {
    if (!this.styleSheet) return;

    const selector =
      className.startsWith('.') || className.startsWith('#') ? className : `.${className}`;

    const index = this.rulesMap.get(selector);

    if (index !== undefined) {
      try {
        this.styleSheet.deleteRule(index);
        this.rulesMap.delete(selector);

        // آپدیت index های بعد از این rule
        this.rulesMap.forEach((value, key) => {
          if (value > index) {
            this.rulesMap.set(key, value - 1);
          }
        });
      } catch (e) {
        console.error('Error removing CSS rule:', e);
      }
    }
  }

  /**
   * گرفتن styles یک کلاس
   */
  getClassStyles(className: string): string | null {
    if (!this.styleSheet) return null;

    const selector =
      className.startsWith('.') || className.startsWith('#') ? className : `.${className}`;

    const index = this.rulesMap.get(selector);

    if (index !== undefined) {
      try {
        const rule = this.styleSheet.cssRules[index] as CSSStyleRule;
        return rule.style.cssText;
      } catch (e) {
        console.error('Error getting CSS rule:', e);
      }
    }

    return null;
  }

  /**
   * پاک کردن همه rules
   */
  clearAll(): void {
    if (!this.styleSheet) return;

    try {
      while (this.styleSheet.cssRules.length > 0) {
        this.styleSheet.deleteRule(0);
      }
      this.rulesMap.clear();
    } catch (e) {
      console.error('Error clearing stylesheet:', e);
    }
  }

  /**
   * Load کردن CSS از string (برای بارگذاری اولیه)
   */
  loadCSS(css: string): void {
    this.clearAll();

    if (!this.styleSheet) return;

    // Parse CSS و اضافه کردن rules
    const rules = this.parseCSSString(css);

    rules.forEach(({ selector, styles }) => {
      this.updateClass(selector, styles);
    });
  }

  /**
   * Export کردن همه CSS به string
   */
  exportCSS(): string {
    if (!this.styleSheet) return '';

    try {
      const rules = Array.from(this.styleSheet.cssRules);
      return rules.map((rule) => rule.cssText).join('\n');
    } catch (e) {
      console.error('Error exporting CSS:', e);
      return '';
    }
  }

  /**
   * تبدیل style object به CSS string
   */
  private styleObjectToString(styles: Partial<CSSStyleDeclaration>): string {
    const declarations: string[] = [];

    Object.entries(styles).forEach(([property, value]) => {
      if (property === 'cssText' || typeof value !== 'string') {
        return;
      }

      // تبدیل camelCase به kebab-case
      const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      declarations.push(`${kebabProperty}: ${value}`);
    });

    return declarations.join('; ') + ';';
  }

  /**
   * Parse کردن CSS string به rules
   */
  private parseCSSString(css: string): Array<{ selector: string; styles: string }> {
    const rules: Array<{ selector: string; styles: string }> = [];

    // Regex برای پیدا کردن rules
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match;

    while ((match = ruleRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const styles = match[2].trim();
      rules.push({ selector, styles });
    }

    return rules;
  }

  /**
   * بررسی وجود یک کلاس
   */
  hasClass(className: string): boolean {
    const selector =
      className.startsWith('.') || className.startsWith('#') ? className : `.${className}`;

    return this.rulesMap.has(selector);
  }

  /**
   * گرفتن تعداد کل rules
   */
  get rulesCount(): number {
    return this.rulesMap.size;
  }

  /**
   * Destroy - پاکسازی
   */
  destroy(): void {
    // پاک کردن همه timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    // حذف style element
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }

    this.styleElement = null;
    this.styleSheet = null;
    this.rulesMap.clear();
  }
}
