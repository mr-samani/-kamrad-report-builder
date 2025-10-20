import { DOCUMENT, inject, Inject, Injector } from '@angular/core';
import { PageBuilderService } from '../services/page-builder.service';

export class BaseComponent {
  protected pageBuilderService: PageBuilderService;
  protected doc: Document;
  constructor(protected injector: Injector) {
    this.pageBuilderService = this.injector.get(PageBuilderService);
    this.doc = this.injector.get(DOCUMENT);
  }
}
