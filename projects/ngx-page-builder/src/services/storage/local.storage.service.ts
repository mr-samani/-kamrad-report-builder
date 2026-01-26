import { Injectable } from '@angular/core';
import { PageBuilderService } from '../page-builder.service';
import { LOCAL_STORAGE_SAVE_KEY } from '../../consts/defauls';
import { IStorageService } from './IStorageService';
import { PageBuilderConfig, PageBuilderDto } from '../../models/PageBuilderDto';
import { preparePageDataForSave } from './prepare-page-builder-data';
import { ClassManagerService } from '../class-manager.service';
import { IPagebuilderOutput } from '../../contracts/IPageBuilderOutput';

@Injectable()
export class LocalStorageService implements IStorageService {
  constructor(
    private pageBuilder: PageBuilderService,
    private cls: ClassManagerService,
  ) {}
  loadData() {
    return new Promise<IPagebuilderOutput>(async (resolve, reject) => {
      try {
        const pageDto = localStorage.getItem(LOCAL_STORAGE_SAVE_KEY) || '';
        if (pageDto == '') {
          resolve({
            config: new PageBuilderConfig(),
            data: [],
            styles: [],
          });
          return;
        }
        const parsed: PageBuilderDto = new PageBuilderDto(JSON.parse(pageDto));
        const styles = await this.cls.exportAllFileCSS();
        resolve({
          config: parsed.config,
          data: parsed.pages,
          styles,
        });
      } catch (error) {
        console.error('Error loading page data:', error);
        reject(error);
      }
    });
  }

  saveData() {
    return new Promise<boolean>(async (resolve, reject) => {
      const sanitized = await preparePageDataForSave(this.pageBuilder);
      localStorage.setItem(LOCAL_STORAGE_SAVE_KEY, JSON.stringify(sanitized));
      resolve(true);
    });
  }
}
