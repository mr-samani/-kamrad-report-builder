import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DOCUMENT,
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
import { getNormalizedRange, isValidMergeRange } from './table-helper';

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
    rowIndex: number;
    colIndex: number;
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

  onSelectCell(selectedBlock: PageItem | undefined, ev?: PointerEvent) {
    try {
      // اگر shift نگرفته باشه، رنج قبلی پاک میشه و سلول اولیه آپدیت میشه
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
      const rowIndex = bodyChilds.indexOf(row) ?? -1;
      const colIndex = row.children.indexOf(cell) ?? -1;

      // اگر shift باشد و یک سلول آغازین داریم → تلاش برای ساختن رِنج
      if (isShift && this.firstSelectedCell && this.firstSelectedCell.section === section) {
        const start = {
          block: this.firstSelectedCell.block,
          row: this.firstSelectedCell.rowIndex,
          col: this.firstSelectedCell.colIndex,
        };
        const end = { row: rowIndex, col: colIndex, block: selectedBlock };
        const normalized = getNormalizedRange(start, end);

        const candidate = {
          section,
          row1: normalized.row1,
          row2: normalized.row2,
          col1: normalized.col1,
          col2: normalized.col2,
          start,
          end,
        };
        // اعتبارسنجی رنج
        const valid = isValidMergeRange(bodyChilds, candidate);
        if (valid) {
          this.rangeSelection = candidate;
        } else {
          this.rangeSelection = undefined;
        }
        // حفظ selectedBlock هم برای مرجع UI
        // this.selectedCell = { section, rowIndex, colIndex, block: selectedBlock };
        this.chdRef.detectChanges();
        this.updateRangeSelectionPosition();
        this.updateToolbarPosition();
        return;
      }

      // در حالت عادی (یا shift ولی بدون firstSelectedCell) → انتخاب به عنوان firstSelectedCell
      this.firstSelectedCell = { section, rowIndex, colIndex, block: selectedBlock };
      // اگر shift نگرفته باشیم رنج قبلی پاک میشه (در صورت shift=false)
      if (!isShift) {
        this.rangeSelection = undefined;
        this.updateRangeSelectionPosition();
      }

      // this.selectedCell = { section, rowIndex, colIndex, block: selectedBlock };
      this.updateToolbarPosition();
      this.chdRef.detectChanges();
    } catch (error) {
      this.firstSelectedCell = undefined;
      this.rangeSelection = undefined;
      // this.selectedCell = undefined;
      this.updateRangeSelectionPosition();
      this.chdRef.detectChanges();
    }
  }

  getRowColIndex(): { rowIndex: number; colIndex: number } {
    if (this.firstSelectedCell) {
      return {
        rowIndex: this.firstSelectedCell.rowIndex,
        colIndex: this.firstSelectedCell.colIndex,
      };
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
    const section = this.firstSelectedCell?.section ?? 'tbody';
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
    const section = this.firstSelectedCell?.section ?? 'tbody';
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
      this.onSelectCell(this.firstSelectedCell?.block);
      this.pageBuilderService.blockSelector?.updatePosition();
      this.updateToolbarPosition();
    });
  }

  updateToolbarPosition() {
    if (this.firstSelectedCell?.block.el) {
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
      const startRect = this.rangeSelection.start.block.el?.getBoundingClientRect();
      const endRect = this.rangeSelection.end.block.el?.getBoundingClientRect();
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
        this.renderer.setStyle(this.doc.querySelector('block-selector'), 'display', 'none');
      }
    } else {
      this.renderer.setStyle(this.selectionRangeEl.nativeElement, 'display', 'none');
      //todo:if blockSelector hide by self
      this.renderer.removeStyle(this.doc.querySelector('block-selector'), 'display');
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

    const height = row2 - row1 + 1;
    const width = col2 - col1 + 1;

    // مرجع سلول بالا-چپ (master)
    const masterRow = sectionBlock.children[row1];
    const masterCell = masterRow.children[col1] as PageItem;

    // تنظیم rowspan & colspan در داده (PageItem.options.attributes)
    masterCell.options ??= {};
    masterCell.options.attributes ??= {};
    if (height > 1) masterCell.options.attributes['rowspan'] = String(height);
    if (width > 1) masterCell.options.attributes['colspan'] = String(width);

    // حذف سلول‌های دیگر از مدل و DOM
    // برای هر ردیف در بازه، سلول‌های col1..col2 حذف می‌شوند به جز master (r==row1 && c==col1)
    for (let r = row1; r <= row2; r++) {
      const row = sectionBlock.children[r];
      // حذف از آخر به اول تا اندیس‌ها به هم نریزند
      for (let c = col2; c >= col1; c--) {
        if (r === row1 && c === col1) continue; // skip master
        const cellToRemove = row.children[c] as PageItem;
        if (!cellToRemove) continue;
        // Destroy از dynamicElementService (اگر ساخته شده)
        try {
          this.dynamicElementService.destroy(cellToRemove);
        } catch (err) {
          // ignore
        }
        row.children.splice(c, 1);
      }
    }

    // بعد از تغییر مدل، جدول را بازسازی کن
    await this.generate();

    // انتخاب را به master منتقل کن و toolbar را آپدیت کن
    // پیدا کردن block جدید master در DOM به کمک BlockHelper یا جستجوی مدل
    // اینجا ساده‌ترین کار این است که دوباره selectedCell را ست کنیم و update را فراخوانی کنیم
    this.pageBuilderService.deSelectBlock();
    // تلاش برای ست کردن selectedBlock روی master (اگر master.el موجود شد)
    setTimeout(() => {
      // پس از generate ممکنه block های جدید ساخته شده باشند، سعی کن master block جدید را بیابی
      const tableAfter = this.pageItem.children?.[0];
      const sectionAfter = tableAfter.children?.find((x) => x.tag === section) as PageItem;
      const newMasterRow = sectionAfter?.children?.[row1];
      const newMasterCell = newMasterRow?.children?.[col1];
      if (newMasterCell) {
        this.pageBuilderService.onSelectBlock(newMasterCell);
        // this.selectedCell = { section, rowIndex: row1, colIndex: col1, block: newMasterCell };
      }
      this.rangeSelection = undefined;
      this.firstSelectedCell = undefined;
      this.update();
    }, 50);
  }
  async unMergeCells(ev: Event) {
    ev.stopPropagation();
    try {
      // نیاز به یک سلول انتخاب‌شده داریم
      if (!this.firstSelectedCell) return;

      const { section, rowIndex, colIndex } = this.firstSelectedCell;

      const table = this.pageItem?.children?.[0];
      if (!table) return;

      const sectionBlock = table.children?.find((x) => x.tag === section) as PageItem;
      if (!sectionBlock) return;

      // master row & cell
      const masterRow = sectionBlock.children?.[rowIndex];
      if (!masterRow) return;
      const masterCell = masterRow.children?.[colIndex] as PageItem;
      if (!masterCell) return;

      // خواندن rowspan/colspan (اگر رشته باشند، Number می‌گیریم)
      const rowspan = Number(masterCell.options?.attributes?.['rowspan'] ?? 1);
      const colspan = Number(masterCell.options?.attributes?.['colspan'] ?? 1);

      // اگر چیزی برای unmerge نیست، بیرون بزن
      if (rowspan === 1 && colspan === 1) return;

      // ۱) حذف attributeهای rowspan/colspan از سلول master
      if (masterCell.options?.attributes) {
        delete masterCell.options.attributes['rowspan'];
        delete masterCell.options.attributes['colspan'];
        // اگر attributes خالی شد، پاکش کن
        if (Object.keys(masterCell.options.attributes).length === 0) {
          delete masterCell.options.attributes;
        }
      }

      // ۲) برای هر سلول جایگزین در مستطیل، یک PageItem جدید بساز و درج کن
      // دقت: درج به صورت از چپ به راست و از بالا به پایین با استفاده از splice
      for (let r = rowIndex; r <= rowIndex + rowspan - 1; r++) {
        const targetRow = sectionBlock.children?.[r];
        if (!targetRow) continue;

        // از راست به چپ درج نکنیم چون می‌خواهیم اندیس‌ها مطابق با ستون واقعی باشند.
        // برای هر ستون در بازه
        for (let c = colIndex; c <= colIndex + colspan - 1; c++) {
          // master را نساختن (همان سلول موجود را نگه می‌داریم)
          if (r === rowIndex && c === colIndex) continue;

          // قالب سلول مناسب (th برای thead، td برای بقیه)
          const template = section === 'thead' ? this._th : this._td;

          // ساخت یک PageItem جدید از قالب (تضمین fresh instance)
          const newCell = PageItem.fromJSON(template) as PageItem;
          newCell.parent = targetRow;
          // تضمین اینکه سلول جدید خالی باشد (بدون child)
          newCell.children = [];

          // اندیس درج را به صورت امن محاسبه کن (اگر طول ردیف کمتر است، در انتها اضافه کن)
          const insertIndex = Math.min(c, targetRow.children.length);
          targetRow.children.splice(insertIndex, 0, newCell);
        }
      }

      // ۳) بازسازی DOM/model و آپدیت selection
      await this.generate();

      // بازنشانی selection: انتخاب را به master منتقل کن (سلول بالا-چپ)
      setTimeout(() => {
        const tableAfter = this.pageItem?.children?.[0];
        const sectionAfter = tableAfter?.children?.find((x) => x.tag === section) as PageItem;
        const newMasterRow = sectionAfter?.children?.[rowIndex];
        const newMasterCell = newMasterRow?.children?.[colIndex];
        if (newMasterCell) {
          // انتخاب در pageBuilderService (اگر متد selectBlock دارید)
          try {
            this.pageBuilderService.onSelectBlock(newMasterCell);
          } catch (err) {
            // ignore if not available
          }
          //this.selectedCell = { section, rowIndex, colIndex, block: newMasterCell };
        } else {
          // this.selectedCell = undefined;
        }

        // پاکسازی رنج‌ها و firstSelectedCell
        this.rangeSelection = undefined;
        this.firstSelectedCell = undefined;

        // به روزرسانی UI
        this.update();
      }, 20);
    } catch (err) {
      console.error('unMergeCells error:', err);
    }
  }
}
