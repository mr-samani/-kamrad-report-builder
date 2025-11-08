import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  AfterViewInit,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IPageBuilderFilePicker } from '../../services/file-picker/IFilePicker';
import { NGX_PAGE_BUILDER_FILE_PICKER } from '../../services/file-picker/token.filepicker';
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
  encapsulation: ViewEncapsulation.None,
})
export class TextCssControlComponent implements OnInit, AfterViewInit, ControlValueAccessor {
  @Output() change = new EventEmitter<string>();
  @ViewChild('textarea', { static: false }) textareaRef?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('highlight', { static: false }) highlightRef?: ElementRef<HTMLDivElement>;

  el?: HTMLElement;
  isDisabled = false;
  textCss = '';
  highlightedCss = '';
  item?: PageItem;

  onChange = (_: PageItem | undefined) => {};
  onTouched = () => {};

  constructor(
    private renderer: Renderer2,
    @Inject(NGX_PAGE_BUILDER_FILE_PICKER) private filePicker: IPageBuilderFilePicker | null,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.syncScroll();
  }

  writeValue(item: PageItem): void {
    this.item = item;
    this.el = item?.el;
    if (item && this.el) {
      this.textCss = this.el.style.cssText.replace(/;/g, ';\n');
      this.updateHighlight();
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

  onInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.textCss = textarea.value;
    this.updateHighlight();
    this.update();
  }

  onScroll(event: Event) {
    this.syncScroll();
  }

  private syncScroll() {
    if (this.textareaRef && this.highlightRef) {
      const textarea = this.textareaRef.nativeElement;
      const highlight = this.highlightRef.nativeElement;
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }
  }

  private updateHighlight() {
    this.highlightedCss = this.highlightCSS(this.textCss);
    this.cdr.detectChanges();

    // Sync scroll after highlight update
    setTimeout(() => this.syncScroll(), 0);
  }

  private highlightCSS(css: string): string {
    if (!css) return '';

    // Escape HTML
    css = css.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Highlight properties (blue)
    css = css.replace(
      /([a-z-]+)(\s*):/gi,
      '<span class="css-property">$1</span>$2<span class="css-colon">:</span>'
    );

    // Highlight values
    css = css.replace(/:\s*([^;}\n]+)/g, (match, value) => {
      value = value.trim();

      // Color values (hex, rgb, rgba, named colors)
      if (/#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(/.test(value)) {
        return `: <span class="css-color">${value}</span>`;
      }

      // Numbers with units
      if (/^-?\d+\.?\d*(px|em|rem|%|vh|vw|deg|s|ms)?$/.test(value)) {
        return `: <span class="css-number">${value}</span>`;
      }

      // URLs
      if (/url\(/.test(value)) {
        return `: <span class="css-url">${value}</span>`;
      }

      // Keywords (important, inherit, etc.)
      if (/^(important|inherit|initial|unset|auto|none|normal)$/i.test(value)) {
        return `: <span class="css-keyword">${value}</span>`;
      }

      // Default value color
      return `: <span class="css-value">${value}</span>`;
    });

    // Highlight semicolons
    css = css.replace(/;/g, '<span class="css-semicolon">;</span>');

    // Highlight invalid properties (properties without values or malformed)
    css = css.replace(
      /(<span class="css-property">[^<]+<\/span>\s*<span class="css-colon">:<\/span>\s*)(<span class="css-semicolon">;<\/span>)/g,
      '<span class="css-invalid">$1</span>$2'
    );

    return css;
  }

  private validateCSS(css: string): boolean {
    // Simple validation
    const lines = css.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.endsWith(';') && trimmed !== '') {
        return false;
      }
    }
    return true;
  }

  update() {
    if (!this.el) return;

    try {
      this.renderer.setAttribute(this.el, 'style', this.textCss);
      this.onChange(this.item);
      this.change.emit(this.textCss);
    } catch (error) {
      console.error('Invalid CSS:', error);
    }

    this.cdr.detectChanges();
  }
}
