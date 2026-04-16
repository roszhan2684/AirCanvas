import { v4 as uuidv4 } from 'uuid';
import type { Stroke, Point } from '../types/stroke';
import { pointInStroke, distance, strokeBoundingBoxCenter } from './geometry';

export function findNearestStroke(
  strokes: Stroke[],
  point: { x: number; y: number }
): Stroke | null {
  let nearest: Stroke | null = null;
  let nearestDist = Infinity;

  for (const stroke of strokes) {
    const center = strokeBoundingBoxCenter(stroke.points, stroke.offsetX, stroke.offsetY);
    const d = distance(point, center);
    // Also check if point is directly on stroke
    const onStroke = pointInStroke(point, stroke.points, stroke.offsetX, stroke.offsetY, 30);
    const score = onStroke ? 0 : d;
    if (score < nearestDist) {
      nearestDist = score;
      nearest = stroke;
    }
  }
  return nearestDist < 120 ? nearest : null;
}

/** Legacy whole-stroke eraser — kept for reference */
export function eraseStrokesNearPoint(
  strokes: Stroke[],
  point: { x: number; y: number },
  radius: number
): Stroke[] {
  return strokes.filter(
    (stroke) => !pointInStroke(point, stroke.points, stroke.offsetX, stroke.offsetY, radius)
  );
}

/**
 * Pencil-style eraser: removes only the points within `radius` of `point`,
 * splitting strokes into multiple segments where needed.
 */
export function eraseStrokePoints(
  strokes: Stroke[],
  point: { x: number; y: number },
  radius: number
): Stroke[] {
  const result: Stroke[] = [];

  for (const stroke of strokes) {
    const ox = stroke.offsetX, oy = stroke.offsetY;
    const segments: { x: number; y: number }[][] = [];
    let current: { x: number; y: number }[] = [];

    for (const pt of stroke.points) {
      if (distance({ x: pt.x + ox, y: pt.y + oy }, point) <= radius) {
        if (current.length >= 2) segments.push(current);
        current = [];
      } else {
        current.push(pt);
      }
    }
    if (current.length >= 2) segments.push(current);

    if (segments.length === 0) continue; // whole stroke erased

    for (let i = 0; i < segments.length; i++) {
      result.push({
        ...stroke,
        id: i === 0 ? stroke.id : uuidv4(),
        points: segments[i],
        offsetX: 0,
        offsetY: 0,
      });
    }
  }

  return result;
}

/** Deterministic pseudo-random from a seed */
function srand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

function buildPath(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  ox: number,
  oy: number
) {
  ctx.moveTo(pts[0].x + ox, pts[0].y + oy);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2 + ox;
    const my = (pts[i].y + pts[i + 1].y) / 2 + oy;
    ctx.quadraticCurveTo(pts[i].x + ox, pts[i].y + oy, mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x + ox, last.y + oy);
}

export function drawStrokeSmooth(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  const pts = stroke.points;
  if (pts.length < 2) return;

  const { color, width, offsetX: ox, offsetY: oy, style = 'pen', opacity = 1 } = stroke;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (style) {
    // ── Neon glow ─────────────────────────────────────────────────────────
    case 'neon': {
      // Outer halo
      ctx.beginPath(); buildPath(ctx, pts, ox, oy);
      ctx.strokeStyle = color;
      ctx.lineWidth = width * 5;
      ctx.globalAlpha = opacity * 0.12;
      ctx.shadowColor = color;
      ctx.shadowBlur = 28;
      ctx.stroke();
      // Mid glow
      ctx.beginPath(); buildPath(ctx, pts, ox, oy);
      ctx.lineWidth = width * 2.5;
      ctx.globalAlpha = opacity * 0.4;
      ctx.shadowBlur = 14;
      ctx.stroke();
      // Bright core
      ctx.beginPath(); buildPath(ctx, pts, ox, oy);
      ctx.lineWidth = width;
      ctx.globalAlpha = opacity;
      ctx.shadowBlur = 6;
      ctx.stroke();
      break;
    }

    // ── Rainbow ────────────────────────────────────────────────────────────
    case 'rainbow': {
      ctx.lineWidth = width;
      for (let i = 0; i < pts.length - 1; i++) {
        const hue = (i / Math.max(pts.length - 1, 1)) * 300;
        ctx.strokeStyle = `hsl(${hue}, 100%, 55%)`;
        ctx.beginPath();
        ctx.moveTo(pts[i].x + ox, pts[i].y + oy);
        if (i < pts.length - 2) {
          const mx = (pts[i + 1].x + pts[i + 2].x) / 2 + ox;
          const my = (pts[i + 1].y + pts[i + 2].y) / 2 + oy;
          ctx.quadraticCurveTo(pts[i + 1].x + ox, pts[i + 1].y + oy, mx, my);
        } else {
          ctx.lineTo(pts[i + 1].x + ox, pts[i + 1].y + oy);
        }
        ctx.stroke();
      }
      break;
    }

    // ── Spray / splatter ───────────────────────────────────────────────────
    case 'spray': {
      ctx.fillStyle = color;
      const radius = width * 2.8;
      const dotsPerPt = Math.max(6, Math.round(width * 1.8));
      const seedBase = pts[0].x * 100 + pts[0].y;
      let si = 0;
      for (let i = 0; i < pts.length; i++) {
        const px = pts[i].x + ox, py = pts[i].y + oy;
        for (let d = 0; d < dotsPerPt; d++) {
          const angle = srand(seedBase + si++) * Math.PI * 2;
          const r = srand(seedBase + si++) * radius;
          ctx.beginPath();
          ctx.arc(px + Math.cos(angle) * r, py + Math.sin(angle) * r, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    // ── Marker (highlighter) ───────────────────────────────────────────────
    case 'marker': {
      ctx.strokeStyle = color;
      ctx.lineWidth = width * 3.5;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'bevel';
      ctx.globalAlpha = opacity * 0.42;
      ctx.beginPath(); buildPath(ctx, pts, ox, oy);
      ctx.stroke();
      break;
    }

    // ── Dashed ────────────────────────────────────────────────────────────
    case 'dashed': {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash([width * 3, width * 2]);
      ctx.beginPath(); buildPath(ctx, pts, ox, oy);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }

    // ── Default pen ───────────────────────────────────────────────────────
    default: {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath(); buildPath(ctx, pts, ox, oy);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function translateStroke(stroke: Stroke, dx: number, dy: number): Stroke {
  return { ...stroke, offsetX: stroke.offsetX + dx, offsetY: stroke.offsetY + dy };
}

// Returns all unique points of a stroke (world space)
export function getStrokeWorldPoints(stroke: Stroke): Point[] {
  return stroke.points.map((p) => ({ x: p.x + stroke.offsetX, y: p.y + stroke.offsetY }));
}
