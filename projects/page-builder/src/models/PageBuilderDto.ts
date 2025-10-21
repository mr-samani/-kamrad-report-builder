import { Page } from './Page';
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
}
export class PageBuilderConfig {
  title?: string = '';
  description?: string = '';
  size: PageSize = 'A4';
  orientation: PageOrientation = 'Portrait';
}
