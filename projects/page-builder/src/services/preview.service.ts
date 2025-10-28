import { Injectable } from '@angular/core';
import { PageBuilderService } from './page-builder.service';
import { DynamicElementService } from './dynamic-element.service';
import { Page } from '../models/Page';

@Injectable({ providedIn: 'root' })
export class PreviewService {
  constructor(
    private dynamicElementService: DynamicElementService,
    private pageBuilderService: PageBuilderService
  ) {}
  async openPreview(print = false) {
    let size = this.pageBuilderService.pageInfo.config.size;
    let orientation = this.pageBuilderService.pageInfo.config.orientation ?? 'portrait';
    // TODO popup size must be get from page size
    const popupWindow = window.open('', '_blank', print ? '' : 'width=800,height=600');
    if (!popupWindow) {
      alert('Popup blocked! Please allow popups for printing.');
      return;
    }

    let content = '';
    for (let page of this.pageBuilderService.pageInfo.pages) {
      const hContainer = document.createElement('div');
      const bContainer = document.createElement('div');
      const fContainer = document.createElement('div');
      let data = await this.loadPageData(hContainer, bContainer, fContainer, page);
      content += `
      <div class="paper-inner">
        <table cellspacing="0" cellpadding="0" class="ngx-page-table">
          <thead>
            <tr>
              <th class="pb-3">
                ${data.header}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <!-- ---------------- body ---------------------- -->
                <div class="page-body">
                     ${data.body}
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                ${data.footer}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>`;
      content += `<div class="page-break"></div>`;
    }
    try {
      // محتوای کامل HTML برای پرینت
      const fullHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
    <title>Print Preview</title>
    <style>
      @page {   
        margin: 0px 0px 20px 0px; 
        size: ${size};
        orientation: ${orientation}; 
      }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html, body { 
        height: 100%; width: 100%; 
        margin: 0;
        padding: 0;
     }
     .paper-inner {
        min-height: inherit;
      }
      table.ngx-page-table {
        width: 100%;
        border-spacing: 0;
        border: 0;
        margin: 0;
        padding: 0;
        height: 100%;
     }
     table.ngx-page-table th {
      text-align: start;
     }
    .page-break { 
      page-break-after: always !important;
    }
    </style>
  </head>
  <body>
      ${content}
  </body>
</html>`;

      // نوشتن HTML در پنجره جدید
      popupWindow.document.open();
      popupWindow.document.write(fullHtml);
      if (print) {
        popupWindow.document.close();
        // صبر کن تا محتوای DOM آماده بشه
        const doPrint = () => {
          try {
            popupWindow.focus();
            // مخصوص iOS Safari: بدون تأخیر ممکنه print نکنه
            setTimeout(() => {
              popupWindow.print();
              // در اکثر مرورگرها بهتره بعد از اندکی تأخیر بسته بشه
              // setTimeout(() => {
              popupWindow.close();
              //  }, 500);
            }, 300);
          } catch (err) {
            console.error('Print error:', err);
          }
        }; // اگر مرورگر onload پشتیبانی می‌کنه
        if ('onload' in popupWindow) {
          popupWindow.onload = doPrint;
        } else {
          // fallback: صبر کوتاه برای آماده شدن محتوا
          setTimeout(doPrint, 600);
        }
      }
    } catch (err) {
      console.error('Failed to open preview window:', err);
    }
  }

  private loadPageData(
    hContainer: HTMLElement,
    bContainer: HTMLElement,
    fContainer: HTMLElement,
    page: Page
  ) {
    return new Promise<{ header: string; body: string; footer: string }>((resolve, reject) => {
      try {
        page.headerItems.map(
          (m) => (m.el = this.dynamicElementService.createElementFromHTML(m, hContainer))
        );
        page.bodyItems.map(
          (m) => (m.el = this.dynamicElementService.createElementFromHTML(m, bContainer))
        );
        page.footerItems.map(
          (m) => (m.el = this.dynamicElementService.createElementFromHTML(m, fContainer))
        );

        resolve({
          header: hContainer.innerHTML,
          body: bContainer.innerHTML,
          footer: fContainer.innerHTML,
        });
      } catch (error) {
        console.error('Error changing page:', error);
        reject(error);
      }
    });
  }
}
