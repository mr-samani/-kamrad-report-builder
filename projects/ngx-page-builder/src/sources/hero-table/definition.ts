import { SourceItem } from '../../models/SourceItem';

export const HeroTableSource = new SourceItem({
  tag: 'hero-table',
  icon: 'assets/icons/table.svg',
  title: 'Hero Table',
  customComponent: {
    componentKey: 'NgxPgHeroTable',
    component: () => import('./hero-table.component').then((c) => c.HeroTableComponent),
    componentSettings: () =>
      import('./table-settings/table-settings.component').then((c) => c.HeroTableSettingsComponent),
  },
});
