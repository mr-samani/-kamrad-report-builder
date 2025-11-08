import {
  Injectable,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  ApplicationRef,
  Injector,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject } from '@angular/core';
import { PageBuilderService } from './page-builder.service';
import { preparePageDataForSave } from './storage/prepare-page-builder-data';
import { PREVIEW_CONSTS } from '../lib/page-preview/PREVIEW_CONSTS';

@Injectable({ providedIn: 'root' })
export class PreviewService {
  private previewWindow?: Window | null;
  mustBePrint = false;
  constructor(
    private pageBuilderService: PageBuilderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async openPreview(print = false) {
    this.mustBePrint = print === true;
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('Preview only works in browser');
      return;
    }
    // ساخت URL برای preview route
    const previewUrl = this.createPreviewUrl();
    // باز کردن window جدید با URL
    this.previewWindow = window.open(
      previewUrl,
      '_blank',
      print ? '' : 'width=900,height=700,resizable=yes,scrollbars=yes'
    );

    if (!this.previewWindow) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }

    // گوش دادن به message از preview window
    this.listenToPreviewMessages();
  }

  private createPreviewUrl(): string {
    // ساخت URL با base URL فعلی اپلیکیشن
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname != '/' ? window.location.pathname : '';
    const url = `${baseUrl}${currentPath}/ngx-page-preview?preview-builder=true&timestamp=${Date.now()}`;
    console.log('Preview URL:', url);
    // استفاده از query param برای جلوگیری از تداخل با روتر کاربر
    return url;
  }

  private listenToPreviewMessages() {
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'NGX_PAGE_PREVIEW_READY') {
        console.log('Preview window is ready');
        const sanitized = preparePageDataForSave(this.pageBuilderService.pageInfo);
        const json = JSON.stringify(sanitized, null, 2);

        this.previewWindow?.postMessage(
          {
            type: PREVIEW_CONSTS.MESSAGE_TYPES.GET_DATA,
            payload: json,
          },
          '*'
        );
      } else if (event.data?.type === PREVIEW_CONSTS.MESSAGE_TYPES.LOAD_ENDED) {
        console.log('Preview load ended');
        if (this.mustBePrint) {
          this.previewWindow?.print();
        }
      } else if (event.data?.type === PREVIEW_CONSTS.MESSAGE_TYPES.CLOSE) {
        this.previewWindow?.close();
        this.previewWindow = null;
        window.removeEventListener('message', messageHandler);
      }
    };

    window.addEventListener('message', messageHandler);
  }
}
