import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { ComponentDataContext } from '../../../models/ComponentDataContext';
import { COMPONENT_DATA } from '../../../models/tokens';
import { DataSourceSetting } from '../../../models/DataSourceSetting';
import { DynamicDataService } from '../../../services/dynamic-data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-collection-settings',
  templateUrl: './collection-settings.component.html',
  styleUrls: ['./collection-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class DataSourceSettingsComponent implements OnInit {
  settings: DataSourceSetting = {};
  constructor(
    @Inject(COMPONENT_DATA) private context: ComponentDataContext<DataSourceSetting>,
    public dynamicDataService: DynamicDataService,
  ) {
    this.settings = this.context.data || new DataSourceSetting();
  }

  ngOnInit() {}

  update() {
    this.context.onChange.next(this.settings);
  }
}
