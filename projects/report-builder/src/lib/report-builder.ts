import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, ViewEncapsulation } from '@angular/core';
import { IDropEvent, moveItemInArray, NgxDragDropKitModule } from 'ngx-drag-drop-kit';
import { ReportItem } from '../models/ReportItem';
import { DynamicElementService } from '../services/dynamic-element.service';
import { SOURCE_ITEMS, SourceItem } from '../models/SourceItem';
import { DefaultBlockClassName, DefaultBlockDirectives } from '../consts/defauls';

@Component({
  selector: 'ngx-report-builder',
  templateUrl: './report-builder.html',
  styleUrls: ['./report-builder.scss'],
  imports: [CommonModule, NgxDragDropKitModule],
  encapsulation: ViewEncapsulation.None,
})
export class NgxReportBuilder {
  private readonly cd = inject(ChangeDetectorRef);
  private readonly dynamicElementService = inject(DynamicElementService);
  items: ReportItem[] = [];
  sources: SourceItem[] = SOURCE_ITEMS;

  constructor() {}

  async onDrop(event: IDropEvent) {
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
      const c = new ReportItem(item);
      this.items.splice(i, 0, c);
    } else {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    this.cd.detectChanges();
  }
}
