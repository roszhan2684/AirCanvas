import type { PlacedShape, ShapeKind } from '../types/shape';
import { distance } from './geometry';

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: PlacedShape,
  preview = false
): void {
  const { cx, cy, size, color, lineWidth, filled, opacity } = shape;
  ctx.save();
  ctx.globalAlpha = (opacity ?? 1) * (preview ? 0.5 : 1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (preview) ctx.setLineDash([7, 5]);

  ctx.beginPath();
  drawShapePath(ctx, shape.kind, cx, cy, size);

  if (filled) {
    ctx.globalAlpha = (opacity ?? 1) * (preview ? 0.35 : 0.28);
    ctx.fill();
    ctx.globalAlpha = (opacity ?? 1) * (preview ? 0.5 : 1);
    ctx.stroke();
  } else {
    ctx.stroke();
  }
  ctx.restore();
}

function drawShapePath(
  ctx: CanvasRenderingContext2D,
  kind: ShapeKind,
  cx: number,
  cy: number,
  size: number
) {
  switch (kind) {
    case 'rectangle':
      ctx.rect(cx - size, cy - size * 0.65, size * 2, size * 1.3);
      break;

    case 'circle':
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      break;

    case 'triangle': {
      const h = size * 1.1;
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx + size, cy + h * 0.5);
      ctx.lineTo(cx - size, cy + h * 0.5);
      ctx.closePath();
      break;
    }

    case 'star': {
      const inner = size * 0.42;
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? size : inner;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }

    case 'heart': {
      // Parametric heart
      ctx.moveTo(cx, cy + size * 0.25);
      ctx.bezierCurveTo(cx - size * 0.55, cy - size * 0.4, cx - size, cy - size * 0.9, cx, cy - size * 0.55);
      ctx.bezierCurveTo(cx + size, cy - size * 0.9, cx + size * 0.55, cy - size * 0.4, cx, cy + size * 0.25);
      ctx.closePath();
      break;
    }

    case 'arrow': {
      const hw = size * 0.45;   // half body width
      const aw = size * 1.0;    // arrow head width (half)
      const bodyEnd = cx + size * 0.2;
      const tipX = cx + size * 1.1;
      ctx.moveTo(cx - size * 0.9, cy - hw);
      ctx.lineTo(bodyEnd, cy - hw);
      ctx.lineTo(bodyEnd, cy - aw);
      ctx.lineTo(tipX, cy);
      ctx.lineTo(bodyEnd, cy + aw);
      ctx.lineTo(bodyEnd, cy + hw);
      ctx.lineTo(cx - size * 0.9, cy + hw);
      ctx.closePath();
      break;
    }

    case 'diamond': {
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx + size * 0.65, cy);
      ctx.lineTo(cx, cy + size);
      ctx.lineTo(cx - size * 0.65, cy);
      ctx.closePath();
      break;
    }

    case 'hexagon': {
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const x = cx + Math.cos(angle) * size;
        const y = cy + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
  }
}

export function findNearestShape(
  shapes: PlacedShape[],
  point: { x: number; y: number }
): PlacedShape | null {
  let nearest: PlacedShape | null = null;
  let nearestDist = Infinity;
  for (const s of shapes) {
    const d = distance(point, { x: s.cx, y: s.cy });
    if (d < nearestDist) { nearestDist = d; nearest = s; }
  }
  return nearestDist < 160 ? nearest : null;
}
