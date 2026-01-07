import { SourceItem } from '../../models/SourceItem';

export const ColumnSource = new SourceItem({
  tag: 'column',
  icon: 'assets/icons/column.svg',
  title: 'Column',
  options: {
    inputs: {},
  },
  customComponent: {
    componentKey: 'NgxPg',
    component: () => import('./column.component').then((c) => c.ColumnComponent),
  },
});
