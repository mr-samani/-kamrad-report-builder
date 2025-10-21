import { CommonModule } from '@angular/common';
import { Component, effect, Inject, Injector, OnInit } from '@angular/core';
import { PageBuilderBaseComponent } from '../page-builder-base-component';
import { sanitizeForStorage } from '../../utiles/sanitizeForStorage';
import { LOCAL_STORAGE_SAVE_KEY } from '../../consts/defauls';
import { FormsModule } from '@angular/forms';
import { STORAGE_SERVICE } from '../../services/storage/token.storage';
import { IStorageService } from '../../services/storage/IStorageService';

@Component({
  selector: 'toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ToolbarComponent extends PageBuilderBaseComponent implements OnInit {
  pageNumber: number = 1;
  isSaving: boolean = false;
  constructor(
    injector: Injector,
    @Inject(STORAGE_SERVICE) private storageService: IStorageService
  ) {
    super(injector);
    effect(() => {
      this.pageNumber = this.pageBuilderService.currentPageIndex() + 1;
    });
  }

  ngOnInit() {}

  changePage() {
    this.pageBuilderService.changePage(this.pageNumber).then((index) => {
      this.pageNumber = index + 1;
    });
  }

  addPage() {
    this.pageBuilderService.addPage().then((index) => {
      this.pageNumber = index + 1;
    });
  }

  onSave() {
    this.isSaving = true;
    this.storageService
      .saveData()
      .then((result) => {
        console.log('Data saved successfully:', result);
        alert('Data saved successfully');
      })
      .finally(() => (this.isSaving = false));
  }

  toggleOutlines() {
    this.pageBuilderService.showOutlines = !this.pageBuilderService.showOutlines;
  }
  deSelectBlock() {
    this.pageBuilderService.deSelectBlock();
  }

  print() {
    if (this.pageBuilderService.page()) {
      this.printService.print({
        html: this.pageBuilderService.page()?.nativeElement,
        size: 'A4',
        orientation: 'portrait',
      });
    }
  }
  openConfigDialog() {
    throw new Error('Method not implemented.');
  }
}
