import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { providePageBuilder, StorageType } from '@ngx-page-builder';
import { CustomSources } from './custom-source/custom-sources';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    providePageBuilder({
      storageType: StorageType.LocalStorage,
      customSources: CustomSources,
    }),
  ],
};
