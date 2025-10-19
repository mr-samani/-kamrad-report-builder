import { CommonModule } from '@angular/common';
import {
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
import { ReportItem } from '../models/ReportItem';
import { DynamicElementService } from '../services/dynamic-element.service';
import { SOURCE_ITEMS, SourceItem } from '../models/SourceItem';
import { DefaultBlockClassName, DefaultBlockDirectives } from '../consts/defauls';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { sanitizeForStorage } from '../utiles/sanitizeForStorage';

@Component({
  selector: 'ngx-report-builder',
  templateUrl: './report-builder.html',
  styleUrls: ['./report-builder.scss'],
  imports: [CommonModule, NgxDragDropKitModule, SafeHtmlPipe],
  encapsulation: ViewEncapsulation.None,
})
export class NgxReportBuilder implements OnInit {
  private readonly cd = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private readonly dynamicElementService = inject(DynamicElementService);
  items: ReportItem[] = [];
  sources: SourceItem[] = SOURCE_ITEMS;
  page = viewChild<ElementRef>('reportPage');
  constructor() {}

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport() {
    const report = localStorage.getItem('report');
    if (report) {
      this.items = JSON.parse(report);
      this.items.forEach((item) => {
        item.el = this.dynamicElementService.createElementFromHTML(
          item.html,
          this.page,
          DefaultBlockDirectives
        );
      });
    }
  }

  async onDrop(event: IDropEvent) {
    console.log('Dropped:', event);

    if (event.previousContainer !== event.container) {
      // انتقال از یک container به container دیگه
      const tag = this.sources[event.previousIndex].tag;
      const text = this.sources[event.previousIndex].text;
      let item = this.dynamicElementService.createElement(
        event.container.el,
        event.currentIndex,
        tag,
        {
          text,
          directives: DefaultBlockDirectives,
          attributes: {
            class: DefaultBlockClassName,
          },
        }
      );
      const c = new ReportItem(item, tag);
      this.items.splice(event.currentIndex, 0, c);
    } else {
      // جابجایی در همون container
      const nativeEl = this.items[event.previousIndex].el;

      // ابتدا آرایه رو جابجا کن
      moveItemInArray(this.items, event.previousIndex, event.currentIndex);

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

    console.log(
      'Dropped:',
      this.items.map((m) => m.tag)
    );
    this.cd.detectChanges();
  }
  onSave() {
    this.items.forEach((item) => (item.html = encodeURIComponent(item.el.outerHTML)));
    const sanitized = sanitizeForStorage(this.items);
    localStorage.setItem('report', JSON.stringify(sanitized));
  }
}
