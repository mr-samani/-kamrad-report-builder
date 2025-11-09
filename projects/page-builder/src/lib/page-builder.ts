import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Injector,
  Input,
  OnInit,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgxDragDropKitModule } from 'ngx-drag-drop-kit';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { BlockSelectorComponent } from '../components/block-selector/block-selector.component';
import { BlockPropertiesComponent } from '../components/block-properties/block-properties.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { PageBuilderBaseComponent } from './page-builder-base-component';
import { IStorageService } from '../services/storage/IStorageService';
import { STORAGE_SERVICE } from '../services/storage/token.storage';
import { PAGE_BUILDER_CONFIGURATION, PageBuilderConfiguration } from '../ngx-page-builder.provider';
import { PageBuilderDto } from '../public-api';
import { DynamicDataStructure } from '../models/DynamicData';

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
    BlockPropertiesComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxPageBuilder extends PageBuilderBaseComponent implements OnInit {
  @Input('dynamicData') set setDynamicData(val: DynamicDataStructure) {
    this.dynamicDataService.dynamicData = val;
  }
  private _pageBody = viewChild<ElementRef<HTMLElement>>('PageBody');
  private _pageHeader = viewChild<ElementRef<HTMLElement>>('PageHeader');
  private _pageFooter = viewChild<ElementRef<HTMLElement>>('PageFooter');

  constructor(
    injector: Injector,
    @Inject(PAGE_BUILDER_CONFIGURATION) private mainConfig: PageBuilderConfiguration,
    @Inject(STORAGE_SERVICE) private storageService: IStorageService
  ) {
    super(injector);
    this.pageBuilderService.pageBody = this._pageBody;
    this.pageBuilderService.pageHeader = this._pageHeader;
    this.pageBuilderService.pageFooter = this._pageFooter;
    this.pageBuilderService.changed$.subscribe(() => {
      this.chdRef.detectChanges();
    });
  }

  ngOnInit(): void {
    this.loadPageData();
  }

  preventDefault() {}
  async loadPageData() {
    try {
      this.pageBuilderService.pageInfo = PageBuilderDto.fromJSON(
        await this.storageService.loadData()
      );
      if (this.pageBuilderService.pageInfo.pages.length == 0) {
        this.pageBuilderService.addPage();
        return;
      } else {
        this.pageBuilderService.changePage(1);
      }
    } catch (error) {
      this.pageBuilderService.addPage();
      console.error('Error loading page data:', error);
      alert('Error loading page data: ' + error);
    }
  }
}
