import { Type } from '@angular/core';
import { generateUUID } from '../utiles/generateUUID';
import { ISourceOptions } from './SourceItem';

export class PageItem {
  id: string = generateUUID();
  el?: HTMLElement;
  children: PageItem[] = [];
  tag!: string;
  html?: string;
  /** content in html editor */
  content?: string;
  component?: Type<any>;
  componentKey?: string;
  options?: ISourceOptions;
  style?: string;
  constructor(data?: PageItem | any) {
    if (data) {
      for (var property in data) {
        if (this.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
      }
    }
    if (this.component && typeof this.component === 'function') {
      this.componentKey = this.component.name || 'UnknownComponent';
    }
  }
  static fromJSON(data: any): PageItem {
    const item = new PageItem(data);
    Object.assign(item, data);
    return item;
  }
}
