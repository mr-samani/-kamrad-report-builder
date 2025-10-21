import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
import { DefaultBlockClassName, DefaultBlockDirectives } from '../consts/defauls';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { BlockSelectorComponent } from '../components/block-selector/block-selector.component';
import { generateUUID } from '../utiles/generateUUID';
import { BlockPropertiesComponent } from '../components/block-properties/block-properties.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { PageFooterComponent } from './page-footer/page-footer.component';
import { PageBuilderBaseComponent } from './page-builder-base-component';

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

  constructor(injector: Injector) {
    super(injector);
    this.dynamicElementService.renderer = this.renderer;
    this.pageBuilderService.renderer = this.renderer;
    this.pageBuilderService.page = this._page;
  }

  ngOnInit(): void {
    this.loadPageData();
  }

  loadPageData() {
    const report = localStorage.getItem('report');
    if (report) {
      this.pageBuilderService.items = [];
      const data = JSON.parse(report) ?? [];
      data.forEach((d: any) => {
        const item = new PageItem(d);
        this.pageBuilderService.items.push(item);
        item.el = this.dynamicElementService.createElementFromHTML(item, this._page, {
          directives: DefaultBlockDirectives,
          attributes: {
            class: DefaultBlockClassName,
          },
          events: {
            click: (ev: Event) => this.pageBuilderService.onSelectBlock(item, ev),
          },
        });
      });
    }
  }

  async onDrop(event: IDropEvent) {
    console.log('Dropped:', event);
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
      this.pageBuilderService.items.splice(event.currentIndex, 0, source);
      this.pageBuilderService.onSelectBlock(source);
    } else {
      if (event.previousIndex !== event.currentIndex) {
        const nativeEl = this.pageBuilderService.items[event.previousIndex].el;
        moveItemInArray(this.pageBuilderService.items, event.previousIndex, event.currentIndex);

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
      this.pageBuilderService.items.map((m) => m.tag)
    );
    this.cd.detectChanges();
  }
}
