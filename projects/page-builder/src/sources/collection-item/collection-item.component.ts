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
import { IPageItem, PageItem } from '../../models/PageItem';
import { Subscription } from 'rxjs';
import { PageBuilderService, PageItemChange } from '../../services/page-builder.service';
import { DynamicElementService } from '../../services/dynamic-element.service';
import { DynamicDataStructure } from '../../models/DynamicData';
import { DynamicDataService } from '../../services/dynamic-data.service';

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

  _template: IPageItem = {
    tag: 'article',
    isTemplateContainer: true,
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
  };

  dataList: DynamicDataStructure[][] = [];
  @ViewChild('collectionContainer') collectionContainer!: ElementRef<HTMLDivElement>;

  constructor(
    @Inject(COMPONENT_DATA) private context: ComponentDataContext<DataSourceSetting>,
    private chdRef: ChangeDetectorRef,
    private pageBuilderService: PageBuilderService,
    private dynamicElementService: DynamicElementService,
    private dynamicDataService: DynamicDataService,
  ) {
    this.subscription = this.context.onChange.subscribe((data) => {
      this.pageItem.dataSource = data;
      this.getData();
      this.chdRef.detectChanges();
    });
    /**
     * TODO: need enhancement for improve performance and avoid unnecessary updates
     * - change block content -> not rebuild all: only update same contents
     * - move block -> not rebuild all: only move same contents
     * - addd block only add new block
     */
    this.pageBuilderService.changed$.subscribe((data) => {
      if (
        data.type == 'AddBlock' ||
        data.type == 'RemoveBlock' ||
        data.type == 'MoveBlock' ||
        data.type == 'ChangeBlockContent' ||
        data.type == 'ChangeBlockProperties'
      ) {
        console.log('Block changed:', data.item?.id, data.type);
        if (this.itemInThisTemplate(data.item)) {
          this.pageItem.template = this.findCellContainer(data.item!);
          this.update(data);
        }
      }
    });
  }

  ngOnInit() {
    if (!this.pageItem.template) {
      this.pageItem.template = new PageItem(this._template, this.pageItem);
    } else {
      this.pageItem.template.isTemplateContainer = true;
    }
  }

  ngAfterViewInit(): void {
    this.getData();
  }

  async getData() {
    this.dataList = [];
    if (!this.pageItem.dataSource || !this.pageItem.template) {
      return;
    }
    const count = this.pageItem.dataSource?.maxResultCount || 10;
    const skip = this.pageItem.dataSource?.skipCount || 0;
    if (this.pageItem.dataSource.id) {
      this.dataList = this.dynamicDataService.getCollectionData(
        this.pageItem.dataSource.id,
        skip,
        count,
      );
    }

    this.clearContainer();
    this.templateList = [];
    for (let i = 0; i < count; i++) {
      let cloned = this.cloneTemplate(i);

      await this.pageBuilderService.createBlockElement(
        cloned,
        this.collectionContainer.nativeElement,
      );
      this.templateList.push(cloned);
    }
    this.chdRef.detectChanges();
  }

  itemInThisTemplate(item?: PageItem | null): boolean {
    if (!item || !this.pageItem || !this.templateList.length) {
      return false;
    }
    let p = this.findCellContainer(item);
    if (!p) return false;
    for (let t of this.templateList) {
      if (t.id == p.id) {
        return true;
      }
    }
    return false;
  }

  private findCellContainer(item: PageItem): PageItem | undefined {
    if (item.isTemplateContainer) {
      return item;
    }
    if (item.parent) {
      return this.findCellContainer(item.parent);
    }
    return undefined;
  }

  async update(change: PageItemChange) {
    if (!this.pageItem || !this.pageItem.template || !change.item) return;

    this.clearContainer();
    this.templateList = [];

    const count = this.pageItem.dataSource?.maxResultCount || 10;

    for (let i = 0; i < count; i++) {
      let cloned = this.cloneTemplate(i);
      await this.pageBuilderService.createBlockElement(
        cloned,
        this.collectionContainer.nativeElement,
      );
      this.templateList.push(cloned);
    }
    this.chdRef.detectChanges();
  }

  private clearContainer() {
    this.dynamicElementService.destroyBatch(this.templateList);
  }

  private cloneTemplate(index: number) {
    const cleanTree = (list: PageItem[]) => {
      for (let item of list) {
        delete item.options?.events;
        delete item.options?.directives;
        delete item.options?.inputs;
        delete item.options?.outputs;
        if (item.dataSource && item.dataSource.binding) {
          const row = this.dataList[index];
          if (row) {
            const col = row.find((x) => x.name == item.dataSource!.binding);
            item.content = (col?.value ?? '').toString();
          }
          console.log(item.content);
        }
        if (item.children && item.children.length > 0) {
          cleanTree(item.children);
        }
      }
    };
    cleanTree([this.pageItem.template!]);
    return PageItem.fromJSON(this.pageItem.template!);
  }
}
