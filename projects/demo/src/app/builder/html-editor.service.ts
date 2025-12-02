import { Injectable } from '@angular/core';
import { IPageBuilderHtmlEditor } from '@ngx-page-builder';

@Injectable()
export class HtmlEditorService implements IPageBuilderHtmlEditor {
  openEditor(): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
