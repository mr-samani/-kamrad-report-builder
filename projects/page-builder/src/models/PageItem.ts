import {
  DestroyableInjector,
  InjectionToken,
  Provider,
  reflectComponentType,
  Type,
} from '@angular/core';
import { randomStrnig } from '../utiles/generateUUID';
import { ISourceOptions } from './SourceItem';
import { LibConsts } from '../consts/defauls';
import { CustomComponent } from './CustomComponent';

export interface IPageItem {
  id?: string;
  el?: HTMLElement;
  children?: PageItem[];
  tag?: string;
  canHaveChild?: boolean;
  /** content in html editor */
  content?: string;
  component?: () => Promise<Type<any>>;
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
  options?: ISourceOptions;
  style?: string;

  /**
   * Disable movement of the source item
   * @example pagebreak cannot move to child items
   */
  disableMovement?: boolean = false;
  //------------------------CUSTOM COMPONENT---------------------------
  /** custom component */
  customComponent?: CustomComponent;

  //---------------------------------------------------

  constructor(data?: IPageItem) {
    if (data) {
      for (var property in data) {
        if (this.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
      }
    }
    if (!this.id) this.id = randomStrnig(5);
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
    const isComponent =
      this.customComponent && typeof this.customComponent.component === 'function';
    return !(this.el?.tagName === 'IMG' || isComponent === true);
  }

  /**
   * @readonly
   */
  public get isImageTag(): boolean {
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

  public async getComponentInstance() {
    if (this.customComponent && this.customComponent.componentKey) {
      const finded = LibConsts.SourceItemList.find(
        (x) => x.customComponent?.componentKey === this.customComponent!.componentKey,
      );
      if (finded) {
        this.customComponent = { ...this.customComponent, ...finded.customComponent! };
        return await this.customComponent.component();
      } else {
        console.error(
          `Custom component with key ${this.customComponent.componentKey} not found in CustomSources.`,
        );
      }
    }
    return undefined;
  }
}
