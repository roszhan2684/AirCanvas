export interface Point {
  x: number;
  y: number;
}

export type StrokeStyle = 'pen' | 'neon' | 'rainbow' | 'spray' | 'marker' | 'dashed';

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  offsetX: number;
  offsetY: number;
  style?: StrokeStyle;
  opacity?: number;
}
