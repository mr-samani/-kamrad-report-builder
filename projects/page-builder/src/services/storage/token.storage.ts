import { InjectionToken } from '@angular/core';
import { IStorageService } from './IStorageService';

export const STORAGE_SERVICE = new InjectionToken<IStorageService>('StorageService');
