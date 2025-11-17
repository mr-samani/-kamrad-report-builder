import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { ComponentDataContext } from '../../models/ComponentDataContext';
import { COMPONENT_DATA } from '../../models/tokens';
import { DataSourceSetting } from '../../models/DataSourceSetting';
import { PageItem } from '../../models/PageItem';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-collection-item',
  templateUrl: './collection-item.component.html',
  styleUrls: ['./collection-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionItemComponent implements OnInit {
  pageItem!: PageItem;
  subscription: Subscription;
  constructor(
    @Inject(COMPONENT_DATA) private context: ComponentDataContext<DataSourceSetting>,
    private chdRef: ChangeDetectorRef,
  ) {
    this.subscription = this.context.onChange.subscribe((data) => {
      this.pageItem.dataSource = data;
      this.chdRef.detectChanges();
    });
  }

  ngOnInit() {}
}
