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
} from '@angular/core';
import 'reflect-metadata';
import { PageItem } from '../models/PageItem';

@Injectable({ providedIn: 'root' })
export class DynamicElementService {
  private renderer: Renderer2;

  constructor(
    rendererFactory: RendererFactory2,
    private injector: Injector,
    private appRef: ApplicationRef,
    private envInjector: EnvironmentInjector
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  createElement(
    container: HTMLElement | ViewContainerRef,
    index: number,
    tag: string,
    id: string,
    options?: {
      text?: string;
      attributes?: Record<string, any>;
      events?: Record<string, any>;
      directives?: Type<any>[];
    }
  ): HTMLElement {
    const element = this.renderer.createElement(tag);
    element.dataset['id'] = id;
    if (options?.attributes) {
      for (const [k, v] of Object.entries(options.attributes)) {
        this.renderer.setAttribute(element, k, v);
      }
    }
    if (options?.events) {
      for (const [k, v] of Object.entries(options.events)) {
        this.renderer.listen(element, k, v);
      }
    }

    if (options?.text) {
      this.renderer.appendChild(element, this.renderer.createText(options.text));
    }

    const parentEl: HTMLElement =
      container instanceof ViewContainerRef ? container.element.nativeElement : container;
    if (index != null && index >= 0) {
      const refNode = parentEl.children[index] || null;
      this.renderer.insertBefore(parentEl, element, refNode);
    } else {
      this.renderer.appendChild(parentEl, element);
    }

    if (options?.directives?.length) {
      for (const DirType of options.directives) {
        this.attachDirective(element, DirType);
      }
    }

    return element;
  }

  createElementFromHTML(
    item: PageItem,
    page: Signal<ElementRef<any> | undefined>,
    options?: {
      attributes?: Record<string, any>;
      events?: Record<string, any>;
      directives?: Type<any>[];
    }
  ): HTMLElement {
    let html = item.html;
    if (!html) {
      html = '';
    }
    const div: HTMLElement = this.renderer.createElement('div');
    html = decodeURIComponent(html);
    this.renderer.setProperty(div, 'innerHTML', html);
    const element = div.firstChild as HTMLElement;
    element.dataset['id'] = item.id;
    const pageRef = page();
    if (pageRef) {
      this.renderer.appendChild(pageRef.nativeElement, element);
    }
    if (options?.attributes) {
      for (const [k, v] of Object.entries(options.attributes)) {
        this.renderer.setAttribute(element, k, v);
      }
    }
    if (options?.events) {
      for (const [k, v] of Object.entries(options.events)) {
        this.renderer.listen(element, k, v);
      }
    }
    if (options && options.directives?.length) {
      for (const DirType of options.directives) {
        this.attachDirective(element, DirType);
      }
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
      debugger;
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

  // متد برای cleanup دستی اگر لازم شد
  destroyDirective(element: HTMLElement) {
    debugger;
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
}
