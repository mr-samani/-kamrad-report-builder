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
  selector: 'background-control',
  templateUrl: './background-control.component.html',
  styleUrls: ['./background-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BackgroundControlComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class BackgroundControlComponent implements OnInit, ControlValueAccessor {
  el: HTMLElement | null = null;

  isDisabled: boolean = false;
  @Output() change = new EventEmitter<Partial<CSSStyleDeclaration> | undefined>();

  backgroundColor: string = '';
  backgroundImage: string = '';
  backgroundSize: string = '';
  backgroundPosition: string = '';
  backgroundRepeat: string = '';
  style?: Partial<CSSStyleDeclaration>;
  onChange = (_: Partial<CSSStyleDeclaration> | undefined) => {};
  onTouched = () => {};
  constructor(private renderer: Renderer2) {}

  ngOnInit() {}
  writeValue(item: PageItem): void {
    if (!item || !item.el) return;
    this.el = item.el;
    let val = getComputedStyle(item.el);

    this.backgroundColor = val?.backgroundColor;
    this.backgroundImage = val?.backgroundImage;
    this.backgroundSize = val?.backgroundSize;
    this.backgroundPosition = val?.backgroundPosition;
    this.backgroundRepeat = val?.backgroundRepeat;

    this.style = {
      backgroundColor: this.backgroundColor,
      backgroundImage: this.backgroundImage,
      backgroundSize: this.backgroundSize,
      backgroundPosition: this.backgroundPosition,
      backgroundRepeat: this.backgroundRepeat,
    };
    this.onChange(this.style);
    this.change.emit(this.style);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  update() {
    // Update style object with formatted CSS values
    this.renderer.setStyle(this.el, 'backgroundColor', this.backgroundColor);
    this.renderer.setStyle(this.el, 'backgroundImage', this.backgroundImage);
    this.renderer.setStyle(this.el, 'backgroundSize', this.backgroundSize);
    this.renderer.setStyle(this.el, 'backgroundPosition', this.backgroundPosition);
    this.renderer.setStyle(this.el, 'backgroundRepeat', this.backgroundRepeat);
    this.style = {
      backgroundColor: this.backgroundColor,
      backgroundImage: this.backgroundImage,
      backgroundSize: this.backgroundSize,
      backgroundPosition: this.backgroundPosition,
      backgroundRepeat: this.backgroundRepeat,
    };
    this.onChange(this.style);
    this.change.emit(this.style);
  }
}
