import { ChangeDetectorRef, inject, Injector } from '@angular/core';
import { DynamicElementService } from '../services/dynamic-element.service';
import { PageBuilderService } from '../services/page-builder.service';
import { PreviewService } from '../services/preview.service';
import { DynamicDataService } from '../services/dynamic-data.service';

export abstract class PageBuilderBaseComponent {
  readonly dynamicElementService = inject(DynamicElementService);
  readonly pageBuilderService = inject(PageBuilderService);
  readonly previewService = inject(PreviewService);
  readonly chdRef = inject(ChangeDetectorRef);

  readonly dynamicDataService = inject(DynamicDataService);

  constructor(injector: Injector) {}
}
