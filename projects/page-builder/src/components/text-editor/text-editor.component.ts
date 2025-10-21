import {
  AfterViewInit,
  Component,
  DOCUMENT,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { PageItem } from '../../models/PageItem';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss'],
  imports: [CommonModule, FormsModule, MatDialogClose],
})
export class TextEditorComponent implements AfterViewInit {
  @ViewChild('editable', { static: true }) editableRef!: ElementRef<HTMLElement>;

  @Input() set value(v: string | null) {
    this._value = v || '';
    if (this.editableRef) this.editableRef.nativeElement.innerHTML = this._value;
  }
  get value() {
    return this._value;
  }
  private _value = '';

  @Output() touched = new EventEmitter<void>();

  fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Verdana',
    'Tahoma',
    'System UI',
  ];
  fontSizes = [10, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36];

  fontFamily = 'Arial';
  fontSize = 14;
  textColor = '#000000';
  bgColor = '#ffffff';

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: PageItem,
    private dialogRef: MatDialogRef<TextEditorComponent>,
    @Inject(DOCUMENT) private doc: Document
  ) {
    this._value = data.content || '';
  }

  ngAfterViewInit() {
    // initialize content if value was set before view init
    this.editableRef.nativeElement.innerHTML = this._value || '';
  }

  // Generic command wrapper for simple commands
  execCommand(cmd: string, value: string | null = null) {
    // Try document command, fallback to manual if needed
    try {
      this.doc.execCommand(cmd, false, value as any);
    } catch (e) {
      console.warn('execCommand failed for', cmd, e);
    }
  }

  isCommandActive(cmd: string) {
    try {
      return this.doc.queryCommandState(cmd);
    } catch {
      return false;
    }
  }

  setAlign(direction: 'left' | 'center' | 'right') {
    const cmd =
      direction === 'left'
        ? 'justifyleft'
        : direction === 'center'
        ? 'justifycenter'
        : 'justifyright';
    this.execCommand(cmd);
  }

  setFontFamily(family: string) {
    this.fontFamily = family;
    this.applyStyle({ fontFamily: family });
  }

  setFontSize(size: string) {
    const px = parseInt(size, 10) || 14;
    this.fontSize = px;
    this.applyStyle({ fontSize: px + 'px' });
  }

  applyStyle(styleObj: { [k: string]: string }) {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const node = sel.focusNode;
    // 1️⃣ اگر selection داخل span هست
    const parentSpan = this.findParentSpan(node);

    if (parentSpan) {
      // بررسی کن ببین استایل فعلی span با چیزی که می‌خوای یکیه یا نه
      let updated = false;
      for (const key of Object.keys(styleObj)) {
        const newVal = styleObj[key];
        const oldVal = parentSpan.style[key as any];
        if (oldVal !== newVal) {
          parentSpan.style[key as any] = newVal;
          updated = true;
        }
      }
      // if (updated) this.emitChange();
      return;
    }

    // 2️⃣ اگر selection داخل span نیست → بساز فقط در صورت نیاز
    if (range.collapsed) {
      const span = document.createElement('span');
      this.applyStyleObject(span.style, styleObj);
      span.appendChild(document.createTextNode('\u200B'));
      range.insertNode(span);

      range.setStart(span.firstChild as Node, 1);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      const span = document.createElement('span');
      this.applyStyleObject(span.style, styleObj);
      try {
        range.surroundContents(span);
      } catch {
        const extracted = range.extractContents();
        span.appendChild(extracted);
        range.insertNode(span);
      }
    }

    this.editableRef.nativeElement.normalize();
  }

  applyStyleObject(style: CSSStyleDeclaration, obj: { [k: string]: string }) {
    for (const k of Object.keys(obj)) {
      // map camelCase to css property names if needed
      // direct assignment works for most properties
      // @ts-ignore
      style[k] = obj[k];
    }
  }

  clearFormatting() {
    const root = this.editableRef.nativeElement;
    // Remove inline styles and convert to plain text-preserving simple tags for paragraphs/line breaks
    const html = root.innerText || '';
    root.innerHTML = html.replace(/\n/g, '<br>');
  }

  onKeyUp() {
    // keep internal state in sync for color inputs if caret style changed
    // try to inspect parent element of selection to read styles
    const sel = this.doc.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode as Node | null;
    const el = this.findParentElement(node);
    if (el) {
      const st = window.getComputedStyle(el as Element);
      this.textColor = this.ensureColorHex(st.color) || this.textColor;
      this.bgColor = this.ensureColorHex(st.backgroundColor) || this.bgColor;
    }
  }

  findParentElement(n: Node | null): HTMLElement | null {
    while (n && n.nodeType !== Node.ELEMENT_NODE) {
      n = n.parentNode;
    }
    return (n as HTMLElement) || null;
  }

  ensureColorHex(colorStr: string | null): string | null {
    if (!colorStr) return null;
    // convert rgb(...) to hex if needed
    const m = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) {
      const r = parseInt(m[1]).toString(16).padStart(2, '0');
      const g = parseInt(m[2]).toString(16).padStart(2, '0');
      const b = parseInt(m[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    // if it's already a hex or named color, return as-is (works for inputs)
    return colorStr;
  }
  findParentSpan(node: Node | null): HTMLSpanElement | null {
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'SPAN') {
        return node as HTMLSpanElement;
      }
      node = node.parentNode!;
    }
    return null;
  }

  getValue() {
    const html = this.editableRef.nativeElement.innerHTML;
    return html;
  }

  ok() {
    this.dialogRef.close(this.getValue());
  }
}
