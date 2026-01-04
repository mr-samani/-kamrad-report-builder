import { CommonModule } from '@angular/common';
import { Component, effect, Injector, OnInit, Type, ViewChild } from '@angular/core';
import { BaseComponent } from '../BaseComponent';
import { PageItem } from '../../models/PageItem';
import { TextBindingComponent } from '../text-binding/text-binding.component';
import { DynamicDataService } from '../../services/dynamic-data.service';
import { DynamicDataStructure } from '../../models/DynamicData';

@Component({
  selector: 'block-settings',
  templateUrl: './block-settings.component.html',
  styleUrls: ['./block-settings.component.scss'],
  standalone: true,
  imports: [CommonModule, TextBindingComponent],
})
export class BlockSettingsComponent extends BaseComponent implements OnInit {
  item?: PageItem;
  settingComponent?: Type<any>;
  @ViewChild('settingsContainer', { static: true }) settingsContainer!: HTMLElement;

  parentCollection?: PageItem;
  collectionDsList: DynamicDataStructure[] = [];

  constructor(
    injector: Injector,
    private dynamicDataService: DynamicDataService,
  ) {
    super(injector);
    effect(async () => {
      this.item = this.pageBuilder.activeEl();
      this.checkParentIsCollection();

      if (
        this.item &&
        this.item.customComponent &&
        typeof this.item.customComponent.componentSettings === 'function'
      ) {
        this.settingComponent = await this.item.customComponent.componentSettings();
      } else {
        this.settingComponent = undefined;
      }
      this.chdRef.detectChanges();
    });
  }

  ngOnInit() {}
  onChangeProperties() {
    if (this.item) this.pageBuilder.changedProperties(this.item);
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
