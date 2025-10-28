import { Component, OnInit } from '@angular/core';
import { NgxPagePreviewComponent, PageBuilderDto } from '@ngx-page-builder';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css'],
  imports: [NgxPagePreviewComponent],
})
export class PreviewComponent implements OnInit {
  data = new PageBuilderDto();
  constructor() {
    this.data = JSON.parse(localStorage.getItem('page') || '{}');
  }

  ngOnInit() {}
}
