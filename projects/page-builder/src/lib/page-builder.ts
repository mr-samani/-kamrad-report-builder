import { CommonModule } from '@angular/common';
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
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { BlockSelectorComponent } from '../components/block-selector/block-selector.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { PageBuilderBaseComponent } from './page-builder-base-component';
import { IStorageService } from '../services/storage/IStorageService';
import { STORAGE_SERVICE } from '../services/storage/token.storage';
import { PageBuilderConfiguration } from '../models/PageBuilderConfiguration';
import { DynamicDataStructure } from '../models/DynamicData';
import { fromEvent, Subscription } from 'rxjs';
import { SideConfigComponent } from '../components/side-config/side-config.component';
import { PAGE_BUILDER_CONFIGURATION } from '../models/tokens';
import { PageItemChange } from '../services/page-builder.service';
import { PageBuilderDto } from '../models/PageBuilderDto';
import { NgxPgNotifyModule, Notify } from '../extensions/notify';
import { SvgIconDirective } from '../directives/svg-icon.directive';

@Component({
  selector: 'ngx-page-builder',
  templateUrl: './page-builder.html',
  styleUrls: ['../styles/paper.scss', './page-builder.scss'],
  imports: [
    CommonModule,
    NgxDragDropKitModule,
    SafeHtmlPipe,
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
  @Input('dynamicData') set setDynamicData(val: DynamicDataStructure[]) {
    this.dynamicDataService.dynamicData = val ?? [];
  }
  private _pageBody = viewChild<ElementRef<HTMLElement>>('PageBody');
  private _pageHeader = viewChild<ElementRef<HTMLElement>>('PageHeader');
  private _pageFooter = viewChild<ElementRef<HTMLElement>>('PageFooter');

  subscriptions: Subscription[] = [];

  constructor(
    injector: Injector,
    @Inject(PAGE_BUILDER_CONFIGURATION) private mainConfig: PageBuilderConfiguration,
    @Inject(STORAGE_SERVICE) private storageService: IStorageService,
    @Inject(DOCUMENT) private doc: Document,
  ) {
    super(injector);
    this.pageBuilderService.mode = 'Edit';
    this.pageBuilderService.pageBody = this._pageBody;
    this.pageBuilderService.pageHeader = this._pageHeader;
    this.pageBuilderService.pageFooter = this._pageFooter;
    this.pageBuilderService.changed$.subscribe((data: PageItemChange) => {
      if (data.type == 'ChangePageConfig') {
        this.chdRef.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    this.loadPageData();
    this.subscriptions = [
      fromEvent<KeyboardEvent>(this.doc, 'keydown').subscribe((ev) => this.deleteCurrentBlock(ev)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  preventDefault() {}
  async loadPageData() {
    try {
      let data = await this.storageService.loadData();
      this.pageBuilderService.pageInfo = PageBuilderDto.fromJSON(data);
      console.log('load data:', data, 'converted class:', this.pageBuilderService.pageInfo);
      if (this.pageBuilderService.pageInfo.pages.length == 0) {
        await this.pageBuilderService.addPage();
        return;
      } else {
        await this.pageBuilderService.changePage(1);
        console.log('after load:', this.pageBuilderService.pageInfo);
      }
    } catch (error) {
      await this.pageBuilderService.addPage();
      console.error('Error loading page data:', error);
      Notify.error('Error loading page data: ' + error);
    }
  }

  deleteCurrentBlock(ev: KeyboardEvent) {
    if (ev.key === 'Delete') {
      const currentBlock = this.pageBuilderService.activeEl();
      if (currentBlock) {
        this.pageBuilderService.removeBlock(currentBlock);
      }
    }
  }
}
