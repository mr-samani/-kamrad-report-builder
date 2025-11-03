import { CommonModule } from '@angular/common';
import {
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

@Component({
  selector: 'ngx-page-preview',
  templateUrl: './page-preview.component.html',
  styleUrls: ['../../styles/paper.scss', './page-preview.component.scss'],
  imports: [CommonModule],
})
export class NgxPagePreviewComponent implements OnInit {
  @Input('dynamicData') set setDynamicData(val: DynamicDataStructure) {
    this.dynamicDataService.dynamicData = val;
  }

  data = new PageBuilderDto();
  @Input('data') set setData(val: PageBuilderDto) {
    this.cleanCanvas();
    this.data = PageBuilderDto.fromJSON(val);
    this.loadPageData();
    this.setPrintStyle();
  }

  private paper = viewChild<ElementRef<HTMLElement>>('paper');
  constructor(
    private dynamicElementService: DynamicElementService,
    private dynamicDataService: DynamicDataService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit() {}

  createPageHtml(): { header: HTMLElement; body: HTMLElement; footer: HTMLElement } {
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
    const pageBreak = this.doc.createElement('div');
    pageBreak.classList.add('page-break');
    this.paper()!.nativeElement.appendChild(pageBreak);
    return { header: Hth, body: Ctd, footer: Ftd };
  }
  async loadPageData() {
    try {
      if (!this.data) return;
      for (let page of this.data.pages) {
        const { header, body, footer } = this.createPageHtml();
        const { headerItems, bodyItems, footerItems } = page;
        headerItems.map((m) => (m.el = this.createElement(m, header)));
        bodyItems.map((m) => (m.el = this.createElement(m, body)));
        footerItems.map((m) => (m.el = this.createElement(m, footer)));
      }
      this.dynamicDataService.replaceValues(this.data.pages);
    } catch (error) {
      console.error('Error loading page data:', error);
      alert('Error loading page data: ' + error);
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

    this.paper()!.nativeElement.innerHTML = '';
  }

  private createElement(item: PageItem, container: HTMLElement) {
    return this.dynamicElementService.createElementFromHTML(item, container);
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
        size: ${size};
        orientation: ${orientation}; 
      }`;
    this.doc.head.appendChild(style);
  }
}
