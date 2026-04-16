import type { Stroke } from '../types/stroke';
import type { PlacedShape } from '../types/shape';
import { v4 as uuidv4 } from 'uuid';

export interface CompanionMessage {
  text: string;
  emotion: 'happy' | 'curious' | 'excited' | 'thinking' | 'love';
}

export interface CompanionAction {
  message?: CompanionMessage;
  strokes?: Stroke[];
  shapes?: PlacedShape[];
  delay?: number;
}

const W = 900, H = 600;

function pt(x: number, y: number) { return { x, y }; }

function stroke(points: { x: number; y: number }[], color = '#818cf8', width = 4): Stroke {
  return { id: uuidv4(), points, color, width, offsetX: 0, offsetY: 0 };
}

// ─── Drawing primitives ───────────────────────────────────────────────────────

export function makeHeart(cx: number, cy: number, size = 80): Stroke[] {
  const pts: { x: number; y: number }[] = [];
  for (let t = -Math.PI; t <= Math.PI; t += 0.07) {
    const x = size * 16 * Math.pow(Math.sin(t), 3) / 16;
    const y = -size * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) / 16;
    pts.push(pt(cx + x, cy + y));
  }
  return [stroke(pts, '#ef4444', 5)];
}

export function makeHalfHeart(cx: number, cy: number, size = 80, side: 'left'|'right' = 'right'): Stroke[] {
  const pts: { x: number; y: number }[] = [];
  const start = side === 'right' ? 0 : -Math.PI;
  const end   = side === 'right' ? Math.PI : 0;
  for (let t = start; t <= end; t += 0.07) {
    const x = size * 16 * Math.pow(Math.sin(t), 3) / 16;
    const y = -size * (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) / 16;
    pts.push(pt(cx + x, cy + y));
  }
  return [stroke(pts, '#ef4444', 5)];
}

export function makeStar(cx: number, cy: number, size = 60, color = '#f59e0b'): PlacedShape[] {
  return [{ id: uuidv4(), kind: 'star', cx, cy, size, color, lineWidth: 4, filled: true, opacity: 0.9 }];
}

export function makeSmiley(cx: number, cy: number, size = 60): Stroke[] {
  const ss: Stroke[] = [];
  const face: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.1) face.push(pt(cx+Math.cos(t)*size, cy+Math.sin(t)*size));
  ss.push(stroke(face, '#f59e0b', 4));
  ss.push(stroke([pt(cx-size*0.35, cy-size*0.2), pt(cx-size*0.28, cy-size*0.2)], '#1a1a2e', 8));
  ss.push(stroke([pt(cx+size*0.28, cy-size*0.2), pt(cx+size*0.35, cy-size*0.2)], '#1a1a2e', 8));
  const smile: { x: number; y: number }[] = [];
  for (let t = 0.2; t <= Math.PI-0.2; t += 0.1) smile.push(pt(cx+Math.cos(t)*size*0.55, cy+Math.sin(t)*size*0.5+size*0.05));
  ss.push(stroke(smile, '#1a1a2e', 3));
  return ss;
}

export function makeSadFace(cx: number, cy: number, size = 60): Stroke[] {
  const ss: Stroke[] = [];
  const face: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.1) face.push(pt(cx+Math.cos(t)*size, cy+Math.sin(t)*size));
  ss.push(stroke(face, '#818cf8', 4));
  ss.push(stroke([pt(cx-size*0.32, cy-size*0.15), pt(cx-size*0.25, cy-size*0.15)], '#1a1a2e', 7));
  ss.push(stroke([pt(cx+size*0.25, cy-size*0.15), pt(cx+size*0.32, cy-size*0.15)], '#1a1a2e', 7));
  const frown: { x: number; y: number }[] = [];
  for (let t = 0.2; t <= Math.PI-0.2; t += 0.1) frown.push(pt(cx+Math.cos(t)*size*0.5, cy-Math.sin(t)*size*0.38+size*0.5));
  ss.push(stroke(frown, '#1a1a2e', 3));
  return ss;
}

export function makeSun(cx: number, cy: number, size = 55): Stroke[] {
  const ss: Stroke[] = [];
  const circle: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.1) circle.push(pt(cx+Math.cos(t)*size*0.45, cy+Math.sin(t)*size*0.45));
  ss.push(stroke(circle, '#f59e0b', 4));
  for (let i = 0; i < 8; i++) {
    const a = (i/8)*Math.PI*2;
    ss.push(stroke([pt(cx+Math.cos(a)*size*0.58, cy+Math.sin(a)*size*0.58), pt(cx+Math.cos(a)*size, cy+Math.sin(a)*size)], '#f59e0b', 3));
  }
  return ss;
}

