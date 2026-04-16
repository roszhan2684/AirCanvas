import type { Landmark } from '../types/hand';
import { distance } from './geometry';

// MediaPipe landmark indices
export const WRIST = 0;
export const THUMB_TIP = 4;
export const INDEX_MCP = 5;
export const INDEX_PIP = 6;
export const INDEX_TIP = 8;
export const MIDDLE_MCP = 9;
export const MIDDLE_TIP = 12;
export const RING_TIP = 16;
export const PINKY_TIP = 20;

function landmarkToCanvas(
  lm: Landmark,
  videoWidth: number,
  videoHeight: number
): { x: number; y: number } {
  // MediaPipe returns normalized [0,1] coords. Video is mirrored so flip x.
  return {
    x: (1 - lm.x) * videoWidth,
    y: lm.y * videoHeight,
  };
}

export function getLandmarkCanvas(
  landmarks: Landmark[],
  index: number,
  w: number,
  h: number
): { x: number; y: number } {
  return landmarkToCanvas(landmarks[index], w, h);
}

/**
 * Pinch: thumb tip and index tip are close together
 */
export function detectPinch(landmarks: Landmark[], w: number, h: number): boolean {
  const thumb = getLandmarkCanvas(landmarks, THUMB_TIP, w, h);
  const index = getLandmarkCanvas(landmarks, INDEX_TIP, w, h);
  const pinchDist = distance(thumb, index);
  // threshold: ~5% of video width
  return pinchDist < w * 0.055;
}

/**
 * Open palm: all 4 fingers extended (tips well above MCPs)
 * We check that index, middle, ring, pinky tips are higher than their MCPs (lower y = higher on screen)
 */
export function detectOpenPalm(landmarks: Landmark[], w: number, h: number): boolean {
  const fingerTips = [INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP];
  const fingerMCPs = [INDEX_MCP, MIDDLE_MCP, 13, 17]; // MCP indices

  let extendedCount = 0;
  for (let i = 0; i < fingerTips.length; i++) {
    const tip = getLandmarkCanvas(landmarks, fingerTips[i], w, h);
    const mcp = getLandmarkCanvas(landmarks, fingerMCPs[i], w, h);
    if (tip.y < mcp.y - h * 0.02) {
      extendedCount++;
    }
  }
  return extendedCount >= 3;
}

/**
 * Draw mode: index finger extended, others curled, not pinching
 */
export function detectDrawing(landmarks: Landmark[], w: number, h: number): boolean {
  if (detectPinch(landmarks, w, h)) return false;
  if (detectOpenPalm(landmarks, w, h)) return false;

  const indexTip = getLandmarkCanvas(landmarks, INDEX_TIP, w, h);
  const indexMcp = getLandmarkCanvas(landmarks, INDEX_MCP, w, h);
  const middleTip = getLandmarkCanvas(landmarks, MIDDLE_TIP, w, h);
  const middleMcp = getLandmarkCanvas(landmarks, MIDDLE_MCP, w, h);

  const indexExtended = indexTip.y < indexMcp.y - h * 0.02;
  const middleCurled = middleTip.y > middleMcp.y - h * 0.01;

  return indexExtended && middleCurled;
}

export function getPinchCenter(landmarks: Landmark[], w: number, h: number): { x: number; y: number } {
  const thumb = getLandmarkCanvas(landmarks, THUMB_TIP, w, h);
  const index = getLandmarkCanvas(landmarks, INDEX_TIP, w, h);
  return { x: (thumb.x + index.x) / 2, y: (thumb.y + index.y) / 2 };
}

export function getPalmCenter(landmarks: Landmark[], w: number, h: number): { x: number; y: number } {
  const wrist = getLandmarkCanvas(landmarks, WRIST, w, h);
  const indexMcp = getLandmarkCanvas(landmarks, INDEX_MCP, w, h);
  const middleMcp = getLandmarkCanvas(landmarks, MIDDLE_MCP, w, h);
  return {
    x: (wrist.x + indexMcp.x + middleMcp.x) / 3,
    y: (wrist.y + indexMcp.y + middleMcp.y) / 3,
  };
}

export const RING_MCP = 13;
export const PINKY_MCP = 17;

/**
 * Two-finger peace sign: index + middle extended, ring + pinky curled, not pinching.
 * Used as the erase gesture.
 */
export function detectTwoFingers(landmarks: Landmark[], w: number, h: number): boolean {
  if (detectPinch(landmarks, w, h)) return false;

  const indexTip  = getLandmarkCanvas(landmarks, INDEX_TIP, w, h);
  const indexMcp  = getLandmarkCanvas(landmarks, INDEX_MCP, w, h);
  const middleTip = getLandmarkCanvas(landmarks, MIDDLE_TIP, w, h);
  const middleMcp = getLandmarkCanvas(landmarks, MIDDLE_MCP, w, h);
  const ringTip   = getLandmarkCanvas(landmarks, RING_TIP, w, h);
  const ringMcp   = getLandmarkCanvas(landmarks, RING_MCP, w, h);
  const pinkyTip  = getLandmarkCanvas(landmarks, PINKY_TIP, w, h);
  const pinkyMcp  = getLandmarkCanvas(landmarks, PINKY_MCP, w, h);

  const indexUp  = indexTip.y  < indexMcp.y  - h * 0.02;
  const middleUp = middleTip.y < middleMcp.y - h * 0.02;
  const ringDown = ringTip.y   > ringMcp.y   - h * 0.01;
  const pinkyDown= pinkyTip.y  > pinkyMcp.y  - h * 0.01;

  return indexUp && middleUp && ringDown && pinkyDown;
}

/** Midpoint between index tip and middle tip — eraser center for 2-finger gesture */
export function getTwoFingerCenter(landmarks: Landmark[], w: number, h: number): { x: number; y: number } {
  const index  = getLandmarkCanvas(landmarks, INDEX_TIP, w, h);
  const middle = getLandmarkCanvas(landmarks, MIDDLE_TIP, w, h);
  return { x: (index.x + middle.x) / 2, y: (index.y + middle.y) / 2 };
}
