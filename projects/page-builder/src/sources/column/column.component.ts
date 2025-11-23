import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgxDragDropKitModule, NgxDropListDirective } from 'ngx-drag-drop-kit';
import { PageItem } from '../../models/PageItem';
import { DynamicElementService } from '../../services/dynamic-element.service';
import { PageBuilderService } from '../../services/page-builder.service';
import { SvgIconDirective } from '../../directives/svg-icon.directive';

@Component({
  selector: 'page-column',
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.scss'],
  imports: [NgxDragDropKitModule, SvgIconDirective],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnComponent implements OnInit {
  pageItem!: PageItem;

  @ViewChild('colContainer', { static: true }) colContainer!: ElementRef<HTMLDivElement>;
  constructor(
    private dynamicElementService: DynamicElementService,
    public pageBuilderService: PageBuilderService,
  ) {}

  ngOnInit() {
    if (this.pageItem.children.length == 0) {
      this.addNewColumn();
      this.addNewColumn();
    } else {
      this.loadCols();
    }
  }
  async loadCols() {
    for (const child of this.pageItem.children) {
      let el = await this.pageBuilderService.createBlockElement(
        child,
        this.colContainer.nativeElement,
      );
      if (!el) continue;
      if (child.children && child.children.length > 0 && el) {
        this.loadChilds(child.children, el);
      }
    }
  }

  loadChilds(childs: PageItem[], container: HTMLElement) {
    for (const child of childs) {
      this.pageBuilderService.createBlockElement(child, container);
    }
  }
  addNewColumn(index?: number) {
    const newColumn = new PageItem(
      {
        tag: 'div',
        canHaveChild: true,
        options: {
          attributes: {
            class: 'col-item',
          },
        },
      },
      this.pageItem,
    );
    this.pageBuilderService.createBlockElement(newColumn, this.colContainer.nativeElement, index);
    this.pageItem.children.splice(index ?? this.pageItem.children.length, 0, newColumn);
  }

  addColumnToLast() {
    this.addNewColumn(this.pageItem.children.length);
  }
  addColumnToFirst() {
    this.addNewColumn(0);
  }
}
