import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit } from '@angular/core';
import { PageBuilderBaseComponent } from '../page-builder-base-component';

@Component({
  selector: 'page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class PageHeaderComponent extends PageBuilderBaseComponent implements OnInit {
  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {}
}
