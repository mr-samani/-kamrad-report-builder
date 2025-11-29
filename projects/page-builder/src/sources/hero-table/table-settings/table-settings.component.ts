import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { ComponentDataContext } from '../../../models/ComponentDataContext';
import { COMPONENT_DATA } from '../../../models/tokens';
import { DynamicDataService } from '../../../services/dynamic-data.service';
import { FormsModule } from '@angular/forms';
import { DynamicDataStructure } from '../../../models/DynamicData';
import { TableSetting } from '../table-setting';
import { SwitchComponent } from '../../../controls/switch/switch.component';

@Component({
  selector: 'app-table-settings',
  templateUrl: './table-settings.component.html',
  styleUrls: ['./table-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SwitchComponent],
})
export class HeroTableSettingsComponent implements OnInit {
  settings: TableSetting = {};

  collectionDataSource: DynamicDataStructure[] = [];
  constructor(
    @Inject(COMPONENT_DATA) private context: ComponentDataContext<TableSetting>,
    public dynamicDataService: DynamicDataService,
  ) {
    this.settings = this.context.data || new TableSetting();
    this.collectionDataSource = this.dynamicDataService.dynamicData.filter((x) => x.list);
  }

  ngOnInit() {}

  update() {
    this.context.onChange.next(this.settings);
  }
}
