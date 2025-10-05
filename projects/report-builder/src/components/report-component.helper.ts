import { Type, ViewContainerRef } from '@angular/core';
import { ReportComponentType } from './component-types';

export abstract class ReportComponentHelper {
  /**
   * lazy load component type for a given report component type.
   * @param item type of component
   * @returns
   */
  public static async getComponent(item: ReportComponentType): Promise<typeof Type> {
    let c: any;
    switch (item) {
      case ReportComponentType.Container:
        c = (await import('./container/container.component')).ContainerComponent;
        break;
      case ReportComponentType.Image:
        c = (await import('./image/image.component')).ImageComponent;
        break;
      default:
        throw new Error(`Unknown component type: ${item}`);
    }
    return c;
  }
}
