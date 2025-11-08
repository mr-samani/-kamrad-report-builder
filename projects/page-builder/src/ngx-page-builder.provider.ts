import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  ENVIRONMENT_INITIALIZER,
  inject,
  InjectionToken,
  provideEnvironmentInitializer,
} from '@angular/core';
import { Router } from '@angular/router';
import { STORAGE_SERVICE } from './services/storage/token.storage';
import { LocalStorageService } from './services/storage/local.storage.service';
import { HttpStorageService } from './services/storage/http.storage.service';
import { JsonFileStorageService } from './services/storage/jsonfile.storage.service';
import { StorageType } from './services/storage/storage-type';
import { SourceItem } from './models/SourceItem';
import { SOURCE_ITEMS } from './consts/SOURCE_ITEMS';
import { LibConsts } from './consts/defauls';

export class PageBuilderConfiguration {
  storageType?: StorageType = StorageType.LocalStorage;
  customSources?: SourceItem[];
}

export const PAGE_BUILDER_CONFIGURATION = new InjectionToken<PageBuilderConfiguration>(
  'PAGE_BUILDER_CONFIGURATION'
);

export function providePageBuilder(config: PageBuilderConfiguration) {
  let storage: any;
  switch (config.storageType) {
    case StorageType.LocalStorage:
      storage = LocalStorageService;
      break;
    case StorageType.HttpClient:
      storage = HttpStorageService;
      break;
    case StorageType.JSONFile:
      storage = JsonFileStorageService;
      break;
    case undefined:
      storage = LocalStorageService;
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

  return makeEnvironmentProviders([
    {
      provide: STORAGE_SERVICE,
      useClass: storage,
    },
    {
      provide: PAGE_BUILDER_CONFIGURATION,
      useValue: config,
    },

    // 🧩 اضافه کردن route به router در زمان bootstrap
    provideDynamicRoute(),
  ]);
}

export const provideDynamicRoute = () =>
  provideEnvironmentInitializer(() => {
    const router = inject(Router);
    const existing = router.config.some((r) => r.path === 'ngx-page-preview');
    if (!existing) {
      router.resetConfig([
        ...router.config,
        {
          path: 'ngx-page-preview',
          loadComponent: () =>
            import('./lib/page-preview/page-preview.component').then(
              (m) => m.NgxPagePreviewComponent
            ),
        },
      ]);
    }
  });
