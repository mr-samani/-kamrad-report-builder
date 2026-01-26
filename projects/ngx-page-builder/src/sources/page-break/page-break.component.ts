import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { PageItem } from '../../models/PageItem';

@Component({
  selector: 'page-break',
  templateUrl: './page-break.component.html',
  styleUrls: ['./page-break.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageBreakComponent implements OnInit {
  // inputs auto filled by create dynamic element
  @Input() editMode: boolean = false;
  @Input() pageItem!: PageItem;
  constructor() {}

  ngOnInit() {}
}
