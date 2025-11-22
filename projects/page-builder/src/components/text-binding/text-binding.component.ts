import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { BaseComponent } from '../BaseComponent';
import { MatDialog } from '@angular/material/dialog';
import { PageItem } from '../../models/PageItem';
import { TextEditorComponent } from '../text-editor/text-editor.component';
import { DynamicDataStructure } from '../../models/DynamicData';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { DynamicDataService } from '../../services/dynamic-data.service';
import { DataSourceSelectorComponent } from './data-source-selector/data-source-selector.component';

@Component({
  selector: 'text-binding',
  templateUrl: './text-binding.component.html',
  styleUrls: ['./text-binding.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe, DataSourceSelectorComponent],
})
export class TextBindingComponent extends BaseComponent implements OnInit {
  @Input() item!: PageItem;
  @Output() change = new EventEmitter<string>();

  isCollectionItem: boolean = false;
  dataSourceName = '';

  bindingColumns: DynamicDataStructure[] = [];

  dsList: DynamicDataStructure[] = [];
  selectedNamespace = '';
  useDynamicData = false;
  isChildOfCollection = false;
  collectionDsList: DynamicDataStructure[] = [];
  constructor(
    injector: Injector,
    private matDialog: MatDialog,
    public dynamicDataService: DynamicDataService,
  ) {
    super(injector);
    // dynamic data if is not item collection
    this.dsList = this.dynamicDataService.dynamicData.filter((x) => !x.list);
  }

  ngOnInit() {
    if (!this.item.dataSource) {
      this.item.dataSource = {};
    }
    let c = (this.item.content ?? '').trim();
    if (c.startsWith('{{') && c.endsWith('}}')) {
      this.selectedNamespace = c.substring(2, c.length - 2);
      this.useDynamicData = true;
    }
    // check parent is collection list
    let parentCollection = this.parentCollectionItem(this.item);
    this.isChildOfCollection = parentCollection !== undefined;
    if (this.isChildOfCollection && parentCollection) {
      let dsList =
        this.dynamicDataService.dynamicData.find((x) => x.id === parentCollection.dataSource?.id)
          ?.list ?? [];
      this.collectionDsList = dsList.length > 0 ? dsList[0] : [];
    }
  }

  parentCollectionItem(item: PageItem): PageItem | undefined {
    if (item.template) {
      return item;
    }
    if (item.parent) {
      return this.parentCollectionItem(item.parent);
    }
    return undefined;
  }

  openTextEditor() {
    if (!this.item) return;
    this.matDialog
      .open(TextEditorComponent, {
        data: this.item,
        width: '80vw',
        maxWidth: '100%',
        height: '90vh',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result && this.item) {
          this.item.content = result;
          this.pageBuilderService.writeItemValue(this.item);
        }
      });
  }
  onChangeKey(event: string[]) {
    this.item.content = `{{${event.join('.')}}}`;
    this.change.emit(this.item.content);
  }
  onChangeCollectionKey(event: string[]) {
    if (event.length > 0) {
      this.useDynamicData = false;
      this.selectedNamespace = '';
    }
    this.item.dataSource!.binding = `${event.join('.')}`;
    this.change.emit(this.item.dataSource!.binding);
  }
  onChangeUseDs() {
    if (this.useDynamicData) {
      this.item.dataSource!.binding = '';
    }
  }
}
