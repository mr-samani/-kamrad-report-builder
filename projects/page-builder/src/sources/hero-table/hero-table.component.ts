import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  Inject,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ComponentDataContext } from '../../models/ComponentDataContext';
import { COMPONENT_DATA } from '../../models/tokens';
import { IPageItem, PageItem } from '../../models/PageItem';
import { Subscription } from 'rxjs';
import { PageBuilderService } from '../../services/page-builder.service';
import { DynamicElementService } from '../../services/dynamic-element.service';
import { DynamicDataStructure } from '../../models/DynamicData';
import { DynamicDataService } from '../../services/dynamic-data.service';
import { NgxDragDropKitModule } from 'ngx-drag-drop-kit';
import { CommonModule } from '@angular/common';
import { BlockHelper } from '../../helper/BlockHelper';
import { cloneDeep } from '../../utiles/clone-deep';
import { BlockSelectorComponent } from '../../components/block-selector/block-selector.component';
import { SvgIconDirective } from '../../directives/svg-icon.directive';

declare type TableSection = 'thead' | 'tbody' | 'tfoot';

@Component({
  selector: 'hero-table',
  templateUrl: './hero-table.component.html',
  styleUrls: ['./hero-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxDragDropKitModule, CommonModule, SvgIconDirective],
  encapsulation: ViewEncapsulation.None,
})
export class HeroTableComponent implements OnInit, AfterViewInit {
  pageItem!: PageItem;
  subscription: Subscription;
  @ViewChild('tableContainer') tableContainer!: ElementRef<HTMLTableElement>;
  @ViewChild('wrapper') wrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('toolbar') toolbar!: ElementRef<HTMLDivElement>;

  selectedCell?: {
    block: PageItem;
    section: TableSection;
    rowIndex: number;
    colIndex: number;
  };
  _th: IPageItem = {
    tag: 'th',
    disableDelete: true,
    disableMovement: true,
    lockMoveInnerChild: true,
    canHaveChild: true,
    options: {
      attributes: {
        class: 'pbt-cell',
      },
    },
  };
  _td: IPageItem = {
    tag: 'td',
    disableDelete: true,
    disableMovement: true,
    lockMoveInnerChild: true,
    canHaveChild: true,
    options: {
      attributes: {
        class: 'pbt-cell',
      },
    },
  };

  _headRow: IPageItem = {
    tag: 'tr',
    disableDelete: true,
    canHaveChild: false,
    lockMoveInnerChild: true,
    disableMovement: true,
    children: [cloneDeep(this._th), cloneDeep(this._th), cloneDeep(this._th)],
  };

  _bodyRow: IPageItem = {
    tag: 'tr',
    disableDelete: true,
    canHaveChild: false,
    lockMoveInnerChild: true,
    disableMovement: true,
    children: [cloneDeep(this._td), cloneDeep(this._td), cloneDeep(this._td)],
  };

  _template: IPageItem = {
    tag: 'table',
    options: {
      attributes: {
        class: 'ngx-hero-table',
      },
    },
    children: [
      {
        tag: 'thead',
        disableDelete: true,
        canHaveChild: false,
        lockMoveInnerChild: true,
        disableMovement: true,
        children: [cloneDeep(this._headRow)],
      },
      {
        tag: 'tbody',
        disableDelete: true,
        canHaveChild: false,
        lockMoveInnerChild: true,
        disableMovement: true,
        children: [
          cloneDeep(this._bodyRow),
          cloneDeep(this._bodyRow),
          cloneDeep(this._bodyRow),
          cloneDeep(this._bodyRow),
        ],
      },
      {
        tag: 'tfoot',
        disableDelete: true,
        canHaveChild: false,
        lockMoveInnerChild: true,
        disableMovement: true,
        children: [],
      },
    ],
  };

  constructor(
    @Inject(COMPONENT_DATA) private context: ComponentDataContext<any>,
    private chdRef: ChangeDetectorRef,
    private pageBuilderService: PageBuilderService,
    private dynamicElementService: DynamicElementService,
    private dynamicDataService: DynamicDataService,
    private renderer: Renderer2,
  ) {
    this.subscription = this.context.onChange.subscribe((data) => {
      this.chdRef.detectChanges();
    });
    effect(() => {
      const selectedBlock = this.pageBuilderService.activeEl();
      this.onSelectCell(selectedBlock);
    });
  }

  ngOnInit() {
    if (!this.pageItem.children || this.pageItem.children.length === 0) {
      this.pageItem.children = [new PageItem(this._template, this.pageItem)];
    }
  }

  ngAfterViewInit(): void {
    this.generate();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async generate() {
    if (!this.pageItem || !this.pageItem.children || this.pageItem.children.length === 0) return;
    this.clearContainer();

    await this.pageBuilderService.createBlockElement(
      this.pageItem.children[0],
      this.tableContainer.nativeElement,
    );
  }
  private clearContainer() {
    this.dynamicElementService.destroyBatch(this.pageItem.children);
  }

  onSelectCell(selectedBlock: PageItem | undefined) {
    try {
      if (!selectedBlock) {
        throw new Error('No selected block');
      }

      const cell = BlockHelper.findParentByTag(
        selectedBlock,
        ['td', 'th'],
        ['tbody', 'thead', 'tfoot'],
      );
      if (!cell) {
        throw new Error('No cell found');
      }
      const row = BlockHelper.findParentByTag(cell, ['tr'], ['tbody', 'thead', 'tfoot']);
      if (!row) {
        throw new Error('No row found');
      }
      const section = row.parent?.tag as TableSection;
      const rowIndex = row.parent?.children.indexOf(row) ?? -1;
      const colIndex = row.children.indexOf(cell) ?? -1;

      this.selectedCell = { section, rowIndex, colIndex, block: selectedBlock };
      this.updateToolbarPosition();
      this.chdRef.detectChanges();
    } catch (error) {
      this.selectedCell = undefined;
      this.chdRef.detectChanges();
    }
  }

  getRowColIndex(): { rowIndex: number; colIndex: number } {
    if (this.selectedCell) {
      return { rowIndex: this.selectedCell.rowIndex, colIndex: this.selectedCell.colIndex };
    }
    // return last cell info
    const body = this.pageItem.children.find((x) => x.tag == 'tbody');
    const rowIndex = body?.children?.length ?? 0;
    const colIndex = body?.children?.[rowIndex]?.children?.length ?? 0;
    return { rowIndex, colIndex };
  }

  async addRow(ev: Event, after = false) {
    ev.stopPropagation();
    const { rowIndex, colIndex } = this.getRowColIndex();
    const section = this.selectedCell?.section ?? 'tbody';
    const table = this.pageItem.children[0];
    const theadOrTbody = table.children?.find((x) => x.tag === section);
    if (!theadOrTbody) return;
    const row = theadOrTbody.children[rowIndex].clone(theadOrTbody);

    for (let cell of row.children) {
      cell.children = [];
    }
    theadOrTbody.children?.splice(after ? rowIndex + 1 : rowIndex, 0, row);

    await this.pageBuilderService.createBlockElement(
      row,
      theadOrTbody.el!,
      after ? rowIndex + 1 : rowIndex,
    );
    this.update();
  }
  async deleteRow(ev: Event) {
    ev.stopPropagation();
    const { rowIndex, colIndex } = this.getRowColIndex();
    const section = this.selectedCell?.section ?? 'tbody';
    const table = this.pageItem.children[0];
    const theadOrTbody = table.children?.find((x) => x.tag === section);
    if (!theadOrTbody) return;
    const row = theadOrTbody.children[rowIndex];
    this.dynamicElementService.destroy(row);
    theadOrTbody.children.splice(rowIndex, 1);
    this.pageBuilderService.deSelectBlock();
    this.update();
  }

  //_________________________________________________________

  async addColumn(ev: Event, after = false) {
    ev.stopPropagation();
    const { rowIndex, colIndex } = this.getRowColIndex();
    const table = this.pageItem.children[0];
    if (!table) return;
    for (let inner of table.children) {
      for (let row of inner.children) {
        let td = inner.tag == 'thead' ? this._th : this._td;
        td = PageItem.fromJSON(td);
        td.parent = row;
        row.children.splice(after ? colIndex + 1 : colIndex, 0, td as PageItem);
      }
    }

    this.generate();
    this.update();
  }
  async deleteColumn(ev: Event) {
    ev.stopPropagation();
    const { rowIndex, colIndex } = this.getRowColIndex();
    const table = this.pageItem.children[0];
    if (!table) return;
    for (let inner of table.children) {
      for (let row of inner.children) {
        row.children.splice(colIndex, 1);
      }
    }
    this.pageBuilderService.deSelectBlock();
    this.generate();
    this.update();
  }

  update() {
    this.pageItem.options ??= {};
    console.log('update called', this.pageItem);
    setTimeout(() => {
      // update new rowIndex and colIndex
      this.onSelectCell(this.selectedCell?.block);
      this.pageBuilderService.blockSelector?.updatePosition();
      this.updateToolbarPosition();
    });
  }

  updateToolbarPosition() {
    if (this.selectedCell?.block.el) {
      console.log(this.selectedCell.block.el);
      const rect = this.selectedCell.block.el.getBoundingClientRect();
      const wrapperRect = this.wrapper.nativeElement.getBoundingClientRect();
      const toolbarWidth = this.toolbar.nativeElement.offsetWidth;
      const optX = rect.x - wrapperRect.x + (rect.width - toolbarWidth) / 2;
      const optY = rect.y - wrapperRect.y + rect.height;
      this.renderer.setStyle(this.toolbar.nativeElement, 'left', `${optX}px`);
      this.renderer.setStyle(this.toolbar.nativeElement, 'top', `${optY}px`);
    }
  }
}
