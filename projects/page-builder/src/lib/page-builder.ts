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
import {
  IDropEvent,
  moveItemInArray,
  NgxDragDropKitModule,
  transferArrayItem,
} from 'ngx-drag-drop-kit';
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
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxPageBuilder extends PageBuilderBaseComponent implements OnInit {
  private renderer = inject(Renderer2);
  sources: SourceItem[] = SOURCE_ITEMS;
  private _pageBody = viewChild<ElementRef<HTMLElement>>('PageBody');
  private _pageHeader = viewChild<ElementRef<HTMLElement>>('PageHeader');
  private _pageFooter = viewChild<ElementRef<HTMLElement>>('PageFooter');

  constructor(
    injector: Injector,
    @Inject(STORAGE_SERVICE) private storageService: IStorageService
  ) {
    super(injector);
    this.dynamicElementService.renderer = this.renderer;
    this.pageBuilderService.renderer = this.renderer;
    this.pageBuilderService.pageBody = this._pageBody;
    this.pageBuilderService.pageHeader = this._pageHeader;
    this.pageBuilderService.pageFooter = this._pageFooter;
    this.pageBuilderService.changed$.subscribe(() => {
      this.chdRef.detectChanges();
    });
  }

  ngOnInit(): void {
    this.loadPageData();
  }

  preventDefault() {}
  async loadPageData() {
    try {
      this.pageBuilderService.pageInfo = await this.storageService.loadData();
      let pages = this.pageBuilderService.pageInfo.pages;
      if (pages.length == 0) {
        this.pageBuilderService.addPage();
        return;
      }
      this.pageBuilderService.pageInfo.pages = [];
      for (let pageData of pages) {
        const page = new Page(pageData);
        page.bodyItems = [];
        for (let item of pageData.bodyItems) {
          item = new PageItem(item);
          page.bodyItems.push(item);
        }
        this.pageBuilderService.pageInfo.pages.push(page);

        if (this.pageBuilderService.pageInfo.pages.length > 0) {
          this.pageBuilderService.changePage(1);
        } else {
          this.pageBuilderService.addPage();
        }
      }
    } catch (error) {
      console.error('Error loading page data:', error);
      alert('Error loading page data: ' + error);
    }
  }

  async onDrop(event: IDropEvent, listName = '') {
    console.log('Dropped:', event);
    this.pageBuilderService.activeEl.set(undefined);
    if (event.previousContainer.el.id == 'blockSourceList') {
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
      source.html = html.outerHTML;
      event.container.data.splice(event.currentIndex, 0, source);
      this.pageBuilderService.onSelectBlock(source);
    } else {
      const nativeEl = event.previousContainer.data[event.previousIndex].el;
      if (event.container == event.previousContainer) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      } else {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      }

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

    // this.pageBuilderService.items = items;
    this.chdRef.detectChanges();
  }
}
