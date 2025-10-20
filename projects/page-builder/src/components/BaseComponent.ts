import { ChangeDetectorRef, DestroyRef, DOCUMENT, inject, Inject, Injector } from '@angular/core';
import { PageBuilderService } from '../services/page-builder.service';

export class BaseComponent {
  protected pageBuilderService: PageBuilderService;
  protected doc: Document;
  protected chdRef: ChangeDetectorRef;
  protected destroyRef: DestroyRef;
  constructor(protected injector: Injector) {
    this.pageBuilderService = this.injector.get(PageBuilderService);
    this.doc = this.injector.get(DOCUMENT);
    this.chdRef = this.injector.get(ChangeDetectorRef);
    this.destroyRef = this.injector.get(DestroyRef);
  }
}
