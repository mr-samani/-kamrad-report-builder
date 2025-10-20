import { generateUUID } from '../utiles/generateUUID';

export class PageItem {
  id: string = generateUUID();
  el!: HTMLElement;
  children: PageItem[] = [];
  tag!: string;
  html?: string;

  constructor(el: HTMLElement, tag: string, id?: string) {
    this.el = el;
    this.tag = tag;
    this.id = id || generateUUID();
  }
}
