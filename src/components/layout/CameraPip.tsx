import { useRef, useEffect, useState } from 'react';
import type { Landmark } from '../../types/hand';

// MediaPipe hand connections
const CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],
  [13,17],[0,17],[17,18],[18,19],[19,20],
];

const HAND_COLORS = ['rgba(0,255,180,0.85)', 'rgba(120,180,255,0.85)'];

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarksAll: Landmark[][] | null; // both hands
  videoSize: { width: number; height: number };
  trackingReady: boolean;
}

export function CameraPip({ videoRef, landmarksAll, videoSize, trackingReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expanded, setExpanded] = useState(false);

  const PIP_W = expanded ? 380 : 260;
  const PIP_H = Math.round(PIP_W * (9 / 16));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !landmarksAll) { ctx?.clearRect(0, 0, canvas.width, canvas.height); return; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    landmarksAll.forEach((landmarks, hi) => {
      const color = HAND_COLORS[hi] ?? HAND_COLORS[0];
      const pts = landmarks.map(lm => ({
        x: (1 - lm.x) * canvas.width,
        y: lm.y * canvas.height,
      }));

      ctx.strokeStyle = color.replace('0.85', '0.5');
      ctx.lineWidth = 1.2;
      for (const [a, b] of CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo(pts[a].x, pts[a].y);
        ctx.lineTo(pts[b].x, pts[b].y);
        ctx.stroke();
      }
      for (let i = 0; i < pts.length; i++) {
        const isTip = [4, 8, 12, 16, 20].includes(i);
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, isTip ? 4 : 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });
  }, [landmarksAll, videoSize, PIP_W, PIP_H]);

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 150,
        width: PIP_W, height: PIP_H,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        transition: 'width 0.2s, height 0.2s',
        background: '#000',
      }}
    >
      <video
        ref={videoRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        playsInline muted
      />
      <canvas
        ref={canvasRef}
        width={PIP_W} height={PIP_H}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      {!trackingReady && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
          <div style={{ width: 18, height: 18, border: '2px solid rgba(0,255,180,0.3)', borderTop: '2px solid rgba(0,255,180,0.9)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      {/* Hand count indicator */}
      {trackingReady && (
        <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 4 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: landmarksAll && landmarksAll[i] ? HAND_COLORS[i] : 'rgba(255,255,255,0.2)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 4, right: 6, color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
        {expanded ? 'CLICK TO SHRINK' : 'CLICK TO EXPAND'}
      </div>
    </div>
  );
}
