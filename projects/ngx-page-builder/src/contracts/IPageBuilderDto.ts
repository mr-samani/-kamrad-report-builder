import { IPage } from '../public-api';
import { PageBuilderConfig } from '../models/PageBuilderDto';

export interface IPageBuilderDto {
  config: PageBuilderConfig;
  pages: IPage[];
  classes?: Record<string, string>;
}
