import { ChangeDetectionStrategy, Component, effect, Injector, OnInit } from '@angular/core';
import { PageBuilderBaseComponent } from '../page-builder-base-component';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfigDialogComponent } from '../config-dialog/config-dialog.component';
import { SortPageListComponent } from '../sort-page-list/sort-page-list.component';
import { RouterModule } from '@angular/router';
import { SvgIconDirective } from '../../directives/svg-icon.directive';
import { ImportExportHtmlService } from '../../services/import-export-html.service';

@Component({
  selector: 'toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  standalone: true,
  imports: [FormsModule, RouterModule, SvgIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImportExportHtmlService],
})
export class ToolbarComponent extends PageBuilderBaseComponent implements OnInit {
  pageNumber: number = 1;
  constructor(
    injector: Injector,
    private matDialog: MatDialog,
    private importExportHtmlService: ImportExportHtmlService,
  ) {
    super(injector);
    effect(() => {
      this.pageNumber = this.pageBuilder.currentPageIndex() + 1;
      this.chdRef.detectChanges();
    });
  }

  ngOnInit() {}

  changePage() {
    this.pageBuilder
      .changePage(this.pageNumber)
      .then((index) => {
        this.pageNumber = index + 1;
      })
      .catch((er) => {
        this.pageNumber = this.pageBuilder.currentPageIndex() + 1;
      });
  }

  addPage() {
    this.pageBuilder.addPage().then((index) => {
      this.pageNumber = index + 1;
    });
  }

  removePage() {
    const c = confirm('Are you sure you want to remove this page?');
    if (c) {
      this.pageBuilder.removePage().then((index) => {
        this.pageNumber = index + 1;
      });
    }
  }
  nextPage() {
    this.pageBuilder
      .nextPage()
      .then((index) => {
        this.pageNumber = index + 1;
      })
      .catch(() => {});
  }
  previousPage() {
    this.pageBuilder
      .previousPage()
      .then((index) => {
        this.pageNumber = index + 1;
      })
      .catch(() => {});
  }

  onSave() {
    this.pageBuilder.save();
  }

  async onOpen() {
    await this.pageBuilder.open();
    console.log(this.pageBuilder.pageInfo, this.pageBuilder.pageInfo.pages.length);
    this.chdRef.detectChanges();
  }

  toggleOutlines() {
    this.pageBuilder.showOutlines = !this.pageBuilder.showOutlines;
  }
  deSelectBlock() {
    this.pageBuilder.deSelectBlock();
  }

  print() {
    this.previewService.openPreview(true);
  }
  preview() {
    this.previewService.openPreview();
  }

  previewPage() {
    window.open('/preview');
  }
  sortPages() {
    this.matDialog
      .open(SortPageListComponent)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.pageBuilder.reloadCurrentPage();
        }
      });
  }
  openConfigDialog() {
    this.matDialog
      .open(ConfigDialogComponent, {
        panelClass: 'ngx-page-builder',
      })
      .afterClosed()
      .subscribe((r) => {
        this.chdRef.detectChanges();
      });
  }

  exportHtml() {
    this.importExportHtmlService.exportHtml();
  }
}
