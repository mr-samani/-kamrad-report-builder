import { SourceItem } from '../../models/SourceItem';

export const CollectionItemSource = new SourceItem({
  tag: 'collection',
  icon: 'assets/icons/collection.svg',
  title: 'Collection Item',
  css: `.card-collection {
            position: relative;
            flex: auto;
            box-shadow: 0 0px 4px rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            overflow: hidden;
          }`,
  customComponent: {
    componentKey: 'NgxPgCollectionItem',
    component: () => import('./collection-item.component').then((c) => c.CollectionItemComponent),
    componentSettings: () =>
      import('./collection-settings/collection-settings.component').then(
        (c) => c.DataSourceSettingsComponent,
      ),
  },
});
