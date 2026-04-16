import { describe, it, expect } from 'vitest';
import {
  detectPinch, detectOpenPalm, detectDrawing, detectTwoFingers,
  getPinchCenter, getTwoFingerCenter,
  getLandmarkCanvas,
  THUMB_TIP, INDEX_TIP, INDEX_MCP, MIDDLE_TIP, MIDDLE_MCP,
  RING_TIP, PINKY_TIP,
} from '../lib/gestureUtils';
import type { Landmark } from '../types/hand';

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Build a 21-landmark hand where all tips are curled (close to MCPs).
 * Caller can then override specific landmarks.
 */
function makeLandmarks(overrides: Partial<Record<number, Partial<Landmark>>> = {}): Landmark[] {
  // Default: all landmarks at wrist position (0.5, 0.8) → curled hand
  const base: Landmark = { x: 0.5, y: 0.8, z: 0 };
  const lms: Landmark[] = Array.from({ length: 21 }, () => ({ ...base }));
  for (const [idx, val] of Object.entries(overrides)) {
    lms[Number(idx)] = { ...lms[Number(idx)], ...val };
  }
  return lms;
}

const W = 640, H = 480;

// ── detectPinch ────────────────────────────────────────────────────────────────

describe('detectPinch', () => {
  it('returns true when thumb and index are very close', () => {
    const lms = makeLandmarks({
      [THUMB_TIP]: { x: 0.5, y: 0.5, z: 0 },
      [INDEX_TIP]: { x: 0.5, y: 0.5, z: 0 },
    });
    expect(detectPinch(lms, W, H)).toBe(true);
  });

  it('returns false when thumb and index are far apart', () => {
    const lms = makeLandmarks({
      [THUMB_TIP]: { x: 0.1, y: 0.1, z: 0 },
      [INDEX_TIP]: { x: 0.9, y: 0.9, z: 0 },
    });
    expect(detectPinch(lms, W, H)).toBe(false);
  });

  it('threshold scales with video width — passes at <5.5% of width', () => {
    // 5% of W=640 = 32px. Place tips 30px apart in canvas coords.
    // canvas x = (1 - lm.x) * W, so delta = delta_lm_x * W
    const sep = 0.04; // 0.04 * 640 = 25.6px < 35px threshold
    const lms = makeLandmarks({
      [THUMB_TIP]: { x: 0.5, y: 0.5, z: 0 },
      [INDEX_TIP]: { x: 0.5 + sep, y: 0.5, z: 0 },
    });
    expect(detectPinch(lms, W, H)).toBe(true);
  });
});

// ── detectOpenPalm ─────────────────────────────────────────────────────────────

describe('detectOpenPalm', () => {
  it('returns true when all 4 fingers extended well above MCPs', () => {
    // tips have lower y (higher on screen) than MCPs
    const lms = makeLandmarks({
      [INDEX_TIP]:  { x: 0.4, y: 0.2, z: 0 },
      [INDEX_MCP]:  { x: 0.4, y: 0.6, z: 0 },
      [MIDDLE_TIP]: { x: 0.5, y: 0.2, z: 0 },
      [MIDDLE_MCP]: { x: 0.5, y: 0.6, z: 0 },
      [RING_TIP]:   { x: 0.55, y: 0.2, z: 0 },
      13:           { x: 0.55, y: 0.6, z: 0 },  // ring MCP
      [PINKY_TIP]:  { x: 0.6, y: 0.2, z: 0 },
      17:           { x: 0.6, y: 0.6, z: 0 },  // pinky MCP
    });
    expect(detectOpenPalm(lms, W, H)).toBe(true);
  });

  it('returns false when fingers are curled (tips below MCPs)', () => {
    const lms = makeLandmarks(); // all at y=0.8, tips same as MCPs
    expect(detectOpenPalm(lms, W, H)).toBe(false);
  });
});

// ── detectDrawing ──────────────────────────────────────────────────────────────

