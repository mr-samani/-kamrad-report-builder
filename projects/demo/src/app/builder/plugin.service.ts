import { Injectable } from '@angular/core';
import { IPlugin, IPluginStore } from '@ngx-page-builder';

@Injectable()
export class PluginService implements IPluginStore {
  save(plugin: IPlugin): void {
    console.log('i get plugin', plugin);
  }
}
