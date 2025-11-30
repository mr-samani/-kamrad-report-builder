
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  Injector,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { BaseComponent } from '../BaseComponent';
import { PageItem } from '../../models/PageItem';
import { SpacingControlComponent } from '../../controls/spacing-control/spacing-control.component';
import { FormsModule } from '@angular/forms';
import { TypographyControlComponent } from '../../controls/typography-control/typography-control.component';
import { BackgroundControlComponent } from '../../controls/beckground-control/background-control.component';
import { DisplayControlComponent } from '../../controls/display-control/display-control.component';
import { TextCssControlComponent } from '../../controls/textcss-control/textcss-control.component';
import { SizeControlComponent } from '../../controls/size-control/size-control.component';
import { DynamicDataStructure } from '../../models/DynamicData';
import { TextBindingComponent } from '../text-binding/text-binding.component';
import { DynamicDataService } from '../../services/dynamic-data.service';

@Component({
  selector: 'block-properties',
  templateUrl: './block-properties.component.html',
  styleUrls: ['./block-properties.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    SpacingControlComponent,
    TypographyControlComponent,
    BackgroundControlComponent,
    DisplayControlComponent,
    TextCssControlComponent,
    SizeControlComponent,
    TextBindingComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class BlockPropertiesComponent extends BaseComponent implements OnInit {
  item?: PageItem;

  parentCollection?: PageItem;
  collectionDsList: DynamicDataStructure[] = [];

  constructor(
    injector: Injector,
    private dynamicDataService: DynamicDataService,
  ) {
    super(injector);
    effect(() => {
      this.item = this.pageBuilderService.activeEl();
      // console.log('updated properties', this.item);
      this.checkParentIsCollection();

      this.chdRef.detectChanges();
    });
  }

  ngOnInit() {}

  onChangeProperties() {
    if (this.item) this.pageBuilderService.changedProperties(this.item);
  }

  checkParentIsCollection() {
    this.parentCollection = this.parentCollectionItem(this.item);
    if (this.parentCollection) {
      const { id, skipCount, maxResultCount } = this.parentCollection.dataSource!;
      let dsList = this.dynamicDataService.getCollectionData(id, skipCount, maxResultCount);
      this.collectionDsList = dsList.length > 0 ? dsList[0] : [];
    }
  }

  parentCollectionItem(item?: PageItem): PageItem | undefined {
    if (!item) return undefined;
    if (item.dataSource?.id) {
      // if (item.template || item.customComponent?.componentKey == 'NgxPgHeroTable') {
      return item;
    }
    if (item.parent) {
      return this.parentCollectionItem(item.parent);
    }
    return undefined;
  }
}
