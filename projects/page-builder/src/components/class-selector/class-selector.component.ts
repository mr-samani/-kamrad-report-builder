import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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

@Component({
  selector: 'class-selector',
  templateUrl: './class-selector.component.html',
  styleUrls: ['./class-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ClassSelectorComponent),
      multi: true,
    },
  ],
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassSelectorComponent extends BaseControl implements OnInit, ControlValueAccessor {
  @Output() change = new EventEmitter<PageItem>();

  constructor(
    injector: Injector,
    private cdr: ChangeDetectorRef,
    public cls: ClassManagerService,
  ) {
    super(injector);
  }

  ngOnInit() {}

  writeValue(item: PageItem): void {
    this.item = item;
    this.el = item?.el;

    this.cdr.detectChanges();
  }

  update() {
    if (!this.el || !this.item) return;

    this.cdr.detectChanges();
    this.onChange(this.item);
    this.item.style = mergeCssStyles(this.item.style, this.el.style.cssText);
    this.change.emit(this.item);
  }

  clear(property: any) {
    property = undefined;
  }
}
