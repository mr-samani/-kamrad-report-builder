import { Routes } from '@angular/router';
import { PreviewComponent } from './preview/preview.component';
import { BuilderComponent } from './builder/builder.component';

export const routes: Routes = [
  { path: '', component: BuilderComponent },
  {
    path: 'preview',
    component: PreviewComponent,
  },
];
