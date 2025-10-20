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
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
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
        let rect = foundedElement.getBoundingClientRect();
        this.x = window.scrollX + rect.x;
        this.y = window.scrollY + rect.y;
        this.width = rect.width;
        this.height = rect.height;
      }
    }
    // reset => hide
    else {
      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;
    }
  }

  deleteBlock() {
    const item = this.activeItem();
    if (item) {
      this.pageBuilderService.removeBlock(item);
    }
  }
}
