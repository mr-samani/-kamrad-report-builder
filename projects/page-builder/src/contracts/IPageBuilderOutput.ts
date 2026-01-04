import { IPage, IPageBuilderDto } from '../public-api';

export interface IPagebuilderOutput {
  data: IPage[];
  style: string;
  script: string;
  html: string;
}
