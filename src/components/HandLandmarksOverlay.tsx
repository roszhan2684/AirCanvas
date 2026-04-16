import { useEffect, useRef } from 'react';
import type { Landmark } from '../types/hand';

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

interface Props {
  landmarks: Landmark[] | null;
  videoSize: { width: number; height: number };
  canvasWidth: number;
  canvasHeight: number;
}

export function HandLandmarksOverlay({ landmarks, videoSize, canvasWidth, canvasHeight }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;

    // Convert normalized MediaPipe coords → canvas screen coords.
    // x is mirrored (1 - x) because the video feed is CSS-flipped (scaleX(-1)).
    // We scale from videoSize to canvasSize since objectFit:cover may crop.
    const vw = videoSize.width;
    const vh = videoSize.height;
    const videoAspect = vw / vh;
    const canvasAspect = canvasWidth / canvasHeight;
    let scale: number;
    let ox = 0;
    let oy = 0;
    if (videoAspect > canvasAspect) {
      scale = canvasHeight / vh;
      ox = (canvasWidth - vw * scale) / 2;
    } else {
      scale = canvasWidth / vw;
      oy = (canvasHeight - vh * scale) / 2;
    }

    const pts = landmarks.map((lm) => ({
      x: (1 - lm.x) * vw * scale + ox,
      y: lm.y * vh * scale + oy,
    }));

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.5)';
    ctx.lineWidth = 1.5;
    for (const [a, b] of CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
      ctx.stroke();
    }

    for (let i = 0; i < pts.length; i++) {
      const isTip = [4, 8, 12, 16, 20].includes(i);
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, isTip ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? 'rgba(0, 255, 200, 0.9)' : 'rgba(100, 220, 255, 0.7)';
      ctx.fill();
    }
    ctx.restore();
  }, [landmarks, videoSize, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
