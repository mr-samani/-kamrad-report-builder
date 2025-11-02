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

@Component({
  selector: 'textcss-control',
  templateUrl: './textcss-control.component.html',
  styleUrls: ['./textcss-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextCssControlComponent),
      multi: true,
    },
  ],
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextCssControlComponent implements OnInit, ControlValueAccessor {
  @Output() change = new EventEmitter<Partial<CSSStyleDeclaration>>();

  el?: HTMLElement;
  isDisabled = false;

  textCss = '';
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
      this.textCss = this.el.style.cssText.replace(/;/g, ';\n');
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

  update() {
    if (!this.el) return;

    this.renderer.setStyle(this.el, 'cssText', this.textCss);

    this.cdr.detectChanges();
    this.onChange(this.item);
    this.change.emit(this.textCss);
  }
}
