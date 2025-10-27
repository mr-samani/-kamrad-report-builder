import {
  ElementRef,
  inject,
  Injectable,
  OnDestroy,
  Renderer2,
  Signal,
  WritableSignal,
  signal,
} from '@angular/core';
import { PageItem } from '../models/PageItem';
import { DynamicElementService } from './dynamic-element.service';
import { Page } from '../models/Page';
import { PageBuilderDto } from '../models/PageBuilderDto';
import { Subject } from 'rxjs';
import { DefaultBlockDirectives, DefaultBlockClassName } from '../consts/defauls';

@Injectable({
  providedIn: 'root',
})
export class PageBuilderService implements OnDestroy {
  currentPageIndex = signal<number>(-1);
  renderer!: Renderer2;
  activeEl = signal<PageItem | undefined>(undefined);
  pageBody: Signal<ElementRef<HTMLElement> | undefined> = signal<
    ElementRef<HTMLElement> | undefined
  >(undefined);
  pageHeader: Signal<ElementRef<HTMLElement> | undefined> = signal<
    ElementRef<HTMLElement> | undefined
  >(undefined);
  pageFooter: Signal<ElementRef<HTMLElement> | undefined> = signal<
    ElementRef<HTMLElement> | undefined
  >(undefined);
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

  public get currentPage(): Page {
    return this.pageInfo.pages[this.currentPageIndex()] ?? new Page();
  }
  public set currentPage(page: Page) {
    if (!this.pageInfo.pages[this.currentPageIndex()]) {
      throw new Error('Current page does not exist');
    }
    this.pageInfo.pages[this.currentPageIndex()] = page;
  }

  addPage(): Promise<number> {
    return new Promise((resolve, reject) => {
      let index = this.currentPageIndex() + 1;
      this.pageInfo.pages.splice(index, 0, new Page());
      return this.changePage(index + 1);
    });
  }
  removePage(): Promise<number> {
    return new Promise((resolve, reject) => {
      let index = this.currentPageIndex();
      if (index > -1) {
        this.cleanCanvas(index);
        this.pageInfo.pages.splice(index, 1);
        if (this.pageInfo.pages.length == 0) {
          return this.addPage();
        } else {
          if (index == 0) {
            index++;
          }
          return this.changePage(index);
        }
      }
      return reject('Invalid page index');
    });
  }

  nextPage(): Promise<number> {
    return new Promise((resolve, reject) => {
      let index = this.currentPageIndex();
      if (index < this.pageInfo.pages.length - 1) {
        return this.changePage(index + 2);
      }
      return reject('No next page');
    });
  }
  previousPage(): Promise<number> {
    return new Promise((resolve, reject) => {
      let index = this.currentPageIndex();
      if (index > 0) {
        return this.changePage(index);
      }
      return reject('No previous page');
    });
  }

  /**
   * Change the current page
   * @param pageNumber start from 1
   */
  changePage(pageNumber: number): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        this.deSelectBlock();
        if (pageNumber == undefined || pageNumber == null) reject('Required page number');
        if (pageNumber < 1 || pageNumber > this.pageInfo.pages.length) {
          reject('Invalid page number');
        } else {
          this.cleanCanvas(this.currentPageIndex());
          const { headerItems, bodyItems, footerItems } = this.pageInfo.pages[pageNumber - 1];
          headerItems.map((m) => (m.el = this.createElement(m, this.pageHeader()!.nativeElement)));
          bodyItems.map((m) => (m.el = this.createElement(m, this.pageBody()!.nativeElement)));
          footerItems.map((m) => (m.el = this.createElement(m, this.pageFooter()!.nativeElement)));

          this.currentPageIndex.set(pageNumber - 1);
          resolve(this.currentPageIndex());
        }
      } catch (error) {
        console.error('Error changing page:', error);
      }
    });
  }
  reloadCurrentPage() {
    this.changePage(this.currentPageIndex() + 1);
  }
  private createElement(item: PageItem, container: HTMLElement) {
    return this.dynamicElementService.createElementFromHTML(item, container, {
      directives: DefaultBlockDirectives,
      attributes: {
        class: DefaultBlockClassName,
      },
      events: {
        click: (ev: Event) => this.onSelectBlock(item, ev),
      },
    });
  }

  /**
   * Clean the canvas by removing all elements
   * - and destroy directives
   * @returns void
   */
  private cleanCanvas(pageIndex: number) {
    this.deSelectBlock();
    const page = this.pageInfo.pages[pageIndex];
    if (!page) return;

    for (let item of page.bodyItems) {
      if (item.el) {
        this.dynamicElementService.destroyDirective(item.el);
        this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
      }
    }
    for (let item of page.headerItems) {
      if (item.el) {
        this.dynamicElementService.destroyDirective(item.el);
        this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
      }
    }
    for (let item of page.footerItems) {
      if (item.el) {
        this.dynamicElementService.destroyDirective(item.el);
        this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
      }
    }
    this.pageBody()!.nativeElement.innerHTML = '';
    this.pageHeader()!.nativeElement.innerHTML = '';
    this.pageFooter()!.nativeElement.innerHTML = '';
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
    const list = this.findBlockList(item);
    if (!item || !list || !list.length) return;

    const index = list.findIndex((i) => i.id === item.id);
    if (index !== -1 && item.el) {
      list.splice(index, 1);
      this.dynamicElementService.destroyDirective(item.el);
      this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
    }
    this.activeEl.set(undefined);
  }

  private findBlockList(block: PageItem): PageItem[] | undefined {
    const { headerItems, bodyItems, footerItems } = this.pageInfo.pages[this.currentPageIndex()];
    for (let item of headerItems) if (item.id === block.id) return headerItems;

    for (let item of bodyItems) if (item.id === block.id) return bodyItems;

    for (let item of footerItems) if (item.id === block.id) return footerItems;

    return [];
  }

  writeItemValue(data: PageItem) {
    const list = this.findBlockList(data);
    if (!data || !list || !list.length) return;
    this.activeEl.set(data);
    const index = list.findIndex((x) => x.id == data.id);
    if (index > -1 && list[index].el) {
      list[index].el = this.dynamicElementService.updateElementContent(list[index].el, data);

      list[index] = data;
    }
  }
}
