import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  Inject,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgxDragDropKitModule } from 'ngx-drag-drop-kit';
import { BlockSelectorComponent } from '../components/block-selector/block-selector.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { PageBuilderBaseComponent } from './page-builder-base-component';
import { IStorageService } from '../services/storage/IStorageService';
import { STORAGE_SERVICE } from '../services/storage/token.storage';
import { PageBuilderConfiguration } from '../models/PageBuilderConfiguration';
import { DynamicDataStructure } from '../models/DynamicData';
import { Subscription } from 'rxjs';
import { SideConfigComponent } from '../components/side-config/side-config.component';
import { PAGE_BUILDER_CONFIGURATION } from '../models/tokens';
import { PageItemChange } from '../services/page-builder.service';
import { NgxPgNotifyModule, Notify } from '../extensions/notify';
import { SvgIconDirective } from '../directives/svg-icon.directive';
import { FocusContext } from '../services/shortcut.service';
import { validateViewMode, ViewMode } from '../consts/ViewMode';
import { Page } from '../models/Page';
import { IPage } from '../contracts/IPage';
import { preparePageDataForSave } from '../services/storage/prepare-page-builder-data';
import { IPageBuilderDto } from '../contracts/IPageBuilderDto';

@Component({
  selector: 'ngx-page-builder',
  templateUrl: './page-builder.html',
  styleUrls: ['./page-builder.scss'],
  imports: [
    NgxDragDropKitModule,
    ToolbarComponent,
    BlockSelectorComponent,
    SideConfigComponent,
    NgxPgNotifyModule,
    SvgIconDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxPageBuilder extends PageBuilderBaseComponent implements OnInit, OnDestroy {
  @Input() set data(val: IPage[]) {
    if (!val || Array.isArray(val) == false) {
      console.warn('NgxPageBuilder', 'Input data not valid!');
      return;
    }
    const pages = val.map((m) => Page.fromJSON(m));
    this.loadPageData(pages);
  }
  @Input('dynamicData') set setDynamicData(val: DynamicDataStructure[]) {
    this.dynamicDataService.dynamicData = val ?? [];
  }

  @Input({
    alias: 'viewMode',
    transform: validateViewMode,
  })
  set SetViewMode(val: ViewMode) {
    super.viewMode = val;
  }
  blockSelector = viewChild<BlockSelectorComponent>('blockSelector');

  private _pageBody = viewChild<ElementRef<HTMLElement>>('PageBody');
  private _pageHeader = viewChild<ElementRef<HTMLElement>>('PageHeader');
  private _pageFooter = viewChild<ElementRef<HTMLElement>>('PageFooter');

  subscriptions: Subscription[] = [];
  containerClassName = '';

  constructor(
    injector: Injector,
    @Inject(PAGE_BUILDER_CONFIGURATION) private mainConfig: PageBuilderConfiguration,
    @Inject(STORAGE_SERVICE) private storageService: IStorageService,
    @Inject(DOCUMENT) private doc: Document,
  ) {
    super(injector);
    this.pageBuilder.mode = 'Edit';
    this.pageBuilder.storageService = this.storageService;
    this.pageBuilder.pageBody = this._pageBody;
    this.pageBuilder.pageHeader = this._pageHeader;
    this.pageBuilder.pageFooter = this._pageFooter;
    this.pageBuilder.changed$.subscribe((data: PageItemChange) => {
      if (data.type == 'ChangePageConfig') {
        this.chdRef.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    this.pageBuilder.blockSelector = this.blockSelector();
    this.registerShortcuts();
    if (this.viewMode == 'PrintPage') {
      this.containerClassName = `paper ${this.pageBuilder.pageInfo.config.size} ${this.pageBuilder.pageInfo.config.orientation}`;
    } else {
      this.containerClassName = `web-page-view`;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.unregisterShortcuts();
  }

  private async loadPageData(data: Page[]) {
    try {
      // let data = await this.storageService.loadData();
      //this.pageBuilder.pageInfo = PageBuilderDto.fromJSON(data);
      this.pageBuilder.pageInfo.pages = data;
      //console.log('load data:', data, 'converted class:', this.pageBuilder.pageInfo);
      if (this.pageBuilder.pageInfo.pages.length == 0) {
        await this.pageBuilder.addPage();
        return;
      } else {
        await this.pageBuilder.changePage(1);
        // console.log('after load:', this.pageBuilder.pageInfo);
      }
    } catch (error) {
      await this.pageBuilder.addPage();
      console.error('Error loading page data:', error);
      Notify.error('Error loading page data: ' + error);
    }
  }

  /**
   * ✅ Register all page builder shortcuts
   */
  private registerShortcuts(): void {
    // ========================================
    // DELETE - حذف بلاک (فقط در CANVAS context)
    // ========================================
    this.shortcuts.register('delete-block', {
      key: 'Delete',
      contexts: [FocusContext.CANVAS], // 👈 فقط وقتی focus روی canvas است
      description: 'Delete selected block',
      action: () => {
        const currentBlock = this.pageBuilder.activeEl();
        if (currentBlock) {
          this.pageBuilder.removeBlock(currentBlock);
        }
      },
    });

    // همچنین Backspace برای Mac users
    this.shortcuts.register('delete-block-backspace', {
      key: 'Backspace',
      contexts: [FocusContext.CANVAS],
      description: 'Delete selected block',
      action: () => {
        const currentBlock = this.pageBuilder.activeEl();
        if (currentBlock) {
          this.pageBuilder.removeBlock(currentBlock);
        }
      },
    });

    // ========================================
    // COPY - کپی بلاک (فقط در CANVAS)
    // ========================================
    this.shortcuts.register('copy-block', {
      key: 'c',
      ctrl: true,
      contexts: [FocusContext.CANVAS],
      description: 'Copy selected block',
      action: () => {
        const currentBlock = this.pageBuilder.activeEl();
        if (currentBlock) {
          this.pageBuilder.copyBlock(currentBlock);
        }
      },
    });

    // ========================================
    // PASTE - پیست بلاک (فقط در CANVAS)
    // ========================================
    this.shortcuts.register('paste-block', {
      key: 'v',
      ctrl: true,
      contexts: [FocusContext.CANVAS],
      description: 'Paste copied block',
      action: () => {
        this.pageBuilder.pasteBlock();
      },
    });

    // ========================================
    // DUPLICATE - دوبل کردن بلاک
    // ========================================
    this.shortcuts.register('duplicate-block', {
      key: 'd',
      ctrl: true,
      contexts: [FocusContext.CANVAS],
      description: 'Duplicate selected block',
      action: () => {
        const currentBlock = this.pageBuilder.activeEl();
        if (currentBlock) {
          this.pageBuilder.duplicateBlock(currentBlock);
        }
      },
    });

    // ========================================
    // UNDO / REDO
    // ========================================
    this.shortcuts.register('undo', {
      key: 'z',
      ctrl: true,
      contexts: [FocusContext.CANVAS, FocusContext.SIDEBAR], // در canvas و sidebar
      description: 'Undo last action',
      action: () => {
        this.pageBuilder.undo();
      },
    });

    this.shortcuts.register('redo', {
      key: 'z',
      ctrl: true,
      shift: true,
      contexts: [FocusContext.CANVAS, FocusContext.SIDEBAR],
      description: 'Redo last action',
      action: () => {
        this.pageBuilder.redo();
      },
    });

    // ========================================
    // ESCAPE - لغو انتخاب
    // ========================================
    this.shortcuts.register('deselect', {
      key: 'Escape',
      contexts: [FocusContext.CANVAS, FocusContext.TEXT_EDITING],
      description: 'Deselect / Exit edit mode',
      action: () => {
        const context = this.shortcuts.getCurrentContext();
        if (context === FocusContext.TEXT_EDITING) {
          // خروج از حالت ویرایش متن
          (document.activeElement as HTMLElement)?.blur();
        } else {
          // لغو انتخاب بلاک
          this.pageBuilder.deSelectBlock();
        }
      },
    });

    // ========================================
    // SAVE - ذخیره (در همه context ها)
    // ========================================
    this.shortcuts.register('save', {
      key: 's',
      ctrl: true,
      contexts: [FocusContext.CANVAS, FocusContext.TEXT_EDITING, FocusContext.SIDEBAR],
      description: 'Save page',
      action: () => {
        this.pageBuilder.save();
      },
    });

    // ========================================
    // ARROW KEYS - حرکت بلاک (فقط در CANVAS)
    // ========================================
    // const moveDistance = 1;
    // const moveDistanceLarge = 10;

    // this.shortcuts.register('move-up', {
    //   key: 'ArrowUp',
    //   contexts: [FocusContext.CANVAS],
    //   description: 'Move block up',
    //   action: (event) => {
    //     const distance = event.shiftKey ? moveDistanceLarge : moveDistance;
    //     this.pageBuilder.moveActiveBlock(0, -distance);
    //   },
    // });

    // this.shortcuts.register('move-down', {
    //   key: 'ArrowDown',
    //   contexts: [FocusContext.CANVAS],
    //   description: 'Move block down',
    //   action: (event) => {
    //     const distance = event.shiftKey ? moveDistanceLarge : moveDistance;
    //     this.pageBuilder.moveActiveBlock(0, distance);
    //   },
    // });

    // this.shortcuts.register('move-left', {
    //   key: 'ArrowLeft',
    //   contexts: [FocusContext.CANVAS],
    //   description: 'Move block left',
    //   action: (event) => {
    //     const distance = event.shiftKey ? moveDistanceLarge : moveDistance;
    //     this.pageBuilder.moveActiveBlock(-distance, 0);
    //   },
    // });

    // this.shortcuts.register('move-right', {
    //   key: 'ArrowRight',
    //   contexts: [FocusContext.CANVAS],
    //   description: 'Move block right',
    //   action: (event) => {
    //     const distance = event.shiftKey ? moveDistanceLarge : moveDistance;
    //     this.pageBuilder.moveActiveBlock(distance, 0);
    //   },
    // });

    // ========================================
    // debuge log pageinfo
    // ========================================
    this.shortcuts.register('logconsole', {
      key: 'p',
      ctrl: true,
      shift: true,
      alt: true,
      contexts: [FocusContext.CANVAS, FocusContext.TEXT_EDITING, FocusContext.SIDEBAR],
      description: 'log console',
      action: () => {
        console.log(this.pageBuilder.pageInfo);
      },
    });
  }

  /**
   * ✅ Unregister shortcuts
   */
  private unregisterShortcuts(): void {
    const shortcutIds = [
      'delete-block',
      'delete-block-backspace',
      'copy-block',
      'paste-block',
      'duplicate-block',
      'undo',
      'redo',
      'select-all',
      'deselect',
      'save',
      'move-up',
      'move-down',
      'move-left',
      'move-right',
    ];

    shortcutIds.forEach((id) => this.shortcuts.unregister(id));
  }

  /**
   * Get page builder data for save to DB
   * @returns Promise JSONData
   */
  public getData(): Promise<IPageBuilderDto> {
    return preparePageDataForSave(this.pageBuilder.pageInfo);
  }
}
