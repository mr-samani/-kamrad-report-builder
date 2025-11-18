// dynamic-element.service.ts
import {
  ApplicationRef,
  ElementRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  Renderer2,
  RendererFactory2,
  ViewContainerRef,
  runInInjectionContext,
  createComponent,
  EventEmitter,
  Inject,
  DOCUMENT,
} from '@angular/core';
import 'reflect-metadata';
import { PageItem } from '../models/PageItem';
import { DEFAULT_IMAGE_URL } from '../consts/defauls';
import { Directive } from '../models/SourceItem';
import { DynamicDataStructure } from '../models/DynamicData';
import { COMPONENT_DATA, ComponentDataContext } from '../public-api';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DynamicElementService {
  public dynamicData?: DynamicDataStructure;

  private renderer!: Renderer2;
  constructor(
    rendererFactory: RendererFactory2,
    private appRef: ApplicationRef,
    private envInjector: EnvironmentInjector,
    @Inject(DOCUMENT) private doc: Document,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * create html element on droped to page
   * ایجاد المنت از روی سورس ها در هنگام افزودن با درگ اند دراپ
   */
  async createBlockElement(
    container: HTMLElement | ViewContainerRef,
    index: number,
    item: PageItem,
  ): Promise<HTMLElement> {
    let element: HTMLElement;
    if (item.customComponent) {
      element = await this.createComponentElement(container, item, index);
    } else {
      if (!item.tag) {
        item.tag = 'div';
      }
      element = this.renderer.createElement(item.tag);
      const parentEl: HTMLElement =
        container instanceof ViewContainerRef ? container.element.nativeElement : container;
      if (index != null && index >= 0) {
        const refNode = parentEl.children[index] || null;
        this.renderer.insertBefore(parentEl, element, refNode);
      } else {
        this.renderer.appendChild(parentEl, element);
      }
    }

    element = this.bindOptions(element, item);
    if (item.content) {
      this.renderer.setProperty(element, 'innerHTML', item.content);
    }
    item.el = element;
    return element;
  }

  updateElementContent(data: PageItem) {
    let els = this.doc.querySelectorAll('[data-id="' + data.id + '"]');
    els.forEach((el) => {
      this.renderer.setProperty(el, 'innerHTML', data.content);
    });
    return data.el;
  }

  private async createComponentElement(
    container: HTMLElement | ViewContainerRef,
    item: PageItem,
    index: number | null,
  ): Promise<HTMLElement> {
    const component = await item.getComponentInstance();
    if (!component) {
      console.warn('Not exist custom component:', item.customComponent);
      throw new Error('Not exist custom component');
    }

    const p = item.customComponent?.providers ?? [];
    // دریافت تغییرات  تنظیمات داده‌های کامپوننت سفارشی
    const onChangeCustomData = new Subject();
    onChangeCustomData.subscribe((value) => {
      item.customComponent!.componentData = value;
    });
    const context: ComponentDataContext = {
      data: item.customComponent?.componentData,
      onChange: onChangeCustomData,
    };

    p.push({ provide: COMPONENT_DATA, useValue: context });
    // ساخت Injector اختصاصی برای این instance
    item.customComponent!.compInjector = Injector.create({
      providers: p,
      parent: this.envInjector,
    });

    // ساخت کامپوننت در محیط Angular
    const compRef = createComponent(component, {
      elementInjector: item.customComponent!.compInjector,
      environmentInjector: this.envInjector,
    });

    // اتصال view به برنامه Angular
    this.appRef.attachView(compRef.hostView);

    // گرفتن المنت خود کامپوننت
    let element = compRef.location.nativeElement as HTMLElement;

    // افزودن به DOM
    const parentEl =
      container instanceof ViewContainerRef ? container.element.nativeElement : container;
    if (index != null && index >= 0) {
      const refNode = parentEl.children[index] || null;
      this.renderer.insertBefore(parentEl, element, refNode);
    } else {
      this.renderer.appendChild(parentEl, element);
    }
    // ذخیره برای cleanup
    (element as any).__componentRef__ = compRef;

    const instance = compRef.instance;
    // set default propery pageItem
    if ('pageItem' in instance) {
      instance['pageItem'] = item;
    }
    // ✅ Inputs
    if (item.options && item.options.inputs) {
      for (const [key, val] of Object.entries(item.options.inputs)) {
        // if (key in instance) {
        instance[key] = val;
        // } else {
        //   this.renderer.setAttribute(element, key, val);
        // }
      }
    }

    // ✅ Outputs
    if (item.options?.outputs) {
      for (const [key, handler] of Object.entries(item.options.outputs)) {
        const emitter = (instance as any)[key];
        if (emitter instanceof EventEmitter) {
          emitter.subscribe((value: any) => handler(value));
        } else {
          console.warn(`⚠️ '${key}' is not an EventEmitter on ${component.name}`);
        }
      }
    }

    return element;
  }

  //--------------------------------------------------------------------------------------------------------------
  private bindOptions(element: HTMLElement, item: PageItem): HTMLElement {
    if (item.options?.attributes) {
      for (const [k, v] of Object.entries(item.options.attributes)) {
        this.renderer.setAttribute(element, k, v);
      }
    }

    if (item.options && item.options.directives?.length) {
      for (const DirType of item.options.directives) {
        this.attachDirective(element, DirType);
      }
    }
    if (item.options?.events) {
      for (const [k, v] of Object.entries(item.options.events)) {
        this.renderer.listen(element, k, v);
      }
    }

    if (element.tagName == 'IMG' && !element.hasAttribute('src')) {
      element.setAttribute('src', DEFAULT_IMAGE_URL);
    }
    // if (
    //   element.tagName == 'INPUT' ||
    //   element.tagName == 'TEXTAREA' ||
    //   element.tagName == 'SELECT'
    // ) {
    //   element.setAttribute('readonly', 'true');
    // }

    element.dataset['id'] = item.id;

    // if (item.options?.text && element.innerText !== item.options.text) {
    //   this.renderer.appendChild(element, this.renderer.createText(item.options.text));
    // }
    // if (this.isContentEditable(tag)) {
    //   element.contentEditable = 'true';
    // }
    if (item.style) {
      // element.style.cssText = decodeURIComponent(item.style);
      element.style.cssText = item.style;
    }
    return element;
  }

  private attachDirective<T>(element: HTMLElement, directive: Directive) {
    const DirType = directive.directive;
    const { inputs, outputs } = directive;
    if (!DirType) return;
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
    // ✅ Inputs
    if (inputs) {
      for (const [key, val] of Object.entries(inputs)) {
        dirInstance[key] = val;
      }
    }

    // ✅ Outputs
    if (outputs) {
      for (const [key, handler] of Object.entries(outputs)) {
        const emitter = (dirInstance as any)[key];
        if (emitter instanceof EventEmitter) {
          emitter.subscribe((value: any) => handler(value));
        } else {
          console.warn(`⚠️ '${key}' is not an EventEmitter on ${DirType.name}`);
        }
      }
    }

    const selectorName = (DirType as any).ɵdir?.selectors?.[0]?.find((x: any) => x !== '');
    elRef.nativeElement.setAttribute(selectorName, '');
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
    }
    this.destroyComponent(item.el);
    this.destroyDirective(item.el);
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
