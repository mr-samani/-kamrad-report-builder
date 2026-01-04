import { PageItem } from '../../models/PageItem';

export interface ImportResult {
  success: boolean;
  data?: PageItem[];
  error?: string;
  warnings?: string[];
}
