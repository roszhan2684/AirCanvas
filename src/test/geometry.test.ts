import { describe, it, expect } from 'vitest';
import { distance, lerp, smoothPoint, midpoint, pointInStroke, strokeBoundingBoxCenter } from '../lib/geometry';

describe('distance', () => {
  it('returns 0 for same point', () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });
  it('returns 5 for 3-4-5 triangle', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
  it('is symmetric', () => {
    const a = { x: 1, y: 2 }, b = { x: 7, y: 9 };
    expect(distance(a, b)).toBeCloseTo(distance(b, a));
  });
});

describe('lerp', () => {
  it('returns a at t=0', () => { expect(lerp(10, 20, 0)).toBe(10); });
  it('returns b at t=1', () => { expect(lerp(10, 20, 1)).toBe(20); });
  it('returns midpoint at t=0.5', () => { expect(lerp(10, 20, 0.5)).toBe(15); });
  it('extrapolates beyond 1', () => { expect(lerp(0, 10, 2)).toBe(20); });
});

describe('smoothPoint', () => {
  it('returns prev when alpha=0', () => {
    const r = smoothPoint({ x: 0, y: 0 }, { x: 100, y: 100 }, 0);
    expect(r).toEqual({ x: 0, y: 0 });
  });
  it('returns next when alpha=1', () => {
    const r = smoothPoint({ x: 0, y: 0 }, { x: 100, y: 100 }, 1);
    expect(r).toEqual({ x: 100, y: 100 });
  });
  it('interpolates at alpha=0.5', () => {
    const r = smoothPoint({ x: 0, y: 0 }, { x: 100, y: 100 }, 0.5);
    expect(r).toEqual({ x: 50, y: 50 });
  });
  it('moves toward next at alpha=0.72 (tracking value)', () => {
    const r = smoothPoint({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.72);
    expect(r.x).toBeCloseTo(72);
    expect(r.y).toBe(0);
  });
});

describe('midpoint', () => {
  it('returns exact midpoint', () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 10 })).toEqual({ x: 5, y: 5 });
  });
  it('handles negative coords', () => {
    expect(midpoint({ x: -10, y: -10 }, { x: 10, y: 10 })).toEqual({ x: 0, y: 0 });
  });
});

describe('pointInStroke', () => {
  const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];
  it('finds a point within threshold', () => {
    expect(pointInStroke({ x: 5, y: 0 }, pts, 0, 0, 10)).toBe(true);
  });
  it('misses a point outside threshold', () => {
    expect(pointInStroke({ x: 100, y: 100 }, pts, 0, 0, 5)).toBe(false);
  });
  it('respects offset', () => {
    expect(pointInStroke({ x: 15, y: 5 }, pts, 5, 5, 5)).toBe(true);
  });
});

describe('strokeBoundingBoxCenter', () => {
  it('returns (0,0) for empty array', () => {
    expect(strokeBoundingBoxCenter([], 0, 0)).toEqual({ x: 0, y: 0 });
  });
  it('returns center of bounding box', () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 }];
    expect(strokeBoundingBoxCenter(pts, 0, 0)).toEqual({ x: 50, y: 50 });
  });
  it('applies offset', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
    expect(strokeBoundingBoxCenter(pts, 10, 10)).toEqual({ x: 15, y: 15 });
  });
});
