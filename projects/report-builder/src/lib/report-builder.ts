import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, ViewContainerRef } from '@angular/core';
import { EnumToArrayStringPipe } from '../pipes/enum-to-array.pipe';
import { IDropEvent, moveItemInArray, NgxDragDropKitModule } from 'ngx-drag-drop-kit';
import { ReportItem } from '../models/ReportItems';
import { ReportComponentHelper } from '../components/report-component.helper';
import { ReportComponentType } from '../components/component-types';

@Component({
  selector: 'ngx-report-builder',
  templateUrl: './report-builder.html',
  styleUrl: './report-builder.scss',
  imports: [CommonModule, NgxDragDropKitModule],
})
export class NgxReportBuilder {
  private readonly cd = inject(ChangeDetectorRef);
  items: ReportItem[] = [];
  sources: { type: ReportComponentType; title: string }[];

  constructor() {
    this.sources = Object.entries(ReportComponentType)
      .filter(([key, value]) => typeof value === 'string')
      .map(([key, value]) => ({
        type: value as ReportComponentType,
        title: key,
      }));
  }

  async onDrop(event: IDropEvent) {
    if (event.previousContainer !== event.container) {
      // copyArrayItem(event.previousContainer.data,event.container.data,event.previousIndex, event.currentIndex);
      const i = event.currentIndex;
      const type = event.previousContainer.data[event.previousIndex].type;
      const c = await ReportComponentHelper.getComponent(type);
      const item = new ReportItem(c);
      this.items.splice(i, 0, item);
    } else {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    this.cd.detectChanges();
  }
}
