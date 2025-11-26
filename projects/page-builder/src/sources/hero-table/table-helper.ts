import { PageItem } from '../../models/PageItem';

/**
 * Create rectengle from two coordinates
 * @param a from coordinate
 * @param b to coordinate
 * @returns
 */
export function getNormalizedRange(
  a: { row: number; col: number },
  b: { row: number; col: number },
) {
  return {
    row1: Math.min(a.row, b.row),
    row2: Math.max(a.row, b.row),
    col1: Math.min(a.col, b.col),
    col2: Math.max(a.col, b.col),
  };
}

export function isValidMergeRange(
  rowChildren: PageItem[],
  range: { row1: number; row2: number; col1: number; col2: number },
): boolean {
  for (let r = range.row1; r <= range.row2; r++) {
    const row = rowChildren[r];

    for (let c = range.col1; c <= range.col2; c++) {
      const cell = row.children[c];

      // اگر از قبل merge شده بود → INVALID
      const rowspan = Number(cell.options?.attributes?.['rowspan'] ?? 1);
      const colspan = Number(cell.options?.attributes?.['colspan'] ?? 1);

      if (rowspan > 1 || colspan > 1) {
        return false;
      }
    }
  }

  // حداقل یک مستطیل واقعی باشد
  const height = range.row2 - range.row1 + 1;
  const width = range.col2 - range.col1 + 1;

  if (height === 1 && width === 1) return false;

  return true;
}