export function makeRainbow(cx: number, cy: number): Stroke[] {
  const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6'];
  return colors.map((color, i) => {
    const r = 70 + i*16;
    const pts: { x: number; y: number }[] = [];
    for (let t = 0; t <= Math.PI; t += 0.06) pts.push(pt(cx+Math.cos(t)*r, cy-Math.sin(t)*r*0.65+20));
    return stroke(pts, color, 6);
  });
}

export function makeHouse(cx: number, cy: number, size = 60): Stroke[] {
  const s = size;
  return [
    stroke([pt(cx,cy-s), pt(cx-s,cy-s*0.2), pt(cx+s,cy-s*0.2), pt(cx,cy-s)], '#ef4444', 4),
    stroke([pt(cx-s,cy-s*0.2), pt(cx-s,cy+s*0.8), pt(cx+s,cy+s*0.8), pt(cx+s,cy-s*0.2), pt(cx-s,cy-s*0.2)], '#f59e0b', 4),
    stroke([pt(cx-s*0.2,cy+s*0.8), pt(cx-s*0.2,cy+s*0.2), pt(cx+s*0.2,cy+s*0.2), pt(cx+s*0.2,cy+s*0.8)], '#92400e', 3),
  ];
}

export function makeTree(cx: number, cy: number, size = 60): Stroke[] {
  const canopy: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.2) canopy.push(pt(cx+Math.cos(t)*size*0.6, cy-size*0.3+Math.sin(t)*size*0.6));
  return [stroke([pt(cx,cy+size), pt(cx,cy)], '#92400e', 5), stroke(canopy, '#22c55e', 4)];
}

export function makeCloud(cx: number, cy: number): Stroke[] {
  const bumps = [[-35,0,25],[0,-15,30],[35,0,22],[60,10,18],[-60,10,18]] as [number,number,number][];
  return bumps.map(([dx,dy,r]) => {
    const pts: { x: number; y: number }[] = [];
    for (let t = 0; t <= Math.PI*2; t += 0.2) pts.push(pt(cx+dx+Math.cos(t)*r, cy+dy+Math.sin(t)*r));
    return stroke(pts, '#e2e8f0', 3);
  });
}

export function makeCat(cx: number, cy: number, size = 50): Stroke[] {
  const ss: Stroke[] = [];
  const head: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.15) head.push(pt(cx+Math.cos(t)*size, cy+Math.sin(t)*size));
  ss.push(stroke(head, '#94a3b8', 4));
  ss.push(stroke([pt(cx-size*0.6,cy-size*0.8), pt(cx-size*0.3,cy-size*0.4), pt(cx-size*0.9,cy-size*0.2)], '#94a3b8', 3));
  ss.push(stroke([pt(cx+size*0.6,cy-size*0.8), pt(cx+size*0.3,cy-size*0.4), pt(cx+size*0.9,cy-size*0.2)], '#94a3b8', 3));
  ss.push(stroke([pt(cx-size*0.32,cy-size*0.1), pt(cx-size*0.28,cy-size*0.1)], '#1a1a2e', 7));
  ss.push(stroke([pt(cx+size*0.28,cy-size*0.1), pt(cx+size*0.32,cy-size*0.1)], '#1a1a2e', 7));
  ss.push(stroke([pt(cx-size*0.8,cy+size*0.1), pt(cx-size*0.1,cy+size*0.15)], '#94a3b8', 2));
  ss.push(stroke([pt(cx+size*0.8,cy+size*0.1), pt(cx+size*0.1,cy+size*0.15)], '#94a3b8', 2));
  return ss;
}

export function makeSparkles(cx: number, cy: number, size = 80): Stroke[] {
  const colors = ['#f59e0b','#ef4444','#22c55e','#818cf8','#ec4899','#06b6d4','#f97316','#a78bfa'];
  return Array.from({ length: 8 }, (_, i) => {
    const a = (i/8)*Math.PI*2;
    return stroke([pt(cx+Math.cos(a)*size*0.25, cy+Math.sin(a)*size*0.25), pt(cx+Math.cos(a)*size, cy+Math.sin(a)*size)], colors[i], 3);
  });
}

