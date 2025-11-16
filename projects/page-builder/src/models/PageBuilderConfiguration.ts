import { StorageType, SourceItem } from '../public-api';

export class PageBuilderConfiguration {
  storageType?: StorageType = StorageType.LocalStorage;
  customSources?: SourceItem[];
}
