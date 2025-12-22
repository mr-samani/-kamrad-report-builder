import { makeEnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { Router } from '@angular/router';
import { STORAGE_SERVICE } from './services/storage/token.storage';
import { LocalStorageService } from './services/storage/local.storage.service';
import { HttpStorageService } from './services/storage/http.storage.service';
import { JsonFileStorageService } from './services/storage/jsonfile.storage.service';
import { StorageType } from './services/storage/storage-type';
import { SourceItem } from './models/SourceItem';
import { SOURCE_ITEMS } from './sources/SOURCE_ITEMS';
import { LibConsts } from './consts/defauls';
import {
  PageBuilderConfiguration,
  PageBuilderToolbarConfig,
} from './models/PageBuilderConfiguration';
import { PAGE_BUILDER_CONFIGURATION } from './models/tokens';
import { NGX_PAGE_BUILDER_HTML_EDITOR } from './services/html-editor/token.html-editor';
import { NGX_PAGE_BUILDER_FILE_PICKER } from './services/file-picker/token.filepicker';

export function providePageBuilder(config: PageBuilderConfiguration) {
  LibConsts.enableHistory = config.enableHistory === true;
  if (config.toolbarConfig) {
    LibConsts.toolbarConfig = { ...new PageBuilderToolbarConfig(), ...config.toolbarConfig };
  }
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
  // check duplicates
  const ids = new Set();
  for (const item of LibConsts.SourceItemList) {
    if (!item.customComponent) continue;
    if (ids.has(item.customComponent.componentKey)) {
      throw new Error(
        'NgxPageBuilder: ' +
          `Custom component has Duplicate componentKey: ${item.customComponent.componentKey}`,
      );
    }
    ids.add(item.customComponent.componentKey);
  }

  return makeEnvironmentProviders([
    {
      provide: STORAGE_SERVICE,
      useClass: storage,
    },
    {
      provide: PAGE_BUILDER_CONFIGURATION,
      useValue: config,
    },
    {
      provide: NGX_PAGE_BUILDER_HTML_EDITOR,
      useValue: '',
    },
    {
      provide: NGX_PAGE_BUILDER_FILE_PICKER,
      useValue: '',
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
              (m) => m.NgxPagePreviewComponent,
            ),
        },
      ]);
    }
  });
