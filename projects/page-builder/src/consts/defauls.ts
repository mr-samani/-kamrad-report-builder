import { NgxDraggableDirective } from 'ngx-drag-drop-kit';
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

const DefaultBlockDirectives: Directive[] = [{ directive: NgxDraggableDirective }];

export const DefaultBlockClassName = 'block-item';

export const LOCAL_STORAGE_SAVE_KEY = 'page';

export const DEFAULT_IMAGE_URL = '/assets/default-image.png';

export function getDefaultBlockDirective(pageItem: PageItem) {
  if (pageItem.disableMovement) {
    return DefaultBlockDirectives.filter((d) => d.directive !== NgxDraggableDirective);
  }
  return DefaultBlockDirectives;
}
