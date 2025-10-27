// ngx-dynamic-autocomplete.directive.ts
import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
  EventEmitter,
  Output,
  OnDestroy,
} from '@angular/core';
import {
  DynamicDataStructure,
  DynamicNode,
  DynamicObjectNode,
  DynamicArrayNode,
  DynamicValueNode,
} from '../models/DynamicData';

@Directive({
  selector: '[ngxDynamicAutocomplete]',
  standalone: true,
})
export class DynamicAutocompleteDirective implements OnDestroy {
  @Input() dynamicData!: DynamicDataStructure;
  @Output() inserted = new EventEmitter<string>();

  private popupEl?: HTMLElement;
  private suggestions: string[] = [];
  private activeIndex = 0;
  private showPopup = false;

  // close popup when clicking outside
  private onDocClick = (e: MouseEvent) => {
    if (!this.popupEl) return;
    if (
      !this.popupEl.contains(e.target as Node) &&
      !this.el.nativeElement.contains(e.target as Node)
    ) {
      this.closePopup();
    }
  };

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {
    document.addEventListener('click', this.onDocClick, true);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocClick, true);
    this.closePopup();
  }

  // -------------------------
  // Key handling
  // -------------------------
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // open suggestions via Ctrl+Space or Ctrl+Shift+Space or just Ctrl+Space
    if (event.ctrlKey && (event.code === 'Space' || event.key === ' ')) {
      event.preventDefault();
      // open after browser updates input (not strictly necessary but safe)
      setTimeout(() => this.openSuggestionsAtCursor(), 0);
      return;
    }

    // navigation when popup open
    if (this.showPopup) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % this.suggestions.length;
        this.updateHighlight();
        return;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.activeIndex =
          (this.activeIndex - 1 + this.suggestions.length) % this.suggestions.length;
        this.updateHighlight();
        return;
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.suggestions.length) this.select(this.suggestions[this.activeIndex]);
        return;
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closePopup();
        return;
      }
    }

    // If user types '.' we re-open suggestions relative to the new path.
    // Wait a tick so '.' is inserted into the editable before computing path.
    if (event.key === '.') {
      setTimeout(() => this.openSuggestionsAtCursor(), 0);
      return;
    }

    // For normal typing / deletion, if popup is open we recompute suggestions.
    // Wait a tick to allow input to update.
    setTimeout(() => {
      if (this.showPopup) {
        const path = this.computePathBeforeCursor();
        const sugg = this.getSuggestionsForPath(path);
        if (!sugg.length) {
          this.closePopup();
        } else {
          this.suggestions = sugg;
          this.activeIndex = Math.min(this.activeIndex, this.suggestions.length - 1);
          this.updatePopupItems();
          const r = this.getCaretRect();
          this.setPosition(r.left, r.bottom);
        }
      }
    }, 0);
  }

  @HostListener('blur')
  onBlur() {
    // slight delay to allow click on suggestion to be processed
    setTimeout(() => this.closePopup(), 150);
  }

  // -------------------------
  // Opening & computing
  // -------------------------
  private openSuggestionsAtCursor() {
    const path = this.computePathBeforeCursor();
    const suggestions = this.getSuggestionsForPath(path);
    if (!suggestions || !suggestions.length) {
      this.closePopup();
      return;
    }
    this.suggestions = suggestions;
    this.activeIndex = 0;
    this.createOrUpdatePopup();
    const rect = this.getCaretRect();
    this.setPosition(rect.left, rect.bottom);
    this.showPopup = true;
  }

  /**
   * computePathBeforeCursor
   * - returns segments array
   * - if text ends with '.' the last segment is '' (empty) to indicate "list children"
   *
   * Examples:
   *  "" -> []
   *  "personalInfo" -> ["personalInfo"]
   *  "personalInfo." -> ["personalInfo",""]
   *  "personalInfo.name.fi" -> ["personalInfo","name","fi"]
   */
  private computePathBeforeCursor(): string[] {
    const textBefore = this.getTextBeforeCursor();
    if (!textBefore) return [];

    // match the last chain that contains words or [index] separated by dots
    // this match finds the chain at the end of textBefore
    const chainMatch = textBefore.match(/(?:[\w$]+|\[index\])(?:\.(?:[\w$]+|\[index\]))*$/);
    if (!chainMatch) {
      // if text ends with '.' but chainMatch failed (rare), check explicitly
      if (textBefore.endsWith('.')) {
        const prev = textBefore
          .slice(0, -1)
          .match(/(?:[\w$]+|\[index\])(?:\.(?:[\w$]+|\[index\]))*$/);
        if (prev) {
          const segs = prev[0].split('.');
          segs.push('');
          return segs;
        }
      }
      return [];
    }

    const chain = chainMatch[0];
    const segments = chain.split('.');

    // if original text ended with '.' then we want an extra empty segment
    if (textBefore.endsWith('.')) {
      segments.push('');
    }

    // normalize: keep empty last segment only (used to show children)
    return segments;
  }

  // get current token (last alphanumeric token before caret) — uses the improved regex you suggested
  private getCurrentToken(): string {
    const textBefore = this.getTextBeforeCursor();
    if (!textBefore) return '';
    const match = textBefore.replace(/[\s.]+$/, '').match(/[\w$]+$/);
    return match ? match[0] : '';
  }

  // Retrieve text before cursor for input/textarea or contenteditable
  private getTextBeforeCursor(): string {
    const el = this.el.nativeElement;
    if ((el as HTMLElement).isContentEditable) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return '';
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      const preRange = document.createRange();
      preRange.selectNodeContents(el);
      preRange.setEnd(range.endContainer, range.endOffset);
      return preRange.toString();
    } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const pos = el.selectionStart ?? 0;
      return el.value.slice(0, pos);
    }
    return '';
  }

  // -------------------------
  // Suggestions computation
  // -------------------------
  private getSuggestionsForPath(path: string[]): string[] {
    const root = this.dynamicData ?? {};

    // empty path -> top-level keys
    if (!path || path.length === 0) {
      return Object.keys(root);
    }

    // We will traverse to parent (everything except last segment)
    const parentPath = path.slice(0, -1);
    const currentToken = path[path.length - 1]; // may be '' when user typed '.' just now

    // Start from a synthetic root object wrapping dynamicData
    let current: DynamicNode = { type: 'object', properties: root } as DynamicObjectNode;

    // traverse parentPath
    for (const seg of parentPath) {
      if (!current) return [];
      if (current.type === 'object') {
        if (current.properties && seg in current.properties) {
          current = current.properties[seg];
        } else {
          return [];
        }
      } else if (current.type === 'array') {
        // If seg is [index] -> go into items, otherwise allow direct drill into items as well
        if (seg === '[index]') {
          current = current.items;
        } else {
          // treat unknown segment as attempt to access items properties
          current = current.items;
        }
      } else {
        return [];
      }
    }

    // Now current refers to the parent node where we want to list children for currentToken
    if (!current) return [];

    if (current.type === 'object') {
      const keys = Object.keys(current.properties || {});
      if (currentToken === '' || currentToken === undefined) {
        // user typed '.' -> show all children
        return keys;
      }
      // filter by prefix
      return keys.filter((k) => k.startsWith(currentToken));
    }

    if (current.type === 'array') {
      const suggestions: string[] = [];
      // suggest [index]
      if (!currentToken || '[index]'.startsWith(currentToken)) suggestions.push('[index]');
      // if items is object, suggest its props
      if (current.items && current.items.type === 'object') {
        const itemKeys = Object.keys(current.items.properties || {});
        if (!currentToken) suggestions.push(...itemKeys);
        else suggestions.push(...itemKeys.filter((k) => k.startsWith(currentToken)));
      }
      return suggestions;
    }

    // value node has no children
    return [];
  }

  // -------------------------
  // Popup DOM helpers
  // -------------------------
  private createOrUpdatePopup() {
    if (!this.popupEl) {
      const popup = this.renderer.createElement('ul');
      this.renderer.setStyle(popup, 'position', 'fixed');
      this.renderer.setStyle(popup, 'z-index', '10000');
      this.renderer.setStyle(popup, 'background', '#fff');
      this.renderer.setStyle(popup, 'border', '1px solid rgba(0,0,0,0.12)');
      this.renderer.setStyle(popup, 'border-radius', '6px');
      this.renderer.setStyle(popup, 'box-shadow', '0 6px 18px rgba(0,0,0,0.12)');
      this.renderer.setStyle(popup, 'list-style', 'none');
      this.renderer.setStyle(popup, 'margin', '0');
      this.renderer.setStyle(popup, 'padding', '6px 0');
      this.renderer.setStyle(popup, 'font-family', 'monospace');
      this.renderer.setStyle(popup, 'max-height', '220px');
      this.renderer.setStyle(popup, 'overflow', 'auto');
      this.renderer.appendChild(document.body, popup);
      this.popupEl = popup;
    }
    this.updatePopupItems();
  }

  private updatePopupItems() {
    if (!this.popupEl) return;
    // clear
    while (this.popupEl.firstChild) this.popupEl.removeChild(this.popupEl.firstChild);

    this.suggestions.forEach((sugg, idx) => {
      const li = this.renderer.createElement('li');
      this.renderer.setStyle(li, 'padding', '6px 12px');
      this.renderer.setStyle(li, 'cursor', 'pointer');
      this.renderer.setProperty(li, 'innerText', sugg);
      this.renderer.listen(li, 'click', () => this.select(sugg));
      if (idx === this.activeIndex) {
        this.renderer.setStyle(li, 'background', '#0078d7');
        this.renderer.setStyle(li, 'color', '#fff');
      }
      this.renderer.appendChild(this.popupEl!, li);
    });
  }

  private updateHighlight() {
    if (!this.popupEl) return;
    const children = Array.from(this.popupEl.children) as HTMLElement[];
    children.forEach((c, i) => {
      this.renderer.setStyle(c, 'background', i === this.activeIndex ? '#0078d7' : '');
      this.renderer.setStyle(c, 'color', i === this.activeIndex ? '#fff' : '#000');
    });
    const activeEl = children[this.activeIndex] as HTMLElement | undefined;
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
  }

  private setPosition(x: number, y: number) {
    if (!this.popupEl) return;
    const popupRect = this.popupEl.getBoundingClientRect();
    const winW = window.innerWidth;
    const left = x + popupRect.width > winW ? Math.max(8, winW - popupRect.width - 8) : x;
    this.renderer.setStyle(this.popupEl, 'left', `${left}px`);
    this.renderer.setStyle(this.popupEl, 'top', `${y}px`);
  }

  private closePopup() {
    if (this.popupEl) {
      try {
        this.renderer.removeChild(document.body, this.popupEl);
      } catch {
        /* ignore */
      }
      this.popupEl = undefined;
    }
    this.showPopup = false;
    this.suggestions = [];
    this.activeIndex = 0;
  }

  // -------------------------
  // Insert logic
  // -------------------------
  private select(value: string) {
    // Insert the selected segment in place of the chain's last segment.
    // If you prefer inserting placeholder format like [%@data.path%], change here.
    this.replaceCurrentTokenWith(value);
    this.inserted.emit(value);
    this.closePopup();
  }

  private replaceCurrentTokenWith(textToInsert: string) {
    const el = this.el.nativeElement;
    // For contenteditable we reconstruct text (innerText) and set caret by char index
    if ((el as HTMLElement).isContentEditable) {
      const full = el.innerText ?? el.textContent ?? '';
      const caretIndex = this.getCaretIndexInContentEditable();
      const before = full.slice(0, caretIndex);
      const after = full.slice(caretIndex);
      const chainMatch = before.match(/(?:[\w$]+|\[index\])(?:\.(?:[\w$]+|\[index\]))*$/);
      if (chainMatch) {
        const start = caretIndex - chainMatch[0].length;
        const newText = before.slice(0, start) + textToInsert + after;
        // set new text (note: this loses inner HTML formatting; if you need to keep HTML use more advanced approach)
        el.innerText = newText;
        // set caret after inserted text
        this.setCaretInContentEditable(start + textToInsert.length);
      } else {
        // fallback: insert at caret
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(textToInsert));
        range.collapse(false);
      }
    } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const start = el.selectionStart ?? 0;
      const before = el.value.slice(0, start);
      const after = el.value.slice(start);
      const chainMatch = before.match(/(?:[\w$]+|\[index\])(?:\.(?:[\w$]+|\[index\]))*$/);
      if (chainMatch) {
        const s = start - chainMatch[0].length;
        el.value = el.value.slice(0, s) + textToInsert + el.value.slice(start);
        const pos = s + textToInsert.length;
        el.setSelectionRange(pos, pos);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // insert normally
        el.setRangeText(textToInsert, el.selectionStart ?? 0, el.selectionEnd ?? 0, 'end');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  // helper: get caret index inside contenteditable as character offset
  private getCaretIndexInContentEditable(): number {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return 0;
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    const preRange = document.createRange();
    preRange.selectNodeContents(this.el.nativeElement);
    preRange.setEnd(range.endContainer, range.endOffset);
    return preRange.toString().length;
  }

  private setCaretInContentEditable(charIndex: number) {
    const node = this.el.nativeElement;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    let currentNode: Node | null = walker.nextNode();
    let count = 0;
    while (currentNode) {
      const textLen = (currentNode.textContent || '').length;
      if (count + textLen >= charIndex) {
        const offset = charIndex - count;
        const range = document.createRange();
        range.setStart(currentNode, offset);
        range.collapse(true);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
        return;
      }
      count += textLen;
      currentNode = walker.nextNode();
    }
    // fallback: set to end
    const range = document.createRange();
    range.selectNodeContents(this.el.nativeElement);
    range.collapse(false);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  // -------------------------
  // caret rect calculation
  // -------------------------
  private getCaretRect(): DOMRect {
    const el = this.el.nativeElement;
    if ((el as HTMLElement).isContentEditable) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return el.getBoundingClientRect();
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(false);
      const rects = range.getClientRects();
      if (rects.length) return rects[0];
      return el.getBoundingClientRect();
    } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      // a simple approximation for inputs/textarea caret position
      // For pixel-perfect placement use the "mirror" technique (I can add it on request)
      const rect = el.getBoundingClientRect();
      // try to approximate vertical position using line-height or font-size
      const style = window.getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight || style.fontSize || '16');
      return new DOMRect(rect.left + 8, rect.top + Math.min(24, lineHeight + 8), 0, 0);
    }
    return new DOMRect();
  }
}
