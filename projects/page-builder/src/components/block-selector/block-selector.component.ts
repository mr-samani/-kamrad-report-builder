import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../BaseComponent';

@Component({
  selector: 'block-selector',
  templateUrl: './block-selector.component.html',
  styleUrls: ['./block-selector.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class BlockSelectorComponent extends BaseComponent implements OnInit {
  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    // this.pageBuilderService.activeEl.update((value: ReportItem | null) => {
    //   debugger;
    // });
  }
}
