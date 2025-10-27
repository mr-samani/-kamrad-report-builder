import { Component, signal, viewChild } from '@angular/core';
import { NGX_PAGE_BUILDER_FILE_PICKER, NgxPageBuilder } from '@ngx-page-builder';
import { FilePickerService } from './file-picker.service';
@Component({
  selector: 'app-root',
  imports: [NgxPageBuilder],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [{ provide: NGX_PAGE_BUILDER_FILE_PICKER, useClass: FilePickerService }],
})
export class App {
  filePicker = viewChild<HTMLInputElement>('filePicker');
  protected readonly title = signal('demo');

  imageChooserFn() {
    const filePicker = this.filePicker();
    if (filePicker) {
      filePicker.click();
    }
  }
}
