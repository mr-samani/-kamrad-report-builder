import {
  ElementRef,
  inject,
  Injectable,
  OnDestroy,
  Renderer2,
  Signal,
  WritableSignal,
  signal,
  RendererFactory2,
} from '@angular/core';
import { PageItem } from '../models/PageItem';
import { DynamicElementService } from './dynamic-element.service';
import { Page } from '../models/Page';
import { PageBuilderDto } from '../models/PageBuilderDto';
import { BehaviorSubject, Subject } from 'rxjs';
import { DefaultBlockClassName, getDefaultBlockDirective, LibConsts } from '../consts/defauls';
import { IDropEvent, moveItemInArray, transferArrayItem } from 'ngx-drag-drop-kit';
import { SourceItem } from '../models/SourceItem';
import { Notify } from '../extensions/notify';
import { BlockSelectorComponent } from '../components/block-selector/block-selector.component';

export interface PageItemChange {
  item: PageItem | null;
  type:
    | 'ChangePageConfig'
    | 'AddBlock'
    | 'ChangeBlockContent'
    | 'ChangeBlockProperties'
    | 'RemoveBlock'
    | 'MoveBlock';
}

@Injectable({
  providedIn: 'root',
})
export class PageBuilderService implements OnDestroy {
  mode: 'Edit' | 'Preview' = 'Preview';
  sources: SourceItem[] = LibConsts.SourceItemList;

  currentPageIndex = signal<number>(-1);
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

  private _changed$ = new Subject<PageItemChange>();
  /** تغییر کردن pageitem ها */
  changed$ = this._changed$.asObservable();

  /** جابجایی بین صفحات */
  onPageChange$ = new BehaviorSubject<Page | undefined>(undefined);

  private renderer!: Renderer2;

  blockSelector?: BlockSelectorComponent;

