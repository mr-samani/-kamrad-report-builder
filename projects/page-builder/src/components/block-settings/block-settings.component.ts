import { CommonModule } from '@angular/common';
import {
  ApplicationRef,
  Component,
  ComponentRef,
  createComponent,
  effect,
  EnvironmentInjector,
  Injector,
  OnInit,
  reflectComponentType,
  Type,
  ViewChild,
  viewChild,
} from '@angular/core';
import { BaseComponent } from '../BaseComponent';
import { PageItem } from '../../models/PageItem';

@Component({
  selector: 'block-settings',
  templateUrl: './block-settings.component.html',
  styleUrls: ['./block-settings.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class BlockSettingsComponent extends BaseComponent implements OnInit {
  item?: PageItem;
  settingComponent?: Type<any>;
  @ViewChild('settingsContainer', { static: true }) settingsContainer!: HTMLElement;

  constructor(injector: Injector) {
    super(injector);
    effect(async () => {
      this.item = this.pageBuilderService.activeEl();
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
}
