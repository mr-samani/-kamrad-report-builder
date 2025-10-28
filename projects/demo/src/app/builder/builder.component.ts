import { Component, OnInit } from '@angular/core';
import { NGX_PAGE_BUILDER_FILE_PICKER, NgxPageBuilder } from '@ngx-page-builder';
import { FilePickerService } from '../file-picker.service';

@Component({
  selector: 'app-builder',
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.css'],
  imports: [NgxPageBuilder],
  providers: [{ provide: NGX_PAGE_BUILDER_FILE_PICKER, useClass: FilePickerService }],
})
export class BuilderComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
