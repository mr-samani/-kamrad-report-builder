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
  reflectComponentType,
} from '@angular/core';
import 'reflect-metadata';
import { PageItem } from '../models/PageItem';
import { DEFAULT_IMAGE_URL, LibConsts } from '../consts/defauls';
import { Directive } from '../models/SourceItem';
import { DynamicDataStructure } from '../models/DynamicData';

@Injectable({ providedIn: 'root' })
export class DynamicElementService {
  public dynamicData?: DynamicDataStructure;

  private renderer!: Renderer2;
  constructor(
    rendererFactory: RendererFactory2,
    private appRef: ApplicationRef,
    private envInjector: EnvironmentInjector,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * create html element on droped to page
   * ایجاد المنت از روی سورس ها در هنگام افزودن با درگ اند دراپ
   */
  createElement(
    container: HTMLElement | ViewContainerRef,
    index: number,
    item: PageItem,
  ): HTMLElement {
    let element: HTMLElement;
    if (item.component) {
      element = this.createComponentElement(container, item, index);
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
    item.el = element;
    item.html = element.outerHTML;
    return element;
  }

  /**
   * create html element from PageItem (Saved data)
   */
  createElementFromHTML(item: PageItem, container: HTMLElement): HTMLElement | undefined {
    let element: HTMLElement;
    if (item.componentKey) {
      let CustomSource = LibConsts.SourceItemList.find((x) => x.componentKey === item.componentKey);
      if (!CustomSource || !CustomSource.component) {
        console.error('component not found', item.componentKey);
        return;
      }
      item.component = CustomSource.component;
      item.options = Object.assign(item.options ?? {}, CustomSource.options);

      element = this.createComponentElement(container, item, null);
    } else {
      let html = item.html;
      if (!html) {
        console.error('Create element: Invalid HTML content', item.id);
        return undefined;
      }
      const div: HTMLElement = this.renderer.createElement('div');
      html = decodeURIComponent(html);
      this.renderer.setProperty(div, 'innerHTML', html);
      element = div.firstChild as HTMLElement;
      if (element.nodeType !== 1) {
        console.error('Error on create elment:', element.nodeType, element);
        return undefined;
      }
      this.renderer.appendChild(container, element);
    }

    element = this.bindOptions(element, item);
    item.el = element;
    item.html = element.outerHTML;
    return element;
  }
  updateElementContent(el: HTMLElement, data: PageItem) {
    this.renderer.setProperty(el, 'innerHTML', data.content);
    return el;
  }

  private createComponentElement(
    container: HTMLElement | ViewContainerRef,
    item: PageItem,
    index: number | null,
  ): HTMLElement {
    const component = item.component;
    if (!component) throw new Error('SourceItem.component not defined');
    // ساخت کامپوننت در محیط Angular
    const compRef = createComponent(component, {
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

    // ✅ Inputs
    if (item.options && item.options.inputs) {
      if ('pageItem' in instance) {
        instance['pageItem'] = item;
      }
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
      element.style.cssText = decodeURIComponent(item.style);
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
