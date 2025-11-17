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

@Component({
  selector: 'page-column',
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.scss'],
  imports: [NgxDragDropKitModule],
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
      let el = await this.createElementCell(child, this.colContainer.nativeElement);
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
      },
      this.pageItem.id,
    );
    let el = this.createElementCell(newColumn, this.colContainer.nativeElement, index);
    this.pageItem.children.splice(index ?? this.pageItem.children.length, 0, newColumn);
  }

  private async createElementCell(item: PageItem, container: HTMLElement, index: number = -1) {
    item.options = {
      ...item.options,
      attributes: {
        class: 'col-item',
      },
    };
    if (this.pageBuilderService.mode == 'Edit') {
      item.options.directives = [
        {
          directive: NgxDropListDirective,
          inputs: {
            data: item.children,
          },
          outputs: {
            drop: this.onDrop.bind(this),
          },
        },
      ];
      item.options.events = {
        click: (ev: Event) => this.pageBuilderService.onSelectBlock(item, ev),
      };
    }
    let el = await this.dynamicElementService.createBlockElement(container, index, item);
    item.el = el;
    return el;
  }

  private onDrop(ev: any, parentId?: string) {
    this.pageBuilderService.onDrop(ev, parentId);
  }

  addColumnToLast() {
    this.addNewColumn(this.pageItem.children.length);
  }
  addColumnToFirst() {
    this.addNewColumn(0);
  }
}
