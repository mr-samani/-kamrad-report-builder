import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PageBuilderService } from '../../services/page-builder.service';
import { PageBuilderConfig } from '../../models/PageBuilderDto';
import { MatButtonModule } from '@angular/material/button';
import { PageOrientation, PageSize } from '../../models/types';

@Component({
  selector: 'app-config-dialog',
  templateUrl: './config-dialog.component.html',
  styleUrls: ['../../styles/paper.scss', './config-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule],
})
export class ConfigDialogComponent implements OnInit {
  configs: PageBuilderConfig;
  sizeList: PageSize[] = ['A4', 'A5', 'Letter'];
  orientationList: PageOrientation[] = ['Portrait', 'Landscape'];
  constructor(
    @Inject(MAT_DIALOG_DATA) _data: any,
    private dialogRef: MatDialogRef<ConfigDialogComponent>,
    private pageBuilder: PageBuilderService,
  ) {
    this.configs = Object.assign({}, pageBuilder.pageInfo.config);
  }

  ngOnInit() {}

  ok() {
    this.pageBuilder.pageInfo.config = this.configs;
    this.pageBuilder.updateChangeDetection({ item: null, type: 'ChangePageConfig' });
    this.dialogRef.close(true);
  }
}
