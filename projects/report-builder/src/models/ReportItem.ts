import { generateUUID } from '../utiles/generateUUID';

export class ReportItem {
  id: string = generateUUID();
  el!: HTMLElement;
  children: ReportItem[] = [];

  constructor(el: HTMLElement) {
    this.el = el;
  }
}
