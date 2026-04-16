import { describe, it, expect } from 'vitest';
import {
  makeHeart, makeStar, makeSmiley, makeSun, makeRainbow,
  makeHouse, makeTree, makeCloud, makeCat, makeSpiral,
  makeZigzag, makeFlower, makeDiamond, makeWave, makeMountain,
  makeFish, makeRocket, makeLightning, makeSnowflake,
  makeInfinity, makePlanet, makeStarOutline, makeUnicorn,
  makeSparkles, makeStarField,
  classifyUserStroke,
  pickRandom, pickRandomDraw,
  DRAW_FN_MAP, PIP_DRAW_OPTIONS, COMPANION_SCRIPTS,
  getRandomScript, scriptCentroid,
  IDLE_QUIPS, REACTION_QUIPS,
} from '../lib/companion';

// ── Drawing primitives ─────────────────────────────────────────────────────────

describe('makeHeart', () => {
  it('returns one stroke', () => {
    const r = makeHeart(200, 200);
    expect(r).toHaveLength(1);
    expect(r[0].points.length).toBeGreaterThan(10);
  });
  it('stroke has valid id and color', () => {
    const [s] = makeHeart(100, 100);
    expect(s.id).toBeTruthy();
    expect(s.color).toBeTruthy();
    expect(s.width).toBeGreaterThan(0);
  });
  it('custom size scales the heart', () => {
    const small = makeHeart(200, 200, 20);
    const large = makeHeart(200, 200, 100);
    const bbox = (pts: { x: number; y: number }[]) => {
      const xs = pts.map(p => p.x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(bbox(large[0].points)).toBeGreaterThan(bbox(small[0].points));
  });
});

describe('makeStar', () => {
  it('returns a PlacedShape', () => {
    const r = makeStar(300, 300, 60);
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe('star');
    expect(r[0].cx).toBe(300);
    expect(r[0].cy).toBe(300);
  });
});

describe('makeSmiley', () => {
  it('returns multiple strokes', () => {
    const r = makeSmiley(200, 200, 60);
    expect(r.length).toBeGreaterThanOrEqual(3);
    r.forEach(s => { expect(s.points.length).toBeGreaterThanOrEqual(2); });
  });
});

describe('makeSun', () => {
  it('returns strokes with yellow color', () => {
    const r = makeSun(300, 200);
    expect(r.length).toBeGreaterThan(0);
    const hasYellow = r.some(s => s.color.toLowerCase().includes('f'));
    expect(hasYellow).toBe(true);
  });
});

describe('makeRainbow', () => {
  it('returns multiple arcs', () => {
    const r = makeRainbow(300, 300);
    expect(r.length).toBeGreaterThan(3);
  });
  it('each stroke has different color', () => {
    const r = makeRainbow(300, 300);
    const colors = new Set(r.map(s => s.color));
    expect(colors.size).toBeGreaterThan(2);
  });
});

describe('makeHouse', () => {
  it('returns strokes', () => {
    expect(makeHouse(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeTree', () => {
  it('returns strokes', () => {
    expect(makeTree(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeCloud', () => {
  it('returns strokes', () => {
    expect(makeCloud(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeCat', () => {
  it('returns strokes', () => {
    expect(makeCat(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeSpiral', () => {
  it('returns strokes with many points', () => {
    const r = makeSpiral(200, 200);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].points.length).toBeGreaterThan(20);
  });
});

describe('makeZigzag', () => {
  it('returns strokes', () => {
    expect(makeZigzag(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeFlower', () => {
  it('returns strokes', () => {
    expect(makeFlower(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeDiamond', () => {
  it('returns strokes', () => {
    expect(makeDiamond(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeWave', () => {
  it('returns strokes with oscillating y coords', () => {
    const r = makeWave(200, 200);
    expect(r.length).toBeGreaterThan(0);
    const ys = r[0].points.map(p => p.y);
    const range = Math.max(...ys) - Math.min(...ys);
    expect(range).toBeGreaterThan(5); // it actually oscillates
  });
});

describe('makeMountain', () => {
  it('returns strokes', () => {
    expect(makeMountain(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeFish', () => {
  it('returns strokes', () => {
    expect(makeFish(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeRocket', () => {
  it('returns strokes', () => {
    expect(makeRocket(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeLightning', () => {
  it('returns strokes', () => {
    expect(makeLightning(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeSnowflake', () => {
  it('returns strokes', () => {
    expect(makeSnowflake(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeInfinity', () => {
  it('returns strokes with many points', () => {
    const r = makeInfinity(200, 200);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].points.length).toBeGreaterThan(10);
  });
});

describe('makePlanet', () => {
  it('returns mixed strokes and shapes', () => {
    const r = makePlanet(200, 200);
    expect(r.length).toBeGreaterThan(0);
  });
});

describe('makeStarOutline', () => {
  it('returns strokes', () => {
    expect(makeStarOutline(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeUnicorn', () => {
  it('returns strokes', () => {
    expect(makeUnicorn(200, 200).length).toBeGreaterThan(0);
  });
});

describe('makeSparkles', () => {
  it('returns multiple short strokes', () => {
    const r = makeSparkles(200, 200, 60);
    expect(r.length).toBeGreaterThan(0);
  });
});

describe('makeStarField', () => {
  it('returns star shapes', () => {
    const r = makeStarField(200, 200, 4);
    expect(r.length).toBe(4);
    r.forEach(s => { expect(s.kind).toBe('star'); });
  });
});

// ── classifyUserStroke ─────────────────────────────────────────────────────────

describe('classifyUserStroke', () => {
  it('classifies a dot (single point)', () => {
    expect(classifyUserStroke([{ x: 50, y: 50 }])).toBe('dot');
  });

  it('classifies a horizontal line', () => {
    const pts = Array.from({ length: 30 }, (_, i) => ({ x: i * 10, y: 100 }));
    expect(classifyUserStroke(pts)).toBe('line');
  });

  it('classifies a vertical line', () => {
    const pts = Array.from({ length: 30 }, (_, i) => ({ x: 100, y: i * 10 }));
    expect(classifyUserStroke(pts)).toBe('vertical line');
  });

  it('classifies an approximate circle', () => {
    const pts: { x: number; y: number }[] = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
      pts.push({ x: 200 + Math.cos(t) * 80, y: 200 + Math.sin(t) * 80 });
    }
    const result = classifyUserStroke(pts);
    expect(['circle', 'loop']).toContain(result);
  });

  it('classifies a dense back-and-forth as scribble', () => {
    // Back and forth in a small area, many points → perim > 40, bbox < 45x45
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 20; i++) {
      pts.push({ x: 20 + (i % 2) * 10, y: 20 + Math.floor(i / 2) * 2 });
    }
    expect(classifyUserStroke(pts)).toBe('scribble');
  });
});

// ── DRAW_FN_MAP ────────────────────────────────────────────────────────────────

describe('DRAW_FN_MAP', () => {
  it('has all 25 expected function names', () => {
    const expected = [
      'makeHeart','makeSun','makeRainbow','makeSmiley','makeSadFace',
      'makeHouse','makeTree','makeCloud','makeCat','makeSpiral',
      'makeZigzag','makeFlower','makeDiamond','makeWave','makeMountain',
      'makeFish','makeRocket','makeLightning','makePizza','makeStarOutline',
      'makeInfinity','makeSnowflake','makePlanet','makeUnicorn','makeLetterHi',
    ];
    expected.forEach(name => {
      expect(DRAW_FN_MAP[name], `DRAW_FN_MAP missing: ${name}`).toBeDefined();
    });
  });

  it('each function returns a non-empty array', () => {
    for (const [name, fn] of Object.entries(DRAW_FN_MAP)) {
      const result = fn(200, 200, 60, '#ff0000');
      expect(result.length, `${name} returned empty array`).toBeGreaterThan(0);
    }
  });
});

// ── PIP_DRAW_OPTIONS ───────────────────────────────────────────────────────────

describe('PIP_DRAW_OPTIONS', () => {
  it('has at least 25 entries', () => {
    expect(PIP_DRAW_OPTIONS.length).toBeGreaterThanOrEqual(25);
  });

  it('each draw option returns a msg with text and emotion', () => {
    PIP_DRAW_OPTIONS.forEach((fn, i) => {
      const result = fn(200, 200);
      expect(result.msg.text, `option ${i} missing msg.text`).toBeTruthy();
      expect(result.msg.emotion, `option ${i} missing msg.emotion`).toBeTruthy();
      const hasOutput = (result.strokes && result.strokes.length > 0) ||
                        (result.shapes && result.shapes.length > 0);
      expect(hasOutput, `option ${i} produces no strokes or shapes`).toBe(true);
    });
  });
});

// ── pickRandom / pickRandomDraw ────────────────────────────────────────────────

describe('pickRandom', () => {
  it('returns an element from the array', () => {
    const arr = [1, 2, 3, 4, 5];
    const picked = pickRandom(arr);
    expect(arr).toContain(picked);
  });

  it('works with single-element arrays', () => {
    expect(pickRandom(['only'])).toBe('only');
  });
});

describe('pickRandomDraw', () => {
  it('returns a function from PIP_DRAW_OPTIONS', () => {
    const fn = pickRandomDraw();
    expect(PIP_DRAW_OPTIONS).toContain(fn);
  });
});

// ── COMPANION_SCRIPTS ──────────────────────────────────────────────────────────

describe('COMPANION_SCRIPTS', () => {
  it('is a non-empty array', () => {
    expect(COMPANION_SCRIPTS.length).toBeGreaterThan(0);
  });

  it('each script has at least one action', () => {
    COMPANION_SCRIPTS.forEach((script, i) => {
      expect(script.length, `script ${i} is empty`).toBeGreaterThan(0);
    });
  });

  it('each action has at least one of: message, strokes, shapes', () => {
    COMPANION_SCRIPTS.forEach((script, si) => {
      script.forEach((action, ai) => {
        const hasSomething = action.message || action.strokes || action.shapes;
        expect(hasSomething, `script ${si} action ${ai} is empty`).toBeTruthy();
      });
    });
  });
});

describe('getRandomScript', () => {
  it('returns a valid index', () => {
    const idx = getRandomScript();
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(COMPANION_SCRIPTS.length);
  });

  it('excludes the given index when possible', () => {
    // Run many times; exclusion should hold when there are multiple scripts
    if (COMPANION_SCRIPTS.length > 1) {
      for (let i = 0; i < 50; i++) {
        expect(getRandomScript(0)).not.toBe(0);
      }
    }
  });
});

describe('scriptCentroid', () => {
  it('returns the average position of all stroke points', () => {
    const actions = [{
      strokes: [{
        id: 'x', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 }],
        color: '#000', width: 2, offsetX: 0, offsetY: 0,
      }],
    }];
    const c = scriptCentroid(actions);
    expect(c.x).toBeCloseTo(50);
    expect(c.y).toBeCloseTo(100 / 3);
  });
});

// ── Quip arrays ────────────────────────────────────────────────────────────────

describe('IDLE_QUIPS', () => {
  it('is non-empty and each has text+emotion', () => {
    expect(IDLE_QUIPS.length).toBeGreaterThan(0);
    IDLE_QUIPS.forEach(q => {
      expect(q.text).toBeTruthy();
      expect(q.emotion).toBeTruthy();
    });
  });
});

describe('REACTION_QUIPS', () => {
  it('is non-empty', () => {
    expect(REACTION_QUIPS.length).toBeGreaterThan(0);
  });
});
