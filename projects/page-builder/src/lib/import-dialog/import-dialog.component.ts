import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  ImportHtmlService,
  ImportOptions,
  ImportResult,
} from '../../services/import-export/import-html.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PreviewImportTreeComponent } from './preview-import-tree/preview-import-tree.component';
import { SvgIconDirective } from '../../directives/svg-icon.directive';
import { Notify } from '../../extensions/notify';
import { MatAnchor } from '@angular/material/button';

@Component({
  selector: 'app-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    PreviewImportTreeComponent,
    SvgIconDirective,
    MatAnchor,
  ],
  providers: [ImportHtmlService],
})
export class ImportDialogComponent implements OnInit {
  urlInput = '';
  querySelectorInput = '';
  htmlInput = '';
  result?: ImportResult;
  showJson = false;

  // تنظیمات پیشرفته
  importOptions: ImportOptions = {
    allowedAttributes: [
      'src',
      'href',
      'alt',
      'title',
      'colspan',
      'rowspan',
      'target',
      'rel',
      'type',
      'name',
      'value',
      'placeholder',
      'data-*',
      'aria-*',
    ],
    preserveInlineStyles: true,
    extractComputedStyles: false,
    styleFilter: (propertyName: string, value: string) => {
      // فیلتر سفارشی: فقط استایل‌های خاص
      const importantStyles = [
        'display',
        'position',
        'width',
        'height',
        'margin',
        'padding',
        'background',
        'color',
        'font-size',
        'text-align',
        'border',
      ];

      return importantStyles.some((style) => propertyName.startsWith(style));
    },
  };
  loading: boolean = false;
  constructor(
    private dialogRef: MatDialogRef<ImportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) _data: any,
    private importer: ImportHtmlService,
    private chdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {}

  importFromUrl(resultSection: HTMLElement) {
    if (!this.urlInput || !this.querySelectorInput) {
      Notify.warning('لطفاً URL و Query Selector را وارد کنید');
      return;
    }
    this.loading = true;

    this.importer
      .importFromUrl(this.urlInput, this.querySelectorInput, this.importOptions)
      .finally(() => (this.loading = false))
      .then((result) => {
        this.result = result;
        Notify.success('Import successfully');
        setTimeout(() => {
          resultSection.scrollIntoView();
        }, 100);
        this.chdr.detectChanges();
      });
  }

  async importFromHtml(resultSection: HTMLElement) {
    if (!this.htmlInput) {
      Notify.warning('لطفاً محتوای HTML را وارد کنید');
      return;
    }
    this.loading = true;
    this.importer
      .importFromHtml(this.htmlInput, this.importOptions)
      .finally(() => (this.loading = false))
      .then((result) => {
        this.result = result;
        Notify.success('Import successfully');
        setTimeout(() => {
          resultSection.scrollIntoView();
        }, 100);
        this.chdr.detectChanges();
      });
  }

  getJsonOutput(): string {
    if (!this.result?.data) return '';
    return this.importer.exportToJson(this.result.data);
  }

  ok() {
    if (this.loading || !this.result || !this.result.data) return;
    this.dialogRef.close(this.result.data);
  }
}