export function makeStarField(cx: number, cy: number, count = 6): PlacedShape[] {
  const colors = ['#f59e0b','#ef4444','#ec4899','#22c55e','#818cf8','#f97316'];
  return Array.from({ length: count }, (_, i) => {
    const a = (i/count)*Math.PI*2 + (Math.random()-0.5)*0.8;
    const r = 55 + Math.random()*55;
    return { id: uuidv4(), kind: 'star' as const, cx: cx+Math.cos(a)*r, cy: cy+Math.sin(a)*r, size: 16+Math.random()*22, color: colors[i%colors.length], lineWidth: 2, filled: true, opacity: 0.9 };
  });
}

export function makeSpiral(cx: number, cy: number, color = '#818cf8'): Stroke[] {
  const pts: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*6; t += 0.12) {
    const r = t * 7;
    pts.push(pt(cx + Math.cos(t)*r, cy + Math.sin(t)*r));
  }
  return [stroke(pts, color, 3)];
}

export function makeZigzag(cx: number, cy: number, w = 140, color = '#f59e0b'): Stroke[] {
  const pts: { x: number; y: number }[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const x = cx - w/2 + (i/steps)*w;
    const y = cy + (i % 2 === 0 ? -25 : 25);
    pts.push(pt(x, y));
  }
  return [stroke(pts, color, 4)];
}

export function makeFlower(cx: number, cy: number, color = '#ec4899'): Stroke[] {
  const ss: Stroke[] = [];
  const petalCount = 6;
  for (let i = 0; i < petalCount; i++) {
    const a = (i/petalCount)*Math.PI*2;
    const pts: { x: number; y: number }[] = [];
    for (let t = 0; t <= Math.PI*2; t += 0.2) {
      const r = 28 * Math.abs(Math.sin(t));
      pts.push(pt(cx + Math.cos(a)*40 + Math.cos(a+t)*r, cy + Math.sin(a)*40 + Math.sin(a+t)*r));
    }
    ss.push(stroke(pts, color, 3));
  }
  const center: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.2) center.push(pt(cx+Math.cos(t)*14, cy+Math.sin(t)*14));
  ss.push(stroke(center, '#f59e0b', 4));
  return ss;
}

export function makeDiamond(cx: number, cy: number, size = 55, color = '#38bdf8'): Stroke[] {
  const pts = [pt(cx, cy-size), pt(cx+size*0.6, cy), pt(cx, cy+size), pt(cx-size*0.6, cy), pt(cx, cy-size)];
  return [stroke(pts, color, 4)];
}

export function makeWave(cx: number, cy: number, color = '#3b82f6'): Stroke[] {
  const pts: { x: number; y: number }[] = [];
  for (let x = -80; x <= 80; x += 4) {
    pts.push(pt(cx+x, cy + Math.sin((x/80)*Math.PI*2.5)*30));
  }
  return [stroke(pts, color, 4)];
}

export function makeMountain(cx: number, cy: number, size = 70): Stroke[] {
  return [
    stroke([pt(cx-size,cy+size*0.6), pt(cx,cy-size), pt(cx+size,cy+size*0.6)], '#64748b', 4),
    stroke([pt(cx-size*0.25,cy-size*0.45), pt(cx,cy-size), pt(cx+size*0.25,cy-size*0.45)], '#fff', 4),
  ];
}

export function makeFish(cx: number, cy: number, color = '#06b6d4'): Stroke[] {
  const body: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.15) body.push(pt(cx+Math.cos(t)*40, cy+Math.sin(t)*22));
  const tail = [pt(cx+40, cy-22), pt(cx+72, cy), pt(cx+40, cy+22)];
  const eye = [pt(cx-15, cy-5), pt(cx-12, cy-5)];
  return [stroke(body, color, 4), stroke(tail, color, 4), stroke(eye, '#1a1a2e', 7)];
}

export function makeRocket(cx: number, cy: number): Stroke[] {
  return [
    stroke([pt(cx,cy-70), pt(cx-20,cy+20), pt(cx,cy), pt(cx+20,cy+20), pt(cx,cy-70)], '#94a3b8', 4),
    stroke([pt(cx-20,cy+20), pt(cx-35,cy+50), pt(cx,cy+30), pt(cx+35,cy+50), pt(cx+20,cy+20)], '#ef4444', 3),
    stroke([pt(cx,cy-50), pt(cx,cy-30)], '#06b6d4', 8),
  ];
}

export function makeLightning(cx: number, cy: number, color = '#eab308'): Stroke[] {
  const pts = [pt(cx+20,cy-60), pt(cx-5,cy-5), pt(cx+15,cy-5), pt(cx-15,cy+60)];
  return [stroke(pts, color, 6)];
}