describe('detectDrawing', () => {
  it('returns true when only index extended', () => {
    const lms = makeLandmarks({
      [THUMB_TIP]:  { x: 0.5, y: 0.75, z: 0 }, // not pinching
      [INDEX_TIP]:  { x: 0.4, y: 0.2, z: 0 },  // extended
      [INDEX_MCP]:  { x: 0.4, y: 0.6, z: 0 },
      [MIDDLE_TIP]: { x: 0.5, y: 0.75, z: 0 }, // curled
      [MIDDLE_MCP]: { x: 0.5, y: 0.6, z: 0 },
    });
    expect(detectDrawing(lms, W, H)).toBe(true);
  });

  it('returns false when pinching (thumb+index close)', () => {
    const lms = makeLandmarks({
      [THUMB_TIP]:  { x: 0.5, y: 0.5, z: 0 },
      [INDEX_TIP]:  { x: 0.5, y: 0.5, z: 0 },
      [INDEX_MCP]:  { x: 0.5, y: 0.6, z: 0 },
      [MIDDLE_TIP]: { x: 0.5, y: 0.75, z: 0 },
      [MIDDLE_MCP]: { x: 0.5, y: 0.6, z: 0 },
    });
    expect(detectDrawing(lms, W, H)).toBe(false);
  });

  it('returns false when open palm', () => {
    const lms = makeLandmarks({
      [INDEX_TIP]:  { x: 0.4, y: 0.2, z: 0 },
      [INDEX_MCP]:  { x: 0.4, y: 0.6, z: 0 },
      [MIDDLE_TIP]: { x: 0.5, y: 0.2, z: 0 },
      [MIDDLE_MCP]: { x: 0.5, y: 0.6, z: 0 },
      [RING_TIP]:   { x: 0.55, y: 0.2, z: 0 },
      13:           { x: 0.55, y: 0.6, z: 0 },
      [PINKY_TIP]:  { x: 0.6, y: 0.2, z: 0 },
      17:           { x: 0.6, y: 0.6, z: 0 },
    });
    expect(detectDrawing(lms, W, H)).toBe(false);
  });
});

// ── detectTwoFingers ───────────────────────────────────────────────────────────

describe('detectTwoFingers', () => {
  it('returns true for peace sign (index+middle up, ring+pinky down)', () => {
    const lms = makeLandmarks({
      [THUMB_TIP]:  { x: 0.3, y: 0.8, z: 0 }, // no pinch
      [INDEX_TIP]:  { x: 0.4, y: 0.2, z: 0 },
      [INDEX_MCP]:  { x: 0.4, y: 0.6, z: 0 },
      [MIDDLE_TIP]: { x: 0.5, y: 0.2, z: 0 },
      [MIDDLE_MCP]: { x: 0.5, y: 0.6, z: 0 },
      [RING_TIP]:   { x: 0.55, y: 0.75, z: 0 },
      13:           { x: 0.55, y: 0.6, z: 0 },
      [PINKY_TIP]:  { x: 0.6, y: 0.75, z: 0 },
      17:           { x: 0.6, y: 0.6, z: 0 },
    });
    expect(detectTwoFingers(lms, W, H)).toBe(true);
  });

  it('returns false when pinching', () => {
    const lms = makeLandmarks({
      [THUMB_TIP]:  { x: 0.5, y: 0.5, z: 0 },
      [INDEX_TIP]:  { x: 0.5, y: 0.5, z: 0 },
    });
    expect(detectTwoFingers(lms, W, H)).toBe(false);
  });
});

// ── getPinchCenter ─────────────────────────────────────────────────────────────

describe('getPinchCenter', () => {
  it('returns midpoint of thumb and index tips', () => {
    const lms = makeLandmarks({
      [THUMB_TIP]: { x: 0.2, y: 0.4, z: 0 },
      [INDEX_TIP]: { x: 0.4, y: 0.4, z: 0 },
    });
    const center = getPinchCenter(lms, W, H);
    // canvas x = (1-lm.x)*W → thumb=(0.8*640=512), index=(0.6*640=384) → mid=448
    expect(center.x).toBeCloseTo(448);
    expect(center.y).toBeCloseTo(0.4 * H);
  });
});

// ── getTwoFingerCenter ─────────────────────────────────────────────────────────

describe('getTwoFingerCenter', () => {
  it('returns midpoint of index and middle tips', () => {
    const lms = makeLandmarks({
      [INDEX_TIP]:  { x: 0.4, y: 0.2, z: 0 },
      [MIDDLE_TIP]: { x: 0.6, y: 0.2, z: 0 },
    });
    const center = getTwoFingerCenter(lms, W, H);
    // index canvas x = (1-0.4)*640=384, middle=(1-0.6)*640=256 → mid=320
    expect(center.x).toBeCloseTo(320);
    expect(center.y).toBeCloseTo(0.2 * H);
  });
});

// ── getLandmarkCanvas ──────────────────────────────────────────────────────────

describe('getLandmarkCanvas', () => {
  it('mirrors x coordinate', () => {
    const lms = makeLandmarks({ 0: { x: 0.25, y: 0.5, z: 0 } });
    const p = getLandmarkCanvas(lms, 0, W, H);
    expect(p.x).toBeCloseTo((1 - 0.25) * W);
    expect(p.y).toBeCloseTo(0.5 * H);
  });

  it('x=0 maps to rightmost pixel', () => {
    const lms = makeLandmarks({ 0: { x: 0, y: 0, z: 0 } });
    expect(getLandmarkCanvas(lms, 0, W, H).x).toBe(W);
  });

  it('x=1 maps to leftmost pixel', () => {
    const lms = makeLandmarks({ 0: { x: 1, y: 0, z: 0 } });
    expect(getLandmarkCanvas(lms, 0, W, H).x).toBe(0);
  });
});
