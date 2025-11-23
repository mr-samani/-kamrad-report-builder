import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { ComponentDataContext } from '../../../models/ComponentDataContext';
import { COMPONENT_DATA } from '../../../models/tokens';
import { DataSourceSetting } from '../../../models/DataSourceSetting';
import { DynamicDataService } from '../../../services/dynamic-data.service';
import { FormsModule } from '@angular/forms';
import { DynamicDataStructure } from '../../../models/DynamicData';

@Component({
  selector: 'app-table-settings',
  templateUrl: './table-settings.component.html',
  styleUrls: ['./table-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class HeroTableSettingsComponent implements OnInit {
  settings: DataSourceSetting = {};

  collectionDataSource: DynamicDataStructure[] = [];
  constructor(
    @Inject(COMPONENT_DATA) private context: ComponentDataContext<DataSourceSetting>,
    public dynamicDataService: DynamicDataService,
  ) {
    this.settings = this.context.data || new DataSourceSetting();
    this.collectionDataSource = this.dynamicDataService.dynamicData.filter((x) => x.list);
  }

  ngOnInit() {}

  update() {
    this.context.onChange.next(this.settings);
  }
}
