import { Injectable, signal } from '@angular/core';
import { ReportItem } from '../models/ReportItem';

@Injectable({
  providedIn: 'root',
})
export class PageBuilderService {
  items: ReportItem[] = [];

  activeEl = signal<ReportItem | null>(null);
  constructor() {}

  onSelectBlock(c: ReportItem) {
    this.activeEl.set(c);
  }
}
