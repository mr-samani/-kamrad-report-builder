import { Component, signal } from '@angular/core';
import { NgxReportBuilder } from '@ngx-report-builder';
@Component({
  selector: 'app-root',
  imports: [NgxReportBuilder],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('demo');
}
