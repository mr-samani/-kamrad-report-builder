import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit } from '@angular/core';
import { PageBuilderBaseComponent } from '../page-builder-base-component';

@Component({
  selector: 'page-footer',
  templateUrl: './page-footer.component.html',
  styleUrls: ['./page-footer.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class PageFooterComponent extends PageBuilderBaseComponent implements OnInit {
  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {}
}
