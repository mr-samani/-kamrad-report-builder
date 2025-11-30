import { Component, OnInit } from '@angular/core';
import { NgxPagePreviewComponent, PageBuilderDto } from '@ngx-page-builder';
import { DynamicData } from '../dynamic-data/dynamic-data';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
  imports: [NgxPagePreviewComponent, FormsModule],
})
export class PreviewComponent implements OnInit {
  dynamicData = DynamicData;

  data = new PageBuilderDto();
  constructor() {
    this.data = JSON.parse(localStorage.getItem('page') || '{}');
  }

  ngOnInit() {}
}
