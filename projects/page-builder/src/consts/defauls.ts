import { NgxDraggableDirective, NgxResizableDirective } from 'ngx-drag-drop-kit';
import { SourceItem } from '../models/SourceItem';
import { CdkDrag } from '@angular/cdk/drag-drop';

/** loaded from initial provider
 *
 * - merge SOURCE_ITEMS with custom sources
 */
export const LibConsts: {
  SourceItemList: SourceItem[];
} = {
  SourceItemList: [],
};

export const DefaultBlockDirectives = [CdkDrag];

export const DefaultBlockClassName = 'block-item';

export const LOCAL_STORAGE_SAVE_KEY = 'page';

export const DEFAULT_IMAGE_URL = '/assets/default-image.png';
