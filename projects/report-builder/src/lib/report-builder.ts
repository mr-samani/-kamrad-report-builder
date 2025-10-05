import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { IDropEvent, moveItemInArray, NgxDragDropKitModule } from 'ngx-drag-drop-kit';
import { ReportItem } from '../models/ReportItem';
import { DynamicElementService } from '../services/dynamic-element.service';
import { SOURCE_ITEMS, SourceItem } from '../models/SourceItem';
import { DefaultBlockClassName, DefaultBlockDirectives } from '../consts/defauls';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';

@Component({
  selector: 'ngx-report-builder',
  templateUrl: './report-builder.html',
  styleUrls: ['./report-builder.scss'],
  imports: [CommonModule, NgxDragDropKitModule, SafeHtmlPipe],
  encapsulation: ViewEncapsulation.None,
})
export class NgxReportBuilder implements OnInit {
  private readonly cd = inject(ChangeDetectorRef);
  private readonly dynamicElementService = inject(DynamicElementService);
  items: ReportItem[] = [];
  sources: SourceItem[] = SOURCE_ITEMS;

  constructor() {}

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport() {
    const report = localStorage.getItem('report');
    if (report) {
      this.items = JSON.parse(report);
    }
  }

  async onDrop(event: IDropEvent) {
    console.log('Dropped:', event);
    if (event.previousContainer !== event.container) {
      // copyArrayItem(event.previousContainer.data,event.container.data,event.previousIndex, event.currentIndex);
      const i = event.currentIndex;
      const tag = this.sources[event.previousIndex].tag;
      const text = this.sources[event.previousIndex].text;
      let item = this.dynamicElementService.createElement(event.container.el, i, tag, {
        text,
        directives: DefaultBlockDirectives,
        attributes: {
          class: DefaultBlockClassName,
        },
      });
      const c = new ReportItem(item, tag);
      this.items.splice(i, 0, c);
    } else {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    this.cd.detectChanges();
  }

  onSave() {
    localStorage.setItem('report', JSON.stringify(this.items));
  }
}
