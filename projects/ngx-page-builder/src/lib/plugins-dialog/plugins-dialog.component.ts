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
import { SvgIconDirective } from '../../directives/svg-icon.directive';

@Component({
  selector: 'app-plugins-dialog',
  templateUrl: './plugins-dialog.component.html',
  styleUrls: ['./plugins-dialog.component.scss'],
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingComponent,
    SvgIconDirective,
  ],
})
export class PluginsDialogComponent implements OnInit {
  plugins: IPlugin[] = [];
  loading = true;
  search = '';

  take = 20;
  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: PageItem,
    private dialogRef: MatDialogRef<PluginsDialogComponent>,
    private pluginService: PluginService,
    private chdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.getList();
  }

  getList() {
    this.loading = true;
    const skip = this.plugins.length;
    this.pluginService
      .getAllPlugins(this.take, skip, this.search)
      .finally(() => (this.loading = false))
      .then((p) => {
        this.plugins = [...this.plugins, ...(p ?? [])];
        this.chdr.detectChanges();
      })
      .catch((error) => {
        Notify.error(error);
        this.dialogRef.close();
      });
  }

  filterList() {
    this.plugins = [];
    this.getList();
  }

  ok(plugin: IPlugin) {
    if (!plugin) return;
    this.pluginService.addToForm(plugin).catch((err) => Notify.error(err));
    this.dialogRef.close(true);
  }
}
