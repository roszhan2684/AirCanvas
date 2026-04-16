import { describe, it, expect } from 'vitest';
import { applyPipStyle, PIP_STYLE_LABELS } from '../lib/pipStyles';
import type { Stroke } from '../types/stroke';
import { v4 as uuidv4 } from 'uuid';

function makeStroke(overrides: Partial<Stroke> = {}): Stroke {
  return {
    id: uuidv4(),
    points: [{ x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 60 }],
    color: '#3b82f6',
    width: 4,
    offsetX: 0,
    offsetY: 0,
    ...overrides,
  };
}

// ── applyPipStyle ──────────────────────────────────────────────────────────────

describe('applyPipStyle — normal', () => {
  it('returns strokes unchanged', () => {
    const input = [makeStroke(), makeStroke()];
    const output = applyPipStyle(input, 'normal');
    expect(output).toHaveLength(2);
    expect(output[0].points).toEqual(input[0].points);
    expect(output[0].color).toBe(input[0].color);
  });
});

describe('applyPipStyle — calligraphy', () => {
  it('increases stroke width', () => {
    const s = makeStroke({ width: 4 });
    const [out] = applyPipStyle([s], 'calligraphy');
    expect(out.width).toBeGreaterThan(s.width);
  });

  it('sets style to marker', () => {
    const [out] = applyPipStyle([makeStroke()], 'calligraphy');
    expect(out.style).toBe('marker');
  });

  it('minimum width is 6', () => {
    const [out] = applyPipStyle([makeStroke({ width: 0.5 })], 'calligraphy');
    expect(out.width).toBeGreaterThanOrEqual(6);
  });
});

describe('applyPipStyle — funny', () => {
  it('returns same number of strokes', () => {
    const input = [makeStroke(), makeStroke()];
    expect(applyPipStyle(input, 'funny')).toHaveLength(2);
  });

  it('jitters point coordinates but preserves count', () => {
    const s = makeStroke();
    const [out] = applyPipStyle([s], 'funny');
    expect(out.points).toHaveLength(s.points.length);
  });

  it('slightly increases width', () => {
    const [out] = applyPipStyle([makeStroke({ width: 4 })], 'funny');
    expect(out.width).toBeGreaterThanOrEqual(4);
  });
});

describe('applyPipStyle — sketch', () => {
  it('returns 3x the number of strokes (3 offset passes)', () => {
    const input = [makeStroke(), makeStroke()];
    const output = applyPipStyle(input, 'sketch');
    expect(output).toHaveLength(6);
  });

  it('first pass keeps original id', () => {
    const s = makeStroke();
    const output = applyPipStyle([s], 'sketch');
    expect(output[0].id).toBe(s.id);
  });

  it('subsequent passes have different ids', () => {
    const s = makeStroke();
    const [p1, p2, p3] = applyPipStyle([s], 'sketch');
    expect(p1.id).toBe(s.id);
    expect(p2.id).not.toBe(s.id);
    expect(p3.id).not.toBe(s.id);
  });

  it('reduces stroke width', () => {
    const [out] = applyPipStyle([makeStroke({ width: 8 })], 'sketch');
    expect(out.width).toBeLessThan(8);
  });
});

describe('applyPipStyle — glow', () => {
  it('sets style to neon', () => {
    const [out] = applyPipStyle([makeStroke()], 'glow');
    expect(out.style).toBe('neon');
  });

  it('preserves points', () => {
    const s = makeStroke();
    const [out] = applyPipStyle([s], 'glow');
    expect(out.points).toEqual(s.points);
  });
});

describe('applyPipStyle — rainbow', () => {
  it('sets style to rainbow', () => {
    const [out] = applyPipStyle([makeStroke()], 'rainbow');
    expect(out.style).toBe('rainbow');
  });

  it('preserves points', () => {
    const s = makeStroke();
    const [out] = applyPipStyle([s], 'rainbow');
    expect(out.points).toEqual(s.points);
  });
});

// ── PIP_STYLE_LABELS ───────────────────────────────────────────────────────────

describe('PIP_STYLE_LABELS', () => {
  const expectedKeys = ['normal', 'calligraphy', 'funny', 'sketch', 'glow', 'rainbow'];

  it('has all 6 style entries', () => {
    expectedKeys.forEach(k => {
      expect(PIP_STYLE_LABELS[k as keyof typeof PIP_STYLE_LABELS]).toBeDefined();
    });
  });

  it('each entry has label, icon, and tip', () => {
    for (const [key, val] of Object.entries(PIP_STYLE_LABELS)) {
      expect(val.label, `${key} missing label`).toBeTruthy();
      expect(val.icon,  `${key} missing icon`).toBeTruthy();
      expect(val.tip,   `${key} missing tip`).toBeTruthy();
    }
  });
});

// ── Edge cases ─────────────────────────────────────────────────────────────────

describe('applyPipStyle — edge cases', () => {
  it('handles empty stroke array for all styles', () => {
    const styles: Parameters<typeof applyPipStyle>[1][] = ['normal', 'calligraphy', 'funny', 'sketch', 'glow', 'rainbow'];
    styles.forEach(style => {
      expect(applyPipStyle([], style)).toEqual([]);
    });
  });

  it('handles single-point strokes without throwing', () => {
    const s = makeStroke({ points: [{ x: 50, y: 50 }] });
    expect(() => applyPipStyle([s], 'funny')).not.toThrow();
    expect(() => applyPipStyle([s], 'sketch')).not.toThrow();
  });
});
