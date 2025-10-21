import { ChangeDetectorRef, inject, Injector } from '@angular/core';
import { DynamicElementService } from '../services/dynamic-element.service';
import { PageBuilderService } from '../services/page-builder.service';
import { PrintService } from '../services/print.service';

export abstract class PageBuilderBaseComponent {
  readonly dynamicElementService = inject(DynamicElementService);
  readonly pageBuilderService = inject(PageBuilderService);
  readonly printService = inject(PrintService);
  readonly chdRef = inject(ChangeDetectorRef);

  constructor(injector: Injector) {}
}
