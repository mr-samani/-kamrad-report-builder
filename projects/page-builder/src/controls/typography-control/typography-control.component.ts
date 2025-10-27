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

import { CommonModule } from '@angular/common';

@Component({
  selector: 'typography-control',
  templateUrl: './typography-control.component.html',
  styleUrls: ['./typography-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TypographyControlComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class TypographyControlComponent implements OnInit, ControlValueAccessor {
  el: HTMLElement | null = null;

  isDisabled: boolean = false;
  @Output() change = new EventEmitter<Partial<CSSStyleDeclaration> | undefined>();

  fontSize?: number;
  fontFamily: string = '';
  lineHeight?: number;
  textDecoration: string = 'none';
  textTransform: string = 'none';
  textAlign: string = '';
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
    let val = getComputedStyle(item.el);
    this.fontSize = parseFloat(val?.fontSize);
    this.fontFamily = val?.fontFamily;
    this.lineHeight = parseFloat(val?.lineHeight);
    this.textDecoration = val?.textDecoration;
    this.textTransform = val?.textTransform;
    this.textAlign = val?.textAlign;

    this.style = {
      fontSize: this.fontSize + 'px',
      fontFamily: this.fontFamily,
      lineHeight: this.lineHeight + 'px',
      textDecoration: this.textDecoration,
      textTransform: this.textTransform,
      textAlign: this.textAlign,
    };
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  update() {
    // Update style object with formatted CSS values
    this.renderer.setStyle(this.el, 'fontSize', this.fontSize + 'px');
    this.renderer.setStyle(this.el, 'fontFamily', this.fontFamily);
    this.renderer.setStyle(this.el, 'lineHeight', this.lineHeight + 'px');
    this.renderer.setStyle(this.el, 'textDecoration', this.textDecoration);
    this.renderer.setStyle(this.el, 'textTransform', this.textTransform);
    this.renderer.setStyle(this.el, 'textAlign', this.textAlign);
    this.style = {
      fontSize: this.fontSize + 'px',
      fontFamily: this.fontFamily,
      lineHeight: this.lineHeight + 'px',
      textDecoration: this.textDecoration,
      textTransform: this.textTransform,
      textAlign: this.textAlign,
    };
    this.onChange(this.item);
    this.change.emit(this.style);
  }
}
