import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Inject,
  OnInit,
  Optional,
  Output,
  Renderer2,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxInputColorModule, NgxInputGradientModule } from 'ngx-input-color';
import { parseBackground } from '../../utiles/parseBackground';
import { IPageBuilderFilePicker } from '../../services/file-picker/IFilePicker';
import { NGX_PAGE_BUILDER_FILE_PICKER } from '../../services/file-picker/token.filepicker';
import { DEFAULT_IMAGE_URL } from '../../consts/defauls';
import { PageItem } from '../../models/PageItem';

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

  el?: HTMLElement;
  isDisabled = false;

  backgroundColor = '';
  backgroundGradient = '';
  /** css bacground-image  */
  backgroundImage = '';
  /** img tag src url */
  imageUrl = '';
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
  isImageTag = false;
  item?: PageItem;
  onChange = (_: PageItem | undefined) => {};
  onTouched = () => {};

  constructor(
    private renderer: Renderer2,
    @Inject(NGX_PAGE_BUILDER_FILE_PICKER) private filePicker: IPageBuilderFilePicker | null,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  writeValue(item: PageItem): void {
    this.item = item;
    this.el = item?.el;
    if (item && this.el) {
      const val = this.el.style;
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
      this.isImageTag = this.el.tagName === 'IMG';
      if (this.isImageTag) {
        this.imageUrl = this.el.getAttribute('src') ?? '';
      }
      this.detectMode();
      this.update();
    }
    this.cdr.detectChanges();
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

    if (this.isImageTag) {
      if (this.imageUrl) {
        this.renderer.setAttribute(this.el, 'src', this.imageUrl);
      } else {
        this.renderer.setAttribute(this.el, 'src', DEFAULT_IMAGE_URL);
      }
    }

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

    this.cdr.detectChanges();
    this.onChange(this.item);
    this.change.emit(this.style);
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

  onChangeSrcImage() {
    if (!this.filePicker) {
      console.warn('Provider for file picker is not available');
      return;
    }
    this.filePicker.openFilePicker('image').then((result) => {
      // TODO base address must be set with pipe
      this.imageUrl = this.filePicker?.baseUrlAddress + result;
      this.update();
    });
  }
}
