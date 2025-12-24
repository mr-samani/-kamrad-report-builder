import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageItem } from '../../models/PageItem';
import { ClassManagerService } from '../../services/class-manager.service';
import { PageBuilderService } from '../../public-api';
import { SvgIconDirective } from '../../directives/svg-icon.directive';
import { Notify } from '../../extensions/notify';

export interface IClassOutput {
  name: string;
  value: string;
}
@Component({
  selector: 'class-selector',
  templateUrl: './class-selector.component.html',
  styleUrls: ['./class-selector.component.scss'],

  standalone: true,
  imports: [FormsModule, SvgIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassSelectorComponent implements OnInit {
  @Output() selectedCss = new EventEmitter<IClassOutput>();
  item?: PageItem;

  activeClass = '';
  showAddClassBtn = true;
  constructor(
    private cdr: ChangeDetectorRef,
    public cls: ClassManagerService,
    private pageBuilder: PageBuilderService,
  ) {
    effect(() => {
      this.item = this.pageBuilder.activeEl();
      if (this.item) {
        this.onSelectClass(this.item.classList[0]);
      }
    });
  }

  ngOnInit() {}

  writeValue(item: PageItem): void {
    this.item = item;

    this.cdr.detectChanges();
  }

  onAddClass(ev: any) {
    if (this.item && this.item.classList) {
      const val = ev.currentTarget?.value;
      if (this.item.classList.indexOf(val) == -1) {
        this.item.classList.push(val);
      }
      this.onSelectClass(val);
      this.showAddClassBtn = true;
    }
  }

  onSelectClass(className: string) {
    if (!this.item) return;
    this.activeClass = className;
    const css = this.cls.getClassValue(className);
    this.cdr.detectChanges();
    this.selectedCss.emit({
      name: className,
      value: css,
    });
  }

  remove(index: number) {
    if (this.item?.classList.length == 1) {
      Notify.error('Can not delete all classes!');
      return;
    }
    if (this.item && this.item.classList) {
      this.item.classList.splice(index, 1);
    }
  }

  clear(property: any) {
    property = undefined;
  }
}
