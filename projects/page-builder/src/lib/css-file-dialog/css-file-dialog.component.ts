import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  forwardRef,
  ChangeDetectorRef,
  Provider,
  Injector,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

const CLASS_MAP_CSS_EDITOR_PROVIDER: Provider[] = [
  {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CssFileDialogComponent),
    multi: true,
  },
  {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => CssFileDialogComponent),
    multi: true,
  },
];

@Component({
  selector: 'app-css-file-dialog',
  templateUrl: './css-file-dialog.component.html',
  styleUrls: ['./css-file-dialog.component.scss'],

  providers: CLASS_MAP_CSS_EDITOR_PROVIDER,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CssFileDialogComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor, Validator
{
  @Input() placeholder = '/* وارد کنید: .my-class { color: red } */';
  @Input() allowMultipleSelectors = false; // if true accepts ".a, .b { ... }" but maps only first
  @Output() classesChange = new EventEmitter<Record<string, string>>();

  @ViewChild('editorTextarea', { static: false }) textareaRef?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('highlightDiv', { static: false }) highlightRef?: ElementRef<HTMLDivElement>;

  cssText = '';
  highlightHtml = '';
  errors: string[] = [];
  isDisabled = false;

  onTouchedFn: () => void = () => {};
  private onChangeFn: (v: any) => void = () => {};
  private updateTimeout?: any;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.setupSyncScroll();
    this.updateHighlight();
  }

  ngOnDestroy(): void {
    if (this.updateTimeout) clearTimeout(this.updateTimeout);
  }

  writeValue(value: Record<string, string> | null): void {
    if (!value) {
      this.cssText = '';
    } else {
      this.cssText = this.classesToCss(value);
    }
    this.updateHighlight();
    this.cdr.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChangeFn = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouchedFn = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (this.textareaRef) this.textareaRef.nativeElement.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const parsed = this.cssToClasses(this.cssText);
    if (parsed.errors && parsed.errors.length) {
      return { invalidCss: parsed.errors };
    }
    return null;
  }

  // Public API: save (parse and emit classes map)
  save() {
    const parsed = this.cssToClasses(this.cssText);
    this.errors = parsed.errors;
    if (parsed.errors.length === 0 && parsed.classes) {
      // emit and propagate value
      this.onChangeFn(parsed.classes);
      this.classesChange.emit(parsed.classes);
    }
    this.updateHighlight();
    this.cdr.markForCheck();
  }

  // UI handlers
  onInput(e: Event) {
    const t = e.target as HTMLTextAreaElement;
    this.cssText = t.value;
    this.updateHighlight();
    if (this.updateTimeout) clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => {
      // optionally live-validate
      const parsed = this.cssToClasses(this.cssText);
      this.errors = parsed.errors;
      // do not auto-emit; require explicit save
      this.cdr.markForCheck();
    }, 250);
  }

  onKeyDown(ev: KeyboardEvent) {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) return;

    if (ev.key === 'Tab') {
      ev.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const v = textarea.value;
      textarea.value = v.substring(0, start) + '  ' + v.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      this.cssText = textarea.value;
      this.updateHighlight();
    }
  }

  private setupSyncScroll() {
    if (!this.textareaRef || !this.highlightRef) return;
    const ta = this.textareaRef.nativeElement;
    const hi = this.highlightRef.nativeElement;
    ta.addEventListener('scroll', () => {
      hi.scrollTop = ta.scrollTop;
      hi.scrollLeft = ta.scrollLeft;
    });
  }

  private updateHighlight() {
    this.highlightHtml = this.highlightFileCss(this.cssText);
    if (this.highlightRef) {
      this.highlightRef.nativeElement.innerHTML = this.highlightHtml;
    }
  }

  /*************** conversion & validation logic ***************/

  // Convert classes map to pretty css text
  classesToCss(classes: Record<string, string>): string {
    const lines: string[] = [];
    for (const key of Object.keys(classes)) {
      const sel = key.startsWith('.') ? key : `.${key}`;
      const raw = classes[key] ?? '';
      // normalize: ensure semicolons between declarations
      const body = raw
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => (p.endsWith(';') ? p : p + ';'))
        .join('\n  ');
      if (!body) {
        lines.push(`${sel} {\n}\n`);
      } else {
        lines.push(`${sel} {\n  ${body}\n}\n`);
      }
    }
    return lines.join('\n').trim();
  }

  // Parse CSS text into classes map + errors
  cssToClasses(css: string): { classes: Record<string, string>; errors: string[] } {
    const errors: string[] = [];
    const classes: Record<string, string> = {};

    // Remove comments first (but keep line counts for accurate messages)
    const noComments = css.replace(/\/\*[\s\S]*?\*\//g, (m) => {
      // preserve newlines to maintain line numbers
      return m.replace(/[^\n]/g, ' ');
    });

    // naive block parser: find selector { body }
    const blockRegex = /([^{]+)\{([^}]*)\}/g;
    let match: RegExpExecArray | null;
    const seenSelectors = new Set<string>();
    let anyBlock = false;
    while ((match = blockRegex.exec(noComments)) !== null) {
      anyBlock = true;
      const rawSelector = match[1].trim();
      const body = match[2].trim();
      // support combined selectors by splitting by comma, use first for mapping
      const selectors = rawSelector
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (selectors.length === 0) {
        errors.push(`Selector خالی در بخش: "${rawSelector}"`);
        continue;
      }

      const selector = selectors[0]; // map to first
      // we accept .name or name (without dot)
      const selMatch = selector.match(
        /^\.(?<dotname>[A-Za-z0-9\-_]+)$|^(?<noname>[A-Za-z0-9\-_]+)$/,
      );
      if (!selMatch) {
        errors.push(
          `Selector نامعتبر: "${selector}". فقط کلاسهای ساده مانند ".btn" یا "btn" مجاز هستند.`,
        );
        continue;
      }
      const key = selMatch.groups?.['dotname'] ?? selMatch.groups?.['noname'] ?? selector;
      if (seenSelectors.has(key)) {
        errors.push(`تکرار selector برای "${key}"`);
      }
      seenSelectors.add(key);

      // parse body into property:value pairs
      const pairs = body
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean);

      if (pairs.length === 0) {
        classes[key] = '';
        continue;
      }

      const cleanedPairs: string[] = [];
      pairs.forEach((p, idx) => {
        const colonIndex = p.indexOf(':');
        if (colonIndex === -1) {
          // find line number for better message
          const before = noComments.slice(0, match!.index);
          const blockStartLine = before.split('\n').length;
          const relativeLines = match![2].slice(0, match![2].indexOf(p)).split('\n').length - 1;
          const lineNum = blockStartLine + relativeLines + 1;
          errors.push(`پراپرتی نامعتبر (بدون ':') در selector "${key}" در خط ${lineNum}: "${p}"`);
        } else {
          const prop = p.slice(0, colonIndex).trim();
          const val = p.slice(colonIndex + 1).trim();
          if (!prop) {
            errors.push(`نام پراپرتی خالی در selector "${key}": "${p}"`);
          }
          if (!val) {
            errors.push(`مقدار پراپرتی خالی برای "${prop}" در selector "${key}"`);
          }
          cleanedPairs.push(`${prop}:${val}`); // store without trailing ;
        }
      });

      classes[key] = cleanedPairs.join(';');
    }

    if (!anyBlock && css.trim()) {
      // if user typed something but no blocks found, try accepting inline format "key: prop:val;..."
      errors.push(
        'هیچ بلاک CSS (selector { ... }) یافت نشد. مطمئن شوید ساختار مانند: .btn { color: red; } است.',
      );
    }

    return { classes, errors };
  }

  /*************** highlighting ***************/
  private highlightFileCss(css: string): string {
    if (!css || !css.trim()) {
      return `<span class="css-placeholder">${this.escapeHtml(this.placeholder)}</span>`;
    }

    // remove comments for highlighting separately but keep them visible
    // We will process blocks and non-block text
    const parts: string[] = [];
    // simple scan: use same regex as parser
    const blockRegex = /([^{]+)\{([^}]*)\}/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = blockRegex.exec(css)) !== null) {
      const before = css.substring(lastIndex, m.index);
      if (before) parts.push(this.escapeHtml(before));
      const selector = this.escapeHtml(m[1]);
      const body = m[2];

      // highlight selector
      const selectorHtml = `<span class="css-selector">${selector.trim()}</span>`;
      // highlight body using existing logic for property:value;
      const lines = body
        .split('\n')
        .map((l) => l.trim())
        .filter(() => true);
      const bodyHighlighted = body
        .split(';')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .map((p) => {
          const colonIndex = p.indexOf(':');
          if (colonIndex === -1) {
            return `<span class="css-invalid">${this.escapeHtml(p)}</span>;`;
          }
          const prop = this.escapeHtml(p.slice(0, colonIndex).trim());
          const val = this.escapeHtml(p.slice(colonIndex + 1).trim());
          const hv = this.highlightValue(val);
          return `<span class="css-property">${prop}</span><span class="css-colon">:</span><span class="css-value">${hv}</span><span class="css-semicolon">;</span>`;
        })
        .join('<br>  ');

      parts.push(`${selectorHtml} {<br>  ${bodyHighlighted}<br>}`);
      lastIndex = blockRegex.lastIndex;
    }
    // trailing
    if (lastIndex < css.length) {
      parts.push(this.escapeHtml(css.substring(lastIndex)));
    }

    return parts.join('');
  }

  private highlightValue(val: string): string {
    const v = val.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(v))
      return `<span class="css-color">${this.escapeHtml(v)}</span>`;
    if (/^(rgb|rgba|hsl|hsla)\(/.test(v))
      return `<span class="css-color">${this.escapeHtml(v)}</span>`;
    if (/!important/.test(v))
      return this.escapeHtml(v).replace(
        /!important/,
        '<span class="css-important">!important</span>',
      );
    if (/^-?\d+\.?\d+(px|em|rem|%|vh|vw|deg|s|ms)?$/i.test(v))
      return `<span class="css-number">${this.escapeHtml(v)}</span>`;
    if (/^url\(.+\)$/.test(v)) return `<span class="css-url">${this.escapeHtml(v)}</span>`;
    if (/\s/.test(v)) {
      return v
        .split(/\s+/)
        .map((part) => this.highlightValue(part))
        .join(' ');
    }
    if (/^[a-z]+$/i.test(v)) return `<span class="css-keyword">${this.escapeHtml(v)}</span>`;
    return this.escapeHtml(v);
  }

  private escapeHtml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
