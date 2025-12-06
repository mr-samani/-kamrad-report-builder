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
  OnDestroy,
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
  implements OnInit, AfterViewInit, ControlValueAccessor, OnDestroy
{
  @Output() change = new EventEmitter<PageItem>();
  @ViewChild('editorDiv', { static: false }) editorRef?: ElementRef<HTMLDivElement>;

  textCss = '';
  private isUpdating = false;
  private updateTimeout?: any;
  private highlightTimeout?: any;
  private editorListeners: Array<() => void> = [];

  constructor(
    injector: Injector,
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

  ngOnDestroy() {
    // Clean up listeners
    this.editorListeners.forEach((cleanup) => cleanup());
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }
  }

  writeValue(item: PageItem): void {
    this.item = item;
    this.el = item?.el;
    if (item && this.el) {
      this.textCss = this.el.style.cssText.replace(/;\s*/g, ';\n');
      if (this.editorRef && !this.isUpdating) {
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

    // Handle input with debouncing
    const inputHandler = () => {
      if (this.isUpdating) return;

      this.textCss = this.getPlainText(editor);

      // Clear previous highlight timeout
      if (this.highlightTimeout) {
        clearTimeout(this.highlightTimeout);
      }

      // Highlight after user stops typing (300ms delay)
      this.highlightTimeout = setTimeout(() => {
        this.updateEditorContent();
      }, 300);

      // Debounce update to improve performance
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
      }
      this.updateTimeout = setTimeout(() => {
        this.updateStyles();
      }, 100);
    };
    editor.addEventListener('input', inputHandler);
    this.editorListeners.push(() => editor.removeEventListener('input', inputHandler));

    // Handle keydown for Enter key
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Insert newline at cursor position
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode('\n');
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);

          // Trigger input event manually
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };
    editor.addEventListener('keydown', keydownHandler);
    this.editorListeners.push(() => editor.removeEventListener('keydown', keydownHandler));

    // Handle paste - remove formatting
    const pasteHandler = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') || '';
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);

        // Trigger input event manually
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    editor.addEventListener('paste', pasteHandler);
    this.editorListeners.push(() => editor.removeEventListener('paste', pasteHandler));

    // Handle blur
    const blurHandler = () => {
      this.onTouched();
    };
    editor.addEventListener('blur', blurHandler);
    this.editorListeners.push(() => editor.removeEventListener('blur', blurHandler));
  }

  private updateEditorContent() {
    if (!this.editorRef || this.isUpdating) return;

    this.isUpdating = true;
    const editor = this.editorRef.nativeElement;
    const cursorPosition = this.getCursorPosition(editor);

    editor.innerHTML = this.highlightCSS(this.textCss);

    // Restore cursor position
    if (cursorPosition !== null) {
      requestAnimationFrame(() => {
        this.setCursorPosition(editor, cursorPosition);
      });
    }

    this.isUpdating = false;
  }

  private getPlainText(element: HTMLElement): string {
    // Use textContent instead of innerText for better performance
    return element.textContent || '';
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
    if (!selection) return;

    const range = document.createRange();
    let currentPos = 0;
    let found = false;

    const traverse = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (currentPos + textLength >= position) {
          const offset = Math.min(position - currentPos, textLength);
          range.setStart(node, offset);
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

    if (found) {
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (element.childNodes.length > 0) {
      // Fallback: set cursor to end
      const lastNode = element.childNodes[element.childNodes.length - 1];
      if (lastNode.nodeType === Node.TEXT_NODE) {
        range.setStart(lastNode, lastNode.textContent?.length || 0);
      } else {
        range.setStartAfter(lastNode);
      }
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  private highlightCSS(css: string): string {
    if (!css) return '<span class="css-placeholder">/* Enter CSS styles here */</span>';

    // Escape HTML
    const escaped = css.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Split by lines and process each line
    const lines = escaped.split('\n');
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

        const highlightedValue = this.highlightValue(value.trim());

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
    if (!this.el || !this.item || this.isUpdating) return;

    try {
      // Apply styles to element
      this.el.style.cssText = this.textCss;

      // Update editor with syntax highlighting
      this.updateEditorContent();

      // Update item
      this.item.style = mergeCssStyles(this.item.style, this.el.style.cssText);
      this.onChange(this.item);
      this.change.emit(this.item);
    } catch (error) {
      console.error('Invalid CSS:', error);
    }

    this.cdr.detectChanges();
  }

  private updateStyles() {
    if (!this.el || !this.item || this.isUpdating) return;

    try {
      // Apply styles to element without updating editor
      this.el.style.cssText = this.textCss;

      // Update item
      this.item.style = mergeCssStyles(this.item.style, this.el.style.cssText);
      this.onChange(this.item);
      this.change.emit(this.item);
    } catch (error) {
      console.error('Invalid CSS:', error);
    }

    this.cdr.detectChanges();
  }
}
