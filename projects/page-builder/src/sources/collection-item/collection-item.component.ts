import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ComponentDataContext } from '../../models/ComponentDataContext';
import { COMPONENT_DATA } from '../../models/tokens';
import { DataSourceSetting } from '../../models/DataSourceSetting';
import { PageItem } from '../../models/PageItem';
import { Subscription } from 'rxjs';
import { ItemGeneratorComponent } from './item-generator/item-generator.component';
import { PageBuilderService } from '../../services/page-builder.service';

@Component({
  selector: 'app-collection-item',
  templateUrl: './collection-item.component.html',
  styleUrls: ['./collection-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ItemGeneratorComponent],
})
export class CollectionItemComponent implements OnInit {
  list = [];
  pageItem!: PageItem;
  subscription: Subscription;

  template: PageItem = PageItem.fromJSON({
    tag: 'div',
    canHaveChild: true,
    disableMovement: true,
    lockMoveInnerChild: true,
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
  });

  @ViewChildren(ItemGeneratorComponent) itemGenerators!: QueryList<ItemGeneratorComponent>;

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
      if (
        data.type == 'AddBlock' ||
        data.type == 'RemoveBlock' ||
        data.type == 'ChangeBlockContent'
      ) {
        if (this.itemInThisTemplate(data.item)) {
          this.renderAllItems(true);
        }
      }
    });
  }

  ngOnInit() {
    if (!this.pageItem.template) {
      this.pageItem.template = this.template;
    }
    this.getData();
  }

  async getData() {
    if (!this.pageItem.dataSource) {
      return;
    }
    const count = this.pageItem.dataSource?.maxResultCount || 10;
    this.list = Array.from({ length: count });

    setTimeout(() => {
      this.renderAllItems();
    }, 100);
  }

  private renderAllItems(force: boolean = false) {
    console.log('Rendering all items', this.itemGenerators.length);
    this.itemGenerators.forEach((itemGenerator, index) => {
      itemGenerator.generate(this.pageItem.template, force);
    });
    this.chdRef.detectChanges();
  }

  itemInThisTemplate(item?: PageItem | null): boolean {
    if (!item || !this.pageItem || !this.pageItem.template) {
      return false;
    }
    for (let t of this.pageItem.template.children) {
      if (t.id == item.id) {
        return true;
      }
      if (t.children && t.children.length > 0) {
        if (this.itemInThisTemplate(item)) {
          return true;
        }
      }
    }
    return false;
  }
}
