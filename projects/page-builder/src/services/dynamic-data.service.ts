import { Injectable } from '@angular/core';
import { DynamicDataStructure, DynamicNode, DynamicObjectNode } from '../models/DynamicData';
import { PageBuilderDto } from '../public-api';
import { Page } from '../models/Page';

@Injectable({
  providedIn: 'root',
})
export class DynamicDataService {
  private _dynamicData?: DynamicDataStructure;

  private _dynamicDataDictionary: { [key: string]: string } = {};

  public get dynamicData(): DynamicDataStructure | undefined {
    return this._dynamicData;
  }

  public set dynamicData(value: DynamicDataStructure | undefined) {
    this._dynamicData = value;
    this.createValueDictionary();
    console.log(this._dynamicDataDictionary);
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

    for (let key in this._dynamicData) {
      const value = this._dynamicData[key];
      let path: string[] = [key];
      recursiveTraverse(value, path);
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
}
