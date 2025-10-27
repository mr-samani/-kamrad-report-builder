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
import { DynamicDataStructure, DynamicNode, DynamicObjectNode } from '../models/DynamicData';

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

  // === Key handling ===
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // open suggestions
    if (event.ctrlKey && (event.code === 'Space' || event.key === ' ')) {
      event.preventDefault();
      this.openSuggestionsAtCursor();
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
    if (event.key === '.') {
      // allow '.' to be inserted first, then compute path and open
      // use setTimeout 0 to run after the '.' is inserted by browser
      setTimeout(() => this.openSuggestionsAtCursor(), 0);
      return;
    }

    // if user deletes/backspaces or types normal chars we recompute suggestions or close
    // use setTimeout to let input update
    setTimeout(() => {
      if (this.showPopup) {
        const path = this.computePathBeforeCursor();
        // if path became invalid or suggestions empty -> close
        const sugg = this.getSuggestionsForPath(path);
        if (!sugg.length) this.closePopup();
        else {
          this.suggestions = sugg;
          this.activeIndex = Math.min(this.activeIndex, this.suggestions.length - 1);
          this.updatePopupItems(); // update list contents
          const r = this.getCaretRect();
          this.setPosition(r.left, r.bottom);
        }
      }
    }, 0);
  }

  @HostListener('blur')
  onBlur() {
    // give click handlers a chance; close on next tick
    setTimeout(() => this.closePopup(), 100);
  }

  // === Opening & computing ===
  private openSuggestionsAtCursor() {
    const path = this.computePathBeforeCursor();
    const suggestions = this.getSuggestionsForPath(path);
    if (!suggestions.length) return;
    this.suggestions = suggestions;
    this.activeIndex = 0;
    this.createOrUpdatePopup();
    const rect = this.getCaretRect();
    this.setPosition(rect.left, rect.bottom);
    this.showPopup = true;
  }

  // compute path like ['personalInfo','name'] from text before cursor.
  // robust for inputs, textarea and contenteditable.
  private computePathBeforeCursor(): string[] {
    const textBefore = this.getTextBeforeCursor();
    if (!textBefore) return [];
    // match chain like: word(.word|.[index])*
    const chainMatch = textBefore.match(/(?:[\w$]+|\[index\])(?:\.(?:[\w$]+|\[index\]))*$/);
    if (!chainMatch) return [];
    const chain = chainMatch[0];
    // split by '.' but keep [index] as segment
    return chain.split('.').filter(Boolean);
  }

  // get current token (last segment) using the improved regex you suggested
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
      // create range from start of element to caret
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

  // === Suggestions computation (fixed traversal checks) ===
  private getSuggestionsForPath(path: string[]): string[] {
    // start from root object that represents dynamicData
    let current: DynamicNode | undefined = undefined;
    // if path empty, we want top-level keys
    if (path.length === 0) {
      // top-level "object" built from dynamicData
      return Object.keys(this.dynamicData ?? {});
    }

    // traverse
    current = { type: 'object', properties: this.dynamicData } as DynamicObjectNode;
    for (const segment of path.slice(0, -1)) {
      // walk through all but the last segment to reach parent of current token
      if (current.type === 'object' && current.properties && segment in current.properties) {
        current = current.properties[segment];
      } else if (current.type === 'array' && segment === '[index]') {
        current = current.items;
      } else {
        // invalid path -> no suggestions
        return [];
      }
    }

    // now handle suggestions for the last segment (partial token)
    const lastSegment = path[path.length - 1];
    // if lastSegment is empty (e.g. just typed dot) then we should list children of parent
    if (lastSegment === '' || lastSegment === undefined) {
      if (current.type === 'object') return Object.keys(current.properties);
      if (current.type === 'array') {
        // for array suggest index token or properties of item
        // suggest [index] so user can then type .property
        if (current.items.type === 'object') {
          return ['[index]', ...Object.keys(current.items.properties)];
        }
        return ['[index]'];
      }
      return [];
    }

    // if parent is object -> filter its properties by prefix
    if (current.type === 'object') {
      return Object.keys(current.properties).filter((k) => k.startsWith(lastSegment));
    }

    if (current.type === 'array') {
      // suggest index token or properties of array item that match prefix
      const item = current.items;
      const props = item.type === 'object' ? Object.keys(item.properties) : [];
      const results = [];
      if ('[index]'.startsWith(lastSegment)) results.push('[index]');
      results.push(...props.filter((p) => p.startsWith(lastSegment)));
      return results;
    }

    return [];
  }

  // === Popup DOM ===
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
    // ensure active item visible
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

  // === Insert logic ===
  private select(value: string) {
    // insert selected segment. If user wants full placeholder, change here.
    // We will replace the current token (chain's last segment) with the selected value.
    this.replaceCurrentTokenWith(value);
    this.inserted.emit(value);
    this.closePopup();
  }

  private replaceCurrentTokenWith(textToInsert: string) {
    const el = this.el.nativeElement;
    if ((el as HTMLElement).isContentEditable) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);

      // compute range covering the matched chain before cursor
      const beforeText = this.getTextBeforeCursor();
      const chainMatch = beforeText.match(/(?:[\w$]+|\[index\])(?:\.(?:[\w$]+|\[index\]))*$/);
      if (chainMatch) {
        const chain = chainMatch[0];
        // create a range that covers the chain length backwards
        const newRange = range.cloneRange();
        // move start backward by chain.length characters within the same container/DOM
        // easiest: collapse to caret, then expand start by chain.length using Range APIs
        newRange.setStart(range.endContainer, range.endOffset);
        // walk backwards to set start (robust but simple approach: remove characters via string)
        // We'll replace by deleting the chain text using execCommand (works for contenteditable)
        // but execCommand deprecated — fallback: do manual approach
        // Simpler and robust: delete last chain chars by moving a temp range from caret-left
        const walkRange = document.createRange();
        // create a start point by walking nodes; easiest: use text nodes only by searching backward from container
        // For brevity and robustness: we'll delete using selection modify (available in browsers)
        try {
          // select backward by word/character chain.length (selection.modify may not be available everywhere)
          // fallback: delete last token using execCommand
          document.execCommand('insertText', false, ''); // noop ensure support
        } catch {}
      }
      // Simpler approach: insert text and then remove the previous token by searching in parent text
      // So we'll replace by reconstructing the whole text content of the editable element:
      const full = el.innerText || el.textContent || '';
      const caretIndex = this.getCaretIndexInContentEditable();
      const before = full.slice(0, caretIndex);
      const after = full.slice(caretIndex);
      const chainMatch2 = before.match(/(?:[\w$]+|\[index\])(?:\.(?:[\w$]+|\[index\]))*$/);
      if (chainMatch2) {
        const start = caretIndex - chainMatch2[0].length;
        const newText = before.slice(0, start) + textToInsert + after;
        el.innerText = newText;
        // set caret after inserted text
        this.setCaretInContentEditable(start + textToInsert.length);
      } else {
        // fallback: simple insert at caret
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
        el.dispatchEvent(new Event('input'));
      } else {
        // just insert
        el.setRangeText(textToInsert, el.selectionStart ?? 0, el.selectionEnd ?? 0, 'end');
        el.dispatchEvent(new Event('input'));
      }
    }
  }

  // helper: get caret index inside contenteditable as character offset (approx)
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

  // === caret rect calculation ===
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
      // approximate: compute caret position using a mirror technique is best but long.
      // here we approximate near element's top-left + padding + caret index
      const rect = el.getBoundingClientRect();
      return new DOMRect(rect.left + 8, rect.top + 18, 0, 0);
    }
    return new DOMRect();
  }
}
