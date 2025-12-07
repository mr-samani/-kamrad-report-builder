export interface ISpacingModel {
  padding: ISpacing;
  margin: ISpacing;
}
export interface ISpacing {
  top: IPosValue;
  right: IPosValue;
  bottom: IPosValue;
  left: IPosValue;
}

export interface IPosValue {
  value?: number | 'auto';
  unit?: 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh' | 'auto';
}
