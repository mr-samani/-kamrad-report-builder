import { PageItem } from './PageItem';

export class Page {
  headerItems: PageItem[] = [];
  bodyItems: PageItem[] = [];
  footerItems: PageItem[] = [];
  config: PageConfig = new PageConfig();
  order: number = 0;
  constructor(data?: Page | any) {
    if (data) {
      for (var property in data) {
        if (this.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
      }
    }
  }
}

export class PageConfig {
  title?: string = '';
  description?: string = '';
}
