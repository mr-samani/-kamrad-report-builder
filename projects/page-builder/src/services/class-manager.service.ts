import { DOCUMENT, inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { parseCssToRecord } from '../utiles/css-parser';
import { CSSStyleHelper } from '../helper/CSSStyle';
import { PageBuilderService } from './page-builder.service';

interface ICssFile {
  id: string; // UUID یا unique ID
  name: string;
  data: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

interface IClassInfo {
  selector: string;
  cssText: string;
  fileName: string;
  fileId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClassManagerService {
  // Observables برای reactive programming
  private cssFilesSubject = new BehaviorSubject<ICssFile[]>([]);
  public cssFiles$ = this.cssFilesSubject.asObservable();

  private availableClassesSubject = new BehaviorSubject<string[]>([]);
  public availableClasses$ = this.availableClassesSubject.asObservable();

  // Internal state
  public cssFileData: ICssFile[] = [];
  private styleElement: HTMLStyleElement | null = null;
  private styleSheet: CSSStyleSheet | null = null;
  private rulesMap = new Map<string, { index: number; fileId: string }>(); // selector -> {index, fileId}
  private debounceTimers = new Map<string, any>();
  private isInitialized = false;

  doc = inject(DOCUMENT);

  constructor(
    private rendererFactory: RendererFactory2,
    private pageBuilder: PageBuilderService,
  ) {
    // Initialize با فایل پیش‌فرض
    this.initializeDefaultFile();
  }

  /**
   * مقداردهی اولیه با فایل پیش‌فرض
   */
  private initializeDefaultFile(): void {
    const defaultFile: ICssFile = {
      id: this.generateId(),
      name: 'default',
      data: {
        'a[href=""],#b.a,a~b': 'color:red',
        button: 'color:red;background-color:#eecec;box-shadow:0 0 10px 1px red',
        '#btn': 'border:1px solid red;color:red;padding:10px 20px',
        '.btn-primary': 'background:blue;color:white',
        '.btn-large': 'font-size:18px;padding:15px 30px',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cssFileData.push(defaultFile);
    this.updateAvailableClasses();
    this.cssFilesSubject.next(this.cssFileData);
  }

  /**
   * Initialize کردن style element
   * این باید بعد از اینکه pageBuilder آماده شد صدا زده بشه
   */
  public initialize(): void {
    if (this.isInitialized) return;

    if (!this.pageBuilder.innerShadowRootDom) {
      console.warn('PageBuilder shadow root not ready');
      return;
    }

    // ساخت یا پیدا کردن style element
    let existingStyle = this.pageBuilder.innerShadowRootDom.querySelector(
      'style#NgxPageBuilderClassUI',
    ) as HTMLStyleElement;

    if (!existingStyle) {
      existingStyle = this.doc.createElement('style');
      existingStyle.id = 'NgxPageBuilderClassUI';
      this.pageBuilder.innerShadowRootDom.appendChild(existingStyle);
    }

    this.styleElement = existingStyle;
    this.styleSheet = existingStyle.sheet as CSSStyleSheet;

    // Load کردن همه فایل‌های CSS
    this.loadAllFiles();
    this.isInitialized = true;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `css_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate و unique کردن نام
   */
  private validateName(name: string, excludeId?: string): string {
    const match = name.match(/^(.*?)(?:_(\d+))?$/);
    const baseName = match?.[1] ?? name;

    let index = 0;
    let finalName = baseName;

    while (
      this.cssFileData.some(
        (x) => x.name.toLowerCase() === finalName.toLowerCase() && x.id !== excludeId,
      )
    ) {
      index++;
      finalName = `${baseName}_${index}`;
    }

    return finalName;
  }

  /**
   * اضافه کردن فایل CSS جدید
   */
  public async addCssFile(name: string, content: string): Promise<ICssFile> {
    name = this.validateName(name);
    const data = await parseCssToRecord(content);

    const newFile: ICssFile = {
      id: this.generateId(),
      name,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cssFileData.push(newFile);
    this.updateAvailableClasses();
    this.cssFilesSubject.next(this.cssFileData);

    // اگر initialized هست، rules رو اضافه کن
    if (this.isInitialized) {
      this.loadFileRules(newFile);
    }

    return newFile;
  }

  /**
   * آپدیت فایل CSS
   */
  public async updateCssFile(fileId: string, content: string): Promise<void> {
    const fileIndex = this.cssFileData.findIndex((f) => f.id === fileId);
    if (fileIndex === -1) {
      throw new Error(`File with id ${fileId} not found`);
    }

    const data = await parseCssToRecord(content);
    const file = this.cssFileData[fileIndex];

    // حذف rules قدیمی این فایل
    this.removeFileRules(fileId);

    // آپدیت data
    file.data = data;
    file.updatedAt = new Date();

    this.updateAvailableClasses();
    this.cssFilesSubject.next(this.cssFileData);

    // اضافه کردن rules جدید
    if (this.isInitialized) {
      this.loadFileRules(file);
    }
  }

  /**
   * حذف فایل CSS
   */
  public removeCssFile(fileId: string): void {
    const fileIndex = this.cssFileData.findIndex((f) => f.id === fileId);
    if (fileIndex === -1) return;

    // حذف rules این فایل
    this.removeFileRules(fileId);

    // حذف از لیست
    this.cssFileData.splice(fileIndex, 1);
    this.updateAvailableClasses();
    this.cssFilesSubject.next(this.cssFileData);
  }

  /**
   * تغییر نام فایل
   */
  public renameCssFile(fileId: string, newName: string): void {
    const file = this.cssFileData.find((f) => f.id === fileId);
    if (!file) return;

    file.name = this.validateName(newName, fileId);
    file.updatedAt = new Date();
    this.cssFilesSubject.next(this.cssFileData);
  }

  /**
   * گرفتن فایل با ID
   */
  public getCssFile(fileId: string): ICssFile | undefined {
    return this.cssFileData.find((f) => f.id === fileId);
  }

  /**
   * گرفتن همه فایل‌ها
   */
  public getAllCssFiles(): ICssFile[] {
    return [...this.cssFileData];
  }

  /**
   * Load کردن همه فایل‌ها
   */
  private loadAllFiles(): void {
    if (!this.styleSheet) return;

    // پاک کردن همه rules
    this.clearAllRules();

    // Load کردن هر فایل
    this.cssFileData.forEach((file) => {
      this.loadFileRules(file);
    });
  }

  /**
   * Load کردن rules یک فایل
   */
  private loadFileRules(file: ICssFile): void {
    if (!this.styleSheet) return;

    Object.entries(file.data).forEach(([selector, cssText]) => {
      this.insertRule(selector, cssText, file.id);
    });
  }

  /**
   * حذف rules یک فایل
   */
  private removeFileRules(fileId: string): void {
    if (!this.styleSheet) return;

    // پیدا کردن همه rules این فایل
    const rulesToRemove: string[] = [];
    this.rulesMap.forEach((value, selector) => {
      if (value.fileId === fileId) {
        rulesToRemove.push(selector);
      }
    });

    // حذف rules (از آخر به اول برای جلوگیری از مشکل index)
    rulesToRemove
      .sort((a, b) => {
        const indexA = this.rulesMap.get(a)?.index ?? 0;
        const indexB = this.rulesMap.get(b)?.index ?? 0;
        return indexB - indexA;
      })
      .forEach((selector) => {
        this.deleteRule(selector);
      });
  }

  /**
   * Insert کردن یک rule
   */
  private insertRule(selector: string, cssText: string, fileId: string): void {
    if (!this.styleSheet) return;

    try {
      const ruleText = `${selector} { ${cssText} }`;
      const index = this.styleSheet.cssRules.length;
      this.styleSheet.insertRule(ruleText, index);
      this.rulesMap.set(selector, { index, fileId });
    } catch (e) {
      console.error(`Error inserting rule ${selector}:`, e);
    }
  }

  /**
   * حذف یک rule
   */
  private deleteRule(selector: string): void {
    if (!this.styleSheet) return;

    const ruleInfo = this.rulesMap.get(selector);
    if (!ruleInfo) return;

    try {
      this.styleSheet.deleteRule(ruleInfo.index);
      this.rulesMap.delete(selector);

      // آپدیت index های بعد از این rule
      this.rulesMap.forEach((value, key) => {
        if (value.index > ruleInfo.index) {
          value.index--;
        }
      });
    } catch (e) {
      console.error(`Error deleting rule ${selector}:`, e);
    }
  }

  /**
   * آپدیت یا اضافه کردن یک کلاس
   */
  public updateClass(
    selector: string,
    styles: Partial<CSSStyleDeclaration> | string,
    fileId?: string,
  ): void {
    if (!this.styleSheet) {
      console.warn('StyleSheet not initialized. Call initialize() first.');
      return;
    }

    // تبدیل styles به CSS string
    const cssText = typeof styles === 'string' ? styles : this.styleObjectToString(styles);

    // Normalize selector
    const normalizedSelector = this.normalizeSelector(selector);

    // پیدا کردن fileId
    const targetFileId =
      fileId || this.rulesMap.get(normalizedSelector)?.fileId || this.cssFileData[0]?.id;

    if (!targetFileId) {
      console.error('No file available to add class');
      return;
    }

    const ruleText = `${normalizedSelector} { ${cssText} }`;

    try {
      const existingRule = this.rulesMap.get(normalizedSelector);

      if (existingRule) {
        // آپدیت rule موجود
        this.styleSheet.deleteRule(existingRule.index);
        this.styleSheet.insertRule(ruleText, existingRule.index);
      } else {
        // اضافه کردن rule جدید
        const index = this.styleSheet.cssRules.length;
        this.styleSheet.insertRule(ruleText, index);
        this.rulesMap.set(normalizedSelector, { index, fileId: targetFileId });
      }

      // آپدیت در cssFileData
      const file = this.cssFileData.find((f) => f.id === targetFileId);
      if (file) {
        file.data[normalizedSelector] = cssText;
        file.updatedAt = new Date();
        this.updateAvailableClasses();
        this.cssFilesSubject.next(this.cssFileData);
      }
    } catch (e) {
      console.error('Error updating CSS rule:', e);
    }
  }

  /**
   * آپدیت با debounce
   */
  public updateClassDebounced(
    selector: string,
    styles: Partial<CSSStyleDeclaration> | string,
    delay: number = 16,
    fileId?: string,
  ): void {
    const normalizedSelector = this.normalizeSelector(selector);

    // پاک کردن timer قبلی
    const existingTimer = this.debounceTimers.get(normalizedSelector);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // ست کردن timer جدید
    const timer = setTimeout(() => {
      this.updateClass(normalizedSelector, styles, fileId);
      this.debounceTimers.delete(normalizedSelector);
    }, delay);

    this.debounceTimers.set(normalizedSelector, timer);
  }

  /**
   * آپدیت فوری با requestAnimationFrame
   */
  public updateClassImmediate(
    selector: string,
    styles: Partial<CSSStyleDeclaration> | string,
    fileId?: string,
  ): void {
    requestAnimationFrame(() => {
      this.updateClass(selector, styles, fileId);
    });
  }

  /**
   * Batch update
   */
  public updateClasses(
    classes: Record<string, Partial<CSSStyleDeclaration> | string>,
    fileId?: string,
  ): void {
    requestAnimationFrame(() => {
      Object.entries(classes).forEach(([selector, styles]) => {
        this.updateClass(selector, styles, fileId);
      });
    });
  }

  /**
   * حذف یک کلاس
   */
  public removeClass(selector: string): void {
    const normalizedSelector = this.normalizeSelector(selector);
    const ruleInfo = this.rulesMap.get(normalizedSelector);

    if (!ruleInfo) return;

    // حذف از stylesheet
    this.deleteRule(normalizedSelector);

    // حذف از cssFileData
    const file = this.cssFileData.find((f) => f.id === ruleInfo.fileId);
    if (file) {
      delete file.data[normalizedSelector];
      file.updatedAt = new Date();
      this.updateAvailableClasses();
      this.cssFilesSubject.next(this.cssFileData);
    }
  }

  /**
   * تغییر نام کلاس - روش صحیح
   */
  public renameClass(oldSelector: string, newSelector: string): void {
    const normalizedOldSelector = this.normalizeSelector(oldSelector);
    const normalizedNewSelector = this.normalizeSelector(newSelector);

    if (normalizedOldSelector === normalizedNewSelector) return;

    const ruleInfo = this.rulesMap.get(normalizedOldSelector);
    if (!ruleInfo) return;

    // گرفتن cssText فعلی
    const cssText = this.getClassStyles(normalizedOldSelector);
    if (!cssText) return;

    // حذف rule قدیمی
    this.deleteRule(normalizedOldSelector);

    // اضافه کردن rule جدید
    this.insertRule(normalizedNewSelector, cssText, ruleInfo.fileId);

    // آپدیت در cssFileData
    const file = this.cssFileData.find((f) => f.id === ruleInfo.fileId);
    if (file) {
      delete file.data[normalizedOldSelector];
      file.data[normalizedNewSelector] = cssText;
      file.updatedAt = new Date();
      this.updateAvailableClasses();
      this.cssFilesSubject.next(this.cssFileData);
    }
  }

  /**
   * گرفتن styles یک کلاس
   */
  public getClassStyles(selector: string): string | null {
    if (!this.styleSheet) return null;

    const normalizedSelector = this.normalizeSelector(selector);
    const ruleInfo = this.rulesMap.get(normalizedSelector);

    if (!ruleInfo) return null;

    try {
      const rule = this.styleSheet.cssRules[ruleInfo.index] as CSSStyleRule;
      return rule.style.cssText;
    } catch (e) {
      console.error('Error getting CSS rule:', e);
      return null;
    }
  }

  /**
   * گرفتن اطلاعات کامل یک کلاس
   */
  public getClassInfo(selector: string): IClassInfo | null {
    const normalizedSelector = this.normalizeSelector(selector);
    const ruleInfo = this.rulesMap.get(normalizedSelector);

    if (!ruleInfo) return null;

    const cssText = this.getClassStyles(normalizedSelector);
    if (!cssText) return null;

    const file = this.cssFileData.find((f) => f.id === ruleInfo.fileId);

    return {
      selector: normalizedSelector,
      cssText,
      fileName: file?.name || 'unknown',
      fileId: ruleInfo.fileId,
    };
  }

  /**
   * بررسی وجود کلاس
   */
  public hasClass(selector: string): boolean {
    const normalizedSelector = this.normalizeSelector(selector);
    return this.rulesMap.has(normalizedSelector);
  }

  /**
   * پاک کردن همه rules
   */
  private clearAllRules(): void {
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
   * Export کردن یک فایل به CSS string
   */
  public exportFileCSS(fileId: string): string {
    const file = this.cssFileData.find((f) => f.id === fileId);
    if (!file) return '';

    const rules: string[] = [];
    Object.entries(file.data).forEach(([selector, cssText]) => {
      rules.push(`${selector} { ${cssText} }`);
    });

    return rules.join('\n\n');
  }

  /**
   * Export کردن همه CSS
   */
  public exportAllCSS(): string {
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
   * آپدیت لیست کلاس‌های available
   */
  private updateAvailableClasses(): void {
    const classes = new Set<string>();

    this.cssFileData.forEach((file) => {
      Object.keys(file.data).forEach((selector) => {
        // فقط class selectors (که با . شروع میشن)
        if (selector.startsWith('.')) {
          // حذف . از اول و split کردن اگه multiple selector باشه
          const classNames = selector
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.startsWith('.'))
            .map((s) =>
              s
                .substring(1)
                .split(/[\s:>\+~\[]/)[0]
                .trim(),
            )
            .filter((s) => s);

          classNames.forEach((c) => classes.add(c));
        }
      });
    });

    const availableClasses = Array.from(classes).sort();
    this.availableClassesSubject.next(availableClasses);
  }

  /**
   * Normalize کردن selector
   */
  private normalizeSelector(selector: string): string {
    // اگه با . یا # شروع نمیشه، . اضافه کن
    if (!selector.startsWith('.') && !selector.startsWith('#') && !selector.includes('[')) {
      return `.${selector}`;
    }
    return selector;
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

    return declarations.join('; ') + (declarations.length > 0 ? ';' : '');
  }

  /**
   * گرفتن تعداد rules
   */
  public get rulesCount(): number {
    return this.rulesMap.size;
  }

  /**
   * Destroy
   */
  public destroy(): void {
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
    this.cssFileData = [];
    this.isInitialized = false;

    this.cssFilesSubject.next([]);
    this.availableClassesSubject.next([]);
  }
}

// ==============================================
// مثال استفاده:
// ==============================================

/*
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClassManagerService } from './class-manager.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-style-manager',
  template: `
    <div>
      <h3>CSS Files</h3>
      <ul>
        <li *ngFor="let file of cssFiles">
          {{ file.name }} ({{ Object.keys(file.data).length }} rules)
          <button (click)="editFile(file.id)">Edit</button>
          <button (click)="deleteFile(file.id)">Delete</button>
        </li>
      </ul>

      <button (click)="addNewFile()">Add File</button>

      <h3>Available Classes</h3>
      <div *ngFor="let className of availableClasses">
        .{{ className }}
      </div>
    </div>
  `
})
export class StyleManagerComponent implements OnInit, OnDestroy {
  cssFiles: any[] = [];
  availableClasses: string[] = [];
  private destroy$ = new Subject<void>();

  constructor(private classManager: ClassManagerService) {}

  ngOnInit() {
    // Initialize
    this.classManager.initialize();

    // Subscribe به تغییرات
    this.classManager.cssFiles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(files => {
        this.cssFiles = files;
      });

    this.classManager.availableClasses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(classes => {
        this.availableClasses = classes;
      });
  }

  async addNewFile() {
    const css = `.new-class { color: blue; }`;
    await this.classManager.addCssFile('my-styles', css);
  }

  editFile(fileId: string) {
    const newCss = `.edited-class { color: red; }`;
    this.classManager.updateCssFile(fileId, newCss);
  }

  deleteFile(fileId: string) {
    this.classManager.removeCssFile(fileId);
  }

  // استفاده از debounced update برای color picker
  onColorChange(color: string) {
    this.classManager.updateClassDebounced('.my-button', {
      backgroundColor: color
    }, 16);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
*/
