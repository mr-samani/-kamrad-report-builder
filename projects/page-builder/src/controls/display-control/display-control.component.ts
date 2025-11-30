import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Injector,
  OnInit,
  Output,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { PageItem } from '../../models/PageItem';
import { BaseControl } from '../base-control';
import { mergeCssStyles } from '../../utiles/merge-css-styles';

export type DisplayType =
  | 'block'
  | 'inline'
  | 'inline-block'
  | 'flex'
  | 'inline-flex'
  | 'grid'
  | 'inline-grid'
  | 'table'
  | 'table-row'
  | 'table-cell'
  | 'none'
  | 'contents'
  | 'flow-root';

@Component({
  selector: 'display-control',
  templateUrl: './display-control.component.html',
  styleUrls: ['./display-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DisplayControlComponent),
      multi: true,
    },
  ],
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayControlComponent extends BaseControl implements OnInit, ControlValueAccessor {
  @Output() change = new EventEmitter<PageItem>();

  // Display Properties
  display: DisplayType = 'block';

  // Flex Properties
  flexDirection: 'row' | 'row-reverse' | 'column' | 'column-reverse' = 'row';
  flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse' = 'nowrap';
  justifyContent:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly' = 'flex-start';
  alignItems: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' = 'stretch';
  alignContent:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'stretch' = 'stretch';
  gap = '';
  rowGap = '';
  columnGap = '';

  // Flex Item Properties
  flexGrow = '';
  flexShrink = '';
  flexBasis = '';
  alignSelf: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch' = 'auto';
  order = '';

  // Grid Container Properties
  gridTemplateColumns = '';
  gridTemplateRows = '';
  gridTemplateAreas = '';
  gridAutoColumns = '';
  gridAutoRows = '';
  gridAutoFlow: 'row' | 'column' | 'dense' | 'row dense' | 'column dense' = 'row';
  justifyItems: 'start' | 'end' | 'center' | 'stretch' = 'stretch';
  alignItems2: 'start' | 'end' | 'center' | 'stretch' = 'stretch';
  placeItems = '';
  justifyContent2:
    | 'start'
    | 'end'
    | 'center'
    | 'stretch'
    | 'space-around'
    | 'space-between'
    | 'space-evenly' = 'start';
  alignContent2:
    | 'start'
    | 'end'
    | 'center'
    | 'stretch'
    | 'space-around'
    | 'space-between'
    | 'space-evenly' = 'start';
  placeContent = '';

  // Grid Item Properties
  gridColumn = '';
  gridRow = '';
  gridArea = '';
  justifySelf: 'auto' | 'start' | 'end' | 'center' | 'stretch' = 'auto';
  alignSelf2: 'auto' | 'start' | 'end' | 'center' | 'stretch' = 'auto';
  placeSelf = '';

  // Table Properties
  tableLayout: 'auto' | 'fixed' = 'auto';
  borderCollapse: 'separate' | 'collapse' = 'separate';
  borderSpacing = '';
  captionSide: 'top' | 'bottom' = 'top';
  emptyCells: 'show' | 'hide' = 'show';

  // Display Mode Options
  displayOptions: { value: DisplayType; label: string; icon: string }[] = [
    { value: 'block', label: 'Block', icon: '▭' },
    { value: 'inline', label: 'Inline', icon: '═' },
    { value: 'inline-block', label: 'Inline Block', icon: '▢' },
    { value: 'flex', label: 'Flex', icon: '⫴' },
    { value: 'inline-flex', label: 'Inline Flex', icon: '⫴' },
    { value: 'grid', label: 'Grid', icon: '▦' },
    { value: 'inline-grid', label: 'Inline Grid', icon: '▦' },
    { value: 'table', label: 'Table', icon: '⊞' },
    { value: 'table-row', label: 'Table Row', icon: '━' },
    { value: 'table-cell', label: 'Table Cell', icon: '□' },
    { value: 'none', label: 'None', icon: '⊗' },
    { value: 'contents', label: 'Contents', icon: '⋯' },
    { value: 'flow-root', label: 'Flow Root', icon: '↯' },
  ];

  constructor(
    injector: Injector,
    private cdr: ChangeDetectorRef,
  ) {
    super(injector);
  }

  ngOnInit() {}

  writeValue(item: PageItem): void {
    this.item = item;
    this.el = item?.el;

    if (item && this.el) {
      const computed = this.el.style;

      // Display
      this.display = (computed.display || 'block') as DisplayType;

      // Flex Properties
      this.flexDirection = (computed.flexDirection as any) || 'row';
      this.flexWrap = (computed.flexWrap as any) || 'nowrap';
      this.justifyContent = (computed.justifyContent as any) || 'flex-start';
      this.alignItems = (computed.alignItems as any) || 'stretch';
      this.alignContent = (computed.alignContent as any) || 'stretch';
      this.gap = computed.gap || '';
      this.rowGap = computed.rowGap || '';
      this.columnGap = computed.columnGap || '';

      // Flex Item Properties
      this.flexGrow = computed.flexGrow || '';
      this.flexShrink = computed.flexShrink || '';
      this.flexBasis = computed.flexBasis || '';
      this.alignSelf = (computed.alignSelf as any) || 'auto';
      this.order = computed.order || '';

      // Grid Properties
      this.gridTemplateColumns = computed.gridTemplateColumns || '';
      this.gridTemplateRows = computed.gridTemplateRows || '';
      this.gridTemplateAreas = computed.gridTemplateAreas || '';
      this.gridAutoColumns = computed.gridAutoColumns || '';
      this.gridAutoRows = computed.gridAutoRows || '';
      this.gridAutoFlow = (computed.gridAutoFlow as any) || 'row';
      this.justifyItems = (computed.justifyItems as any) || 'stretch';
      this.alignItems2 = (computed.alignItems as any) || 'stretch';
      this.justifyContent2 = (computed.justifyContent as any) || 'start';
      this.alignContent2 = (computed.alignContent as any) || 'start';

      // Grid Item Properties
      this.gridColumn = computed.gridColumn || '';
      this.gridRow = computed.gridRow || '';
      this.gridArea = computed.gridArea || '';
      this.justifySelf = (computed.justifySelf as any) || 'auto';
      this.alignSelf2 = (computed.alignSelf as any) || 'auto';

      // Table Properties
      this.tableLayout = (computed.tableLayout as any) || 'auto';
      this.borderCollapse = (computed.borderCollapse as any) || 'separate';
      this.borderSpacing = computed.borderSpacing || '';
      this.captionSide = (computed.captionSide as any) || 'top';
      this.emptyCells = (computed.emptyCells as any) || 'show';
    }

    this.cdr.detectChanges();
  }

  setDisplay(displayType: DisplayType) {
    this.display = displayType;
    this.update();
  }

  update() {
    if (!this.el || !this.item) return;

    // Apply Display
    this.renderer.setStyle(this.el, 'display', this.display);

    // Apply Flex Properties
    if (this.display === 'flex' || this.display === 'inline-flex') {
      this.renderer.setStyle(this.el, 'flex-direction', this.flexDirection);
      this.renderer.setStyle(this.el, 'flex-wrap', this.flexWrap);
      this.renderer.setStyle(this.el, 'justify-content', this.justifyContent);
      this.renderer.setStyle(this.el, 'align-items', this.alignItems);
      this.renderer.setStyle(this.el, 'align-content', this.alignContent);

      if (this.gap) this.renderer.setStyle(this.el, 'gap', this.gap);
      if (this.rowGap) this.renderer.setStyle(this.el, 'row-gap', this.rowGap);
      if (this.columnGap) this.renderer.setStyle(this.el, 'column-gap', this.columnGap);
    }

    // Apply Flex Item Properties (if parent is flex)
    if (this.flexGrow) this.renderer.setStyle(this.el, 'flex-grow', this.flexGrow);
    if (this.flexShrink) this.renderer.setStyle(this.el, 'flex-shrink', this.flexShrink);
    if (this.flexBasis) this.renderer.setStyle(this.el, 'flex-basis', this.flexBasis);
    if (this.alignSelf !== 'auto') this.renderer.setStyle(this.el, 'align-self', this.alignSelf);
    if (this.order) this.renderer.setStyle(this.el, 'order', this.order);

    // Apply Grid Properties
    if (this.display === 'grid' || this.display === 'inline-grid') {
      if (this.gridTemplateColumns)
        this.renderer.setStyle(this.el, 'grid-template-columns', this.gridTemplateColumns);
      if (this.gridTemplateRows)
        this.renderer.setStyle(this.el, 'grid-template-rows', this.gridTemplateRows);
      if (this.gridTemplateAreas)
        this.renderer.setStyle(this.el, 'grid-template-areas', this.gridTemplateAreas);
      if (this.gridAutoColumns)
        this.renderer.setStyle(this.el, 'grid-auto-columns', this.gridAutoColumns);
      if (this.gridAutoRows) this.renderer.setStyle(this.el, 'grid-auto-rows', this.gridAutoRows);
      this.renderer.setStyle(this.el, 'grid-auto-flow', this.gridAutoFlow);
      this.renderer.setStyle(this.el, 'justify-items', this.justifyItems);
      this.renderer.setStyle(this.el, 'align-items', this.alignItems2);
      this.renderer.setStyle(this.el, 'justify-content', this.justifyContent2);
      this.renderer.setStyle(this.el, 'align-content', this.alignContent2);

      if (this.gap) this.renderer.setStyle(this.el, 'gap', this.gap);
      if (this.rowGap) this.renderer.setStyle(this.el, 'row-gap', this.rowGap);
      if (this.columnGap) this.renderer.setStyle(this.el, 'column-gap', this.columnGap);
    }

    // Apply Grid Item Properties (if parent is grid)
    if (this.gridColumn) this.renderer.setStyle(this.el, 'grid-column', this.gridColumn);
    if (this.gridRow) this.renderer.setStyle(this.el, 'grid-row', this.gridRow);
    if (this.gridArea) this.renderer.setStyle(this.el, 'grid-area', this.gridArea);
    if (this.justifySelf !== 'auto')
      this.renderer.setStyle(this.el, 'justify-self', this.justifySelf);
    if (this.alignSelf2 !== 'auto') this.renderer.setStyle(this.el, 'align-self', this.alignSelf2);

    // Apply Table Properties
    if (this.display.includes('table')) {
      this.renderer.setStyle(this.el, 'table-layout', this.tableLayout);
      this.renderer.setStyle(this.el, 'border-collapse', this.borderCollapse);
      if (this.borderSpacing) this.renderer.setStyle(this.el, 'border-spacing', this.borderSpacing);
      this.renderer.setStyle(this.el, 'caption-side', this.captionSide);
      this.renderer.setStyle(this.el, 'empty-cells', this.emptyCells);
    }

    this.cdr.detectChanges();
    this.onChange(this.item);
    this.item.style = mergeCssStyles(this.item.style, this.el.style.cssText);
    this.change.emit(this.item);
  }

  private getStyles(): Partial<CSSStyleDeclaration> {
    const styles: any = {
      display: this.display,
    };

    // Flex styles
    if (this.display === 'flex' || this.display === 'inline-flex') {
      styles.flexDirection = this.flexDirection;
      styles.flexWrap = this.flexWrap;
      styles.justifyContent = this.justifyContent;
      styles.alignItems = this.alignItems;
      styles.alignContent = this.alignContent;
      if (this.gap) styles.gap = this.gap;
      if (this.rowGap) styles.rowGap = this.rowGap;
      if (this.columnGap) styles.columnGap = this.columnGap;
    }

    // Grid styles
    if (this.display === 'grid' || this.display === 'inline-grid') {
      if (this.gridTemplateColumns) styles.gridTemplateColumns = this.gridTemplateColumns;
      if (this.gridTemplateRows) styles.gridTemplateRows = this.gridTemplateRows;
      if (this.gridTemplateAreas) styles.gridTemplateAreas = this.gridTemplateAreas;
      if (this.gridAutoColumns) styles.gridAutoColumns = this.gridAutoColumns;
      if (this.gridAutoRows) styles.gridAutoRows = this.gridAutoRows;
      styles.gridAutoFlow = this.gridAutoFlow;
      styles.justifyItems = this.justifyItems;
      styles.justifyContent = this.justifyContent2;
      styles.alignContent = this.alignContent2;
      if (this.gap) styles.gap = this.gap;
    }

    return styles;
  }

  isFlex(): boolean {
    return this.display === 'flex' || this.display === 'inline-flex';
  }

  isGrid(): boolean {
    return this.display === 'grid' || this.display === 'inline-grid';
  }

  isTable(): boolean {
    return this.display.includes('table');
  }

  // Quick Flex Presets
  setFlexPreset(preset: string) {
    switch (preset) {
      case 'row-start':
        this.flexDirection = 'row';
        this.justifyContent = 'flex-start';
        this.alignItems = 'flex-start';
        break;
      case 'row-center':
        this.flexDirection = 'row';
        this.justifyContent = 'center';
        this.alignItems = 'center';
        break;
      case 'row-between':
        this.flexDirection = 'row';
        this.justifyContent = 'space-between';
        this.alignItems = 'center';
        break;
      case 'column-start':
        this.flexDirection = 'column';
        this.justifyContent = 'flex-start';
        this.alignItems = 'flex-start';
        break;
      case 'column-center':
        this.flexDirection = 'column';
        this.justifyContent = 'center';
        this.alignItems = 'center';
        break;
    }
    this.update();
  }

  // Quick Grid Presets
  setGridPreset(preset: string) {
    switch (preset) {
      case '2-col':
        this.gridTemplateColumns = 'repeat(2, 1fr)';
        break;
      case '3-col':
        this.gridTemplateColumns = 'repeat(3, 1fr)';
        break;
      case '4-col':
        this.gridTemplateColumns = 'repeat(4, 1fr)';
        break;
      case 'auto-fill':
        this.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        break;
      case 'auto-fit':
        this.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        break;
    }
    this.update();
  }
}
