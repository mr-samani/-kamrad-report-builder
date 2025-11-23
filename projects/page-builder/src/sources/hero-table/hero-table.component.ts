import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  Inject,
  OnInit,
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

declare type TableSection = 'thead' | 'tbody' | 'tfoot';

@Component({
  selector: 'hero-table',
  templateUrl: './hero-table.component.html',
  styleUrls: ['./hero-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxDragDropKitModule, CommonModule],
  encapsulation: ViewEncapsulation.None,
})
export class HeroTableComponent implements OnInit, AfterViewInit {
  pageItem!: PageItem;
  subscription: Subscription;
  @ViewChild('tableContainer') tableContainer!: ElementRef<HTMLTableElement>;

  selectedCell?: {
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
        children: [this._headRow],
      },
      {
        tag: 'tbody',
        children: [this._bodyRow, this._bodyRow, this._bodyRow, this._bodyRow],
      },
      {
        tag: 'tfoot',
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
    this.selectedCell = undefined;
    if (!selectedBlock) {
      return;
    }

    const cell = BlockHelper.findParentByTag(
      selectedBlock,
      ['td', 'th'],
      ['tbody', 'thead', 'tfoot'],
    );
    if (!cell) return;
    const row = BlockHelper.findParentByTag(cell, ['tr'], ['tbody', 'thead', 'tfoot']);
    if (!row) return;
    const section = row.parent?.tag as TableSection;
    const rowIndex = row.parent?.children.indexOf(row) ?? -1;
    const colIndex = row.children.indexOf(cell) ?? -1;

    this.selectedCell = { section, rowIndex, colIndex };
    this.chdRef.detectChanges();
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

  async addRow() {
    const { rowIndex, colIndex } = this.getRowColIndex();
    const section = this.selectedCell?.section ?? 'tbody';
    const table = this.pageItem.children[0];
    const rows = table.children?.find((x) => x.tag === section);
    if (!rows) return;
    const row = cloneDeep(rows.children[rowIndex]);
    for (let cell of row.children) {
      cell.children = [];
    }
    rows.children?.splice(rowIndex, 0, row);
    await this.pageBuilderService.createBlockElement(row, rows.el!);
    this.update();
  }
  async addColumn() {
    const { rowIndex, colIndex } = this.getRowColIndex();
    const table = this.pageItem.children[0];
    if (!table) return;
    for (let inner of table.children) {
      const td = inner.tag == 'thead' ? cloneDeep(this._th) : cloneDeep(this._td);

      for (let row of inner.children) {
        row.children.splice(colIndex, 0, PageItem.fromJSON(td));
      }
    }

    this.generate();
    this.update();
  }

  update() {
    this.pageItem.options ??= {};
  }
}
