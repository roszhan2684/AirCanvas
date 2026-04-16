export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResult {
  landmarks: Landmark[][];
  multiHandedness: Array<{ label: string; score: number }>;
}

export type GestureMode = 'idle' | 'drawing' | 'grabbing' | 'erasing' | 'shape_placing' | 'shape_resize';

export interface GestureState {
  mode: GestureMode;
  indexTip: { x: number; y: number } | null;
  pinchCenter: { x: number; y: number } | null;
  palmCenter: { x: number; y: number } | null;
  // Two-hand fields
  secondPinchCenter: { x: number; y: number } | null;
  bothPinchDistance: number | null; // videoSize-space pixels between two pinches
}
