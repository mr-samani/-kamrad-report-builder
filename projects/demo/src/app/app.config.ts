import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { providePageBuilder, STORAGE_SERVICE, StorageType } from '@ngx-page-builder';
import { CustomSources } from './custom-source/custom-sources';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessagePackStorageService } from './custom-storage/msgpack.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    providePageBuilder({
      storageType: StorageType.JSONFile,
      customSources: CustomSources,
    }),
    provideAnimationsAsync(),
    {
      provide: STORAGE_SERVICE,
      useClass: MessagePackStorageService,
    },
  ],
};
