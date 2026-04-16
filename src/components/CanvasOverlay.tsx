import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Stroke } from '../types/stroke';
import type { PlacedShape } from '../types/shape';
import { drawStrokeSmooth } from '../lib/strokeUtils';
import { drawShape } from '../lib/shapeUtils';
import type { GestureState } from '../types/hand';

export interface CanvasOverlayRef {
  getCanvas: () => HTMLCanvasElement | null;
}

interface RemoteCursor { x: number; y: number; name: string; color: string; }

interface Props {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  shapes: PlacedShape[];
  previewShape: PlacedShape | null;
  gestureState: GestureState;
  width: number;
  height: number;
  videoSize: { width: number; height: number };
  companionStroke?: Stroke | null;
  remoteCursors?: RemoteCursor[];
  portraitImage?: string | null;
}

function toDisplayCoords(
  p: { x: number; y: number },
  videoSize: { width: number; height: number },
  dw: number,
  dh: number
): { x: number; y: number } {
  const { width: vw, height: vh } = videoSize;
  const va = vw / vh;
  const ca = dw / dh;
  let scale: number, ox = 0, oy = 0;
  if (va > ca) { scale = dh / vh; ox = (dw - vw * scale) / 2; }
  else          { scale = dw / vw; oy = (dh - vh * scale) / 2; }
  return { x: p.x * scale + ox, y: p.y * scale + oy };
}

export const CanvasOverlay = forwardRef<CanvasOverlayRef, Props>(
  ({ strokes, currentStroke, shapes, previewShape, gestureState, width, height, videoSize, companionStroke, remoteCursors, portraitImage }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const portraitImgRef = useRef<HTMLImageElement | null>(null);

    useImperativeHandle(ref, () => ({ getCanvas: () => canvasRef.current }));

    // Load portrait image into a cached HTMLImageElement when the dataURL changes
    useEffect(() => {
      if (!portraitImage) { portraitImgRef.current = null; return; }
      const img = new Image();
      img.src = portraitImage;
      img.onload = () => { portraitImgRef.current = img; };
    }, [portraitImage]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // Portrait sketch image — drawn in Pip's left half before strokes
      if (portraitImgRef.current) {
        const img = portraitImgRef.current;
        const halfW = width / 2;
        const pad = halfW * 0.05;
        const availW = halfW - pad * 2;
        const availH = height - pad * 2;
        const scale = Math.min(availW / img.width, availH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = pad + (availW - dw) / 2;
        const dy = pad + (availH - dh) / 2;
        ctx.save();
        ctx.globalAlpha = 0.92;
        // Rounded clip for the portrait
        ctx.beginPath();
        ctx.roundRect(dx - 4, dy - 4, dw + 8, dh + 8, 12);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
        // Subtle border
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(dx - 4, dy - 4, dw + 8, dh + 8, 12);
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Strokes
      for (const stroke of strokes) drawStrokeSmooth(ctx, stroke);
      if (currentStroke) drawStrokeSmooth(ctx, currentStroke);
      if (companionStroke) drawStrokeSmooth(ctx, companionStroke);

      // Committed shapes
      for (const shape of shapes) drawShape(ctx, shape);

      // Preview shape (ghost)
      if (previewShape) drawShape(ctx, previewShape, true);

      const { mode, indexTip, pinchCenter, palmCenter, secondPinchCenter } = gestureState;

      // Idle / palm cursor — always show hand position when hand is visible
      if (mode === 'idle' && indexTip) {
        const p = toDisplayCoords(indexTip, videoSize, width, height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(148,163,184,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148,163,184,0.65)';
        ctx.fill();
        ctx.restore();
      }

      // Drawing cursor
      if ((mode === 'drawing' || mode === 'shape_placing') && indexTip) {
        const p = toDisplayCoords(indexTip, videoSize, width, height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Grab cursor
      if (mode === 'grabbing' && pinchCenter) {
        const p = toDisplayCoords(pinchCenter, videoSize, width, height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,200,0,0.9)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x - 8, p.y); ctx.lineTo(p.x + 8, p.y);
        ctx.moveTo(p.x, p.y - 8); ctx.lineTo(p.x, p.y + 8);
        ctx.stroke();
        ctx.restore();
      }

      // Erase cursor
      if (mode === 'erasing' && palmCenter) {
        const p = toDisplayCoords(palmCenter, videoSize, width, height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 50, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,80,80,0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Two-hand resize cursors
      if (mode === 'shape_resize' && pinchCenter && secondPinchCenter) {
        const p1 = toDisplayCoords(pinchCenter, videoSize, width, height);
        const p2 = toDisplayCoords(secondPinchCenter, videoSize, width, height);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(192,132,252,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        for (const p of [p1, p2]) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(192,132,252,0.9)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Remote cursors (collaborators)
      if (remoteCursors?.length) {
        for (const rc of remoteCursors) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(rc.x, rc.y, 12, 0, Math.PI * 2);
          ctx.strokeStyle = rc.color;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.fillStyle = rc.color + '33';
          ctx.fill();
          ctx.font = '11px monospace';
          ctx.fillStyle = rc.color;
          ctx.fillText(rc.name, rc.x + 16, rc.y - 4);
          ctx.restore();
        }
      }
    }, [strokes, currentStroke, shapes, previewShape, gestureState, width, height, videoSize, companionStroke, remoteCursors, portraitImage]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
        }}
      />
    );
  }
);
