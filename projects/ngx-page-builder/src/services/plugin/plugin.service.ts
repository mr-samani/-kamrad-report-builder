import { Inject, Injectable } from '@angular/core';
import { PageItem } from '../../models/PageItem';
import { snapdom } from '@zumer/snapdom';
import { deepCloneInstance } from '../../utiles/clone-deep';
import {
  IPluginStore,
  NGX_PAGE_BUILDER_EXPORT_PLUGIN_STORE,
  preparePageItems,
} from '../../public-api';
import { sanitizeForStorage } from '../storage/sanitizeForStorage';
import { ClassManagerService } from '../class-manager.service';
import { IPlugin } from '../../contracts/IPlugin';

@Injectable({ providedIn: 'root' })
export class PluginService {
  constructor(
    private cls: ClassManagerService,
    @Inject(NGX_PAGE_BUILDER_EXPORT_PLUGIN_STORE) private pluginStore: IPluginStore,
  ) {}
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
  save(plugin: IPlugin) {
    this.pluginStore.save(plugin);
  }

  getAllPlugins(take: number, skip: number, filter: string): Promise<IPlugin[]> {
    return this.pluginStore.getAllPlugins(take, skip, filter);
  }
  addToForm(plugin: IPlugin) {
    throw new Error('Method not implemented.');
  }
}
