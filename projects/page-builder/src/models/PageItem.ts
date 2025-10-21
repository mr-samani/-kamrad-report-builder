import { generateUUID } from '../utiles/generateUUID';

export class PageItem {
  id: string = generateUUID();
  el?: HTMLElement;
  children: PageItem[] = [];
  tag!: string;
  html?: string;
  content?: string;
  attributes?: Record<string, any> | undefined;

  constructor(data?: PageItem | any) {
    if (data) {
      for (var property in data) {
        if (this.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
      }
    }
  }
}
