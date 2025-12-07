import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Injector,
  OnInit,
  Output,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PageItem } from '../../models/PageItem';
import { ISpacingModel } from './ISpacingModel';
import { SpacingFormatter } from './SpacingFormatter';
import { parseSpacingValues, validateSpacing } from './validateSpacing';
import { CommonModule } from '@angular/common';
import { IPosValue } from './IPosValue';
import { BaseControl } from '../base-control';
import { mergeCssStyles } from '../../utiles/merge-css-styles';

@Component({
  selector: 'spacing-control',
  templateUrl: './spacing-control.component.html',
  styleUrls: ['./spacing-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpacingControlComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class SpacingControlComponent extends BaseControl implements OnInit, ControlValueAccessor {
  @Output() change = new EventEmitter<PageItem>();

  DEFAULT_SPACING: ISpacingModel = {
    margin: { top: undefined, right: undefined, bottom: undefined, left: undefined, unit: 'px' },
    padding: { top: undefined, right: undefined, bottom: undefined, left: undefined, unit: 'px' },
  };
  spacing: ISpacingModel = { ...this.DEFAULT_SPACING };

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {}
  writeValue(item: PageItem): void {
    this.item = item;
    if (!item || !item.el) return;
    this.el = item.el;
    let val = this.el.style;
    this.style = { padding: val?.padding, margin: val?.margin };

    // Parse margin and padding from input
    this.spacing = {
      margin: parseSpacingValues(val?.margin, this.DEFAULT_SPACING.margin),
      padding: parseSpacingValues(val?.padding, this.DEFAULT_SPACING.padding),
    };
  }

  onChangeUnit(spacing: IPosValue, direction: 'top' | 'right' | 'bottom' | 'left') {
    if (spacing.unit == 'auto') {
      spacing[direction] = 'auto';
    }
    this.update();
  }
  update() {
    if (!this.spacing || !this.style || !this.item || !this.el) return;

    // Validate and format spacing values
    const validatedMargin = validateSpacing(this.spacing.margin, true);
    const validatedPadding = validateSpacing(this.spacing.padding, false);

    // Update style object with formatted CSS values
    this.style.padding = SpacingFormatter.formatSpacingToCSS(validatedPadding);
    this.style.margin = SpacingFormatter.formatSpacingToCSS(validatedMargin);
    this.renderer.setStyle(this.el, 'padding', this.style.padding);
    this.renderer.setStyle(this.el, 'margin', this.style.margin);
    this.onChange(this.item);
    this.item.style = mergeCssStyles(this.item.style, this.el.style.cssText);
    this.change.emit(this.item);
  }

  clear(spacing: IPosValue, direction: string) {
    (spacing as any)[direction] = undefined;
    this.update();
  }
}
