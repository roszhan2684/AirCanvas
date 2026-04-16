import { v4 as uuidv4 } from 'uuid';
import type { Stroke } from '../types/stroke';

export type PipStyle = 'normal' | 'calligraphy' | 'funny' | 'sketch' | 'glow' | 'rainbow';

export const PIP_STYLE_LABELS: Record<PipStyle, { label: string; icon: string; tip: string }> = {
  normal:      { label: 'Normal',      icon: '✏',  tip: 'Classic clean lines' },
  calligraphy: { label: 'Calligraphy', icon: '🖋',  tip: 'Thick flowing brushstrokes' },
  funny:       { label: 'Funny',       icon: '😂',  tip: 'Wobbly chaotic lines' },
  sketch:      { label: 'Sketch',      icon: '📐',  tip: 'Pencil sketch with cross-hatching' },
  glow:        { label: 'Glow',        icon: '✨',  tip: 'Neon glow effect' },
  rainbow:     { label: 'Rainbow',     icon: '🌈',  tip: 'Every stroke is a rainbow' },
};

export function applyPipStyle(strokes: Stroke[], style: PipStyle): Stroke[] {
  switch (style) {
    case 'calligraphy': return strokes.map(applyCalligraphy);
    case 'funny':       return strokes.map(applyFunny);
    case 'sketch':      return strokes.flatMap(applySketch);
    case 'glow':        return strokes.map(s => ({ ...s, style: 'neon' as const }));
    case 'rainbow':     return strokes.map(s => ({ ...s, style: 'rainbow' as const }));
    default:            return strokes;
  }
}

function applyCalligraphy(s: Stroke): Stroke {
  return { ...s, style: 'marker' as const, width: Math.max(s.width * 1.6, 6) };
}

function applyFunny(s: Stroke): Stroke {
  const jitter = Math.max(s.width * 1.8, 4);
  return {
    ...s,
    width: s.width * 1.2,
    points: s.points.map(p => ({
      x: p.x + (Math.random() - 0.5) * jitter,
      y: p.y + (Math.random() - 0.5) * jitter,
    })),
  };
}

function applySketch(s: Stroke): Stroke[] {
  // 3 offset passes = pencil sketch look
  const offsets: [number, number][] = [[0, 0], [2.5, 1], [-1.5, 2]];
  return offsets.map(([ox, oy], i) => ({
    ...s,
    id: i === 0 ? s.id : uuidv4(),
    width: Math.max(1, s.width * 0.65),
    opacity: (s.opacity ?? 1) * (i === 0 ? 0.85 : 0.5),
    points: s.points.map(p => ({
      x: p.x + ox + (Math.random() - 0.5) * 1.2,
      y: p.y + oy + (Math.random() - 0.5) * 1.2,
    })),
  }));
}
