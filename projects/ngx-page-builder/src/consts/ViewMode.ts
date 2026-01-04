export declare type ViewMode = (typeof ViewModes)[number];
export const ViewModes = ['WebPage', 'PrintPage'] as const;
export function validateViewMode(mode: ViewMode): ViewMode {
  return ViewModes.includes(mode) ? mode : 'PrintPage';
}
