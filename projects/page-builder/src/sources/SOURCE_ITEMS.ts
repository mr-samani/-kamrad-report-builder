import { randomNumber } from '../utiles/randomNumber';
import { SourceItem } from '../models/SourceItem';

export const SOURCE_ITEMS: SourceItem[] = [
  {
    tag: 'div',
    title: 'Div',
    icon: 'assets/icons/div.svg',
    canHaveChild: true,
  },
  {
    tag: 'section',
    title: 'Section',
    icon: 'assets/icons/section.svg',
    canHaveChild: true,
  },
  {
    tag: 'span',
    title: 'Span',
    icon: 'assets/icons/span.svg',
    content: 'Span',
  },
  {
    tag: 'p',
    title: 'Paragraph',
    icon: 'assets/icons/paragraph.svg',
    content: 'Paragraph',
  },
  {
    tag: 'h1',
    title: 'Heading 1',
    icon: 'assets/icons/h1.svg',
    content: 'Heading 1',
  },
  {
    tag: 'h2',
    title: 'Heading 2',
    icon: 'assets/icons/h2.svg',
    content: 'Heading 2',
  },
  {
    tag: 'h3',
    title: 'Heading 3',
    icon: 'assets/icons/h3.svg',
    content: 'Heading 3',
  },
  {
    tag: 'h4',
    title: 'Heading 4',
    icon: 'assets/icons/h4.svg',
    content: 'Heading 4',
  },
  {
    tag: 'h5',
    title: 'Heading 5',
    icon: 'assets/icons/h5.svg',
    content: 'Heading 5',
  },
  {
    tag: 'h6',
    title: 'Heading 6',
    icon: 'assets/icons/h6.svg',
    content: 'Heading 6',
  },
  {
    tag: 'img',
    title: 'Image',
    icon: 'assets/icons/img.svg',
    options: {
      attributes: {
        loading: 'lazy',
      },
    },
  },
  {
    tag: 'input',
    title: 'Input',
    icon: 'assets/icons/input.svg',
    options: {
      attributes: {
        name: 'input-field-' + randomNumber(3),
        type: 'text',
        placeholder: 'Enter text',
      },
    },
  },
  new SourceItem({
    tag: 'column',
    icon: 'assets/icons/column.svg',
    title: 'Column',
    options: {
      inputs: {},
    },
    customComponent: {
      componentKey: 'NgxPg',
      component: () => import('./column/column.component').then((c) => c.ColumnComponent),
    },
  }),
  new SourceItem({
    tag: 'page-break',
    icon: 'assets/icons/page-break.svg',
    title: 'Page Break',
    disableMovement: true,
    customComponent: {
      componentKey: 'NgxPgPageBreak',
      component: () =>
        import('./page-break/page-break.component').then((c) => c.PageBreakComponent),
    },
  }),
  new SourceItem({
    tag: 'collection',
    icon: 'assets/icons/collection.svg',
    title: 'Collection Item',
    customComponent: {
      componentKey: 'NgxPgCollectionItem',
      component: () =>
        import('./collection-item/collection-item.component').then(
          (c) => c.CollectionItemComponent,
        ),
      componentSettings: () =>
        import('./collection-item/collection-settings/collection-settings.component').then(
          (c) => c.DataSourceSettingsComponent,
        ),
    },
  }),
  new SourceItem({
    tag: 'hero-table',
    icon: 'assets/icons/table.svg',
    title: 'Hero Table',
    customComponent: {
      componentKey: 'NgxPgHeroTable',
      component: () =>
        import('./hero-table/hero-table.component').then((c) => c.HeroTableComponent),
      componentSettings: () =>
        import('./hero-table/table-settings/table-settings.component').then(
          (c) => c.HeroTableSettingsComponent,
        ),
    },
  }),
];
