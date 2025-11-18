import { Injectable } from '@angular/core';
import { DynamicDataStructure } from '../models/DynamicData';
import { Page } from '../models/Page';
import { PageItem } from '../models/PageItem';

@Injectable({
  providedIn: 'root',
})
export class DynamicDataService {
  private _dynamicData: DynamicDataStructure[] = [];

  private _dynamicDataDictionary: { [key: string]: string } = {};

  private map = new Map<string, DynamicDataStructure>();
  private nearestCache = new Map<string, string | null>(); // itemId -> nearest datasource id

  public set dynamicData(value: DynamicDataStructure[]) {
    this._dynamicData = value ?? [];
    this.createValueDictionary();
    console.log(this._dynamicDataDictionary);
  }
  public get dynamicData() {
    return this._dynamicData;
  }

  private createValueDictionary() {
    this._dynamicDataDictionary = {};
    if (!this._dynamicData) {
      return;
    }

    let recursiveTraverse = (obj: any, path: string[] = []) => {
      if (obj.value) {
        this._dynamicDataDictionary[path.join('.')] = obj.value;
        return;
      }

      for (const key in obj.properties) {
        recursiveTraverse(obj.properties[key], [...path, key]);
      }
    };

    for (let item of this._dynamicData) {
      const values = item.values;
      let path: string[] = [item.name];
      recursiveTraverse(values, path);
    }
  }

  public replaceValues(pages: Page[]) {
    setTimeout(() => {
      // console.log('Replacing values...', pages, this._dynamicDataDictionary);
      let replace = (item?: HTMLElement) => {
        if (!item) return;
        let txt = item.innerHTML;
        let isReplaced = false;
        for (const key in this._dynamicDataDictionary) {
          const value = this._dynamicDataDictionary[key];
          const regEx = new RegExp(`\\[%${key}%\\]`, 'g');
          isReplaced = isReplaced || regEx.test(txt);
          txt = txt.replace(regEx, value);
        }
        if (isReplaced) {
          item.innerHTML = txt;
        }
      };
      for (let page of pages) {
        page.bodyItems.forEach((item) => replace(item.el));
        page.headerItems.forEach((item) => replace(item.el));
        page.footerItems.forEach((item) => replace(item.el));
      }
    }, 100);
  }

  /*------------------------------------------------------------------------------------------*/
  register(ds: DynamicDataStructure) {
    this.map.set(ds.id, ds);
  }
  get(id: string) {
    return this.map.get(id) ?? null;
  }
  list() {
    return Array.from(this.map.values());
  }

  // walk up model parent pointers to find nearest datasource
  findNearestDataSource(itemId: string, pageModel: Map<string, PageItem>): string | null {
    if (this.nearestCache.has(itemId)) return this.nearestCache.get(itemId)!;
    let cur = pageModel.get(itemId);
    while (cur) {
      if (cur.dataSource?.id) {
        this.nearestCache.set(itemId, cur.dataSource.id);
        return cur.dataSource.id;
      }
      if (!cur.parent?.id) break;
      cur = pageModel.get(cur.parent.id);
    }
    this.nearestCache.set(itemId, null);
    return null;
  }

  // call this whenever tree structure or datasource references change
  invalidateNearestCacheFor(itemIds?: string[]) {
    if (!itemIds) this.nearestCache.clear();
    else itemIds.forEach((id) => this.nearestCache.delete(id));
  }
}
