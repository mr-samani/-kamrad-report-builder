
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PageBuilderService } from '../../services/page-builder.service';
import { IDropEvent, moveItemInArray, NgxDragDropKitModule } from 'ngx-drag-drop-kit';
import { Page } from '../../models/Page';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sort-page-list',
  templateUrl: './sort-page-list.component.html',
  styleUrls: ['./sort-page-list.component.scss'],
  standalone: true,
  imports: [MatDialogModule, NgxDragDropKitModule, MatButtonModule],
})
export class SortPageListComponent implements OnInit {
  pageList: Page[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) _data: any,
    private dialogRef: MatDialogRef<SortPageListComponent>,
    private pageBuilderService: PageBuilderService,
  ) {
    this.pageList = [...(pageBuilderService.pageInfo.pages ?? [])];
    this.pageList.map((m, index) => (m.order = index));
  }

  ngOnInit() {}

  ok() {
    this.pageBuilderService.pageInfo.pages = this.pageList;
    this.dialogRef.close(true);
  }
  onDrop(event: IDropEvent) {
    if (event.previousIndex == event.currentIndex) {
      return;
    }
    moveItemInArray(this.pageList, event.previousIndex, event.currentIndex);
  }
}
