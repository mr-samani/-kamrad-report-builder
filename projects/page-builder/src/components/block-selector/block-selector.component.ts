import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  Injector,
  OnInit,
  Signal,
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
export class BlockSelectorComponent extends BaseComponent implements OnInit {
  rect?: DOMRect;
  activeItem = computed(() => {
    const item = this.pageBuilderService.activeEl();
    this.updatePosition(item);
    return item;
  });
  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {}

  @HostListener('window:resize', ['$event'])
  onPageResize(ev: Event) {
    const item = this.activeItem();
    this.updatePosition(item);
  }

  updatePosition(item?: PageItem) {
    if (item) {
      const foundedElement: HTMLElement | null = this.doc.querySelector(`[data-id="${item.id}"]`);
      if (foundedElement) {
        this.rect = foundedElement.getBoundingClientRect();
      }
    }
    // reset => hide
    else {
      this.rect = undefined;
    }
  }

  deleteBlock() {
    const item = this.activeItem();
    if (item) {
      this.pageBuilderService.removeBlock(item);
    }
  }
}
