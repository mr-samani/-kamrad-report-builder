import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CssClassesEditorComponent } from '../../components/css-classes-editor/css-classes-editor.component';

@Component({
  selector: 'app-css-file-dialog',
  templateUrl: './css-file-dialog.component.html',
  styleUrls: ['./css-file-dialog.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, ReactiveFormsModule, CssClassesEditorComponent],
})
export class CssFileDialogComponent {
  classesControl: FormControl<Record<string, string> | null>;

  constructor(
    public dialogRef: MatDialogRef<CssFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { classes?: Record<string, string> },
  ) {
    this.classesControl = new FormControl(data.classes || {});
  }

  onSave(): void {
    if (this.classesControl.value) {
      this.dialogRef.close(this.classesControl.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
