import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../BaseComponent';
import { PageItem } from '../../models/PageItem';
import { Page } from '../../models/Page';
import { SvgIconDirective } from '../../directives/svg-icon.directive';

@Component({
  selector: 'block-layouts',
  templateUrl: './block-layouts.component.html',
  styleUrls: ['./block-layouts.component.scss'],
  standalone: true,
  imports: [CommonModule, SvgIconDirective],
})
export class BlockLayoutsComponent extends BaseComponent implements OnInit {
  currentPageHeaderItems: PageItem[] = [];
  currentPageFooterItems: PageItem[] = [];
  currentPageBodyItems: PageItem[] = [];
  constructor(injector: Injector) {
    super(injector);

    this.pageBuilderService.onPageChange$.subscribe((page) => {
      this.reloadLayout(page);
    });
  }

  ngOnInit() {}
  reloadLayout(page?: Page) {
    this.currentPageBodyItems = page ? [...page.bodyItems] : [];
    this.currentPageHeaderItems = page ? [...page.headerItems] : [];
    this.currentPageFooterItems = page ? [...page.footerItems] : [];
    console.log('Layout reloaded:', {
      header: this.currentPageHeaderItems,
      body: this.currentPageBodyItems,
      footer: this.currentPageFooterItems,
    });
  }

  onSelectBlock(ev: PointerEvent, item: PageItem) {
    this.pageBuilderService.onSelectBlock(item, ev);
  }
}
