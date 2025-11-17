import { Component, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
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
