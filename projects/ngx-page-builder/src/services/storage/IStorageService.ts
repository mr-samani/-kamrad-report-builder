import { IPagebuilderOutput } from '../../contracts/IPageBuilderOutput';

export interface IStorageService {
  loadData(): Promise<IPagebuilderOutput>;
  saveData(): Promise<boolean>;
}
