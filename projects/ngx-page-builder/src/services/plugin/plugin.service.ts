import { Injectable } from '@angular/core';
import { PageItem } from '../../models/PageItem';
import { snapdom } from '@zumer/snapdom';
import { deepCloneInstance } from '../../utiles/clone-deep';
import { preparePageItems } from '../../public-api';
import { sanitizeForStorage } from '../storage/sanitizeForStorage';
import { ClassManagerService } from '../class-manager.service';
import { IPlugin } from '../../contracts/IPlugin';

@Injectable({ providedIn: 'root' })
export class PluginService {
  constructor(private cls: ClassManagerService) {}
  async getPlugin(item: PageItem): Promise<IPlugin> {
    return new Promise<IPlugin>(async (resolve, reject) => {
      try {
        if (!item.el) {
          throw new Error('Can not get html element!');
        }

        const style = this.cls.getBlockStyles(item);
        const img = (await snapdom.toPng(item.el, { embedFonts: true })).src ?? '';
        const clonedData = deepCloneInstance(item);
        const data = preparePageItems([clonedData])[0];
        const sanitized = sanitizeForStorage(data);
        resolve({
          image: img,
          name: '',
          plugin: JSON.stringify({ sanitized, style }),
        });
      } catch (error: any) {
        reject(error);
      }
    });
  }
}
