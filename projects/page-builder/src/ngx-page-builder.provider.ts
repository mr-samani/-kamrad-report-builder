import { EnvironmentProviders, InjectionToken } from '@angular/core';
import { LocalStorageService } from './services/storage/local.storage.service';
import { StorageType } from './services/storage/storage-type';
import { HttpStorageService } from './services/storage/http.storage.service';
import { STORAGE_SERVICE } from './services/storage/token.storage';
import { SOURCE_ITEMS, SourceItem } from './models/SourceItem';
import { LibConsts } from './consts/defauls';

export class PageBuilderConfiguration {
  storageType: StorageType = StorageType.LocalStorage;
  customSources?: SourceItem[];
}
export const PAGE_BUILDER_CONFIGURATION = new InjectionToken<PageBuilderConfiguration>(
  'PAGE_BUILDER_CONFIGURATION'
);

export function providePageBuilder(config: PageBuilderConfiguration) {
  let providers: EnvironmentProviders[] = [];
  let storage;
  switch (config.storageType) {
    case StorageType.LocalStorage:
      storage = LocalStorageService;
      break;
    case StorageType.HttpClient:
      storage = HttpStorageService;
      break;
    default:
      throw new Error('Invalid storage type');
  }
  if (!config.customSources || !Array.isArray(config.customSources)) {
    config.customSources = [];
  }
  LibConsts.SourceItemList = [
    ...SOURCE_ITEMS,
    ...(config.customSources ?? []).map((item) => new SourceItem(item)),
  ];
  return [
    {
      provide: STORAGE_SERVICE,
      useClass: storage,
      multi: false,
    },
    {
      provide: PAGE_BUILDER_CONFIGURATION,
      useValue: config,
    },
  ];
}
