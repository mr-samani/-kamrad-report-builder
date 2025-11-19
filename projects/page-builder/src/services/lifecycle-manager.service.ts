import { Injectable, DestroyRef, Injector, inject } from '@angular/core';

export interface LifecycleInstance {
  ngOnInit?(): void;
  ngAfterViewInit?(): void;
  ngOnDestroy?(): void;
}

/**
 * سیستم مدیریت lifecycle با استفاده از DestroyRef
 * برای performance بهتر
 */
@Injectable({ providedIn: 'root' })
export class LifecycleManagerService {
  // Map برای نگهداری DestroyRef و cleanup functions هر element
  private elementRegistry = new WeakMap<
    HTMLElement,
    {
      destroyRef: DestroyRef;
      instances: LifecycleInstance[];
      componentRef?: any;
      cleanupFns: (() => void)[];
    }
  >();

  /**
   * ثبت element با یه DestroyRef اختصاصی
   * این DestroyRef از injector hierarchy استفاده میکنه
   */
  register(
    element: HTMLElement,
    instances: LifecycleInstance[],
    injector: Injector,
    componentRef?: any,
  ) {
    // ساخت یه DestroyRef از injector
    const destroyRef = injector.get(DestroyRef);

    const cleanupFns: (() => void)[] = [];
    // ثبت ngOnDestroy برای هر instance
    instances.forEach((instance) => {
      if (typeof instance.ngOnDestroy === 'function') {
        const cleanup = destroyRef.onDestroy(() => {
          try {
            debugger;
            instance.ngOnDestroy!();
          } catch (err) {
            console.error('ngOnDestroy error:', err);
          }
        });
        cleanupFns.push(cleanup);
      }
    });

    // اگه component هست، destroy‌اش رو هم ثبت کن
    if (componentRef) {
      const cleanup = destroyRef.onDestroy(() => {
        try {
          componentRef.destroy();
        } catch (err) {
          console.error('Component destroy error:', err);
        }
      });
      cleanupFns.push(cleanup);
    }

    // ذخیره در registry
    this.elementRegistry.set(element, {
      destroyRef,
      instances,
      componentRef,
      cleanupFns,
    });
  }

  /**
   * Destroy دستی یه element
   * فقط وقتی لازمه که بخوای قبل از destroy واقعی cleanup کنی
   */
  manualDestroy(element: HTMLElement) {
    const entry = this.elementRegistry.get(element);
    if (!entry) return;

    // صدا زدن همه cleanup functions
    entry.cleanupFns.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    });

    // حذف از registry
    this.elementRegistry.delete(element);

    // پاک کردن reference‌های داخلی
    delete (element as any).__ngDirectives__;
    delete (element as any).__componentRef__;
  }

  /**
   * صدا زدن lifecycle hook
   */
  callLifecycleHook(element: HTMLElement, hookName: keyof LifecycleInstance) {
    const entry = this.elementRegistry.get(element);
    if (!entry) return;

    entry.instances.forEach((instance) => {
      const hook = instance[hookName];
      if (typeof hook === 'function') {
        try {
          hook.call(instance);
        } catch (err) {
          console.error(`Error in ${hookName}:`, err);
        }
      }
    });
  }

  /**
   * چک کردن آیا element ثبت شده
   */
  isRegistered(element: HTMLElement): boolean {
    return this.elementRegistry.has(element);
  }
}
