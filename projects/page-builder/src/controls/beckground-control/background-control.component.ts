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
import { CommonModule } from '@angular/common';
import { NgxInputColorModule, NgxInputGradientModule } from 'ngx-input-color';
import { parseBackground } from '../../utiles/parseBackground';

export type BackgroundMode = 'color' | 'gradient' | 'image' | 'color+gradient' | 'color+image';

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
  standalone: true,
  imports: [CommonModule, FormsModule, NgxInputColorModule, NgxInputGradientModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundControlComponent implements OnInit, ControlValueAccessor {
  @Output() change = new EventEmitter<Partial<CSSStyleDeclaration>>();

  el: HTMLElement | null = null;
  isDisabled = false;

  backgroundColor = '';
  backgroundGradient = '';
  backgroundImage = '';
  backgroundRepeat = '';
  backgroundSize = '';
  backgroundPosition = '';
  backgroundAttachment = '';
  backgroundOrigin = '';
  backgroundClip = '';

  mode: BackgroundMode = 'color';
  modes: { value: BackgroundMode; label: string; icon: string }[] = [
    { value: 'color', label: 'Color', icon: 'color' },
    { value: 'gradient', label: 'Gradient', icon: 'gradient' },
    { value: 'image', label: 'Image', icon: 'image' },
    { value: 'color+gradient', label: 'Color + Gradient', icon: 'mix' },
    { value: 'color+image', label: 'Color + Image', icon: 'mix' },
  ];
  style?: Partial<CSSStyleDeclaration>;

  onChange = (_: Partial<CSSStyleDeclaration> | undefined) => {};
  onTouched = () => {};

  constructor(private renderer: Renderer2) {}

  ngOnInit() {}

  writeValue(item: any): void {
    if (!item || !item.el) return;
    this.el = item.el;

    const val = getComputedStyle(item.el);
    const backgroundFull = val.background;
    const parsed = parseBackground(backgroundFull);

    this.backgroundColor = parsed.color ?? val.backgroundColor;
    this.backgroundGradient = parsed.gradient ?? '';
    this.backgroundImage = parsed.image ?? val.backgroundImage;
    this.backgroundRepeat = val.backgroundRepeat;
    this.backgroundSize = val.backgroundSize;
    this.backgroundPosition = val.backgroundPosition;
    this.backgroundAttachment = val.backgroundAttachment;
    this.backgroundOrigin = val.backgroundOrigin;
    this.backgroundClip = val.backgroundClip;

    this.detectMode();

    this.update();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  private detectMode() {
    const hasColor = !!this.backgroundColor && this.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const hasGradient = !!this.backgroundGradient;
    const hasImage = !!this.backgroundImage && this.backgroundImage !== 'none';

    if (hasColor && hasGradient) this.mode = 'color+gradient';
    else if (hasColor && hasImage) this.mode = 'color+image';
    else if (hasGradient) this.mode = 'gradient';
    else if (hasImage) this.mode = 'image';
    else this.mode = 'color';
  }
  setMode(m: BackgroundMode) {
    this.mode = m;
    this.update(); // هنگام تغییر mode، استایل را بروز کن
  }
  update() {
    if (!this.el) return;
    debugger;
    // Apply only relevant styles
    if (this.mode.includes('color')) {
      this.renderer.setStyle(this.el, 'background-color', this.backgroundColor);
    }

    if (this.mode.includes('gradient') && this.backgroundGradient) {
      this.renderer.setStyle(this.el, 'background-image', this.backgroundGradient);
    } else if (this.mode.includes('image') && this.backgroundImage) {
      this.renderer.setStyle(this.el, 'background-image', this.backgroundImage);
    } else {
      this.renderer.removeStyle(this.el, 'background-image');
    }

    this.renderer.setStyle(this.el, 'background-repeat', this.backgroundRepeat);
    this.renderer.setStyle(this.el, 'background-size', this.backgroundSize);
    this.renderer.setStyle(this.el, 'background-position', this.backgroundPosition);
    this.renderer.setStyle(this.el, 'background-attachment', this.backgroundAttachment);
    this.renderer.setStyle(this.el, 'background-origin', this.backgroundOrigin);
    this.renderer.setStyle(this.el, 'background-clip', this.backgroundClip);

    this.style = {
      backgroundColor: this.backgroundColor,
      backgroundImage:
        this.mode.includes('gradient') && this.backgroundGradient
          ? this.backgroundGradient
          : this.backgroundImage,
      backgroundRepeat: this.backgroundRepeat,
      backgroundSize: this.backgroundSize,
      backgroundPosition: this.backgroundPosition,
      backgroundAttachment: this.backgroundAttachment,
      backgroundOrigin: this.backgroundOrigin,
      backgroundClip: this.backgroundClip,
    };

    this.onChange(this.style);
    this.change.emit(this.style);
  }
}
