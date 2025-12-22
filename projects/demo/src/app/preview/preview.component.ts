import { Component, OnInit } from '@angular/core';
import { IPageBuilderDto, NgxPagePreviewComponent } from '@ngx-page-builder';
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

  data: IPageBuilderDto;
  constructor() {
    this.data = JSON.parse(localStorage.getItem('page') || '{}');
  }

  ngOnInit() {}
}
