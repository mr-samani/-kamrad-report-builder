import { reflectComponentType, Type } from '@angular/core';
import { randomStrnig } from '../utiles/generateUUID';
import { ISourceOptions } from './SourceItem';

export class PageItem {
  id: string = '';
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
    if (!this.id) this.id = randomStrnig(5);
    if (this.component && typeof this.component === 'function') {
      this.componentKey = this.component.name || 'UnknownComponent';
      const metadata = reflectComponentType(this.component);
      this.tag = metadata?.selector || '';
    }
  }
  static fromJSON(data: any): PageItem {
    const item = new PageItem(data);
    Object.assign(item, data);
    return item;
  }

  public get CanBeSetContent(): boolean {
    const isComponent = this.component && typeof this.component === 'function';
    return !(this.el?.tagName === 'IMG' || isComponent === true);
  }

  public get isImageTag(): boolean {
    return this.el?.tagName === 'IMG';
  }
}