  constructor(
    rendererFactory: RendererFactory2,
    private dynamicElementService: DynamicElementService,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  ngOnDestroy(): void {
    this._changed$.complete();
    this.onPageChange$.unsubscribe();
  }
  updateChangeDetection(data: PageItemChange) {
    this._changed$.next(data);
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

  async onDrop(event: IDropEvent<PageItem>, parent?: PageItem) {
    console.log('Dropped:', event);
    if (event.container == event.previousContainer && event.currentIndex == event.previousIndex) {
      return;
    }
    const dragItem = event.previousContainer.data[event.previousIndex];
    if (!dragItem) {
      return;
    }

    this.activeEl.set(undefined);
    if (event.previousContainer.el.id == 'blockSourceList') {
      // انتقال از یک container به container دیگه
      const source = new PageItem(this.sources[event.previousIndex], parent);
      source.children = []; // very important to create reference to droplist data
      await this.createBlockElement(source, event.container.el, event.currentIndex);
      event.container.data.splice(event.currentIndex, 0, source);
      this.onSelectBlock(source);
      this.updateChangeDetection({ item: source, type: 'AddBlock' });
    } else {
      // بررسی اجازه جابجایی در ایتم های کالکشن (لیست تکرار شونده)
      if (this.canMove(dragItem, event.container) == false) {
        Notify.warning('You cannot move this item here.');
        return;
      }

      const nativeEl = dragItem.el;
      if (event.container == event.previousContainer) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      } else {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
      }

      const containerEl = event.container.el;
      const children = Array.from(containerEl.children).filter(
        (x) => !x.classList.contains('ngx-drag-placeholder'),
      );
      // اگر باید به آخر لیست اضافه بشه
      if (event.currentIndex >= children.length - 1) {
        this.renderer.appendChild(containerEl, nativeEl);
      } else {
        // وگرنه قبل از المنت مورد نظر قرارش بده
        // توجه: چون یه element رو remove کردیم، باید index رو تنظیم کنیم
        const refNode = children[event.currentIndex];
        this.renderer.insertBefore(containerEl, nativeEl, refNode);
        // this.renderer.removeChild(containerEl, nativeEl);
      }
      // update register item
      // TODO: probably not needed
      (event.item as any).dragRegister?.registerDragItem?.(event.item);
      this.updateChangeDetection({
        item: event.container.data[event.currentIndex],
        type: 'MoveBlock',
      });
    }
    // this.pageBuilderService.items = items;
    // this.chdRef.detectChanges();
    this.onPageChange$.next(this.currentPage);
  }

  /**
   * in collection item list only can move element in inner self template
   * @param source current drag item
   * @param destination destination drop list
   * @returns boolean
   */
  private canMove(source: PageItem, destination: any): boolean {
    let p = this.getParentTemplate(source);
    if (!p || !p.lockMoveInnerChild) return true;
    return destination.el.closest('.template-container') == p.el;
  }

  getParentTemplate(item: PageItem): PageItem | undefined {
    if (!item || !item.parent) return undefined;
    if (item.parent.isTemplateContainer) {
      return item.parent;
    }
    return this.getParentTemplate(item.parent);
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
    return new Promise(async (resolve, reject) => {
      try {
        this.deSelectBlock();
        if (pageNumber == undefined || pageNumber == null) reject('Required page number');
        if (pageNumber < 1 || pageNumber > this.pageInfo.pages.length) {
          reject('Invalid page number');
        } else {
          this.cleanCanvas(this.currentPageIndex());
          const { headerItems, bodyItems, footerItems } = this.pageInfo.pages[pageNumber - 1];
          await this.genElms(headerItems, this.pageHeader()!.nativeElement);
          await this.genElms(bodyItems, this.pageBody()!.nativeElement);
          await this.genElms(footerItems, this.pageFooter()!.nativeElement);

          this.currentPageIndex.set(pageNumber - 1);
          resolve(this.currentPageIndex());
          this.onPageChange$.next(this.pageInfo.pages[this.currentPageIndex()]);
        }
      } catch (error) {
        console.error('Error changing page:', error);
      }
    });
  }

  private async genElms(list: PageItem[], container: HTMLElement, index = -1) {
    for (let i = 0; i < list.length; i++) {
      list[i].el = await this.createBlockElement(list[i], container, index);
    }
  }
  reloadCurrentPage() {
    this.changePage(this.currentPageIndex() + 1);
  }

  /**
   *  ایجاد المنت جدید حتما باید با await انجام شود
   */
  async createBlockElement(item: PageItem, container: HTMLElement, index = -1) {
    if (this.mode == 'Edit') {
      item.options ??= {};
      item.options.directives ??= [];
      if (item.options.directives.length > 0) {
        console.log('Directives already present', item.tag, item.options.directives);
      }
      let directives = await getDefaultBlockDirective(item, this.onDrop.bind(this));

      for (let d of directives) {
        if (item.options.directives.findIndex((x) => x.directive == d.directive) === -1) {
          item.options.directives.push(d);
        }
      }
      if (item.options.directives.length >= 3) {
        throw new Error('Too many directives');
      }
      item.options.attributes ??= {};
      item.options.attributes['class'] ??= DefaultBlockClassName;
      if (!item.options.attributes['class'].includes(DefaultBlockClassName)) {
        item.options.attributes['class'] += ` ${DefaultBlockClassName}`;
      }
      item.options.events ??= {};
      item.options.events['click'] = (ev: Event) => this.onSelectBlock(item, ev);
    }
    let el = await this.dynamicElementService.createBlockElement(container, index, item);
    if (item.children && item.children.length > 0 && el) {
      for (const child of item.children) {
        await this.createBlockElement(child, el, -1);
      }
    }
    return el;
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
    this.dynamicElementService.destroyBatch(page.bodyItems);
    this.dynamicElementService.destroyBatch(page.headerItems);
    this.dynamicElementService.destroyBatch(page.footerItems);
    this.pageBody()!.nativeElement.innerHTML = '';
    this.pageHeader()!.nativeElement.innerHTML = '';
    this.pageFooter()!.nativeElement.innerHTML = '';
  }

  onSelectBlock(c: PageItem, ev?: Event) {
    // console.log('click on block', c.el);
    ev?.stopPropagation();
    ev?.preventDefault();
    this.activeEl.set(c);
  }
  deSelectBlock() {
    this.activeEl.set(undefined);
  }
  removeBlock(item: PageItem) {
    let parent = item.parent;
    if (!parent) {
      const page = this.pageInfo.pages[this.currentPageIndex()];
      const lists = [...page.headerItems, ...page.bodyItems, ...page.footerItems];
      parent = lists.find((x) => x.children && x.children.includes(item));
    }
    if (!item || !parent) {
      throw new Error('Remove block failed: invalid parent item in list');
    }
    const index = parent.children.findIndex((i) => i.id === item.id);
    if (index !== -1 && item.el) {
      parent.children.splice(index, 1);
      this.dynamicElementService.destroy(item);
    }
    this.activeEl.set(undefined);
    this.updateChangeDetection({ item: item, type: 'RemoveBlock' });
  }

  private findInTree(list: PageItem[], id: string): PageItem[] | null {
    for (const item of list) {
      if (item.id === id) {
        return list; // این لیست شامل بلاک مورد نظر است
      }

      if (item.children && item.children.length > 0) {
        const found = this.findInTree(item.children, id);
        if (found) return found; // فقط در صورت پیدا شدن بازگشت
      }
    }

    return null;
  }

  writeItemValue(data: PageItem) {
    this.dynamicElementService.updateElementContent(data);
    this.updateChangeDetection({ item: data, type: 'ChangeBlockContent' });
  }
  changedProperties(item: PageItem) {
    this.updateChangeDetection({ item: item, type: 'ChangeBlockProperties' });
  }
}
