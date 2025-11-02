import { Injectable } from '@angular/core';
import { IStorageService } from './IStorageService';
import { PageBuilderDto } from '../../public-api';
import { PageBuilderService } from '../page-builder.service';
import { preparePageDataForSave } from './prepare-page-builder-data';

@Injectable()
export class JsonFileStorageService implements IStorageService {
  constructor(private pageBuilderService: PageBuilderService) {}

  async loadData(): Promise<PageBuilderDto> {
    try {
      const file = await this.selectFile(['.json']);
      const text = await file.text();
      const parsed = JSON.parse(text);
      return new PageBuilderDto(parsed);
    } catch (error) {
      console.error('Error loading JSON file:', error);
      return new PageBuilderDto();
    }
  }

  async saveData(): Promise<PageBuilderDto> {
    try {
      const sanitized = preparePageDataForSave(this.pageBuilderService.pageInfo);
      const json = JSON.stringify(sanitized, null, 2);
      this.downloadFile(json, 'page-data.json', 'application/json');
      return new PageBuilderDto(sanitized);
    } catch (error) {
      console.error('Error saving JSON file:', error);
      throw error;
    }
  }

  // --- Helpers ---
  private selectFile(accept: string[]): Promise<File> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept.join(',');
      input.style.display = 'none';
      document.body.appendChild(input);
      input.click();

      input.onchange = () => {
        if (input.files && input.files.length > 0) resolve(input.files[0]);
        else reject('No file selected');
        document.body.removeChild(input);
      };

      input.onerror = (e) => {
        reject(e);
        document.body.removeChild(input);
      };
    });
  }

  private downloadFile(content: string | Blob, fileName: string, mimeType: string) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}
