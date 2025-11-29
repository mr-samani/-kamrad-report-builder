import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DOCUMENT,
  ElementRef,
  Inject,
  Input,
  OnInit,
  Renderer2,
  viewChild,
} from '@angular/core';
import { PageBuilderDto } from '../../models/PageBuilderDto';
import { PageItem } from '../../models/PageItem';
import { DynamicElementService } from '../../services/dynamic-element.service';
import { DynamicDataStructure } from '../../models/DynamicData';
import { DynamicDataService } from '../../services/dynamic-data.service';
import { ActivatedRoute } from '@angular/router';
import { PREVIEW_CONSTS } from './PREVIEW_CONSTS';
import { waitForFontsToLoad, waitForRenderComplete } from '../../utiles/rendering';
import { Notify } from '../../extensions/notify';

@Component({
  selector: 'ngx-page-preview',
  templateUrl: './page-preview.component.html',
  styleUrls: ['../../styles/paper.scss', './page-preview.component.scss'],
  imports: [CommonModule],
})
export class NgxPagePreviewComponent implements OnInit, AfterViewInit {
  @Input('dynamicData') set setDynamicData(val: DynamicDataStructure[]) {
    this.dynamicDataService.dynamicData = val;
  }

  data?: PageBuilderDto;
  @Input('data') set setData(val: PageBuilderDto) {
    this.initializePreview(PageBuilderDto.fromJSON(val));
  }

  private paper = viewChild<ElementRef<HTMLElement>>('paper');
  isPrintPage = false;
  constructor(
    private dynamicElementService: DynamicElementService,
    private dynamicDataService: DynamicDataService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private doc: Document,
    private route: ActivatedRoute,
    private chdRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.isPrintPage = this.route.snapshot.queryParams['print'] === 'true';

    this.renderer.listen(window, 'beforeprint', this.onBeforePrint.bind(this));
  }

  onBeforePrint(event: Event): void {
    // لغو عملیات پیش‌فرض پرینت
    event.preventDefault();
    event.stopPropagation();
    this.isPrintPage = true;
    this.chdRef.detectChanges();
    setTimeout(() => {
      window.print();
    });
  }

  ngAfterViewInit(): void {
    window.opener?.postMessage({ type: PREVIEW_CONSTS.MESSAGE_TYPES.READY }, '*');
    // منتظر دریافت دیتا از parent
    window.addEventListener('message', (event) => {
      console.log('Received message from parent:', event.data);
      if (event.data?.type === PREVIEW_CONSTS.MESSAGE_TYPES.GET_DATA) {
        const data: { pageInfo: string; dynamicData: DynamicDataStructure[] } = event.data.payload;
        this.dynamicDataService.dynamicData = data.dynamicData;
        this.initializePreview(PageBuilderDto.fromJSON(JSON.parse(data.pageInfo)));
      }
    });

    // اعلام بسته شدن
    window.addEventListener('beforeunload', () => {
      window.opener?.postMessage({ type: PREVIEW_CONSTS.MESSAGE_TYPES.CLOSE }, '*');
    });
  }

  async initializePreview(data: PageBuilderDto) {
    this.cleanCanvas();

    this.data = data;
    this.loadPageData();
    this.setPrintStyle();

    await waitForFontsToLoad(PREVIEW_CONSTS.TIMEOUT_LOAD_FONTS);
    await waitForRenderComplete();
    this.chdRef.detectChanges();

    setTimeout(() => {
      window.opener?.postMessage({ type: PREVIEW_CONSTS.MESSAGE_TYPES.LOAD_ENDED }, '*');
    }, PREVIEW_CONSTS.TIMEOUT_READY);
  }

  createPageHtml(isLastPage: boolean): {
    header: HTMLElement;
    body: HTMLElement;
    footer: HTMLElement;
  } {
    if (!this.paper()) {
      throw new Error('Paper element not found');
    }
    const inner = this.doc.createElement('div');
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
    this.paper()!.nativeElement.appendChild(inner);
    if (!isLastPage) {
      const pageBreak = this.doc.createElement('div');
      pageBreak.classList.add('page-break');
      this.paper()!.nativeElement.appendChild(pageBreak);
    }
    return { header: Hth, body: Ctd, footer: Ftd };
  }
  async loadPageData() {
    try {
      if (!this.data) return;
      for (let page of this.data.pages) {
        const isLastPage = page === this.data.pages[this.data.pages.length - 1];
        const { header, body, footer } = this.createPageHtml(isLastPage);
        setTimeout(() => {
          const { headerItems, bodyItems, footerItems } = page;
          this.genElms(headerItems, header);
          this.genElms(bodyItems, body);
          this.genElms(footerItems, footer);
        }, 100);
      }
      this.dynamicDataService.replaceValues(this.data.pages);
    } catch (error) {
      console.error('Error loading page data:', error);
      Notify.error('Error loading page data: ' + error);
    }
  }
  private async genElms(list: PageItem[], container: HTMLElement, index = -1) {
    for (let i = 0; i < list.length; i++) {
      list[i].el = await this.createBlockElement(list[i], container, index);
    }
  }

  private cleanCanvas() {
    if (!this.data) return;
    for (let page of this.data.pages) {
      if (!page) continue;
      for (let item of page.bodyItems) {
        if (item.el) {
          this.dynamicElementService.destroy(item);
          this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
        }
      }
      for (let item of page.headerItems) {
        if (item.el) {
          this.dynamicElementService.destroy(item);
          this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
        }
      }
      for (let item of page.footerItems) {
        if (item.el) {
          this.dynamicElementService.destroy(item);
          this.renderer.removeChild(this.renderer.parentNode(item.el), item.el);
        }
      }
    }
    if (this.paper()?.nativeElement) {
      this.paper()!.nativeElement.innerHTML = '';
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

  private setPrintStyle() {
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
      }`;
    this.doc.head.appendChild(style);
  }
}
