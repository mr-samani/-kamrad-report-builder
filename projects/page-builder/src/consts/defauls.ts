import { IDropEvent, NgxDraggableDirective, NgxDropListDirective } from 'ngx-drag-drop-kit';
import { Directive, SourceItem } from '../models/SourceItem';
import { PageItem } from '../models/PageItem';

/** loaded from initial provider
 *
 * - merge SOURCE_ITEMS with custom sources
 */
export const LibConsts: {
  SourceItemList: SourceItem[];
} = {
  SourceItemList: [],
};

export const DefaultBlockClassName = 'block-item';

export const LOCAL_STORAGE_SAVE_KEY = 'page';

export const DEFAULT_IMAGE_URL = '/assets/default-image.png';

export function getDefaultBlockDirective(pageItem: PageItem, onDropFn: Function) {
  const dir: Directive[] = [];
  if (!pageItem.disableMovement) {
    dir.push({ directive: NgxDraggableDirective });
  }

  if (pageItem.canHaveChild) {
    dir.push({
      directive: NgxDropListDirective,
      inputs: {
        data: pageItem.children,
        connectedTo: pageItem.lockMoveInnerChild ? `[data-id="${pageItem.id}"]` : undefined,
      },
      outputs: {
        drop: (ev: IDropEvent<PageItem>) => onDropFn(ev, pageItem),
      },
    });
  }
  return dir;
}
