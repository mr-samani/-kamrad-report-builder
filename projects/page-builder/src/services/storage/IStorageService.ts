import { IPageBuilderDto } from '../../contracts/IPageBuilderDto';

export interface IStorageService {
  loadData(): Promise<IPageBuilderDto>;
  saveData(): Promise<IPageBuilderDto>;
}