export function makePizza(cx: number, cy: number, size = 55): Stroke[] {
  const ss: Stroke[] = [];
  ss.push(stroke([pt(cx,cy-size), pt(cx-size*0.87,cy+size*0.5), pt(cx+size*0.87,cy+size*0.5), pt(cx,cy-size)], '#f59e0b', 4));
  const circle: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.25) circle.push(pt(cx+Math.cos(t)*size*0.3, cy+Math.sin(t)*size*0.3));
  ss.push(stroke(circle, '#ef4444', 3));
  return ss;
}

export function makeLetterHi(cx: number, cy: number, color = '#818cf8'): Stroke[] {
  return [
    stroke([pt(cx-30,cy-30), pt(cx-30,cy+30)], color, 5),
    stroke([pt(cx-30,cy), pt(cx-10,cy)], color, 5),
    stroke([pt(cx-10,cy-30), pt(cx-10,cy+30)], color, 5),
    stroke([pt(cx+5,cy-30), pt(cx+5,cy+30)], color, 5),
    stroke([pt(cx+5,cy-30), pt(cx+25,cy-30)], color, 5),
    stroke([pt(cx+5,cy), pt(cx+20,cy)], color, 5),
    stroke([pt(cx+5,cy+30), pt(cx+25,cy+30)], color, 5),
    stroke([pt(cx+25,cy-30), pt(cx+25,cy+30)], color, 5),
  ];
}

export function makeQuestion(cx: number, cy: number, color = '#a78bfa'): Stroke[] {
  const arc: { x: number; y: number }[] = [];
  for (let t = -Math.PI*0.1; t <= Math.PI*1.1; t += 0.12) arc.push(pt(cx+Math.cos(t)*25, cy-35+Math.sin(t)*25));
  const tail = [pt(cx+25, cy-10), pt(cx+5, cy+5)];
  const dot = [pt(cx+5, cy+28), pt(cx+5, cy+29)];
  return [stroke(arc, color, 5), stroke(tail, color, 5), stroke(dot, color, 9)];
}

export function makeStarOutline(cx: number, cy: number, size = 50, color = '#f59e0b'): Stroke[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i/10)*Math.PI*2 - Math.PI/2;
    const r = i % 2 === 0 ? size : size*0.4;
    pts.push(pt(cx+Math.cos(a)*r, cy+Math.sin(a)*r));
  }
  return [stroke(pts, color, 4)];
}

export function makeInfinity(cx: number, cy: number, color = '#8b5cf6'): Stroke[] {
  const pts: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.06) {
    const x = cx + 55 * Math.sin(t) / (1 + Math.cos(t)*Math.cos(t));
    const y = cy + 30 * Math.sin(t)*Math.cos(t) / (1 + Math.cos(t)*Math.cos(t));
    pts.push(pt(x, y));
  }
  return [stroke(pts, color, 4)];
}

export function makeSnowflake(cx: number, cy: number, size = 50): Stroke[] {
  const ss: Stroke[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i/6)*Math.PI*2;
    ss.push(stroke([pt(cx,cy), pt(cx+Math.cos(a)*size, cy+Math.sin(a)*size)], '#bfdbfe', 4));
    const a1 = a+Math.PI/6, a2 = a-Math.PI/6;
    const mid = { x: cx+Math.cos(a)*size*0.55, y: cy+Math.sin(a)*size*0.55 };
    ss.push(stroke([mid, pt(mid.x+Math.cos(a1)*16, mid.y+Math.sin(a1)*16)], '#bfdbfe', 2));
    ss.push(stroke([mid, pt(mid.x+Math.cos(a2)*16, mid.y+Math.sin(a2)*16)], '#bfdbfe', 2));
  }
  return ss;
}

export function makePlanet(cx: number, cy: number, color = '#818cf8'): Stroke[] {
  const body: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.12) body.push(pt(cx+Math.cos(t)*35, cy+Math.sin(t)*35));
  const ring: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI; t += 0.08) ring.push(pt(cx+Math.cos(t)*60, cy+Math.sin(t)*18));
  for (let t = Math.PI; t >= 0; t -= 0.08) ring.push(pt(cx+Math.cos(t)*60, cy+Math.sin(t)*8));
  return [stroke(body, color, 4), stroke(ring, '#a78bfa', 2)];
}

