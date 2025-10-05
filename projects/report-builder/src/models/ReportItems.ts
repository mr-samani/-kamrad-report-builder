import { ComponentRef, Type } from '@angular/core';
import { generateUUID } from '../utiles/generateUUID';

export class ReportItem<C = any> {
  id: string = generateUUID();
  component!: Type<C>;
  children: ReportItem<C>[] = [];

  constructor(component: Type<C>) {
    this.component = component;
  }
}
