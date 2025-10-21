import { PageItem } from './PageItem';

export declare type PageSize = 'A4' | 'A5' | 'Letter';
export declare type PageOrientation = 'portrait' | 'landscape';

export class Page {
  items: PageItem[] = [];
  config: PageConfig = new PageConfig();
  constructor(data?: Page | any) {
    if (data) {
      for (var property in data) {
        if (this.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
      }
    }
  }
}

export class PageConfig {
  title: string = '';
  description: string = '';
  size: PageSize = 'A4';
  orientation: PageOrientation = 'portrait';
}
