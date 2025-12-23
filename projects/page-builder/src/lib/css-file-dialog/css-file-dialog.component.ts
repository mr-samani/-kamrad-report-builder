import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CssClassesEditorComponent } from '../../components/css-classes-editor/css-classes-editor.component';
import { FileSelector } from '../../helper/FileSelector';
import { ClassManagerService } from '../../services/class-manager.service';
import { TabGroupModule } from '../../controls/tab-group/tab-group.module';
import { LibConsts } from '../../consts/defauls';

@Component({
  selector: 'app-css-file-dialog',
  templateUrl: './css-file-dialog.component.html',
  styleUrls: ['./css-file-dialog.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    CssClassesEditorComponent,
    TabGroupModule,
    FormsModule,
  ],
})
export class CssFileDialogComponent {
  loading = false;
  enableAddCssFile = LibConsts.enableAddCssFile;
  constructor(
    public dialogRef: MatDialogRef<CssFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { classes?: Record<string, string> },
    public cls: ClassManagerService,
    private chdRef: ChangeDetectorRef,
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  async addFile() {
    try {
      this.loading = true;
      const file = await FileSelector.selectFile({
        accept: ['text/css', '.css'],
      });
      const text = await file.text();
      await this.cls.addCssFile(file.name.split('.')[0], text);
      this.loading = false;
      this.chdRef.detectChanges();
    } catch (err) {
      console.log(err);
      this.loading = false;
    }
  }
}
