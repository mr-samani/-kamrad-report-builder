import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { PageItem } from '../../../models/PageItem';
import { PageBuilderService } from '../../../public-api';

@Component({
  selector: 'item-generator',
  templateUrl: './item-generator.component.html',
  styleUrls: ['./item-generator.component.css'],
})
export class ItemGeneratorComponent {
  @Input() set template(val: PageItem | undefined) {
    this.generate(val);
  }

  @ViewChild('itemContainer', { static: true }) itemContainer!: ElementRef<HTMLDivElement>;

  private currentTemplate: PageItem | null = null;

  constructor(private pageBuilderService: PageBuilderService) {}

  async generate(template?: PageItem, force: boolean = false) {
    if (template == this.currentTemplate && !force) {
      return;
    }
    this.clearContainer();
    if (!template) return;

    // ذخیره reference
    this.currentTemplate = template;
    await this.pageBuilderService.createBlockElement(template, this.itemContainer.nativeElement);
  }

  private clearContainer() {
    if (this.currentTemplate)
      this.pageBuilderService.destroyInTree(this.currentTemplate.children, true);
  }

  // برای refresh کردن دستی
  refresh() {
    if (this.currentTemplate) {
      this.generate(this.currentTemplate);
    }
  }
}
