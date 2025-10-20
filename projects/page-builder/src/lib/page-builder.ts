import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnInit,
  Renderer2,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { IDropEvent, moveItemInArray, NgxDragDropKitModule } from 'ngx-drag-drop-kit';
import { PageItem } from '../models/PageItem';
import { DynamicElementService } from '../services/dynamic-element.service';
import { SOURCE_ITEMS, SourceItem } from '../models/SourceItem';
import { DefaultBlockClassName, DefaultBlockDirectives } from '../consts/defauls';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { sanitizeForStorage } from '../utiles/sanitizeForStorage';
import { PageBuilderService } from '../services/page-builder.service';
import { BlockSelectorComponent } from '../components/block-selector/block-selector.component';
import { generateUUID } from '../utiles/generateUUID';

@Component({
  selector: 'ngx-page-builder',
  templateUrl: './page-builder.html',
  styleUrls: ['./page-builder.scss'],
  imports: [CommonModule, NgxDragDropKitModule, SafeHtmlPipe, BlockSelectorComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxPageBuilder implements OnInit {
  private readonly cd = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private readonly dynamicElementService = inject(DynamicElementService);
  public readonly pageBuilderService = inject(PageBuilderService);
  sources: SourceItem[] = SOURCE_ITEMS;
  page = viewChild<ElementRef>('PageContainer');
  showOutlines = true;
  constructor() {
    this.pageBuilderService.renderer = this.renderer;
  }

  ngOnInit(): void {
    this.loadPageData();
  }

  loadPageData() {
    const report = localStorage.getItem('report');
    if (report) {
      this.pageBuilderService.items = JSON.parse(report);
      this.pageBuilderService.items.forEach((item) => {
        item.el = this.dynamicElementService.createElementFromHTML(item, this.page, {
          directives: DefaultBlockDirectives,
          attributes: {
            class: DefaultBlockClassName,
          },
          events: {
            click: () => this.pageBuilderService.onSelectBlock(item),
          },
        });
      });
    }
  }

  async onDrop(event: IDropEvent) {
    console.log('Dropped:', event);
    this.deSelectBlock();
    if (event.previousContainer !== event.container) {
      const id = generateUUID();
      // انتقال از یک container به container دیگه
      const source = this.sources[event.previousIndex];
      let item = this.dynamicElementService.createElement(
        event.container.el,
        event.currentIndex,
        source.tag,
        id,
        {
          text: source.text,
          directives: DefaultBlockDirectives,
          attributes: {
            ...source.attributes,
            class: DefaultBlockClassName,
          },
          events: {
            click: () => this.pageBuilderService.onSelectBlock(c),
          },
        }
      );
      const c = new PageItem(item, source.tag, id);
      this.pageBuilderService.items.splice(event.currentIndex, 0, c);
      this.pageBuilderService.onSelectBlock(c);
    } else {
      if (event.previousIndex !== event.currentIndex) {
        // جابجایی در همون container
        const nativeEl = this.pageBuilderService.items[event.previousIndex].el;

        // ابتدا آرایه رو جابجا کن
        moveItemInArray(this.pageBuilderService.items, event.previousIndex, event.currentIndex);

        // حالا DOM رو هم جابجا کن
        const containerEl = event.container.el;
        const children = Array.from(containerEl.children);

        // المنت رو از جای قبلی بردار
        this.renderer.removeChild(containerEl, nativeEl);

        // اگر باید به آخر لیست اضافه بشه
        if (event.currentIndex >= children.length - 1) {
          this.renderer.appendChild(containerEl, nativeEl);
        } else {
          // وگرنه قبل از المنت مورد نظر قرارش بده
          // توجه: چون یه element رو remove کردیم، باید index رو تنظیم کنیم
          const refIndex =
            event.currentIndex > event.previousIndex ? event.currentIndex : event.currentIndex;
          const refNode = children[refIndex];
          this.renderer.insertBefore(containerEl, nativeEl, refNode);
        }
      }
    }

    console.log(
      'Dropped:',
      this.pageBuilderService.items.map((m) => m.tag)
    );
    this.cd.detectChanges();
  }
  onSave() {
    this.pageBuilderService.items.forEach((item) => {
      //cleanup
      let html = item.el.outerHTML;
      html = html.replace(/\s*data-id="[^"]*"/g, '');
      html = html.replace(/\s*contenteditable="[^"]*"/g, '');
      html = html.replace(/<div[^>]*class="[^"]*ngx-corner-resize[^"]*"[^>]*>[\s\S]*?<\/div>/g, '');

      item.html = encodeURIComponent(html);
    });
    const sanitized = sanitizeForStorage(this.pageBuilderService.items);
    localStorage.setItem('report', JSON.stringify(sanitized));
  }

  toggleOutlines() {
    this.showOutlines = !this.showOutlines;
  }
  deSelectBlock() {
    this.pageBuilderService.activeEl.set(undefined);
  }
}
