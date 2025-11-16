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
  @ViewChild('settingsContainer', { static: true }) settingsContainer!: HTMLElement;

  constructor(injector: Injector) {
    super(injector);
    effect(() => {
      this.item = this.pageBuilderService.activeEl();
      this.chdRef.detectChanges();
    });
  }

  ngOnInit() {}
}
