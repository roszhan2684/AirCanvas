import { useRef, useState, useCallback } from 'react';
import type { Landmark, GestureMode, GestureState } from '../types/hand';
import {
  detectPinch,
  detectTwoFingers,
  detectDrawing,
  getPinchCenter,
  getTwoFingerCenter,
  getLandmarkCanvas,
  INDEX_TIP,
} from '../lib/gestureUtils';
import { smoothPoint, distance } from '../lib/geometry';

const STABLE_FRAMES_REQUIRED = 3;
const SMOOTH_ALPHA = 0.72;

const EMPTY_STATE: GestureState = {
  mode: 'idle',
  indexTip: null,
  pinchCenter: null,
  palmCenter: null,
  secondPinchCenter: null,
  bothPinchDistance: null,
};

export function useGestureState(videoSize: { width: number; height: number }) {
  const [gestureState, setGestureState] = useState<GestureState>(EMPTY_STATE);

  const pendingModeRef = useRef<GestureMode>('idle');
  const pendingCountRef = useRef(0);
  const currentModeRef = useRef<GestureMode>('idle');
  const smoothedTipRef = useRef<{ x: number; y: number } | null>(null);


  const processLandmarks = useCallback(
    (landmarksAll: Landmark[][] | null, isShapeMode = false) => {
      const { width: w, height: h } = videoSize;

      if (!landmarksAll || landmarksAll.length === 0) {
        if (currentModeRef.current !== 'idle') {
          currentModeRef.current = 'idle';
          pendingModeRef.current = 'idle';
          pendingCountRef.current = 0;
          smoothedTipRef.current = null;
          setGestureState(EMPTY_STATE);
        }
        return;
      }

      const landmarks = landmarksAll[0];

      // --- Primary hand gesture ---
      let rawMode: GestureMode = 'idle';
      if (detectTwoFingers(landmarks, w, h)) {
        rawMode = 'erasing';
      } else if (detectPinch(landmarks, w, h)) {
        rawMode = 'grabbing';
      } else if (detectDrawing(landmarks, w, h)) {
        rawMode = isShapeMode ? 'shape_placing' : 'drawing';
      }

      // Stabilize mode
      if (rawMode === pendingModeRef.current) {
        pendingCountRef.current++;
      } else {
        pendingModeRef.current = rawMode;
        pendingCountRef.current = 1;
      }
      const confirmedMode: GestureMode =
        pendingCountRef.current >= STABLE_FRAMES_REQUIRED
          ? pendingModeRef.current
          : currentModeRef.current;

      // --- Two-hand pinch detection ---
      let secondPinchCenter: { x: number; y: number } | null = null;
      let bothPinchDistance: number | null = null;
      let finalMode: GestureMode = confirmedMode;

      if (landmarksAll.length >= 2) {
        const landmarks2 = landmarksAll[1];
        const hand1Pinching = detectPinch(landmarks, w, h);
        const hand2Pinching = detectPinch(landmarks2, w, h);

        if (hand1Pinching && hand2Pinching) {
          const p1 = getPinchCenter(landmarks, w, h);
          const p2 = getPinchCenter(landmarks2, w, h);
          secondPinchCenter = p2;
          bothPinchDistance = distance(p1, p2);
          finalMode = 'shape_resize';
        }
      }

      currentModeRef.current = finalMode;

      // Smooth index tip
      const rawTip = getLandmarkCanvas(landmarks, INDEX_TIP, w, h);
      if (!smoothedTipRef.current) {
        smoothedTipRef.current = rawTip;
      } else {
        smoothedTipRef.current = smoothPoint(smoothedTipRef.current, rawTip, SMOOTH_ALPHA);
      }

      const pinchCenter = (finalMode === 'grabbing' || finalMode === 'shape_resize')
        ? getPinchCenter(landmarks, w, h)
        : null;
      const palmCenter = finalMode === 'erasing' ? getTwoFingerCenter(landmarks, w, h) : null;

      setGestureState({
        mode: finalMode,
        indexTip: { ...smoothedTipRef.current },
        pinchCenter,
        palmCenter,
        secondPinchCenter,
        bothPinchDistance,
      });
    },
    [videoSize]
  );

  return { gestureState, processLandmarks };
}
