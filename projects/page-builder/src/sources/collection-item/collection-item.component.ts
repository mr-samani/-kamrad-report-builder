import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { ComponentDataContext } from '../../models/ComponentDataContext';
import { COMPONENT_DATA } from '../../models/tokens';
import { DataSourceSetting } from '../../models/DataSourceSetting';
import { PageItem } from '../../models/PageItem';
import { Subscription } from 'rxjs';
import { PageBuilderService, PageItemChange } from '../../services/page-builder.service';

@Component({
  selector: 'app-collection-item',
  templateUrl: './collection-item.component.html',
  styleUrls: ['./collection-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class CollectionItemComponent implements OnInit, AfterViewInit {
  templateList: PageItem[] = [];
  pageItem!: PageItem;
  subscription: Subscription;

  _template: PageItem = PageItem.fromJSON({
    tag: 'article',
    canHaveChild: true,
    disableMovement: true,
    lockMoveInnerChild: true,
    disableDelete: true,
    style: `
        position: relative;
        flex: auto;
        box-shadow: 0 0px 4px rgba(0, 0, 0, 0.3);
        padding: 10px;
        border-radius: 5px;
        overflow: hidden;
    `,
    options: {
      attributes: {
        class: 'template-container',
      },
    },
    children: [],
    parent: this.pageItem,
  });

  @ViewChild('collectionContainer') collectionContainer!: ElementRef<HTMLDivElement>;

  constructor(
    @Inject(COMPONENT_DATA) private context: ComponentDataContext<DataSourceSetting>,
    private chdRef: ChangeDetectorRef,
    private pageBuilderService: PageBuilderService,
  ) {
    this.subscription = this.context.onChange.subscribe((data) => {
      this.pageItem.dataSource = data;
      this.getData();
      this.chdRef.detectChanges();
    });

    this.pageBuilderService.changed$.subscribe((data) => {
      if (data.type == 'AddBlock' || data.type == 'RemoveBlock' || data.type == 'MoveBlock') {
        if (this.itemInThisTemplate(data.item)) {
          this.pageItem.template = this.findFirstParent(data.item!);
          this.update(data);
        }
      }
    });
  }

  ngOnInit() {
    if (!this.pageItem.template) {
      this.pageItem.template = this._template;
    }
  }

  ngAfterViewInit(): void {
    this.getData();
  }

  async getData() {
    if (!this.pageItem.dataSource || !this.pageItem.template) {
      return;
    }
    const count = this.pageItem.dataSource?.maxResultCount || 10;
    this.clearContainer();
    this.templateList = [];
    for (let i = 0; i < count; i++) {
      let cell = PageItem.fromJSON(this.pageItem.template);
      this.pageBuilderService.createBlockElement(cell, this.collectionContainer.nativeElement);
      this.templateList.push(cell);
    }
    this.chdRef.detectChanges();
  }

  itemInThisTemplate(item?: PageItem | null): boolean {
    if (!item || !this.pageItem || !this.templateList.length) {
      return false;
    }
    let p = this.findFirstParent(item);
    for (let t of this.templateList) {
      if (t.id == p.id) {
        return true;
      }
    }
    return false;
  }

  private findFirstParent(item: PageItem): PageItem {
    if (item.parent) {
      return this.findFirstParent(item.parent);
    } else {
      return item;
    }
  }

  async update(change: PageItemChange) {
    if (!this.pageItem || !this.pageItem.template || !change.item) return;

    this.clearContainer();
    this.templateList = [];

    const count = this.pageItem.dataSource?.maxResultCount || 10;

    for (let i = 0; i < count; i++) {
      let cloned = PageItem.fromJSON(this.pageItem.template);
      this.pageBuilderService.createBlockElement(cloned, this.collectionContainer.nativeElement);
      this.templateList.push(cloned);
    }
    this.chdRef.detectChanges();
  }

  private clearContainer() {
    this.pageBuilderService.destroyInTree(this.templateList, true);
  }
}
