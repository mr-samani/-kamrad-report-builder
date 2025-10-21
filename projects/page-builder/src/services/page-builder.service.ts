import { ElementRef, inject, Injectable, Renderer2, Signal, signal } from '@angular/core';
import { PageItem } from '../models/PageItem';
import { DynamicElementService } from './dynamic-element.service';
import { Page } from '../models/Page';

@Injectable({
  providedIn: 'root',
})
export class PageBuilderService {
  pagelist: Page[] = [];

  currentPageIndex = signal<number>(-1);

  activeEl = signal<PageItem | undefined>(undefined);
  renderer!: Renderer2;
  page: Signal<ElementRef<any> | undefined> = signal<ElementRef<any> | undefined>(undefined);
  showOutlines = true;

  constructor(private dynamicElementService: DynamicElementService) {}

  public get currentPageItems(): PageItem[] {
    return this.pagelist[this.currentPageIndex()]?.items || [];
  }
  public set currentPageItems(items: PageItem[]) {
    if (!this.pagelist[this.currentPageIndex()]) {
      throw new Error('Current page does not exist');
    }
    this.pagelist[this.currentPageIndex()].items = items;
  }

  addPage(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.pagelist.splice(this.currentPageIndex(), 0, new Page());
      this.currentPageIndex.set(this.currentPageIndex() + 1);
      resolve(this.currentPageIndex());
    });
  }

  /**
   * Change the current page
   * @param pageNumber start from 1
   */
  changePage(pageNumber: number): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!pageNumber) reject('Required page number');
      if (pageNumber < 1 || pageNumber > this.pagelist.length) {
        reject('Invalid page number');
      } else {
        this.currentPageIndex.set(pageNumber - 1);
        resolve(this.currentPageIndex());
      }
    });
  }

  onSelectBlock(c: PageItem, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    this.activeEl.set(c);
  }
  deSelectBlock() {
    this.activeEl.set(undefined);
  }
  removeBlock(item: PageItem) {
    let page = this.pagelist[this.currentPageIndex()];
    if (!page || !item) return;

    const index = page.items.findIndex((i) => i.id === item.id);
    if (index !== -1 && item.el) {
      page.items.splice(index, 1);
      this.dynamicElementService.destroyDirective(item.el);
      this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
    }
    this.activeEl.set(undefined);
  }

  writeItemValue(data: PageItem) {
    let page = this.pagelist[this.currentPageIndex()];
    if (!page || !data) return;
    this.activeEl.set(data);
    const index = page.items.findIndex((x) => x.id == data.id);
    if (index > -1) {
      page.items[index].el = this.dynamicElementService.updateElementContent(
        page.items[index].el,
        data
      );

      page.items[index] = data;
    }
  }
}
