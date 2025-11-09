import { NgxDraggableDirective } from 'ngx-drag-drop-kit';
import { Directive, SourceItem } from '../models/SourceItem';

/** loaded from initial provider
 *
 * - merge SOURCE_ITEMS with custom sources
 */
export const LibConsts: {
  SourceItemList: SourceItem[];
} = {
  SourceItemList: [],
};

export const DefaultBlockDirectives: Directive[] = [{ directive: NgxDraggableDirective }];

export const DefaultBlockClassName = 'block-item';

export const LOCAL_STORAGE_SAVE_KEY = 'page';

export const DEFAULT_IMAGE_URL = '/assets/default-image.png';
