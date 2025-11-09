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
import { provideHighcharts } from 'highcharts-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    providePageBuilder({
      customSources: CustomSources,
    }),
    provideAnimationsAsync(),
    // {
    //   provide: STORAGE_SERVICE,
    //   useClass: MessagePackStorageService,
    // },
    provideHighcharts({
      // Optional: Define the Highcharts instance dynamically
      instance: () => import('highcharts'),

      // Global chart options applied across all charts
      options: {
        title: {
          style: {
            color: 'tomato',
          },
        },
        legend: {
          enabled: false,
        },
      },

      // Include Highcharts additional modules (e.g., exporting, accessibility) or custom themes
      modules: () => {
        return [import('highcharts/esm/modules/exporting')];
      },
    }),
  ],
};
