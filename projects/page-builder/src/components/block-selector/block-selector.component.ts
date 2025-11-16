import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  Injector,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { BaseComponent } from '../BaseComponent';
import { PageItem } from '../../models/PageItem';

@Component({
  selector: 'block-selector',
  templateUrl: './block-selector.component.html',
  styleUrls: ['./block-selector.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockSelectorComponent extends BaseComponent implements OnDestroy {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  item?: PageItem;
  showInBottom = false;
  headerOffset = 30;

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private currentElement?: HTMLElement | null;

  constructor(injector: Injector) {
    super(injector);

    // Signal effect: runs when activeEl changes
    effect(() => {
      const newItem = this.pageBuilderService.activeEl();
      this.item = newItem;
      // console.log('Active element changed:', newItem);
      this.observeActiveElement();
    });
  }

  @HostListener('window:resize')
  onPageResize() {
    this.updatePosition();
  }

  ngOnDestroy() {
    this.disconnectObservers();
  }

  private observeActiveElement() {
    this.disconnectObservers();

    if (this.item) {
      const el = this.doc.querySelector<HTMLElement>(`[data-id="${this.item.id}"]`);
      if (!el) return;

      this.currentElement = el;

      // Watch for resize
      this.resizeObserver = new ResizeObserver(() => {
        this.updatePosition();
      });
      this.resizeObserver.observe(el);

      // Watch for style/class changes (margin/padding/etc.)
      this.mutationObserver = new MutationObserver(() => {
        this.updatePosition();
      });
      this.mutationObserver.observe(el, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });

      this.updatePosition();
    }
    this.chdRef.detectChanges();
  }

  private disconnectObservers() {
    if (this.resizeObserver && this.currentElement) {
      try {
        this.resizeObserver.unobserve(this.currentElement);
      } catch {}
    }
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.resizeObserver = undefined;
    this.mutationObserver = undefined;
    this.currentElement = null;
  }

  updatePosition() {
    // console.log('Updating position for:', `[data-id="${this.item?.id}"]`);
    if (!this.item) {
      this.x = this.y = this.width = this.height = 0;
      this.chdRef.detectChanges();
      return;
    }

    const el = this.doc.querySelector<HTMLElement>(`[data-id="${this.item.id}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    this.x = window.scrollX + rect.x;
    this.y = window.scrollY + rect.y;
    this.width = rect.width;
    this.height = rect.height;

    this.showInBottom = rect.y < 0 || rect.y - 24 < this.headerOffset;

    this.chdRef.detectChanges();
  }

  deleteBlock() {
    if (this.item) {
      this.pageBuilderService.removeBlock(this.item);
    }
  }
}
