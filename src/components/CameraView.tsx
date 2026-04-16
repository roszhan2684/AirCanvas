import { useRef, useEffect, useState } from 'react';
import type { Stroke } from '../types/stroke';
import type { PlacedShape } from '../types/shape';
import type { Landmark, GestureState } from '../types/hand';
import { CanvasOverlay } from './CanvasOverlay';
import { HandLandmarksOverlay } from './HandLandmarksOverlay';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoReady: boolean;
  trackingReady: boolean;
  trackingError: string | null;
  strokes: Stroke[];
  currentStroke: Stroke | null;
  shapes: PlacedShape[];
  previewShape: PlacedShape | null;
  gestureState: GestureState;
  landmarks: Landmark[] | null;
  videoSize: { width: number; height: number };
  onDisplaySizeChange: (size: { width: number; height: number }) => void;
}

export function CameraView({
  videoRef,
  videoReady,
  trackingReady,
  trackingError,
  strokes,
  currentStroke,
  shapes,
  previewShape,
  gestureState,
  landmarks,
  videoSize,
  onDisplaySizeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const size = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };
      setContainerSize(size);
      onDisplaySizeChange(size);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onDisplaySizeChange]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
        }}
        playsInline
        muted
      />

      {(!videoReady || !trackingReady) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)',
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'monospace',
            fontSize: 13,
            letterSpacing: '0.12em',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {trackingError ? (
            <>
              <span style={{ color: '#ef4444', fontSize: 14 }}>⚠ {trackingError}</span>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 8,
                  padding: '8px 20px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: 'white',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
              >
                REFRESH
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  width: 44,
                  height: 44,
                  border: '2px solid rgba(0,255,200,0.25)',
                  borderTop: '2px solid rgba(0,255,200,0.9)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span>{!videoReady ? 'INITIALIZING CAMERA...' : 'LOADING HAND TRACKING MODEL...'}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                {!videoReady ? 'Allow camera access when prompted' : 'First load only — downloads ~42MB model'}
              </span>
            </>
          )}
        </div>
      )}

      <CanvasOverlay
        strokes={strokes}
        currentStroke={currentStroke}
        shapes={shapes}
        previewShape={previewShape}
        gestureState={gestureState}
        width={containerSize.width}
        height={containerSize.height}
        videoSize={videoSize}
      />

      <HandLandmarksOverlay
        landmarks={landmarks}
        videoSize={videoSize}
        canvasWidth={containerSize.width}
        canvasHeight={containerSize.height}
      />
    </div>
  );
}
