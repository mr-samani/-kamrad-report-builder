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
  ViewChild,
  AfterViewInit,
  Injector,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { IPageBuilderFilePicker } from '../../services/file-picker/IFilePicker';
import { NGX_PAGE_BUILDER_FILE_PICKER } from '../../services/file-picker/token.filepicker';
import { PageItem } from '../../models/PageItem';
import { BaseControl } from '../base-control';
import { mergeCssStyles } from '../../utiles/merge-css-styles';

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
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextCssControlComponent
  extends BaseControl
  implements OnInit, AfterViewInit, ControlValueAccessor
{
  @Output() change = new EventEmitter<PageItem>();
  @ViewChild('editorDiv', { static: false }) editorRef?: ElementRef<HTMLDivElement>;

  textCss = '';

  constructor(
    injector: Injector,
    @Inject(NGX_PAGE_BUILDER_FILE_PICKER) private filePicker: IPageBuilderFilePicker | null,
    private cdr: ChangeDetectorRef,
  ) {
    super(injector);
  }

  ngOnInit() {}

  ngAfterViewInit() {
    if (this.editorRef) {
      this.setupEditor();
    }
  }

  writeValue(item: PageItem): void {
    this.item = item;
    this.el = item?.el;
    if (item && this.el) {
      this.textCss = this.el.style.cssText.replace(/;/g, ';\n');
      if (this.editorRef) {
        this.updateEditorContent();
      }
    }
    this.cdr.detectChanges();
  }

  override setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (this.editorRef) {
      this.editorRef.nativeElement.contentEditable = isDisabled ? 'false' : 'true';
    }
  }

  private setupEditor() {
    if (!this.editorRef) return;

    const editor = this.editorRef.nativeElement;

    // Set initial content
    this.updateEditorContent();

    // Handle input
    editor.addEventListener('input', () => {
      this.textCss = this.getPlainText(editor);
      this.update();
    });

    // Handle paste - remove formatting
    editor.addEventListener('paste', (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') || '';
      document.execCommand('insertText', false, text);
    });

    // Handle blur
    editor.addEventListener('blur', () => {
      this.onTouched();
    });
  }

  private updateEditorContent() {
    if (!this.editorRef) return;

    const editor = this.editorRef.nativeElement;
    const cursorPosition = this.getCursorPosition(editor);

    editor.innerHTML = this.highlightCSS(this.textCss);

    // Restore cursor position
    if (cursorPosition !== null) {
      this.setCursorPosition(editor, cursorPosition);
    }
  }

  private getPlainText(element: HTMLElement): string {
    return element.innerText || '';
  }

  private getCursorPosition(element: HTMLElement): number | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
  }

  private setCursorPosition(element: HTMLElement, position: number) {
    const selection = window.getSelection();
    const range = document.createRange();

    let currentPos = 0;
    let found = false;

    const traverse = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (currentPos + textLength >= position) {
          range.setStart(node, position - currentPos);
          range.collapse(true);
          found = true;
          return true;
        }
        currentPos += textLength;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          if (traverse(node.childNodes[i])) {
            return true;
          }
        }
      }
      return false;
    };

    traverse(element);

    if (found && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  private highlightCSS(css: string): string {
    if (!css) return '<span class="css-placeholder">/* Enter CSS styles here */</span>';

    // Escape HTML
    css = css.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Split by lines and process each line
    const lines = css.split('\n');
    const highlighted = lines.map((line) => {
      if (!line.trim()) return '';

      // Check for property: value; pattern
      const match = line.match(/^\s*([a-z-]+)\s*:\s*([^;]*)(;?)\s*$/i);

      if (match) {
        const [, property, value, semicolon] = match;
        const indent = line.match(/^\s*/)?.[0] || '';

        // Validate
        const isInvalid = !value.trim() || !semicolon;
        const invalidClass = isInvalid ? ' css-invalid' : '';

        let highlightedValue = this.highlightValue(value.trim());

        return `${indent}<span class="css-property${invalidClass}">${property}</span><span class="css-colon">:</span> <span class="css-value${invalidClass}">${highlightedValue}</span><span class="css-semicolon">${semicolon}</span>`;
      }

      // If doesn't match pattern, mark as invalid
      return `<span class="css-invalid">${line}</span>`;
    });

    return highlighted.join('\n');
  }

  private highlightValue(value: string): string {
    // Color values
    if (/#[0-9a-fA-F]{3,8}/.test(value)) {
      return `<span class="css-color">${value}</span>`;
    }

    if (/^(rgb|rgba|hsl|hsla)\(/.test(value)) {
      return `<span class="css-color">${value}</span>`;
    }

    // Numbers with units
    if (/^-?\d+\.?\d*(px|em|rem|%|vh|vw|vmin|vmax|deg|rad|turn|s|ms)?$/i.test(value)) {
      return `<span class="css-number">${value}</span>`;
    }

    // URLs
    if (/^url\(/.test(value)) {
      return `<span class="css-url">${value}</span>`;
    }

    // Important
    if (/!important/.test(value)) {
      return value.replace(/!important/, '<span class="css-important">!important</span>');
    }

    // Keywords
    if (/^(inherit|initial|unset|auto|none|normal|transparent|currentColor)$/i.test(value)) {
      return `<span class="css-keyword">${value}</span>`;
    }

    // Multiple values (space-separated)
    if (value.includes(' ')) {
      const parts = value.split(/(\s+)/).map((part) => {
        if (/^\s+$/.test(part)) return part;
        return this.highlightValue(part);
      });
      return parts.join('');
    }

    return value;
  }

  update() {
    if (!this.el || !this.item) return;

    try {
      this.renderer.setAttribute(this.el, 'style', this.textCss);
      this.updateEditorContent();
      this.item.style = mergeCssStyles(this.item.style, this.el.style.cssText);
      this.onChange(this.item);
      this.change.emit(this.item);
    } catch (error) {
      console.error('Invalid CSS:', error);
    }

    this.cdr.detectChanges();
  }
}