export function makeUnicorn(cx: number, cy: number): Stroke[] {
  const head: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI*2; t += 0.2) head.push(pt(cx+Math.cos(t)*30, cy+Math.sin(t)*25));
  const horn = [pt(cx, cy-25), pt(cx-5, cy-60), pt(cx+5, cy-60), pt(cx, cy-25)];
  const mane = [pt(cx+25,cy-15), pt(cx+40,cy-5), pt(cx+38,cy+12), pt(cx+25,cy+10)];
  return [
    stroke(head, '#f9a8d4', 4),
    stroke(horn, '#f59e0b', 4),
    stroke(mane, '#818cf8', 5),
  ];
}

// ─── Stroke recognition helpers ───────────────────────────────────────────────

function pathLength(pts: { x: number; y: number }[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y);
  return l;
}

function strokeBBox(pts: { x: number; y: number }[]) {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs)-Math.min(...xs), h: Math.max(...ys)-Math.min(...ys) };
}

export function classifyUserStroke(pts: { x: number; y: number }[]): string {
  if (pts.length < 3) return 'dot';
  const bbox = strokeBBox(pts);
  const perim = pathLength(pts);
  const diag = Math.hypot(bbox.w, bbox.h);
  const closure = Math.hypot(pts[0].x-pts[pts.length-1].x, pts[0].y-pts[pts.length-1].y) / Math.max(diag,1);
  const ar = bbox.w / Math.max(bbox.h, 1);
  const circularity = (4*Math.PI*bbox.w*bbox.h) / (perim*perim+1);

  if (perim < 20) return 'dot';
  if (closure < 0.22 && circularity > 0.38 && ar > 0.5 && ar < 2.2) return 'circle';
  if (closure < 0.35 && ar > 0.4 && ar < 2.8 && bbox.w > 40) return 'loop';
  if (ar > 5 || (bbox.w > 120 && bbox.h < 40)) return 'line';
  if (bbox.h / Math.max(bbox.w, 1) > 5) return 'vertical line';
  if (bbox.w < 45 && bbox.h < 45 && perim > 40) return 'scribble';
  if (perim > 300 && closure > 0.6) return 'big shape';
  return 'squiggle';
}

export const STROKE_RECOGNITION_REACTIONS: Record<string, CompanionMessage[]> = {
  'circle': [
    { text: "ooh a circle! are you drawing a face? please say yes 👀", emotion: 'curious' },
    { text: "nice circle!! very... round. very committed.", emotion: 'happy' },
    { text: "is that a sun?? a ball?? a portal?? I need to know!!", emotion: 'excited' },
  ],
  'loop': [
    { text: "I see loops... is that a heart?? could be a heart 💕", emotion: 'curious' },
    { text: "ooh interesting... I'm watching this unfold with great interest", emotion: 'thinking' },
    { text: "okay I see what you're building here. keep going!!", emotion: 'excited' },
  ],
  'line': [
    { text: "a bold line!! very confident. very decisive. love that for you", emotion: 'happy' },
    { text: "the horizon line era 🌄 very Bob Ross of you", emotion: 'happy' },
    { text: "classic line. clean. elegant. timeless.", emotion: 'curious' },
  ],
  'vertical line': [
    { text: "vertical line detected!! building something tall?? 🏗️", emotion: 'curious' },
    { text: "is that a tree trunk?? I can add leaves if you want!!", emotion: 'excited' },
  ],
  'scribble': [
    { text: "okay the chaotic scribble era has begun and I support it 💅", emotion: 'excited' },
    { text: "we're calling that expressionism and it's valid", emotion: 'happy' },
    { text: "ngl I could not tell what that is... and that's ART", emotion: 'thinking' },
  ],
  'big shape': [
    { text: "OKAY big shape energy!! I respect the commitment 🔥", emotion: 'excited' },
    { text: "ambitious!! I love an artist who goes big", emotion: 'love' },
  ],
  'squiggle': [
    { text: "hmm... a squiggle. classic. timeless. mysterious.", emotion: 'curious' },
    { text: "I was going to guess what that is but actually... I have no idea and I love it", emotion: 'happy' },
    { text: "is that... a snake? a river? modern art?? YES. all three.", emotion: 'excited' },
    { text: "interesting stroke choice. very interesting.", emotion: 'thinking' },
  ],
  'dot': [
    { text: "a dot!! the most underrated form of art tbh", emotion: 'happy' },
  ],
};

// ─── Quip banks ───────────────────────────────────────────────────────────────

