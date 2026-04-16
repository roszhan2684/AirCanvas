import { useEffect, useRef, useState } from 'react';
import type { Landmark } from '../types/hand';

interface UseHandTrackingOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoReady: boolean;
  onResults: (landmarks: Landmark[][] | null) => void;
}

export function useHandTracking({ videoRef, videoReady, onResults }: UseHandTrackingOptions) {
  const rafRef = useRef<number>(0);
  const onResultsRef = useRef(onResults);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const [trackingReady, setTrackingReady] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  useEffect(() => { onResultsRef.current = onResults; }, [onResults]);

  useEffect(() => {
    if (!videoReady) return;
    let cancelled = false;

    async function init() {
      const tf = await import('@tensorflow/tfjs-core');

      // Try backends fastest → slowest
      let backendName = 'cpu';
      try {
        await import('@tensorflow/tfjs-backend-webgl');
        if (await tf.setBackend('webgl')) { await tf.ready(); backendName = 'webgl'; }
      } catch { /* try next */ }

      if (backendName !== 'webgl') {
        try {
          const wasm = await import('@tensorflow/tfjs-backend-wasm');
          wasm.setWasmPaths('/tfjs-wasm/');
          if (await tf.setBackend('wasm')) { await tf.ready(); backendName = 'wasm'; }
        } catch { /* try next */ }
      }

      if (backendName === 'cpu') {
        await import('@tensorflow/tfjs-backend-cpu');
        await tf.setBackend('cpu');
        await tf.ready();
      }

      console.log('[AirCanvas] backend:', tf.getBackend());

      const { SupportedModels, createDetector } = await import('@tensorflow-models/hand-pose-detection');
      const detector = await createDetector(SupportedModels.MediaPipeHands, {
        runtime: 'tfjs',
        modelType: 'lite',
        maxHands: 2,
      });

      if (cancelled) { detector.dispose(); return; }

      const canvas = document.createElement('canvas');
      offscreenRef.current = canvas;
      setTrackingReady(true);

      let busy = false;

      function loop() {
        if (cancelled) return;
        rafRef.current = requestAnimationFrame(loop);
        if (busy) return;

        const vid = videoRef.current;
        if (!vid || vid.readyState < 2 || vid.videoWidth === 0) return;

        const vw = vid.videoWidth;
        const vh = vid.videoHeight;
        if (canvas.width !== vw) canvas.width = vw;
        if (canvas.height !== vh) canvas.height = vh;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(vid, 0, 0, vw, vh);

        busy = true;
        detector.estimateHands(canvas, { flipHorizontal: false })
          .then((hands) => {
            if (cancelled) return;
            if (hands.length > 0) {
              const allLms: Landmark[][] = hands.map((hand) =>
                hand.keypoints.map((kp) => ({
                  x: kp.x / vw,
                  y: kp.y / vh,
                  z: (kp.z ?? 0) / vw,
                }))
              );
              onResultsRef.current(allLms);
            } else {
              onResultsRef.current(null);
            }
          })
          .catch((e) => console.warn('[AirCanvas] estimateHands:', e))
          .finally(() => { busy = false; });
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    init().catch((err) => {
      console.error('[AirCanvas] init failed:', err);
      if (!cancelled) setTrackingError('Hand tracking failed. Try refreshing.');
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [videoReady, videoRef]);

  return { trackingReady, trackingError };
}
