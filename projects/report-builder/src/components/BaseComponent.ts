import { Injector } from '@angular/core';
import { PageBuilderService } from '../services/page-builder.service';

export class BaseComponent {
  protected pageBuilderService: PageBuilderService;
  constructor(protected injector: Injector) {
    this.pageBuilderService = this.injector.get(PageBuilderService);
  }
}
