import { Injectable } from '@angular/core';
import { IStorageService } from './IStorageService';
import { PageBuilderDto } from '../../models/PageBuilderDto';

@Injectable()
export class HttpStorageService implements IStorageService {
  loadData(): Promise<PageBuilderDto> {
    throw new Error('Method not implemented.');
  }
  saveData(): Promise<PageBuilderDto> {
    throw new Error('Method not implemented.');
  }
}
