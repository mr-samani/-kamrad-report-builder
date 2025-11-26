import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DOCUMENT,
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
import { DynamicDataService } from '../../services/dynamic-data.service';
import { NgxDragDropKitModule } from 'ngx-drag-drop-kit';
import { CommonModule } from '@angular/common';
import { BlockHelper } from '../../helper/BlockHelper';
import { cloneDeep } from '../../utiles/clone-deep';
import { SvgIconDirective } from '../../directives/svg-icon.directive';
import {
  buildLogicalGrid,
  findCellLogicalIndex,
  getNormalizedRange,
  isValidMergeRange,
} from './table-helper';
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
  settingChangeSubscription?: Subscription;
  selectBlockSubscription?: Subscription;

  @ViewChild('tableContainer') tableContainer!: ElementRef<HTMLTableElement>;
  @ViewChild('wrapper') wrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('toolbar') toolbar!: ElementRef<HTMLDivElement>;
  @ViewChild('selectionRange') selectionRangeEl!: ElementRef<HTMLDivElement>;

  firstSelectedCell?: {
    section: TableSection;
    rowIndex: number; // child index of row in section.children[]
    colIndex: number; // child index of cell in row.children[]
    block: PageItem;
  };
  rangeSelection?: {
    section: TableSection;
    row1: number;
    row2: number;
    col1: number;
    col2: number;
    start: { row: number; col: number; block: PageItem };
    end: { row: number; col: number; block: PageItem };
  };

  showMergeButton: boolean = false;

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
    @Inject(DOCUMENT) private doc: Document,
  ) {}

  ngOnInit() {
    if (!this.pageItem.children || this.pageItem.children.length === 0) {
      this.pageItem.children = [new PageItem(this._template, this.pageItem)];
    }
  }

  ngAfterViewInit(): void {
    this.settingChangeSubscription = this.context.onChange.subscribe((data) => {
      debugger;
      this.chdRef.detectChanges();
    });
    this.selectBlockSubscription = this.pageBuilderService.onSelectBlock$.subscribe((result) => {
      this.onSelectCell(result?.item, result?.ev);
    });
    this.generate();
  }

  ngOnDestroy() {
    if (this.settingChangeSubscription) {
      this.settingChangeSubscription.unsubscribe();
    }
    if (this.selectBlockSubscription) {
      this.selectBlockSubscription.unsubscribe();
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

  /**
   * Selection handler (supports Shift selection for range)
   */
  onSelectCell(selectedBlock: PageItem | undefined, ev?: PointerEvent) {
    try {
      const isShift = !!ev?.shiftKey;
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
      const bodyChilds = row.parent?.children ?? [];
      // 🔥 پیدا کردن ایندکسِ درست با محاسبه مرج شده‌ها
      const { rowIndex, colIndex } = findCellLogicalIndex(bodyChilds, cell);

      if (rowIndex < 0) {
        throw new Error('Row not found in parent children');
      }
      if (colIndex < 0) {
        throw new Error('Cell not found in row children');
      }

      // Shift selection: build range between firstSelectedCell and this
      if (isShift && this.firstSelectedCell && this.firstSelectedCell.section === section) {
        const start = {
          row: this.firstSelectedCell.rowIndex,
          col: this.firstSelectedCell.colIndex,
          block: this.firstSelectedCell.block,
        };
        const end = { row: rowIndex, col: colIndex, block: selectedBlock };

        // compute normalized range (use only row/col)
        const normalized = getNormalizedRange(
          { row: start.row, col: start.col },
          { row: end.row, col: end.col },
        );

        // validate using helper (pass the section rows array)
        const valid = isValidMergeRange(bodyChilds, normalized);
        if (valid) {
          this.rangeSelection = {
            section,
            row1: normalized.row1,
            row2: normalized.row2,
            col1: normalized.col1,
            col2: normalized.col2,
            start: { ...start },
            end: { ...end },
          };
        } else {
          this.rangeSelection = undefined;
        }

        this.chdRef.detectChanges();
        this.updateRangeSelectionPosition();
        this.updateToolbarPosition();
        return;
      }

      // normal selection: set as firstSelectedCell
      this.firstSelectedCell = { section, rowIndex, colIndex, block: selectedBlock };

      if (!isShift) {
        this.rangeSelection = undefined;
        this.updateRangeSelectionPosition();
      }

      this.updateToolbarPosition();
      this.chdRef.detectChanges();
    } catch (error) {
      // reset selection state on error
      this.firstSelectedCell = undefined;
      this.rangeSelection = undefined;
      this.updateRangeSelectionPosition();
      this.chdRef.detectChanges();
    }
  }

  getRowColIndex(): { rowIndex: number; colIndex: number } {
    // اگر یک سلول از قبل انتخاب شده باشد، همان را برگردان
    if (this.firstSelectedCell) {
      return {
        rowIndex: this.firstSelectedCell.rowIndex,
        colIndex: this.firstSelectedCell.colIndex,
      };
    }

    // fallback ایمن: آخرین سلول tbody
    const body = this.pageItem?.children?.find((x) => x.tag === 'tbody');
    if (!body || !Array.isArray(body.children) || body.children.length === 0) {
      // هیچ tbody یا هیچ ردیفی وجود ندارد -> صفر برگردان
      return { rowIndex: 0, colIndex: 0 };
    }

    // آخرین ردیف موجود
    const lastRowIndex = Math.max(0, body.children.length - 1);
    const lastRow = body.children[lastRowIndex];

    if (!lastRow || !Array.isArray(lastRow.children) || lastRow.children.length === 0) {
      // ردیف وجود دارد ولی سلولی داخلش نیست -> colIndex = 0
      return { rowIndex: lastRowIndex, colIndex: 0 };
    }

    // آخرین سلول (اندیس child)
    const lastColIndex = Math.max(0, lastRow.children.length - 1);
    return { rowIndex: lastRowIndex, colIndex: lastColIndex };
  }

  async addRow(ev: Event, after = false) {
    ev.stopPropagation();
    const { rowIndex, colIndex } = this.getRowColIndex();
    const section = this.firstSelectedCell?.section ?? 'tbody';
    const table = this.pageItem.children[0];
    const theadOrTbody = table.children?.find((x) => x.tag === section);
    if (!theadOrTbody) return;
    // ensure rowIndex valid
    const safeRowIndex = Math.min(
      Math.max(0, rowIndex),
      Math.max(0, theadOrTbody.children.length - 1),
    );
    const row = theadOrTbody.children[safeRowIndex].clone(theadOrTbody);

    for (let cell of row.children) {
      cell.children = [];
    }
    theadOrTbody.children?.splice(after ? safeRowIndex + 1 : safeRowIndex, 0, row);

    await this.pageBuilderService.createBlockElement(
      row,
      theadOrTbody.el!,
      after ? safeRowIndex + 1 : safeRowIndex,
    );
    this.update();
  }
  async deleteRow(ev: Event) {
    ev.stopPropagation();
    const { rowIndex, colIndex } = this.getRowColIndex();
    const section = this.firstSelectedCell?.section ?? 'tbody';
    const table = this.pageItem.children[0];
    const theadOrTbody = table.children?.find((x) => x.tag === section);
    if (!theadOrTbody) return;
    if (rowIndex < 0 || rowIndex >= theadOrTbody.children.length) return;
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
        // safe insert index
        const insertIdx = Math.min(Math.max(0, colIndex), Math.max(0, row.children.length));
        row.children.splice(after ? insertIdx + 1 : insertIdx, 0, td as PageItem);
      }
    }

    this.generate();
    this.update();
  }

  // helper: محاسبه logical column index برای یک child index در یک row
  private getLogicalColIndexForChild(
    sectionBlock: PageItem,
    rowIndex: number,
    childIndex: number,
  ): number {
    const row = sectionBlock.children?.[rowIndex];
    if (!row) return 0;
    let curr = 0;
    for (let i = 0; i < row.children.length; i++) {
      if (i === childIndex) return curr;
      const span = Number(row.children[i].options?.attributes?.['colspan'] ?? 1);
      curr += span;
    }
    // اگر childIndex خارج از محدوده بود، بازگردان curr (معمولاً آخرین)
    return curr;
  }

  // helper: تعداد ستون‌های منطقی فعلی در section (بر پایه اولین ردیف)
  private getLogicalColumnCount(sectionBlock: PageItem): number {
    if (!sectionBlock || !sectionBlock.children || sectionBlock.children.length === 0) return 0;
    // محاسبه از روی ردیف اول (فرض کردن جدول مستطیلی)
    const firstRow = sectionBlock.children[0];
    let total = 0;
    for (const cell of firstRow.children) {
      total += Number(cell.options?.attributes?.['colspan'] ?? 1);
    }
    return total;
  }

  async deleteColumn(ev: Event) {
    ev.stopPropagation();
    // NOTE: deleteColumn already پیاده‌سازی شده قبل؛ پیچیدگی rowspan/colspan کامل وجود دارد.
    // این متد منطقی‌ترین ستون (logicalColIndex) را از firstSelectedCell می‌گیرد و سپس برای هر section
    // در هر ردیف سلول مناسب را حذف یا colspan را کم می‌کند.
    const { rowIndex: childRowIdx, colIndex: childColIdx } = this.getRowColIndex();
    const table = this.pageItem.children?.[0];
    if (!table) return;

    const sectionName = this.firstSelectedCell?.section ?? 'tbody';
    const sectionBlock = table.children?.find((x) => x.tag === sectionName) as PageItem;
    if (!sectionBlock) return;

    let logicalColIndex = 0;
    if (this.firstSelectedCell) {
      logicalColIndex = this.getLogicalColIndexForChild(
        sectionBlock,
        this.firstSelectedCell.rowIndex,
        this.firstSelectedCell.colIndex,
      );
    } else {
      logicalColIndex = this.getLogicalColIndexForChild(
        sectionBlock,
        Math.max(0, childRowIdx - 1),
        Math.max(0, childColIdx),
      );
    }

    for (const inner of table.children) {
      for (let r = 0; r < (inner.children?.length ?? 0); r++) {
        const row = inner.children[r];
        if (!row) continue;

        let curr = 0;
        const newChildren: PageItem[] = [];

        for (let i = 0; i < (row.children?.length ?? 0); i++) {
          const cell = row.children[i] as PageItem;
          const colspan = Number(cell.options?.attributes?.['colspan'] ?? 1);
          const c1 = curr;
          const c2 = curr + colspan - 1;

          if (logicalColIndex < c1 || logicalColIndex > c2) {
            newChildren.push(cell);
          } else {
            if (colspan > 1) {
              const newSpan = colspan - 1;
              cell.options ??= {};
              cell.options.attributes ??= {};
              if (newSpan === 1) {
                delete cell.options.attributes['colspan'];
                if (Object.keys(cell.options.attributes).length === 0) {
                  delete cell.options.attributes;
                }
              } else {
                cell.options.attributes['colspan'] = String(newSpan);
              }
              newChildren.push(cell);
            } else {
              // colspan === 1 : حذف سلول
              // اگر rowspan>1 باشد، رفتار پیچیده است — اینجا فعلاً سلول حذف می‌شود و ممکن است در ردیف‌های پایین placeholder لازم باشد.
              // برای نگهداری ساختار جدول کامل‌تر، می‌توانیم در آینده placeholder اضافه کنیم.
              // const rowspan = Number(cell.options?.attributes?.['rowspan'] ?? 1);
              // if (rowspan > 1) { ... }
            }
          }

          curr = c2 + 1;
        }

        row.children = newChildren;
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
      this.onSelectCell(this.firstSelectedCell?.block);
      this.pageBuilderService.blockSelector?.updatePosition();
      this.updateToolbarPosition();
    });
  }

  updateToolbarPosition() {
    if (this.firstSelectedCell?.block?.el) {
      const rect = this.rangeSelection
        ? this.selectionRangeEl.nativeElement.getBoundingClientRect()
        : this.firstSelectedCell.block.el.getBoundingClientRect();
      const wrapperRect = this.wrapper.nativeElement.getBoundingClientRect();
      const toolbarWidth = this.toolbar.nativeElement.offsetWidth;
      const optX = rect.x - wrapperRect.x + (rect.width - toolbarWidth) / 2;
      const optY = rect.y - wrapperRect.y + rect.height;
      this.renderer.setStyle(this.toolbar.nativeElement, 'left', `${optX}px`);
      this.renderer.setStyle(this.toolbar.nativeElement, 'top', `${optY}px`);
    }
  }

  updateRangeSelectionPosition() {
    this.showMergeButton = false;
    if (this.rangeSelection) {
      const startRect = this.rangeSelection.start.block?.el?.getBoundingClientRect();
      const endRect = this.rangeSelection.end.block?.el?.getBoundingClientRect();
      if (startRect && endRect) {
        this.showMergeButton = true;
        const wrapperRect = this.wrapper.nativeElement.getBoundingClientRect();
        const left = Math.min(startRect.left, endRect.left) - wrapperRect.left;
        const top = Math.min(startRect.top, endRect.top) - wrapperRect.top;
        const right = Math.max(startRect.right, endRect.right) - wrapperRect.left;
        const bottom = Math.max(startRect.bottom, endRect.bottom) - wrapperRect.top;
        this.renderer.setStyle(this.selectionRangeEl.nativeElement, 'left', `${left}px`);
        this.renderer.setStyle(this.selectionRangeEl.nativeElement, 'top', `${top}px`);
        this.renderer.setStyle(this.selectionRangeEl.nativeElement, 'width', `${right - left}px`);
        this.renderer.setStyle(this.selectionRangeEl.nativeElement, 'height', `${bottom - top}px`);
        this.renderer.setStyle(this.selectionRangeEl.nativeElement, 'display', 'block');
        const bs = this.doc.querySelector('block-selector');
        if (bs) {
          this.renderer.setStyle(bs, 'display', 'none');
        }
      }
    } else {
      this.renderer.setStyle(this.selectionRangeEl.nativeElement, 'display', 'none');
      const bs = this.doc.querySelector('block-selector');
      if (bs) {
        this.renderer.removeStyle(bs, 'display');
      }
    }
    this.chdRef.detectChanges();
  }

  async mergeCells(ev: Event) {
    if (!this.rangeSelection) return;
    const { section, row1, row2, col1, col2 } = this.rangeSelection;

    const table = this.pageItem.children?.[0];
    if (!table) return;
    const sectionBlock = table.children?.find((x) => x.tag === section) as PageItem;
    if (!sectionBlock) return;

    // ساخت grid منطقی از ردیف‌های این section
    const rows = sectionBlock.children ?? [];
    const grid = buildLogicalGrid(rows);
    if (!grid || grid.length === 0) return;

    // bounds safety
    if (
      row1 < 0 ||
      row2 >= grid.length ||
      col1 < 0 ||
      col2 >= (grid[0]?.length ?? 0) ||
      row1 > row2 ||
      col1 > col2
    ) {
      return;
    }

    const height = row2 - row1 + 1;
    const width = col2 - col1 + 1;

    // masterGridCell: گرید نقطه بالا-چپ
    const masterInfo = grid[row1][col1];
    if (!masterInfo) return;

    // اگر اون نقطه covered باشه (یعنی کاربر روی جایی کلیک کرده که top-left نیست)
    // بهتره master واقعی (top-left) برای آن سلول را بیابیم
    let masterCell = masterInfo.cell;
    if (!masterInfo.isReal) {
      // پیدا کردن top-left آن cell در grid
      outerFind: for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          const g = grid[r][c];
          if (g && g.isReal && g.cell === masterCell) {
            // بازنویس row1/col1 به top-left واقعی
            // اما توجه: در حالت نرمال rangeSelection باید با logical index ساخته شده باشه، پس این فقط safety است
            // همچنین ممکن است نیاز باشد range را براساس top-left مجدداً بازنرمالایز کنیم — اما ما اینجا تنها master را اصلاح می‌کنیم
            // (فرض می‌کنیم کاربر رنج را طوری انتخاب کرده که master در گوشه بالا-چپ منطقی است)
            // اگر بخوایم می‌توانیم row1= r; col1 = c; ولی چون rangeSelection از قبل تولید شده بهتر است همان رنج را نگه داریم
            masterCell = g.cell;
            break outerFind;
          }
        }
      }
    }

    // تنظیم rowspan/colspan روی master cell (در مدل)
    masterCell.options ??= {};
    masterCell.options.attributes ??= {};
    if (height > 1) masterCell.options.attributes['rowspan'] = String(height);
    else delete masterCell.options.attributes?.['rowspan'];
    if (width > 1) masterCell.options.attributes['colspan'] = String(width);
    else delete masterCell.options.attributes?.['colspan'];

    // جمع‌آوری سلول‌های واقعی (top-left) در محدوده به جز master که باید حذف شوند
    const toRemoveByParent = new Map<PageItem, number[]>(); // parentRow -> [childIndex,...]
    const seen = new Set<PageItem>();

    for (let r = row1; r <= row2; r++) {
      for (let c = col1; c <= col2; c++) {
        const g = grid[r][c];
        if (!g) continue;
        // فقط سلول‌های واقعی (top-left) را حذف/در نظر می‌گیریم
        if (!g.isReal) continue;

        const cell = g.cell;
        if (cell === masterCell) continue; // skip master

        if (seen.has(cell)) continue; // یک سلول top-left ممکن است فقط در یک خانه isReal باشد ولی احتیاط
        seen.add(cell);

        const parentRow = cell.parent as PageItem;
        if (!parentRow) continue;
        const childIdx = parentRow.children.indexOf(cell);
        if (childIdx < 0) continue;

        if (!toRemoveByParent.has(parentRow)) toRemoveByParent.set(parentRow, []);
        toRemoveByParent.get(parentRow)!.push(childIdx);
      }
    }

    // حذف در هر ردیف: حذف از بزرگ به کوچک تا اندیس‌ها تغییر نکند
    toRemoveByParent.forEach((indices, parentRow) => {
      indices.sort((a, b) => b - a);
      for (const idx of indices) {
        // destroy element if exists
        const cell = parentRow.children[idx] as PageItem | undefined;
        if (cell) {
          try {
            this.dynamicElementService.destroy(cell);
          } catch (err) {
            // ignore
          }
        }
        parentRow.children.splice(idx, 1);
      }
    });

    // بازسازی DOM
    await this.generate();

    // selection: سعی کن master جدید را انتخاب کنی
    this.pageBuilderService.deSelectBlock();
    setTimeout(() => {
      // بعد از generate دوباره grid و master را پیدا می‌کنیم تا selection بزنیم
      const tableAfter = this.pageItem.children?.[0];
      if (!tableAfter) return;
      const sectionAfter = tableAfter.children?.find((x) => x.tag === section) as PageItem;
      if (!sectionAfter) return;
      // بازسازی grid بعدی
      const rowsAfter = sectionAfter.children ?? [];
      const gridAfter = buildLogicalGrid(rowsAfter);
      if (gridAfter?.[row1]?.[col1]) {
        const newMaster = gridAfter[row1][col1].cell;
        if (newMaster) {
          try {
            this.pageBuilderService.onSelectBlock(newMaster);
          } catch (err) {
            // ignore
          }
        }
      }

      this.rangeSelection = undefined;
      this.firstSelectedCell = undefined;
      this.update();
    }, 50);
  }

  async unMergeCells(ev: Event) {
    ev.stopPropagation();
    try {
      if (!this.firstSelectedCell) return;

      const { section, rowIndex, colIndex } = this.firstSelectedCell;

      const table = this.pageItem?.children?.[0];
      if (!table) return;
      const sectionBlock = table.children?.find((x) => x.tag === section) as PageItem;
      if (!sectionBlock) return;

      const rows = sectionBlock.children ?? [];
      // بازسازی grid کنونی (در این حالت master ممکنه rowspan/colspan داشته باشه)
      const grid = buildLogicalGrid(rows);

      // اطمینان از bounds
      if (
        !grid ||
        rowIndex < 0 ||
        rowIndex >= grid.length ||
        colIndex < 0 ||
        colIndex >= (grid[0]?.length ?? 0)
      ) {
        return;
      }

      const masterInfo = grid[rowIndex][colIndex];
      if (!masterInfo || !masterInfo.isReal) {
        // اگر اینجا top-left نیست سعی کن top-left واقعی را پیدا کنی
        let found = false;
        for (let r = 0; r < grid.length && !found; r++) {
          for (let c = 0; c < (grid[r]?.length ?? 0) && !found; c++) {
            const g = grid[r][c];
            if (g && g.isReal && g.cell === masterInfo?.cell) {
              // بازنویسی اندیس‌ها
              // توجه: این حالت نادر است ولی safety می‌کنیم
              // (در صورتی که firstSelectedCell حاوی logical top-left باشد نباید اینجا بیاییم)
              // برای سادگی: return چون firstSelectedCell باید top-left واقعی باشد
              found = true;
            }
          }
        }
        if (!found) return;
      }

      const masterCell = masterInfo.cell;
      const rowspan = Number(masterCell.options?.attributes?.['rowspan'] ?? 1);
      const colspan = Number(masterCell.options?.attributes?.['colspan'] ?? 1);

      if (rowspan === 1 && colspan === 1) return;

      // remove rowspan/colspan attributes from master
      if (masterCell.options?.attributes) {
        delete masterCell.options.attributes['rowspan'];
        delete masterCell.options.attributes['colspan'];
        if (Object.keys(masterCell.options.attributes).length === 0) {
          delete masterCell.options.attributes;
        }
      }

      // پس از حذف attributeها، grid فعلی هنوز با master occupying چند خانه خواهد بود
      // پس برای تعیین اندیس درج در هر ردیف، دوباره grid را بسازیم (یا از grid موجود استفاده کنیم ولی باید map child->firstLogicalCol بسازیم)
      // از grid موجود استفاده می‌کنیم تا mapping از هر child به firstLogicalCol در آن ردیف استخراج کنیم

      // تابع helper محلی: تولید map از PageItem -> firstLogicalCol برای ردیف r
      const getFirstLogicalColMapForRow = (r: number) => {
        const map = new Map<PageItem, number>();
        if (!grid[r]) return map;
        for (let c = 0; c < grid[r].length; c++) {
          const g = grid[r][c];
          if (!g) continue;
          if (g.isReal) {
            if (!map.has(g.cell)) {
              map.set(g.cell, c);
            }
          }
        }
        return map;
      };

      // حالا در هر ردیف هدف سلول‌های جدید را اضافه می‌کنیم (به جز master)
      for (let r = rowIndex; r <= rowIndex + rowspan - 1; r++) {
        // اگر ردیف وجود ندارد (در موارد نادر) ایجادش نکن — ولی معمولا وجود دارد
        if (r < 0 || r >= rows.length) continue;
        const targetRow = rows[r];
        const firstColMap = getFirstLogicalColMapForRow(r);

        for (let c = colIndex; c <= colIndex + colspan - 1; c++) {
          if (r === rowIndex && c === colIndex) continue; // skip master

          // تعیین اندیس درج در targetRow.children براساس logical col c
          // پیدا کن اولین سلولی که firstLogicalCol >= c و سپس insert قبل از آن
          let insertBeforeChild: PageItem | undefined = undefined;
          for (const [child, firstCol] of firstColMap.entries()) {
            if (firstCol >= c) {
              // اگر چندتا بود، می‌خواهیم نزدیک‌ترین firstCol را بگیریم (کمترین firstCol >= c)
              if (!insertBeforeChild) insertBeforeChild = child;
              else {
                const prev = firstColMap.get(insertBeforeChild)!;
                if (firstCol < prev) insertBeforeChild = child;
              }
            }
          }

          const insertIdx =
            insertBeforeChild != null
              ? Math.max(0, targetRow.children.indexOf(insertBeforeChild))
              : targetRow.children.length;

          // ساخت cell جدید و درج
          const template = section === 'thead' ? this._th : this._td;
          const newCell = PageItem.fromJSON(template) as PageItem;
          newCell.parent = targetRow;
          newCell.children = [];

          // splice at insertIdx
          targetRow.children.splice(insertIdx, 0, newCell);
        }
      }

      // بازسازی DOM
      await this.generate();

      // دوباره selection و update
      setTimeout(() => {
        const tableAfter = this.pageItem?.children?.[0];
        if (!tableAfter) return;
        const sectionAfter = tableAfter.children?.find((x) => x.tag === section) as PageItem;
        if (!sectionAfter) return;
        // انتخاب master جدید (همان top-left قبلی)
        try {
          // پس از insert ها master در همان موقعیت منطقی خواهد بود؛ سعی کن select بکنی:
          const rowsAfter = sectionAfter.children ?? [];
          const gridAfter = buildLogicalGrid(rowsAfter);
          if (gridAfter?.[rowIndex]?.[colIndex]) {
            const newMaster = gridAfter[rowIndex][colIndex].cell;
            if (newMaster) this.pageBuilderService.onSelectBlock(newMaster);
          }
        } catch (err) {
          // ignore
        }

        this.rangeSelection = undefined;
        this.firstSelectedCell = undefined;
        this.update();
      }, 20);
    } catch (err) {
      console.error('unMergeCells error:', err);
    }
  }
}
