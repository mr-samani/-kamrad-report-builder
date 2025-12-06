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

import { NgxInputColorModule, NgxInputGradientModule } from 'ngx-input-color';
import { parseBackground } from '../../utiles/parseBackground';
import { IPageBuilderFilePicker } from '../../services/file-picker/IFilePicker';
import { NGX_PAGE_BUILDER_FILE_PICKER } from '../../services/file-picker/token.filepicker';
import { PageItem } from '../../models/PageItem';
import { BaseControl } from '../base-control';
import { mergeCssStyles } from '../../utiles/merge-css-styles';
import { Notify } from '../../extensions/notify';

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
  imports: [FormsModule, NgxInputColorModule, NgxInputGradientModule],
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
      const backgroundFull = val.background || val.backgroundImage;
      const parsed = parseBackground(backgroundFull);

      this.color = val.color ?? '';
      this.backgroundColor = parsed.color ?? val.backgroundColor;
      this.backgroundGradient = parsed.gradient ?? '';
      this.backgroundImage = parsed.image ?? '';
      this.backgroundRepeat = val.backgroundRepeat;
      this.backgroundSize = val.backgroundSize;
      this.backgroundPosition = val.backgroundPosition;
      this.backgroundAttachment = val.backgroundAttachment;
      this.backgroundOrigin = val.backgroundOrigin;
      this.backgroundClip = val.backgroundClip;
    }
    this.cdr.detectChanges();
  }

  update() {
    if (!this.el || !this.item) return;
    // Apply only relevant styles
    this.renderer.setStyle(this.el, 'background-color', this.backgroundColor);

    if (this.backgroundGradient) {
      this.renderer.setStyle(this.el, 'background-image', this.backgroundGradient);
    } else if (this.backgroundImage) {
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

    this.renderer.setStyle(this.el, 'color', this.color);

    this.style = {
      color: this.color,
      backgroundColor: this.backgroundColor,
      backgroundImage: this.backgroundGradient ? this.backgroundGradient : this.backgroundImage,
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
      Notify.warning('Provider for file picker is not available');
      return;
    }
    this.filePicker.openFilePicker('image').then((result) => {
      // TODO base address must be set with pipe
      this.backgroundImage = `url(${this.filePicker?.baseUrlAddress + result})`;
      this.update();
    });
  }

  clear(property: string) {
    (this as any)[property] = undefined;
    this.update();
  }
}
