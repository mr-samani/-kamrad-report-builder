import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'page-break',
  templateUrl: './page-break.component.html',
  styleUrls: ['./page-break.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageBreakComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
