import { Component, OnInit } from '@angular/core';
import {
  NGX_PAGE_BUILDER_FILE_PICKER,
  NGX_PAGE_BUILDER_HTML_EDITOR,
  NgxPageBuilder,
} from '@ngx-page-builder';
import { FilePickerService } from './file-picker.service';
import { DynamicData } from '../dynamic-data/dynamic-data';
import { HtmlEditorService } from './html-editor.service';

@Component({
  selector: 'app-builder',
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.css'],
  imports: [NgxPageBuilder],
  providers: [
    { provide: NGX_PAGE_BUILDER_FILE_PICKER, useClass: FilePickerService },
    { provide: NGX_PAGE_BUILDER_HTML_EDITOR, useClass: HtmlEditorService },
  ],
})
export class BuilderComponent implements OnInit {
  dynamicData = DynamicData;
  constructor() {}

  ngOnInit() {}
}
