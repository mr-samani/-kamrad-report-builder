import { Page } from './Page';
import { PageItem } from './PageItem';
import { PageOrientation, PageSize } from './types';

export class PageBuilderDto {
  config: PageBuilderConfig = new PageBuilderConfig();
  pages: Page[] = [];
  constructor(data?: PageBuilderDto | any) {
    if (data) {
      for (var property in data) {
        if (this.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
      }
    }
  }
  static fromJSON(data: any): PageBuilderDto {
    const p = new PageBuilderDto(data);
    p.pages = data.pages.map((page: any) => Page.fromJSON(page));
    p.config = new PageBuilderConfig(data.config);
    return p;
  }
}
export class PageBuilderConfig {
  title?: string = '';
  description?: string = '';
  size: PageSize = 'A4';
  orientation: PageOrientation = 'Portrait';
  constructor(data?: PageBuilderConfig | any) {
    if (data) {
      for (var property in data) {
        if (this.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
      }
    }
  }
}
