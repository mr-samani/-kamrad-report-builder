import { PageBuilderConfig } from '../models/PageBuilderDto';
import { IPage } from './IPage';

export interface IPagebuilderOutput {
  config: PageBuilderConfig;
  data: IPage[];
  style: string;
  script?: string;
  html?: string;
}
