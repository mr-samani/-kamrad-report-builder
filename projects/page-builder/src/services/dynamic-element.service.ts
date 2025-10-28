// dynamic-element.service.ts
import {
  ApplicationRef,
  ElementRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  Renderer2,
  RendererFactory2,
  Signal,
  Type,
  ViewContainerRef,
  runInInjectionContext,
  createEnvironmentInjector,
  createComponent,
} from '@angular/core';
import 'reflect-metadata';
import { PageItem } from '../models/PageItem';
import { DEFAULT_IMAGE_URL, LibConsts } from '../consts/defauls';
import { SourceItem } from '../models/SourceItem';

@Injectable({ providedIn: 'root' })
export class DynamicElementService {
  renderer!: Renderer2;
  constructor(
    rendererFactory: RendererFactory2,
    private injector: Injector,
    private appRef: ApplicationRef,
    private envInjector: EnvironmentInjector
  ) {
    //this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * create html element on droped to page
   * ایجاد المنت از روی سورس ها در هنگام افزودن با درگ اند دراپ
   */
  createElement(
    container: HTMLElement | ViewContainerRef,
    index: number,
    tag: string,
    id: string,
    component: Type<any> | undefined,
    options?: {
      text?: string;
      attributes?: Record<string, any>;
      events?: Record<string, any>;
      directives?: Type<any>[];
    }
  ): HTMLElement {
    if (component) {
      return this.createComponentElement(container, component, id, options);
    }
    let element = this.renderer.createElement(tag);
    element.dataset['id'] = id;

    if (options?.text) {
      this.renderer.appendChild(element, this.renderer.createText(options.text));
    }
    // if (this.isContentEditable(tag)) {
    //   element.contentEditable = 'true';
    // }
    element = this.bindOptions(element, options);

    const parentEl: HTMLElement =
      container instanceof ViewContainerRef ? container.element.nativeElement : container;
    if (index != null && index >= 0) {
      const refNode = parentEl.children[index] || null;
      this.renderer.insertBefore(parentEl, element, refNode);
    } else {
      this.renderer.appendChild(parentEl, element);
    }

    return element;
  }

  /**
   * create html element from PageItem (Saved data)
   */
  createElementFromHTML(
    item: PageItem,
    container: HTMLElement,
    options?: {
      attributes?: Record<string, any>;
      events?: Record<string, any>;
      directives?: Type<any>[];
    }
  ): HTMLElement | undefined {
    debugger;
    if (item.componentKey) {
      item.component = LibConsts.SourceItemList.find(
        (x) => x.componentKey === item.componentKey
      )?.component;
      if (!item.component) {
        console.error('component not found', item.componentKey);
        return;
      }
      return this.createComponentElement(container, item.component, item.id, options);
    }
    let html = item.html;
    if (!html) {
      console.error('Create element: Invalid HTML content', item.id);
      return undefined;
    }
    const div: HTMLElement = this.renderer.createElement('div');
    html = decodeURIComponent(html);
    this.renderer.setProperty(div, 'innerHTML', html);
    let element = div.firstChild as HTMLElement;
    if (element.nodeType !== 1) {
      console.error('Error on create elment:', element.nodeType, element);
      return undefined;
    }
    element.dataset['id'] = item.id;
    // if (this.isContentEditable(item.tag)) {
    //   element.contentEditable = 'true';
    // }

    element = this.bindOptions(element, options);

    this.renderer.appendChild(container, element);

    return element;
  }
  updateElementContent(el: HTMLElement, data: PageItem) {
    this.renderer.setProperty(el, 'innerHTML', data.content);
    return el;
  }

  private createComponentElement(
    container: HTMLElement | ViewContainerRef,
    component: Type<any>,
    id: string,
    options?: {
      text?: string;
      attributes?: Record<string, any>;
      events?: Record<string, any>;
      directives?: Type<any>[];
    }
  ): HTMLElement {
    if (!component) throw new Error('SourceItem.component not defined');

    // ساخت کامپوننت در محیط Angular
    const compRef = createComponent(component, {
      environmentInjector: this.envInjector,
    });

    // اتصال view به برنامه Angular
    this.appRef.attachView(compRef.hostView);

    // گرفتن المنت خود کامپوننت
    const element = compRef.location.nativeElement as HTMLElement;

    // افزودن به DOM
    const parentEl =
      container instanceof ViewContainerRef ? container.element.nativeElement : container;
    this.renderer.appendChild(parentEl, element);

    // ذخیره برای cleanup
    (element as any).__componentRef__ = compRef;

    // dataset id
    element.dataset['id'] = id;

    // بایند کردن attribute / event / directive
    this.bindOptions(element, options);

    return element;
  }

  //--------------------------------------------------------------------------------------------------------------
  private bindOptions(
    element: HTMLElement,
    options?: {
      attributes?: Record<string, any>;
      events?: Record<string, any>;
      directives?: Type<any>[];
    }
  ): HTMLElement {
    if (options?.attributes) {
      for (const [k, v] of Object.entries(options.attributes)) {
        this.renderer.setAttribute(element, k, v);
      }
    }

    if (options && options.directives?.length) {
      for (const DirType of options.directives) {
        this.attachDirective(element, DirType);
      }
    }
    if (options?.events) {
      for (const [k, v] of Object.entries(options.events)) {
        this.renderer.listen(element, k, v);
      }
    }

    if (element.tagName == 'IMG' && !element.hasAttribute('src')) {
      element.setAttribute('src', DEFAULT_IMAGE_URL);
    }
    if (
      element.tagName == 'INPUT' ||
      element.tagName == 'TEXTAREA' ||
      element.tagName == 'SELECT'
    ) {
      element.setAttribute('readonly', 'true');
    }
    return element;
  }

  private attachDirective<T>(element: HTMLElement, DirType: Type<T>) {
    const elRef = new ElementRef(element);

    // ساخت یک EnvironmentInjector کامل که به همه سرویس‌های root دسترسی داره
    const dirInjector = Injector.create({
      providers: [
        { provide: ElementRef, useValue: elRef },
        { provide: Renderer2, useValue: this.renderer },
      ],
      parent: this.envInjector, // این مهمه! از envInjector به جای injector استفاده کن
    });

    // خواندن metadata پارامترهای سازنده
    let paramTypes: any[] = [];
    try {
      paramTypes = Reflect.getMetadata('design:paramtypes', DirType) || [];
    } catch {
      paramTypes = [];
    }

    // ساخت instance داخل injection context
    let dirInstance: any;
    try {
      dirInstance = runInInjectionContext(dirInjector, () => {
        if (paramTypes && paramTypes.length) {
          const deps = paramTypes.map((p: any) => {
            try {
              return dirInjector.get(p);
            } catch (err) {
              console.warn('Could not resolve dependency:', p, err);
              return undefined;
            }
          });
          return new (DirType as any)(...deps);
        } else {
          return new (DirType as any)(elRef);
        }
      });
    } catch (err) {
      console.error('Error creating directive instance:', err);
      dirInstance = new (DirType as any)(elRef);
    }

    // فراخوانی lifecycle hooks
    if (typeof dirInstance.ngOnInit === 'function') {
      try {
        dirInstance.ngOnInit();
      } catch (err) {
        console.error('ngOnInit error:', err);
      }
    }

    // CRITICAL: ngAfterViewInit باید بعد از اینکه element به DOM اضاف شد اجرا بشه
    // برای اطمینان از setTimeout استفاده میکنیم
    setTimeout(() => {
      if (typeof dirInstance.ngAfterViewInit === 'function') {
        try {
          dirInstance.ngAfterViewInit();
        } catch (err) {
          console.error('ngAfterViewInit error:', err);
        }
      }
    }, 0);

    // شبیه‌سازی HostListener برای window events
    // توجه: دایرکتیو از fromEvent استفاده میکنه، پس نیازی به این قسمت نیست
    // ولی اگر بخوای میتونی نگهش داری
    const cleanupFns: (() => void)[] = [];

    // wrap ngOnDestroy
    const originalDestroy = dirInstance.ngOnDestroy?.bind(dirInstance);
    dirInstance.ngOnDestroy = () => {
      try {
        cleanupFns.forEach((f) => f());
      } catch {}
      if (originalDestroy) {
        try {
          originalDestroy();
        } catch {}
      }
    };

    // ذخیره instance برای cleanup بعدی
    if (!(element as any).__ngDirectives__) (element as any).__ngDirectives__ = [];
    (element as any).__ngDirectives__.push(dirInstance);

    return dirInstance;
  }

  public destroy(item: PageItem) {
    if (!item.el) {
      return;
    } else if (item.component) {
      return this.destroyComponent(item.el);
    } else {
      return this.destroyDirective(item.el);
    }
  }

  // متد برای cleanup دستی اگر لازم شد
  private destroyDirective(element: HTMLElement) {
    const directiveInstances = (element as any).__ngDirectives__;
    if (Array.isArray(directiveInstances)) {
      for (const d of directiveInstances) {
        if (d && typeof d.ngOnDestroy === 'function') {
          d.ngOnDestroy?.();
        }
      }
      delete (element as any).__ngDirectives__;
    }
  }

  private destroyComponent(element: HTMLElement) {
    const compRef = (element as any).__componentRef__;
    if (compRef) {
      this.appRef.detachView(compRef.hostView);
      compRef.destroy();
      delete (element as any).__componentRef__;
    }
  }

  isContentEditable(tag: string): boolean {
    const editableTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    return editableTags.indexOf(tag.toLowerCase()) > 0;
  }
}