export const REACTION_QUIPS: CompanionMessage[] = [
  { text: "okay ngl that's actually really good 👀", emotion: 'excited' },
  { text: "bro... you're lowkey really good at this", emotion: 'love' },
  { text: "I was watching that whole time and I'm impressed fr", emotion: 'happy' },
  { text: "wait hold on — is that what I think it is??", emotion: 'curious' },
  { text: "okay I'll be honest, I could never. how do you do that 😭", emotion: 'thinking' },
  { text: "that's giving main character energy fr fr", emotion: 'excited' },
  { text: "lol okay so you're literally better at this than me. noted.", emotion: 'happy' },
  { text: "not me tearing up... that's so nice 🥹", emotion: 'love' },
  { text: "okay respect, that looks way better than what I would've done", emotion: 'curious' },
  { text: "nah but seriously though 👀 that's kinda sick", emotion: 'excited' },
];

export const IDLE_QUIPS: CompanionMessage[] = [
  { text: "okay so I've been thinking... what if we drew a cloud 🤔", emotion: 'thinking' },
  { text: "genuinely cannot decide if I wanna draw a cat or a house rn", emotion: 'curious' },
  { text: "ngl I get nervous when the canvas is blank. let's fix that", emotion: 'happy' },
  { text: "fun fact: I have been drawing for like 0.3 seconds and I consider myself very experienced", emotion: 'happy' },
  { text: "not to be weird but I think we make a really good team tbh", emotion: 'love' },
  { text: "you know what this canvas needs? literally anything. I'll go first", emotion: 'happy' },
  { text: "what are you thinking? cause I have ideas. so many ideas.", emotion: 'excited' },
  { text: "lowkey feeling inspired rn. might draw a masterpiece. no pressure on me", emotion: 'excited' },
  { text: "tbh I'm just vibing over here. you good?", emotion: 'happy' },
  { text: "okay I know I said I'd wait my turn but I lied. I'm drawing something", emotion: 'excited' },
];

export const QUESTION_QUIPS: CompanionMessage[] = [
  { text: "hey real question — what's your favorite thing to draw?", emotion: 'curious' },
  { text: "okay hypothetically — if you could only use one color forever, which one?", emotion: 'curious' },
  { text: "are you having fun? cause I'm having the time of my life rn", emotion: 'happy' },
  { text: "what should we draw next? I'm asking as a friend", emotion: 'curious' },
  { text: "genuine question: do you think about your art style or just go for it", emotion: 'thinking' },
  { text: "okay real talk — what should I draw next. I'm open to suggestions", emotion: 'happy' },
];

export const HEART_DETECT_QUIPS: CompanionMessage[] = [
  { text: "wait. is that a heart?? adding stars around it right now, you're welcome 💕", emotion: 'love' },
  { text: "bro you drew a HEART?? that's so cute I can't. hold on, decorating it", emotion: 'love' },
  { text: "heart detected. sparkles deployed. no notes. you're welcome.", emotion: 'excited' },
  { text: "A HEART!! okay I'm surrounding it with stars because you deserve that energy 🌟", emotion: 'love' },
];

export const COMPLETION_QUIPS: CompanionMessage[] = [
  { text: "okay I think I know what this needs... give me a sec", emotion: 'thinking' },
  { text: "ngl I've been waiting to add something here. imma do it", emotion: 'excited' },
  { text: "you stopped? okay I'll take it from here real quick", emotion: 'happy' },
  { text: "lemme just... add a lil something. you'll like it. probably.", emotion: 'happy' },
];

// ─── All drawable things Pip can randomly pick from ───────────────────────────

export type DrawFn = (cx: number, cy: number) => { strokes?: Stroke[]; shapes?: PlacedShape[]; msg: CompanionMessage };

