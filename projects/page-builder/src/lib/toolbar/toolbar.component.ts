import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  Inject,
  Injector,
  OnInit,
} from '@angular/core';
import { PageBuilderBaseComponent } from '../page-builder-base-component';
import { FormsModule } from '@angular/forms';
import { STORAGE_SERVICE } from '../../services/storage/token.storage';
import { IStorageService } from '../../services/storage/IStorageService';
import { MatDialog } from '@angular/material/dialog';
import { ConfigDialogComponent } from '../config-dialog/config-dialog.component';
import { SortPageListComponent } from '../sort-page-list/sort-page-list.component';
import { PageBuilderDto } from '../../models/PageBuilderDto';
import { RouterModule } from '@angular/router';
import { Notify } from '../../extensions/notify';

@Component({
  selector: 'toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent extends PageBuilderBaseComponent implements OnInit {
  pageNumber: number = 1;
  isSaving: boolean = false;
  constructor(
    injector: Injector,
    @Inject(STORAGE_SERVICE) private storageService: IStorageService,
    private matDialog: MatDialog,
  ) {
    super(injector);
    effect(() => {
      this.pageNumber = this.pageBuilderService.currentPageIndex() + 1;
      this.chdRef.detectChanges();
    });
  }

  ngOnInit() {}

  changePage() {
    this.pageBuilderService
      .changePage(this.pageNumber)
      .then((index) => {
        this.pageNumber = index + 1;
      })
      .catch((er) => {
        this.pageNumber = this.pageBuilderService.currentPageIndex() + 1;
      });
  }

  addPage() {
    this.pageBuilderService.addPage().then((index) => {
      this.pageNumber = index + 1;
    });
  }

  removePage() {
    const c = confirm('Are you sure you want to remove this page?');
    if (c) {
      this.pageBuilderService.removePage().then((index) => {
        this.pageNumber = index + 1;
      });
    }
  }
  nextPage() {
    this.pageBuilderService
      .nextPage()
      .then((index) => {
        this.pageNumber = index + 1;
      })
      .catch(() => {});
  }
  previousPage() {
    this.pageBuilderService
      .previousPage()
      .then((index) => {
        this.pageNumber = index + 1;
      })
      .catch(() => {});
  }

  onSave() {
    this.isSaving = true;
    this.storageService
      .saveData()
      .then((result) => {
        console.log('Data saved successfully:', result);
        Notify.success('Data saved successfully');
      })
      .finally(() => (this.isSaving = false));
  }

  async onOpen() {
    try {
      this.pageBuilderService.pageInfo = PageBuilderDto.fromJSON(
        await this.storageService.loadData(),
      );
      if (this.pageBuilderService.pageInfo.pages.length == 0) {
        this.pageBuilderService.addPage();
        return;
      } else {
        this.pageBuilderService.changePage(1);
      }
      this.chdRef.detectChanges();
    } catch (error) {
      console.error('Error loading page data:', error);
      Notify.error('Error loading page data: ' + error);
    }
  }

  toggleOutlines() {
    this.pageBuilderService.showOutlines = !this.pageBuilderService.showOutlines;
  }
  deSelectBlock() {
    this.pageBuilderService.deSelectBlock();
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
          this.pageBuilderService.reloadCurrentPage();
        }
      });
  }
  openConfigDialog() {
    this.matDialog.open(ConfigDialogComponent, {
      panelClass: 'ngx-page-builder',
    });
  }
}
