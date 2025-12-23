import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  EventEmitter,
  forwardRef,
  Injector,
  OnInit,
  Output,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, FormsModule, ControlValueAccessor } from '@angular/forms';
import { PageItem } from '../../models/PageItem';
import { mergeCssStyles } from '../../utiles/merge-css-styles';
import { BaseControl } from '../../controls/base-control';
import { ClassManagerService } from '../../services/class-manager.service';
import { PageBuilderService } from '../../public-api';
import { SvgIconDirective } from '../../directives/svg-icon.directive';
import { Notify } from '../../extensions/notify';

@Component({
  selector: 'class-selector',
  templateUrl: './class-selector.component.html',
  styleUrls: ['./class-selector.component.scss'],

  standalone: true,
  imports: [FormsModule, SvgIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassSelectorComponent implements OnInit {
  @Output() selectedCss = new EventEmitter<string>();
  item?: PageItem;

  activeClass = '';
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
      this.item.classList.push(val);
      this.onSelectClass(val);
    }
  }
  onSelectClass(className: string) {
    if (!this.item) return;
    this.activeClass = className;
    const css = this.cls.getClassValue(className);
    this.cdr.detectChanges();
    this.selectedCss.emit(css);
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
