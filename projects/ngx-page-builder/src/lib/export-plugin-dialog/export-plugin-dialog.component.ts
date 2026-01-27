import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { PluginService } from '../../services/plugin/plugin.service';
import { IPlugin } from '../../contracts/IPlugin';
import { PageItem } from '../../models/PageItem';
import { Notify } from '../../extensions/notify';
import { LoadingComponent } from '../../controls/loading/loading.component';

@Component({
  selector: 'app-export-plugin-dialog',
  templateUrl: './export-plugin-dialog.component.html',
  styleUrls: ['./export-plugin-dialog.component.scss'],
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingComponent,
  ],
})
export class ExportPluginDialogComponent implements OnInit {
  name = '';
  img = '';

  plugin?: IPlugin;
  loading = true;
  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: PageItem,
    private dialogRef: MatDialogRef<ExportPluginDialogComponent>,
    private pluginService: PluginService,
    private chdr: ChangeDetectorRef,
  ) {
    this.loading = true;
    pluginService
      .getPlugin(_data)
      .then((p) => {
        this.plugin = p;
        this.img = p.image;
        this.name = p.name;
        this.loading = false;
        chdr.detectChanges();
      })
      .catch((error) => {
        Notify.error(error);
        dialogRef.close();
      });
  }

  ngOnInit() {}

  ok(ev?: Event) {
    if (ev) {
      ev.stopPropagation();
      ev.preventDefault();
    }
    if (!this.plugin || !this.name) return;
    this.plugin.name = this.name;
    this.pluginService.save(this.plugin);
    this.dialogRef.close(true);
  }
}
