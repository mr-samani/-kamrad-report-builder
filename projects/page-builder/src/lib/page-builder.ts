import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  inject,
  Injector,
  OnInit,
  Renderer2,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { IDropEvent, moveItemInArray, NgxDragDropKitModule } from 'ngx-drag-drop-kit';
import { PageItem } from '../models/PageItem';
import { SOURCE_ITEMS, SourceItem } from '../models/SourceItem';
import {
  DefaultBlockClassName,
  DefaultBlockDirectives,
  LOCAL_STORAGE_SAVE_KEY,
} from '../consts/defauls';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { BlockSelectorComponent } from '../components/block-selector/block-selector.component';
import { generateUUID } from '../utiles/generateUUID';
import { BlockPropertiesComponent } from '../components/block-properties/block-properties.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { PageFooterComponent } from './page-footer/page-footer.component';
import { PageBuilderBaseComponent } from './page-builder-base-component';
import { Page } from '../models/Page';
import { IStorageService } from '../services/storage/IStorageService';
import { STORAGE_SERVICE } from '../services/storage/token.storage';

@Component({
  selector: 'ngx-page-builder',
  templateUrl: './page-builder.html',
  styleUrls: ['./page-builder.scss'],
  imports: [
    CommonModule,
    NgxDragDropKitModule,
    SafeHtmlPipe,
    ToolbarComponent,
    BlockSelectorComponent,
    BlockPropertiesComponent,
    PageHeaderComponent,
    PageFooterComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxPageBuilder extends PageBuilderBaseComponent implements OnInit {
  private readonly cd = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  sources: SourceItem[] = SOURCE_ITEMS;
  private _page = viewChild<ElementRef>('PageContainer');

  constructor(
    injector: Injector,
    @Inject(STORAGE_SERVICE) private storageService: IStorageService
  ) {
    super(injector);
    this.dynamicElementService.renderer = this.renderer;
    this.pageBuilderService.renderer = this.renderer;
    this.pageBuilderService.page = this._page;
  }

  ngOnInit(): void {
    this.loadPageData();
  }

  preventDefault() {}
  async loadPageData() {
    debugger;
    try {
      this.pageBuilderService.pageInfo = await this.storageService.loadData();
      let pages = this.pageBuilderService.pageInfo.pages;
      this.pageBuilderService.pageInfo.pages = [];

      for (let pageData of pages) {
        const page = new Page(pageData);
        this.pageBuilderService.pageInfo.pages.push(page);
        for (let item of page.items) {
          item = new PageItem(item);
          item.el = this.dynamicElementService.createElementFromHTML(item, this._page, {
            directives: DefaultBlockDirectives,
            attributes: {
              class: DefaultBlockClassName,
            },
            events: {
              click: (ev: Event) => this.pageBuilderService.onSelectBlock(item, ev),
            },
          });
        }

        if (this.pageBuilderService.pageInfo.pages.length > 0) {
          this.pageBuilderService.changePage(1);
        } else {
          this.pageBuilderService.addPage();
        }
      }
    } catch (error) {
      console.log('Error loading page data:', error);
    }
  }

  async onDrop(event: IDropEvent) {
    console.log('Dropped:', event);
    const currentPageItems = this.pageBuilderService.currentPageItems;

    this.pageBuilderService.activeEl.set(undefined);
    if (event.previousContainer !== event.container) {
      // انتقال از یک container به container دیگه
      const source = new PageItem(this.sources[event.previousIndex]);
      source.id = generateUUID();
      let html = this.dynamicElementService.createElement(
        event.container.el,
        event.currentIndex,
        source.tag,
        source.id,
        {
          text: source.content,
          directives: DefaultBlockDirectives,
          attributes: {
            ...source.attributes,
            class: DefaultBlockClassName,
          },
          events: {
            click: (ev: Event) => this.pageBuilderService.onSelectBlock(source, ev),
          },
        }
      );
      source.el = html;
      currentPageItems.splice(event.currentIndex, 0, source);
      this.pageBuilderService.onSelectBlock(source);
    } else {
      if (event.previousIndex !== event.currentIndex) {
        const nativeEl = currentPageItems[event.previousIndex].el;
        moveItemInArray(currentPageItems, event.previousIndex, event.currentIndex);

        const containerEl = event.container.el;
        const children = Array.from(containerEl.children);
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
      }
    }

    console.log(
      'Dropped:',
      currentPageItems.map((m) => m.tag)
    );
    this.pageBuilderService.currentPageItems = currentPageItems;
    this.cd.detectChanges();
  }
}
