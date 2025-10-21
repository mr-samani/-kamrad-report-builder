import { ElementRef, inject, Injectable, Renderer2, Signal, signal } from '@angular/core';
import { PageItem } from '../models/PageItem';
import { DynamicElementService } from './dynamic-element.service';

@Injectable({
  providedIn: 'root',
})
export class PageBuilderService {
  items: PageItem[] = [];

  activeEl = signal<PageItem | undefined>(undefined);
  renderer!: Renderer2;
  page: Signal<ElementRef<any> | undefined> = signal<ElementRef<any> | undefined>(undefined);
  showOutlines = true;

  constructor(private dynamicElementService: DynamicElementService) {}

  onSelectBlock(c: PageItem, ev?: Event) {
    // ev?.stopPropagation();
    ev?.preventDefault();
    this.activeEl.set(c);
  }

  removeBlock(item: PageItem) {
    const index = this.items.findIndex((i) => i.id === item.id);
    if (index !== -1 && item.el) {
      this.items.splice(index, 1);
      this.dynamicElementService.destroyDirective(item.el);
      this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
    }
    this.activeEl.set(undefined);
  }

  writeItemValue(data: PageItem) {
    this.activeEl.set(data);
    const index = this.items.findIndex((x) => x.id == data.id);
    if (index > -1) {
      this.items[index].el = this.dynamicElementService.updateElementContent(
        this.items[index].el,
        data
      );

      this.items[index] = data;
    }
  }
}
