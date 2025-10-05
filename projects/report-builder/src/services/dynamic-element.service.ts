// dynamic-element.service.ts
import {
  ApplicationRef,
  ElementRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  Renderer2,
  RendererFactory2,
  Type,
  ViewContainerRef,
  runInInjectionContext,
} from '@angular/core';
import 'reflect-metadata';

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
    options?: {
      text?: string;
      attributes?: Record<string, any>;
      directives?: Type<any>[];
    }
  ): HTMLElement {
    const element = this.renderer.createElement(tag);

    if (options?.attributes) {
      for (const [k, v] of Object.entries(options.attributes)) {
        this.renderer.setAttribute(element, k, String(v));
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

    //this.renderer.insertBefore(parentEl, element, parentEl.children[index] || null);
    //this.renderer.appendChild(parentEl, element);

    if (options?.directives?.length) {
      for (const DirType of options.directives) {
        this.attachDirective(element, DirType);
      }
    }

    return element;
  }

  private attachDirective<T>(element: HTMLElement, DirType: Type<T>) {
    // ساخت یک injector محلی که ElementRef و Renderer2 را فراهم کند
    const dirInjector = Injector.create({
      providers: [
        { provide: ElementRef, useValue: new ElementRef(element) },
        { provide: Renderer2, useValue: this.renderer },
        // اگر توکن یا provider خاصی لازم داری میتوانی اینجا اضافه کنی:
        // { provide: NGX_DROP_LIST, useValue: undefined }
      ],
      parent: this.injector,
    });

    // تلاش برای خواندن metadata پارامترهای سازنده (اگر موجود باشد)
    let paramTypes: any[] = [];
    try {
      paramTypes = Reflect.getMetadata('design:paramtypes', DirType) || [];
    } catch {
      paramTypes = [];
    }

    // ساخت instance داخل injection context — این باعث میشه inject(...) در داخل کلاس کار کند
    let dirInstance: any;
    try {
      dirInstance = runInInjectionContext(dirInjector, () => {
        if (paramTypes && paramTypes.length) {
          const deps = paramTypes.map((p: any) => {
            try {
              return dirInjector.get(p);
            } catch {
              return undefined;
            }
          });
          return new (DirType as any)(...deps);
        } else {
          // اکثر دایرکتیوهای مدرن سازنده‌ی بدون پارامتر دارند و از inject() داخل فیلد استفاده می‌کنند
          return new (DirType as any)();
        }
      });
    } catch (err) {
      // fallback خیلی ساده (نباید معمولا اجرا بشه اگر runInInjectionContext موجود باشه)
      dirInstance = new (DirType as any)();
    }

    // فراخوانی lifecycle hooks به صورت دستی (Angular وقتی خودش می‌سازد اینها را می‌زند)
    if (typeof dirInstance.ngOnInit === 'function') {
      try {
        dirInstance.ngOnInit();
      } catch {}
    }
    if (typeof dirInstance.ngAfterViewInit === 'function') {
      try {
        dirInstance.ngAfterViewInit();
      } catch (e) {
        // ممکنه در ngAfterViewInit دایرکتیو به providers وابسته باشه — معمولا runInInjectionContext این را حل می کند
        console.warn('ngAfterViewInit error for dynamic directive', e);
      }
    }

    // ----- شبیه‌سازی HostListener برای onEndDrag (window:mouseup / touchend) -----
    // (کتابخانه‌ات از HostListener برای window:mouseup/touchend استفاده کرده؛
    //  چون Angular خودش host listeners را اضافه نمی‌کند، ما این دو را دستی وصل می‌کنیم)
    const cleanupFns: (() => void)[] = [];
    if (typeof dirInstance.onEndDrag === 'function') {
      const winUp = (ev: Event) => {
        try {
          dirInstance.onEndDrag(ev);
        } catch (e) {}
      };
      window.addEventListener('mouseup', winUp);
      window.addEventListener('touchend', winUp);
      cleanupFns.push(() => window.removeEventListener('mouseup', winUp));
      cleanupFns.push(() => window.removeEventListener('touchend', winUp));
    }

    // wrap ngOnDestroy to remove our listeners when directive destroyed
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

    // اگر دایرکتیو EventEmitter دارد می‌توانی به آن subscribe کنی:
    // if (dirInstance.dragStart) dirInstance.dragStart.subscribe((p) => console.log('dragStart', p));

    return dirInstance;
  }
}
