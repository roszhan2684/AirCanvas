export type ShapeKind =
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'arrow'
  | 'diamond'
  | 'hexagon';

export interface PlacedShape {
  id: string;
  kind: ShapeKind;
  cx: number;
  cy: number;
  size: number;
  color: string;
  lineWidth: number;
  filled?: boolean;
  opacity?: number;
}
