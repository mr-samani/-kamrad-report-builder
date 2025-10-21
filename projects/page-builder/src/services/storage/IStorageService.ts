import { PageBuilderDto } from '../../models/PageBuilderDto';

export interface IStorageService {
  loadData(): Promise<PageBuilderDto>;
  saveData(): Promise<PageBuilderDto>;
}
