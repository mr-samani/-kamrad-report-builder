import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
  viewChild,
} from '@angular/core';
import { PageBuilderDto } from '../../models/PageBuilderDto';
import { DynamicDataStructure } from '../../models/DynamicData';
import { DynamicDataService } from '../../services/dynamic-data.service';
import { LibConsts } from '../../consts/defauls';
import { validateViewMode, ViewMode } from '../../consts/ViewMode';
import { IPageBuilderDto } from '../../contracts/IPageBuilderDto';
import { PagePreviewService } from '../../services/preview.service';
import { IPagebuilderOutput } from '../../public-api';

@Component({
  selector: 'ngx-page-preview',
  template: `<div
    class="ngx-page-builder"
    [class.is-print-page]="isPrintPage"
    [class]="previewService.containerClassName"
    #paper
    [attr.dir]="direction"
  ></div>`,
  styles: `
    .is-print-page {
      position: absolute;
      background: #fff;
      width: 100%;
      display: block;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999999;
    }
  `,
})
export class NgxPagePreviewComponent implements OnInit {
  isPrintPage = false;
  direction = '';
  @Input('dynamicData') set setDynamicData(val: DynamicDataStructure[]) {
    this.dynamicDataService.dynamicData = val;
  }

  @Input('data') set setData(val: IPagebuilderOutput) {
    this.load(val);
  }
  @Input({
    alias: 'viewMode',
    transform: validateViewMode,
  })
  set viewMode(val: ViewMode) {
    LibConsts.viewMode = val;
  }
  get viewMode() {
    return LibConsts.viewMode;
  }

  private paper = viewChild<ElementRef<HTMLElement>>('paper');
  constructor(
    public previewService: PagePreviewService,
    private dynamicDataService: DynamicDataService,
    private renderer: Renderer2,
    private chdRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.renderer.listen(window, 'beforeprint', this.onBeforePrint.bind(this));
  }

  load(val: IPagebuilderOutput) {
    this.direction = val.config.direction;
    setTimeout(() => {
      const pageContainer = this.paper()?.nativeElement;
      if (pageContainer) {
        this.previewService.initializePreview(pageContainer, val);
      }
    });
  }

  onBeforePrint(event: Event): void {
    // لغو عملیات پیش‌فرض پرینت
    event.preventDefault();
    event.stopPropagation();
    this.isPrintPage = true;
    this.chdRef.detectChanges();
    setTimeout(() => {
      window.print();
    });
  }
}
