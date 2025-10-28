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
  static fromJSON(data: any): Page {
    const p = new Page(data);
    p.headerItems = (data.headerItems || []).map(PageItem.fromJSON);
    p.bodyItems = (data.bodyItems || []).map(PageItem.fromJSON);
    p.footerItems = (data.footerItems || []).map(PageItem.fromJSON);
    p.config = new PageConfig(data.config);
    p.order = data.order ?? 0;
    return p;
  }
}

export class PageConfig {
  title?: string = '';
  description?: string = '';
  constructor(data?: PageConfig | any) {
    if (data) {
      for (var property in data) {
        if (this.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
      }
    }
  }
}
