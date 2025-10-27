import { Injectable } from '@angular/core';
import { PageBuilderService } from './page-builder.service';
import { DynamicElementService } from './dynamic-element.service';
import { DefaultBlockClassName, DefaultBlockDirectives } from '../consts/defauls';
import { Page } from '../models/Page';

@Injectable({ providedIn: 'root' })
export class PreviewService {
  constructor(
    private dynamicElementService: DynamicElementService,
    private pageBuilderService: PageBuilderService
  ) {}
  openPreview(print = false) {
    let size = this.pageBuilderService.pageInfo.config.size;
    let orientation = this.pageBuilderService.pageInfo.config.orientation ?? 'portrait';
    // TODO popup size must be get from page size
    const popupWindow = window.open('', '_blank', print ? '' : 'width=800,height=600');
    if (!popupWindow) {
      alert('Popup blocked! Please allow popups for printing.');
      return;
    }
    const container = document.createElement('div');
    this.loadAllPages(container, this.pageBuilderService.pageInfo.pages).then((content) => {
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
        size: auto;
        margin: 15mm; 
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
      table.ngx-page-builder {
        width: 100%;
        border-spacing: 0;
        border: 0;
        margin: 0;
        padding: 0;
        height: 100%;
     }
     table.ngx-page-builder th {
      text-align: start;
     }
    </style>
  </head>
  <body>
      <div class="paper-inner">
        <table cellspacing="0" cellpadding="0" class="ngx-page-builder">
          <thead>
            <tr>
              <th class="pb-3">
                <page-header></page-header>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <!-- ---------------- body ---------------------- -->
                <div class="page-body">
                     ${content}
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                <page-footer></page-footer>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
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
    });
  }

  private loadAllPages(container: HTMLElement, pages: Page[]) {
    return new Promise((resolve, reject) => {
      try {
        for (let page of pages) {
          for (let item of page.bodyItems) {
            item.el = this.dynamicElementService.createElementFromHTML(item, container, {
              //directives: DefaultBlockDirectives,
              //   attributes: {
              //     class: DefaultBlockClassName,
              //   },
              //   events: {
              //      click: (ev: Event) => this.onSelectBlock(item, ev),
              //   },
            });
          }
        }
        resolve(container.innerHTML);
      } catch (error) {
        console.error('Error changing page:', error);
        reject(error);
      }
    });
  }
}
