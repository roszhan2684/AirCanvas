import type { Point } from '../types/stroke';

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothPoint(
  prev: { x: number; y: number },
  next: { x: number; y: number },
  alpha: number
): { x: number; y: number } {
  return {
    x: lerp(prev.x, next.x, alpha),
    y: lerp(prev.y, next.y, alpha),
  };
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function pointInStroke(
  point: { x: number; y: number },
  points: Point[],
  offsetX: number,
  offsetY: number,
  threshold: number
): boolean {
  for (const p of points) {
    if (distance(point, { x: p.x + offsetX, y: p.y + offsetY }) < threshold) {
      return true;
    }
  }
  return false;
}

export function strokeBoundingBoxCenter(
  points: Point[],
  offsetX: number,
  offsetY: number
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x + offsetX);
    minY = Math.min(minY, p.y + offsetY);
    maxX = Math.max(maxX, p.x + offsetX);
    maxY = Math.max(maxY, p.y + offsetY);
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}
