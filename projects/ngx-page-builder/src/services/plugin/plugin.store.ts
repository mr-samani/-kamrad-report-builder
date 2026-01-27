import { IPlugin } from '../../contracts/IPlugin';

export interface IPluginStore {
  save(plugin: IPlugin): void;
}

export class PluginStore {
  save(plugin: IPlugin) {
    console.log(plugin);
  }
}
