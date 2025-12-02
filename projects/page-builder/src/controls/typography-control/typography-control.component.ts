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

import { BaseControl } from '../base-control';
import { mergeCssStyles } from '../../utiles/merge-css-styles';

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
  imports: [FormsModule],
})
export class TypographyControlComponent
  extends BaseControl
  implements OnInit, ControlValueAccessor
{
  @Output() change = new EventEmitter<PageItem>();

  fontSize?: number;
  fontFamily: string = '';
  lineHeight?: number;
  textDecoration: string = 'none';
  textTransform: string = 'none';
  textAlign: string = '';
  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {}
  writeValue(item: PageItem): void {
    this.item = item;
    if (!item || !item.el) return;
    this.el = item.el;
    let val = item.el.style;
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

  update() {
    if (!this.el || !this.item) return;
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
    this.item.style = mergeCssStyles(this.item.style, this.el.style.cssText);
    this.change.emit(this.item);
  }
}
