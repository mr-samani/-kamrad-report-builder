import { generateUUID } from '../utiles/generateUUID';

export class ReportItem {
  id: string = generateUUID();
  el!: HTMLElement;
  children: ReportItem[] = [];
  tag!: string;

  constructor(el: HTMLElement, tag: string) {
    this.el = el;
    this.tag = tag;
  }
}
