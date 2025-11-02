import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PageItem } from '../../models/PageItem';
import { ISpacingModel } from './ISpacingModel';
import { SpacingFormatter } from './SpacingFormatter';
import { parseSpacingValues, validateSpacing } from './validateSpacing';
import { CommonModule } from '@angular/common';
import { IPosValue } from './IPosValue';

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
export class SpacingControlComponent implements OnInit, ControlValueAccessor {
  el: HTMLElement | null = null;

  isDisabled: boolean = false;
  @Output() change = new EventEmitter<Partial<CSSStyleDeclaration> | undefined>();
  spacing: ISpacingModel = {
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  };

  style?: Partial<CSSStyleDeclaration>;
  item?: PageItem;
  onChange = (_: PageItem | undefined) => {};
  onTouched = () => {};
  constructor(private renderer: Renderer2) {}

  ngOnInit() {}
  writeValue(item: PageItem): void {
    this.item = item;
    if (!item || !item.el) return;
    this.el = item.el;
    let val = this.el.style;
    this.style = { padding: val?.padding, margin: val?.margin };
    const defaultSpacing: ISpacingModel = {
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    };

    // Parse margin and padding from input
    this.spacing = {
      margin: parseSpacingValues(val?.margin, defaultSpacing.margin),
      padding: parseSpacingValues(val?.padding, defaultSpacing.padding),
    };
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onChangeUnit(spacing: IPosValue, direction: 'top' | 'right' | 'bottom' | 'left') {
    if (spacing.unit == 'auto') {
      spacing[direction] = 'auto';
    }
    this.update();
  }
  update() {
    if (!this.spacing || !this.style) return;

    // Validate and format spacing values
    const validatedMargin = validateSpacing(this.spacing.margin, true);
    const validatedPadding = validateSpacing(this.spacing.padding, false);

    // Update style object with formatted CSS values
    this.style.padding = SpacingFormatter.formatSpacingToCSS(validatedPadding);
    this.style.margin = SpacingFormatter.formatSpacingToCSS(validatedMargin);
    this.renderer.setStyle(this.el, 'padding', this.style.padding);
    this.renderer.setStyle(this.el, 'margin', this.style.margin);
    this.onChange(this.item);
    this.change.emit(this.style);
  }
}