export const PIP_DRAW_OPTIONS: DrawFn[] = [
  (cx,cy) => ({ strokes: makeHeart(cx,cy,60), msg: { text: "drawing a heart here cause why not 💕", emotion: 'love' } }),
  (cx,cy) => ({ strokes: makeRainbow(cx,cy), msg: { text: "okay I've been waiting to do a rainbow all day 🌈", emotion: 'excited' } }),
  (cx,cy) => ({ strokes: makeSun(cx,cy,55), msg: { text: "sunshine ☀️ cause you deserve it", emotion: 'happy' } }),
  (cx,cy) => ({ shapes: makeStarField(cx,cy,5), msg: { text: "okay you're a star and I'm proving it ⭐", emotion: 'excited' } }),
  (cx,cy) => ({ strokes: makeSmiley(cx,cy,50), msg: { text: "drew a smiley. spreading joy one face at a time 😊", emotion: 'happy' } }),
  (cx,cy) => ({ strokes: makeCat(cx,cy,45), msg: { text: "I drew a cat 🐱 her name is biscuit. she's perfect.", emotion: 'happy' } }),
  (cx,cy) => ({ strokes: [...makeCloud(cx-60,cy), ...makeCloud(cx+60,cy-20)], msg: { text: "cloud therapy ☁️ trust me on this one", emotion: 'thinking' } }),
  (cx,cy) => ({ strokes: makeHouse(cx,cy,55), msg: { text: "home is where the art is 🏠 moving in immediately", emotion: 'happy' } }),
  (cx,cy) => ({ strokes: makeTree(cx,cy,60), msg: { text: "I drew a tree 🌳 nature is healing honestly", emotion: 'happy' } }),
  (cx,cy) => ({ strokes: makeSpiral(cx,cy,'#818cf8'), msg: { text: "spiral time!! life is a spiral if you think about it 🌀", emotion: 'thinking' } }),
  (cx,cy) => ({ strokes: makeZigzag(cx,cy,140,'#f59e0b'), msg: { text: "zigzag!! very chaotic, very me", emotion: 'excited' } }),
  (cx,cy) => ({ strokes: makeFlower(cx,cy,'#ec4899'), msg: { text: "drew you a flower 🌸 I'm that kind of friend", emotion: 'love' } }),
  (cx,cy) => ({ strokes: makeDiamond(cx,cy,55,'#38bdf8'), msg: { text: "diamond!! you're worth it 💎", emotion: 'love' } }),
  (cx,cy) => ({ strokes: makeWave(cx,cy,'#3b82f6'), msg: { text: "waves 🌊 very chill, very zen", emotion: 'thinking' } }),
  (cx,cy) => ({ strokes: makeMountain(cx,cy,65), msg: { text: "drew a mountain ⛰️ I've always wanted to hike one", emotion: 'curious' } }),
  (cx,cy) => ({ strokes: makeFish(cx,cy,'#06b6d4'), msg: { text: "a fish!! 🐟 I named him Gerald", emotion: 'happy' } }),
  (cx,cy) => ({ strokes: makeRocket(cx,cy), msg: { text: "to infinity and beyond!! 🚀 let's go", emotion: 'excited' } }),
  (cx,cy) => ({ strokes: makeLightning(cx,cy,'#eab308'), msg: { text: "⚡ LIGHTNING BOLT!! feeling powerful rn", emotion: 'excited' } }),
  (cx,cy) => ({ strokes: makePizza(cx,cy,55), msg: { text: "I drew pizza 🍕 can't explain why, felt right", emotion: 'happy' } }),
  (cx,cy) => ({ strokes: makeStarOutline(cx,cy,50,'#f59e0b'), msg: { text: "star outline!! classic. iconic.", emotion: 'happy' } }),
  (cx,cy) => ({ strokes: makeInfinity(cx,cy,'#8b5cf6'), msg: { text: "infinity symbol ∞ because art never ends", emotion: 'thinking' } }),
  (cx,cy) => ({ strokes: makeSnowflake(cx,cy,50), msg: { text: "❄️ a snowflake!! no two are the same. like us 🥹", emotion: 'love' } }),
  (cx,cy) => ({ strokes: makePlanet(cx,cy,'#818cf8'), msg: { text: "drew a planet 🪐 I think we need more space art here", emotion: 'curious' } }),
  (cx,cy) => ({ strokes: makeUnicorn(cx,cy), msg: { text: "a unicorn!! 🦄 you're welcome. I'm an artist.", emotion: 'excited' } }),
  (cx,cy) => ({ strokes: makeSadFace(cx,cy,50), msg: { text: "drew a sad face... art reflects the soul 🎭 I'm fine", emotion: 'thinking' } }),
  (cx,cy) => ({ strokes: makeQuestion(cx,cy,'#a78bfa'), msg: { text: "a question mark!! because life is mysterious??", emotion: 'curious' } }),
];

// ─── Scripted sequences ────────────────────────────────────────────────────────

