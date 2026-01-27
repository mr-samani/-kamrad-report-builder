import { IPlugin } from '../../contracts/IPlugin';

export interface IPluginStore {
  save(plugin: IPlugin): void;
  getAllPlugins(take: number, skip: number, filter: string): Promise<IPlugin[]>;
}

export class PluginStore {
  private _plugins: IPlugin[] = [];

  save(plugin: IPlugin) {
    console.log(plugin);
  }

  getAllPlugins(take: number, skip: number, filter: string): Promise<IPlugin[]> {
    return new Promise<IPlugin[]>((resolve, reject) => {
      let list = this._plugins.filter((x) => x.name.includes(filter)).slice(skip, skip + take);
      resolve(list);
    });
  }
}
