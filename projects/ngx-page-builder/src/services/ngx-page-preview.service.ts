import {
  Renderer2,
  Inject,
  DOCUMENT,
  ChangeDetectorRef,
  Injectable,
  RendererFactory2,
} from '@angular/core';
import { DynamicDataService } from './dynamic-data.service';
import { DynamicElementService } from './dynamic-element.service';
import { PageBuilderDto } from '../models/PageBuilderDto';
import { LibConsts } from '../consts/defauls';
import { waitForFontsToLoad, waitForRenderComplete } from '../utiles/rendering';
import { Notify } from '../extensions/notify';
import { PageItem } from '../models/PageItem';
import { IPagebuilderOutput } from '../contracts/IPageBuilderOutput';
import { IPageItem } from '../contracts/IPageItem';

@Injectable({ providedIn: 'root' })
export class NgxPagePreviewService {
  containerClassName = '';
  pageContainer?: HTMLElement;
  data?: IPagebuilderOutput;
  private previewWindow?: Window | null;
  private renderer!: Renderer2;
  constructor(
    private dynamicElementService: DynamicElementService,
    private dynamicDataService: DynamicDataService,

    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private doc: Document,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * open preview window from page builder
   */
  async openPreview(data: IPagebuilderOutput, print = false) {
    this.data = data;
    this.pageContainer = this.doc.createElement('div');
    this.cleanCanvas();
    await this.loadPageData();
    // ساخت URL برای preview route
    const previewUrl = this.createBlobUrl();
    // باز کردن window جدید با URL
    this.previewWindow = window.open(
      previewUrl,
      '_blank',
      print ? '' : 'width=900,height=700,resizable=yes,scrollbars=yes',
    );
    if (!this.previewWindow) {
      Notify.error('Popup blocked! Please allow popups for this site.');
      return;
    }

    if (print) {
      // TODO check page loaded end
      setTimeout(() => {
        this.previewWindow?.print();
        this.previewWindow?.close();
        this.previewWindow = null;
        this.cleanCanvas();
      }, 1000);
    }
  }

  /**
   * initialize preview in preview component
   */
  async initializePreview(pageContainer: HTMLElement, data: IPagebuilderOutput) {
    this.pageContainer = pageContainer;
    this.cleanCanvas();
    this.data = data;
    await this.loadPageData();
    this.setStyle();
    if (LibConsts.viewMode == 'PrintPage') {
      this.containerClassName = `paper ${this.data.config.size} ${this.data.config.orientation}`;
    } else {
      this.containerClassName = `web-page-view`;
    }

    await waitForFontsToLoad();
    await waitForRenderComplete();
  }

  //--------------------------------------------------------------------------

  private createBlobUrl(): string {
    if (!this.pageContainer || !this.data) return '';
    const { size, orientation } = this.data.config;

    const w = this.doc.createElement('html');
    const h = this.doc.createElement('head');
    h.innerHTML = ` <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Preview</title>
  <style>
      body {
        margin: 0;
        padding: 0;
        overflow: auto;
      }
       @page {
        margin: 0px 0px 20px 0px;
        size: ${size}  ${orientation.toLowerCase()};
        orientation: ${orientation}; 
      }
      ${this.data.style}
      }
  </style>`;
    const b = this.doc.createElement('body');
    b.appendChild(this.pageContainer);
    w.appendChild(h);
    w.appendChild(b);

    const blob = new Blob([w.innerHTML], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }

  private async cleanCanvas() {
    if (!this.data || !this.pageContainer) return;
    const pages = this.data.data;
    for (let page of pages) {
      if (!page) continue;
      for (let item of page.bodyItems) {
        if (item.el) {
          await this.dynamicElementService.destroy(item);
          this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
        }
      }
      for (let item of page.headerItems) {
        if (item.el) {
          await this.dynamicElementService.destroy(item);
          this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
        }
      }
      for (let item of page.footerItems) {
        if (item.el) {
          await this.dynamicElementService.destroy(item);
          this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
        }
      }
    }
    this.pageContainer.innerHTML = '';
  }
  private async loadPageData() {
    try {
      if (!this.data) return;
      const pages = this.data.data;
      for (let page of pages) {
        const isLastPage = page === pages[pages.length - 1];
        const { header, body, footer } = this.createPageHtml(isLastPage);
        // setTimeout(() => {
        const { headerItems, bodyItems, footerItems } = page;
        this.genElms(headerItems, header);
        this.genElms(bodyItems, body);
        this.genElms(footerItems, footer);
        // }, 100);
      }
      this.dynamicDataService.replaceValues(pages);
    } catch (error) {
      console.error('Error loading page data:', error);
      Notify.error('Error loading page data: ' + error);
    }
  }

  createPageHtml(isLastPage: boolean): {
    header: HTMLElement | null;
    body: HTMLElement | null;
    footer: HTMLElement | null;
  } {
    if (!this.pageContainer) {
      throw new Error('Paper element not found');
    }
    let header: HTMLElement | null = null;
    let footer: HTMLElement | null = null;
    let body: HTMLElement | null = null;
    const inner = this.doc.createElement('div');
    if (LibConsts.viewMode == 'PrintPage') {
      inner.classList.add('paper-inner');
      const mainTable = this.doc.createElement('table');
      mainTable.classList.add('ngx-page-table');
      mainTable.setAttribute('cellspacing', '0');
      mainTable.setAttribute('cellpadding', '0');
      const thead = this.doc.createElement('thead');
      const tr = this.doc.createElement('tr');
      thead.appendChild(tr);
      const Hth = this.doc.createElement('th');
      Hth.className = 'repeatable-header';
      tr.appendChild(Hth);
      const tbody = this.doc.createElement('tbody');
      const Ctr = this.doc.createElement('tr');
      tbody.appendChild(Ctr);
      const Ctd = this.doc.createElement('td');
      Ctr.appendChild(Ctd);
      const tfoot = this.doc.createElement('tfoot');
      const Ftr = this.doc.createElement('tr');
      tfoot.appendChild(Ftr);
      const Ftd = this.doc.createElement('td');
      Ftr.appendChild(Ftd);
      mainTable.appendChild(thead);
      mainTable.appendChild(tbody);
      mainTable.appendChild(tfoot);
      inner.appendChild(mainTable);

      if (!isLastPage) {
        const pageBreak = this.doc.createElement('div');
        pageBreak.classList.add('page-break');
        this.pageContainer.appendChild(pageBreak);
      }

      header = Hth;
      footer = Ftd;
      body = Ctd;
    } else {
      body = inner;
    }
    this.pageContainer.appendChild(inner);
    return { header, body, footer };
  }

  private async genElms(list: IPageItem[], container: HTMLElement | null, index = -1) {
    if (!container) return;
    for (let i = 0; i < list.length; i++) {
      list[i].el = await this.createBlockElement(list[i], container, index);
    }
  }

  private async createBlockElement(item: IPageItem, container: HTMLElement, index = -1) {
    let el = await this.dynamicElementService.createBlockElement(
      container,
      index,
      item as PageItem,
    );
    if (item.children && item.children.length > 0 && el) {
      for (const child of item.children) {
        await this.createBlockElement(child, el);
      }
    }
    return el;
  }

  private setStyle() {
    if (!this.data) return;
    const { size, orientation } = this.data.config;
    let finded = this.doc.querySelector('style#NgxPageBuilderPrint');
    if (finded) {
      finded.remove();
    }
    const style = this.doc.createElement('style');
    style.id = 'NgxPageBuilderPrint';
    style.innerHTML = `
      @page {
        margin: 0px 0px 20px 0px;
        size: ${size}  ${orientation.toLowerCase()};
        orientation: ${orientation}; 
      }
    ${this.data.style}
  }`;
    this.doc.head.appendChild(style);
  }
}
