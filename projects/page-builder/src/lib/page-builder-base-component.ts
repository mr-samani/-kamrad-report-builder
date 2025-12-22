import { ChangeDetectorRef, inject, Injector } from '@angular/core';
import { DynamicElementService } from '../services/dynamic-element.service';
import { PageBuilderService } from '../services/page-builder.service';
import { PreviewService } from '../services/preview.service';
import { DynamicDataService } from '../services/dynamic-data.service';
import { PageBuilderShortcutService } from '../services/shortcut.service';
import { LibConsts } from '../consts/defauls';
import { ViewMode } from '../consts/ViewMode';

export abstract class PageBuilderBaseComponent {
  readonly dynamicElementService = inject(DynamicElementService);
  readonly pageBuilder = inject(PageBuilderService);
  readonly previewService = inject(PreviewService);
  readonly chdRef = inject(ChangeDetectorRef);

  readonly dynamicDataService = inject(DynamicDataService);

  readonly shortcuts = inject(PageBuilderShortcutService);

  constructor(injector: Injector) {}

  set viewMode(val: ViewMode) {
    LibConsts.viewMode = val;
  }
  get viewMode() {
    return LibConsts.viewMode;
  }
}
