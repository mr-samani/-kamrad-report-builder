import { PageItem } from '../models/PageItem';

export abstract class BlockHelper {
  /**
   * find parent by tag
   * @param item pageItem
   * @param tags include tags like=['td','th']
   * @param breakTags break parent tag like=['tbody','thead','tfoot']
   * @returns pageItem or undefined
   */
  static findParentByTag(
    item: PageItem,
    tags: string[],
    breakTags: string[],
  ): PageItem | undefined {
    if (tags.includes(item.tag)) {
      return item;
    }

    if (item.parent) {
      if (breakTags.includes(item.parent.tag)) {
        return undefined;
      }
      return BlockHelper.findParentByTag(item.parent, tags, breakTags);
    }
    return undefined;
  }
}
