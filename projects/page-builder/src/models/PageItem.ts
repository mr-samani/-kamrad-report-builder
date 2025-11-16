import { reflectComponentType, Type } from '@angular/core';
import { randomStrnig } from '../utiles/generateUUID';
import { ISourceOptions } from './SourceItem';
import { LibConsts } from '../consts/defauls';

export interface IPageItem {
  id?: string;
  el?: HTMLElement;
  children?: PageItem[];
  tag?: string;
  canHaveChild?: boolean;
  /** content in html editor */
  content?: string;
  component?: Type<any>;
  componentKey?: string;
  options?: ISourceOptions;
  style?: string;
}

export class PageItem implements IPageItem {
  id: string = '';
  el?: HTMLElement;
  children: PageItem[] = [];
  tag!: string;
  canHaveChild: boolean = false;
  /** content in html editor */
  content?: string;
  component?: Type<any>;
  componentKey?: string;
  options?: ISourceOptions;
  style?: string;

  /**
   * Disable movement of the source item
   * @example pagebreak cannot move to child items
   */
  disableMovement?: boolean = false;
  constructor(data?: IPageItem) {
    if (data) {
      for (var property in data) {
        if (this.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
      }
    }
    if (!this.id) this.id = randomStrnig(5);

    // in edit form
    if (this.componentKey && !this.component) {
      this.component = LibConsts.SourceItemList.find(
        (x) => x.componentKey === this.componentKey,
      )?.component;
    }
    // in new form
    else if (this.component && typeof this.component === 'function') {
      this.componentKey = this.component.name || 'UnknownComponent';
      const metadata = reflectComponentType(this.component);
      this.tag = metadata?.selector || '';
    }
  }
  static fromJSON(data: any): PageItem {
    const item = new PageItem(data);
    Object.assign(item, data);
    if (item.children) {
      item.children = item.children.map((child) => new PageItem(child));
    }
    return item;
  }

  /**
   * @readonly
   */
  public get CanBeSetContent(): boolean {
    const isComponent = this.component && typeof this.component === 'function';
    return !(this.el?.tagName === 'IMG' || isComponent === true);
  }

  /**
   * @readonly
   */
  public get isImageTag(): boolean {
    console.log(this.el?.tagName);
    return this.el?.tagName === 'IMG';
  }

  /**
   * Save element attribute
   * @param name attr
   * @param value value
   */
  public setItemAttribute(name: string, value: string) {
    if (!this.options) {
      this.options = {};
    }
    if (!this.options.attributes) {
      this.options.attributes = {};
    }
    this.options.attributes[name] = value;
  }
}
