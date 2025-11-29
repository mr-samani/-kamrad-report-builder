import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Inject,
  Injector,
  OnInit,
  Output,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxInputColorModule, NgxInputGradientModule } from 'ngx-input-color';
import { parseBackground } from '../../utiles/parseBackground';
import { IPageBuilderFilePicker } from '../../services/file-picker/IFilePicker';
import { NGX_PAGE_BUILDER_FILE_PICKER } from '../../services/file-picker/token.filepicker';
import { PageItem } from '../../models/PageItem';
import { BaseControl } from '../base-control';
import { mergeCssStyles } from '../../utiles/merge-css-styles';

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
export class BackgroundControlComponent
  extends BaseControl
  implements OnInit, ControlValueAccessor
{
  @Output() change = new EventEmitter<PageItem>();

  color = '';
  backgroundColor = '';
  backgroundGradient = '';
  /** css bacground-image  */
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

  constructor(
    injector: Injector,
    @Inject(NGX_PAGE_BUILDER_FILE_PICKER) private filePicker: IPageBuilderFilePicker | null,
    private cdr: ChangeDetectorRef,
  ) {
    super(injector);
  }

  ngOnInit() {}

  writeValue(item: PageItem): void {
    this.item = item;
    this.el = item?.el;
    if (item && this.el) {
      const val = this.el.style;
      const backgroundFull = val.background;
      const parsed = parseBackground(backgroundFull);

      this.color = val.color ?? '';
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
    }
    this.cdr.detectChanges();
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
    if (!this.el || !this.item) return;
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

    if (this.color) {
      this.renderer.setStyle(this.el, 'color', this.color);
    }

    this.style = {
      color: this.color,
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

    this.cdr.detectChanges();
    this.item.style = mergeCssStyles(this.item.style, this.el.style.cssText);
    this.onChange(this.item);
    this.change.emit(this.item);
  }

  openImagePicker() {
    if (!this.filePicker) {
      console.warn('Provider for file picker is not available');
      return;
    }
    this.filePicker.openFilePicker('image').then((result) => {
      // TODO base address must be set with pipe
      this.backgroundImage = `url(${this.filePicker?.baseUrlAddress + result})`;
      this.update();
    });
  }
}
