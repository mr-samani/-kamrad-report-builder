import { CommonModule } from '@angular/common';
import { Component, effect, Injector, OnInit } from '@angular/core';
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
    effect(() => {
      const activeItem = this.pageBuilder.activeEl();
      this.openToParent(activeItem);
    });
    this.pageBuilder.onPageChange$.subscribe((page) => {
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
    this.pageBuilder.onSelectBlock(item, ev);
  }

  openToParent(item?: PageItem) {
    if (!item) return;
    (item as any).isOpen = true;
    if (item.parent) {
      this.openToParent(item.parent);
    }
  }
}
