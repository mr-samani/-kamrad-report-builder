import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../BaseComponent';
import { BlockPropertiesComponent } from '../block-properties/block-properties.component';
import { BlockLayoutsComponent } from '../block-layouts/block-layouts.component';

@Component({
  selector: 'side-config',
  templateUrl: './side-config.component.html',
  styleUrls: ['./side-config.component.scss'],
  standalone: true,
  imports: [CommonModule, BlockPropertiesComponent, BlockLayoutsComponent],
})
export class SideConfigComponent extends BaseComponent implements OnInit {
  selectedTab: 'layouts' | 'properties' = 'properties';
  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {}
}
