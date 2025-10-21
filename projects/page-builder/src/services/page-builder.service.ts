import {
  ElementRef,
  inject,
  Injectable,
  OnDestroy,
  Renderer2,
  Signal,
  signal,
} from '@angular/core';
import { PageItem } from '../models/PageItem';
import { DynamicElementService } from './dynamic-element.service';
import { Page } from '../models/Page';
import { PageBuilderDto } from '../models/PageBuilderDto';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PageBuilderService implements OnDestroy {
  currentPageIndex = signal<number>(-1);

  activeEl = signal<PageItem | undefined>(undefined);
  renderer!: Renderer2;
  page: Signal<ElementRef<any> | undefined> = signal<ElementRef<any> | undefined>(undefined);
  showOutlines = true;
  pageInfo = new PageBuilderDto();

  private _changed$ = new Subject<string>();
  changed$ = this._changed$.asObservable();

  constructor(private dynamicElementService: DynamicElementService) {}

  ngOnDestroy(): void {
    this._changed$.complete();
  }
  updateChangeDetection(arg0: string) {
    this._changed$.next(arg0);
  }

  public get currentPageItems(): PageItem[] {
    return this.pageInfo.pages[this.currentPageIndex()]?.items || [];
  }
  public set currentPageItems(items: PageItem[]) {
    if (!this.pageInfo.pages[this.currentPageIndex()]) {
      throw new Error('Current page does not exist');
    }
    this.pageInfo.pages[this.currentPageIndex()].items = items;
  }

  addPage(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.pageInfo.pages.splice(this.currentPageIndex(), 0, new Page());
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
      if (pageNumber < 1 || pageNumber > this.pageInfo.pages.length) {
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
    let page = this.pageInfo.pages[this.currentPageIndex()];
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
    let page = this.pageInfo.pages[this.currentPageIndex()];
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
