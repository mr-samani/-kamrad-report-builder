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
import { CommonModule } from '@angular/common';
import { mergeCssStyles } from '../../utiles/merge-css-styles';
import { BaseControl } from '../base-control';

export interface ISizeModel {
  width: string;
  minWidth: string;
  maxWidth: string;
  height: string;
  minHeight: string;
  maxHeight: string;
}

export interface ISizeValue {
  value: number | string | undefined;
  unit: 'px' | '%' | 'em' | 'rem' | 'vh' | 'vw' | 'auto';
}

export type SizeProperty = 'width' | 'minWidth' | 'maxWidth' | 'height' | 'minHeight' | 'maxHeight';

@Component({
  selector: 'size-control',
  templateUrl: './size-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SizeControlComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class SizeControlComponent extends BaseControl implements OnInit, ControlValueAccessor {
  @Output() change = new EventEmitter<PageItem>();

  widthProperties: SizeProperty[] = ['width', 'minWidth', 'maxWidth'];
  heightProperties: SizeProperty[] = ['height', 'minHeight', 'maxHeight'];

  sizes: {
    width: ISizeValue;
    minWidth: ISizeValue;
    maxWidth: ISizeValue;
    height: ISizeValue;
    minHeight: ISizeValue;
    maxHeight: ISizeValue;
  } = {
    width: { value: 'auto', unit: 'auto' },
    minWidth: { value: 0, unit: 'px' },
    maxWidth: { value: 'none', unit: 'auto' },
    height: { value: 'auto', unit: 'auto' },
    minHeight: { value: 0, unit: 'px' },
    maxHeight: { value: 'none', unit: 'auto' },
  };

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {}

  writeValue(item: PageItem): void {
    this.item = item;
    if (!item || !item.el) return;

    this.el = item.el;
    const val = this.el.style;

    this.style = {
      width: this.el.style.width || val.width,
      minWidth: this.el.style.minWidth || val.minWidth,
      maxWidth: this.el.style.maxWidth || val.maxWidth,
      height: this.el.style.height || val.height,
      minHeight: this.el.style.minHeight || val.minHeight,
      maxHeight: this.el.style.maxHeight || val.maxHeight,
    };

    // Parse size values
    this.sizes.width = this.parseSizeValue(this.style.width);
    this.sizes.minWidth = this.parseSizeValue(this.style.minWidth);
    this.sizes.maxWidth = this.parseSizeValue(this.style.maxWidth);
    this.sizes.height = this.parseSizeValue(this.style.height);
    this.sizes.minHeight = this.parseSizeValue(this.style.minHeight);
    this.sizes.maxHeight = this.parseSizeValue(this.style.maxHeight);
  }

  parseSizeValue(value: string | undefined): ISizeValue {
    if (!value || value === 'auto' || value === 'none') {
      return { value: value, unit: 'auto' };
    }

    const match = value.match(/^([\d.]+)(px|%|em|rem|vh|vw)$/);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: match[2] as ISizeValue['unit'],
      };
    }

    return { value: 0, unit: 'px' };
  }

  formatSizeValue(sizeValue: ISizeValue): string {
    if (sizeValue.unit === 'auto') {
      return sizeValue.value === 'none' ? 'none' : 'auto';
    }
    return `${sizeValue.value}${sizeValue.unit}`;
  }

  onChangeUnit(property: SizeProperty) {
    const sizeValue = this.sizes[property];
    if (sizeValue.unit === 'auto') {
      if (property.includes('max')) {
        sizeValue.value = 'none';
      } else {
        sizeValue.value = 'auto';
      }
    } else if (typeof sizeValue.value === 'string') {
      sizeValue.value = 0;
    }
    this.update();
  }

  getLabel(property: SizeProperty): string {
    const labels: { [key in SizeProperty]: string } = {
      width: 'Width',
      minWidth: 'Min Width',
      maxWidth: 'Max Width',
      height: 'Height',
      minHeight: 'Min Height',
      maxHeight: 'Max Height',
    };
    return labels[property];
  }

  isMaxProperty(property: SizeProperty): boolean {
    return property === 'maxWidth' || property === 'maxHeight';
  }

  update() {
    if (!this.style || !this.el || !this.item) return;

    // Update style object with formatted CSS values
    this.style.width = this.formatSizeValue(this.sizes.width);
    this.style.minWidth = this.formatSizeValue(this.sizes.minWidth);
    this.style.maxWidth = this.formatSizeValue(this.sizes.maxWidth);
    this.style.height = this.formatSizeValue(this.sizes.height);
    this.style.minHeight = this.formatSizeValue(this.sizes.minHeight);
    this.style.maxHeight = this.formatSizeValue(this.sizes.maxHeight);

    // Apply styles to element
    this.renderer.setStyle(this.el, 'width', this.style.width);
    this.renderer.setStyle(this.el, 'min-width', this.style.minWidth);
    this.renderer.setStyle(this.el, 'max-width', this.style.maxWidth);
    this.renderer.setStyle(this.el, 'height', this.style.height);
    this.renderer.setStyle(this.el, 'min-height', this.style.minHeight);
    this.renderer.setStyle(this.el, 'max-height', this.style.maxHeight);
    this.item.style = mergeCssStyles(this.item.style, this.el.style.cssText);
    this.onChange(this.item);
    this.change.emit(this.item);
  }
}
