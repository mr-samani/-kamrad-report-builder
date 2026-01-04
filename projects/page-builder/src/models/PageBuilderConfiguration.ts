import { StorageType } from '../services/storage/storage-type';
import { SourceItem } from './SourceItem';

export class PageBuilderConfiguration {
  storageType?: StorageType = StorageType.LocalStorage;
  customSources?: SourceItem[];

  enableHistory?: boolean = false;

  toolbarConfig?: PageBuilderToolbarConfig;
  enableAddCssFile?: boolean = false;
}

export class PageBuilderToolbarConfig {
  showOpenButton?: boolean = false;
  showSaveButton?: boolean = false;
  showPreviewButton?: boolean = true;
  showPrintButton?: boolean = true;
  showConfigButton?: boolean = true;
  showImportHtmlButton?: boolean = true;
  showExportHtmlButton?: boolean = true;
}
