import { Injectable } from '@angular/core';
import { PageBuilderService } from '../page-builder.service';
import { LOCAL_STORAGE_SAVE_KEY } from '../../consts/defauls';
import { IStorageService } from './IStorageService';
import { PageBuilderDto } from '../../models/PageBuilderDto';
import { preparePageDataForSave } from './prepare-page-builder-data';

@Injectable()
export class LocalStorageService implements IStorageService {
  constructor(private pageBuilder: PageBuilderService) {}
  loadData() {
    return new Promise<PageBuilderDto>((resolve, reject) => {
      try {
        const pageDto = localStorage.getItem(LOCAL_STORAGE_SAVE_KEY) || '';
        if (pageDto == '') {
          resolve(new PageBuilderDto());
          return;
        }
        const parsed = JSON.parse(pageDto);
        resolve(new PageBuilderDto(parsed));
      } catch (error) {
        console.error('Error loading page data:', error);
        reject(error);
      }
    });
  }

  saveData() {
    return new Promise<PageBuilderDto>(async (resolve, reject) => {
      const sanitized = await preparePageDataForSave(this.pageBuilder.pageInfo);
      localStorage.setItem(LOCAL_STORAGE_SAVE_KEY, JSON.stringify(sanitized));
      resolve(new PageBuilderDto(sanitized));
    });
  }
}
