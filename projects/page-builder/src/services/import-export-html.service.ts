import { isPlatformBrowser } from '@angular/common';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Notify } from '../extensions/notify';
import { preparePageDataForSave } from './storage/prepare-page-builder-data';
import { PageBuilderService } from './page-builder.service';
import { PREVIEW_CONSTS } from '../lib/page-preview/PREVIEW_CONSTS';
import { DynamicDataService } from './dynamic-data.service';
import { downloadFile } from '../utiles/file';

@Injectable()
export class ImportExportHtmlService {
  private previewWindow?: Window | null;
  constructor(
    private router: Router,
    private pageBuilder: PageBuilderService,
    private dynamicDataService: DynamicDataService,
  ) {}
  exportHtml() {
    // ساخت URL برای preview route
    const previewUrl = this.createPreviewUrl();

    // باز کردن window جدید با URL
    this.previewWindow = window.open(previewUrl, '_blank');
    if (!this.previewWindow) {
      Notify.error('Popup blocked! Please allow popups for this site.');
      return;
    }
    this.listenToPreviewMessages()
      .then((html: string) => {
        debugger;
        downloadFile(html, 'export.html', 'plain/text');
      })
      .catch((err) => {
        Notify.error('Can not export!');
      });
  }

  private createPreviewUrl(): string {
    // ساخت URL با base URL فعلی اپلیکیشن
    // const baseUrl = window.location.origin;
    // const currentPath = window.location.pathname != '/' ? window.location.pathname : '';
    // const url = `${baseUrl}${currentPath}/ngx-page-preview?preview-builder=true&timestamp=${Date.now()}`;

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/ngx-page-preview'], {
        queryParams: {
          'preview-builder': true,
          timestamp: Date.now(),
        },
      }),
    );
    console.log('Preview URL:', url);
    return url;
  }

  private listenToPreviewMessages() {
    return new Promise<string>((resolve, reject) => {
      try {
        const messageHandler = (event: MessageEvent) => {
          if (event.data?.type === 'NGX_PAGE_PREVIEW_READY') {
            console.log('Preview window is ready');
            const sanitized = preparePageDataForSave(this.pageBuilder.pageInfo);
            this.previewWindow?.postMessage(
              {
                type: PREVIEW_CONSTS.MESSAGE_TYPES.GET_DATA,
                payload: {
                  pageInfo: JSON.stringify(sanitized),
                  dynamicData: this.dynamicDataService.dynamicData,
                },
              },
              '*',
            );
          } else if (event.data?.type === PREVIEW_CONSTS.MESSAGE_TYPES.LOAD_ENDED) {
            console.log('Preview load ended');

            resolve(this.previewWindow?.document?.documentElement?.outerHTML ?? '');
            this.previewWindow?.close();
            this.previewWindow = null;
            window.removeEventListener('message', messageHandler);
          } else if (event.data?.type === PREVIEW_CONSTS.MESSAGE_TYPES.CLOSE) {
            this.previewWindow?.close();
            this.previewWindow = null;
            window.removeEventListener('message', messageHandler);
          }
        };

        window.addEventListener('message', messageHandler);
      } catch (error) {
        reject(error);
      }
    });
  }
}
