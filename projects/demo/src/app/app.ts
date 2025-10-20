import { Component, signal } from '@angular/core';
import { NgxPageBuilder } from '@ngx-page-builder';
@Component({
  selector: 'app-root',
  imports: [NgxPageBuilder],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('demo');
}