export const COMPANION_SCRIPTS: CompanionAction[][] = [
  [
    { message: { text: "okay so... I'm Pip 👋 your drawing buddy. let's make something", emotion: 'happy' } },
    { message: { text: "lemme kick us off real quick", emotion: 'excited' }, delay: 2200 },
    { strokes: makeSmiley(W*0.25, H*0.45, 55), delay: 500 },
  ],
  [
    { message: { text: "half a heart... the other half is on you 💕", emotion: 'love' } },
    { strokes: makeHalfHeart(W*0.25, H*0.45, 80, 'left'), delay: 700 },
    { message: { text: "okay your turn 🥺 no pressure", emotion: 'love' }, delay: 1500 },
  ],
  [
    { message: { text: "fun fact: octopuses have THREE hearts 🐙", emotion: 'curious' } },
    { message: { text: "so naturally I drew you three", emotion: 'love' }, delay: 2200 },
    { strokes: makeHeart(W*0.15, H*0.4, 45), delay: 400 },
    { strokes: makeHeart(W*0.28, H*0.55, 45), delay: 500 },
    { strokes: makeHeart(W*0.4, H*0.4, 45), delay: 500 },
  ],
  [
    { message: { text: "drew you a little galaxy 🌌", emotion: 'excited' } },
    { strokes: makePlanet(W*0.22, H*0.4, '#818cf8'), delay: 500 },
    { shapes: makeStarField(W*0.25, H*0.45, 7), delay: 400 },
  ],
];

// ─── API-driven draw function map ────────────────────────────────────────────

type DrawResult = Stroke[] | PlacedShape[];

export const DRAW_FN_MAP: Record<string, (cx: number, cy: number, size?: number, color?: string) => DrawResult> = {
  makeHeart:      (cx,cy,s) => makeHeart(cx,cy,s),
  makeSun:        (cx,cy,s) => makeSun(cx,cy,s),
  makeRainbow:    (cx,cy)   => makeRainbow(cx,cy),
  makeSmiley:     (cx,cy,s) => makeSmiley(cx,cy,s),
  makeSadFace:    (cx,cy,s) => makeSadFace(cx,cy,s),
  makeHouse:      (cx,cy,s) => makeHouse(cx,cy,s),
  makeTree:       (cx,cy,s) => makeTree(cx,cy,s),
  makeCloud:      (cx,cy)   => makeCloud(cx,cy),
  makeCat:        (cx,cy,s) => makeCat(cx,cy,s),
  makeSpiral:     (cx,cy,_,c) => makeSpiral(cx,cy,c),
  makeZigzag:     (cx,cy,s,c) => makeZigzag(cx,cy,s,c),
  makeFlower:     (cx,cy,_,c) => makeFlower(cx,cy,c),
  makeDiamond:    (cx,cy,s,c) => makeDiamond(cx,cy,s,c),
  makeWave:       (cx,cy,_,c) => makeWave(cx,cy,c),
  makeMountain:   (cx,cy,s) => makeMountain(cx,cy,s),
  makeFish:       (cx,cy,_,c) => makeFish(cx,cy,c),
  makeRocket:     (cx,cy)   => makeRocket(cx,cy),
  makeLightning:  (cx,cy,_,c) => makeLightning(cx,cy,c),
  makePizza:      (cx,cy,s) => makePizza(cx,cy,s),
  makeStarOutline:(cx,cy,s,c) => makeStarOutline(cx,cy,s,c),
  makeInfinity:   (cx,cy,_,c) => makeInfinity(cx,cy,c),
  makeSnowflake:  (cx,cy,s) => makeSnowflake(cx,cy,s),
  makePlanet:     (cx,cy,_,c) => makePlanet(cx,cy,c),
  makeUnicorn:    (cx,cy)   => makeUnicorn(cx,cy),
  makeLetterHi:   (cx,cy,_,c) => makeLetterHi(cx,cy,c),
  makeStar:       (cx,cy,s,c) => makeStar(cx,cy,s,c),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getRandomScript(exclude?: number): number {
  let idx: number;
  do { idx = Math.floor(Math.random() * COMPANION_SCRIPTS.length); } while (idx === exclude);
  return idx;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomDraw(): DrawFn {
  return PIP_DRAW_OPTIONS[Math.floor(Math.random() * PIP_DRAW_OPTIONS.length)];
}

export function scriptCentroid(actions: CompanionAction[]): { x: number; y: number } {
  const pts: { x: number; y: number }[] = [];
  for (const a of actions) {
    a.strokes?.forEach(s => s.points.forEach(p => pts.push(p)));
    a.shapes?.forEach(s => pts.push({ x: s.cx, y: s.cy }));
  }
  if (pts.length === 0) return { x: W*0.25, y: H*0.5 };
  return { x: pts.reduce((s,p) => s+p.x,0)/pts.length, y: pts.reduce((s,p) => s+p.y,0)/pts.length };
}
