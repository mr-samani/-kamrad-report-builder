import { DOCUMENT, Inject, Injectable } from '@angular/core';
import { Notify } from '../../extensions/notify';
import { PageBuilderService } from '../page-builder.service';
import { DynamicDataService } from '../dynamic-data.service';
import { downloadFile } from '../../utiles/file';
import { DynamicElementService } from '../dynamic-element.service';
import { PageItem } from '../../models/PageItem';

@Injectable()
export class ExportHtmlService {
  constructor(
    private pageBuilder: PageBuilderService,
    private dynamicDataService: DynamicDataService,
    private dynamicElementService: DynamicElementService,

    @Inject(DOCUMENT) private doc: Document,
  ) {}
  exportHtml() {
    this.loadPageData()
      .then((html: string) => {
        downloadFile(html, 'export.html', 'plain/text');
      })
      .catch((err) => {
        Notify.error('Can not export!');
      });
  }

  private async loadPageData() {
    return new Promise<string>(async (resolve, reject) => {
      try {
        if (!this.pageBuilder.pageInfo) return;
        const html = this.createPageHtml();
        for (let page of this.pageBuilder.pageInfo.pages) {
          const { header, body, footer } = {
            header: document.createElement('div'),
            body: document.createElement('div'),
            footer: document.createElement('div'),
          };
          const { headerItems, bodyItems, footerItems } = page;
          await this.genElms(headerItems, header);
          await this.genElms(bodyItems, body);
          await this.genElms(footerItems, footer);

          html.appendChild(header);
          html.appendChild(body);
          html.appendChild(footer);
        }
        this.dynamicDataService.replaceValues(this.pageBuilder.pageInfo.pages);
        resolve(html.outerHTML);
      } catch (error) {
        console.error('Error loading page data:', error);
        Notify.error('Error loading page data: ' + error);
        reject(error);
      }
    });
  }
  private async genElms(list: PageItem[], container: HTMLElement, index = -1) {
    for (let i = 0; i < list.length; i++) {
      list[i].el = await this.createBlockElement(list[i], container, index);
    }
  }
  private async createBlockElement(item: PageItem, container: HTMLElement, index = -1) {
    let el = await this.dynamicElementService.createBlockElement(container, index, item);
    if (item.children && item.children.length > 0 && el) {
      for (const child of item.children) {
        await this.createBlockElement(child, el);
      }
    }
    return el;
  }
  createPageHtml(): HTMLElement {
    const html = this.doc.createElement('html');
    const body = this.doc.createElement('body');
    const head = this.doc.createElement('head');
    head.innerHTML = `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NgxPageBuilder</title>
    <style>
        body{
            margin:0;
            padding:0;
        }

    </style>
    `;
    html.appendChild(head);
    html.appendChild(body);

    return html;
  }
}
