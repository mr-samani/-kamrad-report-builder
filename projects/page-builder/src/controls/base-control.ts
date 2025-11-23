import { Output, EventEmitter, Renderer2, Injector } from '@angular/core';
import { PageItem } from '../models/PageItem';

export abstract class BaseControl {
  style?: Partial<CSSStyleDeclaration>;
  item?: PageItem;
  el: HTMLElement | undefined = undefined;
  isDisabled: boolean = false;
  onChange = (_: PageItem | undefined) => {};
  onTouched = () => {};

  readonly renderer: Renderer2;
  constructor(injector: Injector) {
    this.renderer = injector.get(Renderer2);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
