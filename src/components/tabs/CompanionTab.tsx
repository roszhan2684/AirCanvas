import { useEffect, useRef, useState, useCallback } from 'react';

import {
  IDLE_QUIPS, REACTION_QUIPS, QUESTION_QUIPS, HEART_DETECT_QUIPS, COMPLETION_QUIPS,
  STROKE_RECOGNITION_REACTIONS, DRAW_FN_MAP,
  pickRandom, pickRandomDraw, classifyUserStroke,
  makeSparkles, makeStarField,
  COMPANION_SCRIPTS, getRandomScript, scriptCentroid,
  type CompanionMessage,
} from '../../lib/companion';
import { applyPipStyle, type PipStyle } from '../../lib/pipStyles';
import { capturePortraitFilter } from '../../lib/portrait';
import { CanvasOverlay } from '../CanvasOverlay';
import { Sidebar } from '../Sidebar';
import type { Stroke, StrokeStyle } from '../../types/stroke';
import type { PlacedShape, ShapeKind } from '../../types/shape';
import type { GestureState } from '../../types/hand';

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

function getStrokesBBox(ss: Stroke[]) {
  const pts = ss.flatMap(s => s.points);
  if (!pts.length) return null;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

function findPipSpot(pipStrokes: Stroke[], shapes: PlacedShape[], halfW: number, ch: number) {
  const margin = 80;
  const obstacles = [
    ...pipStrokes.map(s => {
      const b = getStrokesBBox([s]);
      return b ? { cx: b.x + b.w/2, cy: b.y + b.h/2, r: Math.max(b.w, b.h)/2 + 80 } : null;
    }).filter(Boolean) as { cx: number; cy: number; r: number }[],
    ...shapes.filter(s => s.cx < halfW).map(s => ({ cx: s.cx, cy: s.cy, r: s.size + 60 })),
  ];
  for (let i = 0; i < 100; i++) {
    const x = margin + Math.random() * (halfW - margin * 2);
    const y = margin + Math.random() * (ch - margin * 2);
    if (obstacles.every(o => Math.hypot(x - o.cx, y - o.cy) > o.r)) return { x, y };
  }
  return { x: halfW * 0.5, y: ch * 0.5 };
}

// ─── Cloud bubble ─────────────────────────────────────────────────────────────

function CloudBubble({ text, visible }: { text: string; visible: boolean }) {
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: '50%', marginBottom: 12,
      transform: visible
        ? 'translateX(-50%) translateY(-4px) scale(1)'
        : 'translateX(-50%) translateY(4px) scale(0.92)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.35s cubic-bezier(0.34,1.4,0.64,1), opacity 0.25s ease',
      pointerEvents: 'none', zIndex: 30,
      minWidth: 140, maxWidth: 240, width: 'max-content',
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 20, padding: '11px 16px',
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)', border: '1.5px solid rgba(0,0,0,0.05)',
        position: 'relative',
      }}>
        <p style={{
          margin: 0, color: '#1a1a2e',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          fontSize: 13, lineHeight: 1.5, textAlign: 'center', fontWeight: 500,
        }}>{text}</p>
        <div style={{
          position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '10px solid #fff',
        }} />
      </div>
    </div>
  );
}

const MOOD_COLORS = {
  happy: '#f472b6', calm: '#818cf8', energetic: '#f97316', creative: '#22c55e',
} as const;

function PipCharacter({ emotion, isDrawing, moodColor }: {
  emotion: CompanionMessage['emotion']; isDrawing: boolean; moodColor: string;
}) {
  return (
    <svg width="72" height="88" viewBox="0 0 72 88" fill="none"
      style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.28))', display: 'block' }}>
      <ellipse cx="36" cy="85" rx="20" ry="4" fill="rgba(0,0,0,0.14)" />
      <ellipse cx="14" cy="22" rx="9" ry="12" fill={moodColor} opacity="0.85" />
      <ellipse cx="14" cy="22" rx="5" ry="7" fill="rgba(255,255,255,0.3)" />
      <ellipse cx="58" cy="22" rx="9" ry="12" fill={moodColor} opacity="0.85" />
      <ellipse cx="58" cy="22" rx="5" ry="7" fill="rgba(255,255,255,0.3)" />
      <circle cx="36" cy="34" r="22" fill={moodColor} />
      <ellipse cx="36" cy="66" rx="22" ry="18" fill={moodColor} />
      <ellipse cx="36" cy="70" rx="14" ry="12" fill="rgba(255,255,255,0.25)" />
      {(emotion==='love'||emotion==='excited') && <>
        <ellipse cx="20" cy="38" rx="7" ry="4" fill="rgba(255,150,150,0.45)" />
        <ellipse cx="52" cy="38" rx="7" ry="4" fill="rgba(255,150,150,0.45)" />
      </>}
      {emotion==='love' ? <>
        <text x="24" y="38" fontSize="13" fill="#1a1a2e">♥</text>
        <text x="40" y="38" fontSize="13" fill="#1a1a2e">♥</text>
      </> : emotion==='thinking' ? <>
        <ellipse cx="28" cy="34" rx="5" ry="4" fill="#1a1a2e" />
        <ellipse cx="44" cy="34" rx="5" ry="4" fill="#1a1a2e" />
        <circle cx="30" cy="32" r="1.8" fill="rgba(255,255,255,0.7)" />
        <circle cx="46" cy="32" r="1.8" fill="rgba(255,255,255,0.7)" />
        <text x="50" y="26" fontSize="8" fill="#1a1a2e" opacity="0.7">...</text>
      </> : emotion==='excited' ? <>
        <text x="21" y="40" fontSize="14" fill="#1a1a2e">✦</text>
        <text x="38" y="40" fontSize="14" fill="#1a1a2e">✦</text>
      </> : <>
        <circle cx="28" cy="34" r="6" fill="white" />
        <circle cx="44" cy="34" r="6" fill="white" />
        <circle cx={emotion==='curious'?30:29} cy="34" r="3.5" fill="#1a1a2e" />
        <circle cx={emotion==='curious'?46:45} cy="34" r="3.5" fill="#1a1a2e" />
        <circle cx="30" cy="32" r="1.5" fill="white" />
        <circle cx="46" cy="32" r="1.5" fill="white" />
      </>}
      {emotion==='thinking' ? (
        <path d="M 28 44 Q 36 42 44 44" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" fill="none"/>
      ) : emotion==='excited' ? (
        <ellipse cx="36" cy="45" rx="7" ry="5" fill="#1a1a2e" opacity="0.8"/>
      ) : (
        <path d="M 26 43 Q 36 52 46 43" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      )}
      {isDrawing ? (
        <line x1="36" y1="78" x2="48" y2="88" stroke={moodColor} strokeWidth="6" strokeLinecap="round"/>
      ) : <>
        <line x1="14" y1="68" x2="8" y2="78" stroke={moodColor} strokeWidth="6" strokeLinecap="round"/>
        <line x1="58" y1="68" x2="64" y2="78" stroke={moodColor} strokeWidth="6" strokeLinecap="round"/>
      </>}
    </svg>
  );
}

interface Props {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  shapes: PlacedShape[];
  previewShape: PlacedShape | null;
  gestureState: GestureState;
  videoSize: { width: number; height: number };
  color: string;
  brushSize: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  eraserSize: number;
  shapeFilled: boolean;
  selectedShapeKind: ShapeKind | null;
  onColorChange: (c: string) => void;
  onBrushSizeChange: (s: number) => void;
  onStrokeStyleChange: (s: StrokeStyle) => void;
  onOpacityChange: (o: number) => void;
  onEraserSizeChange: (s: number) => void;
  onShapeFilledChange: (f: boolean) => void;
  onShapeSelect: (k: ShapeKind | null) => void;
  onClear: () => void;
  onUndo: () => void;
  onAddStroke: (s: Stroke) => void;
  onAddShape: (s: PlacedShape) => void;
  onRemoveStrokesByIds: (ids: Set<string>) => void;
  onDisplaySizeChange: (s: { width: number; height: number }) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  voiceEnabled?: boolean;
  voiceListening?: boolean;
  voiceLastCommand?: string | null;
  onVoiceToggle?: () => void;
  mood?: 'happy' | 'calm' | 'energetic' | 'creative';
}

const PIP_W = 72, PIP_H = 88;
const PTS_PER_TICK = 2;

export function CompanionTab({
  strokes, currentStroke, shapes, previewShape,
  gestureState, videoSize,
  color, brushSize, strokeStyle, opacity, eraserSize, shapeFilled, selectedShapeKind,
  onColorChange, onBrushSizeChange, onStrokeStyleChange, onOpacityChange,
  onEraserSizeChange, onShapeFilledChange, onShapeSelect,
  onClear, onUndo, onAddStroke, onAddShape, onRemoveStrokesByIds, onDisplaySizeChange,
  videoRef,
  voiceEnabled = false, voiceListening = false, voiceLastCommand = null, onVoiceToggle,
  mood = 'calm',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 });
  const canvasSizeRef = useRef(canvasSize); canvasSizeRef.current = canvasSize;

  const pipStrokeIdsRef = useRef<Set<string>>(new Set());
  const strokesRef = useRef(strokes); strokesRef.current = strokes;
  const shapesRef  = useRef(shapes);  shapesRef.current  = shapes;

  const [pipPos, setPipPos] = useState({ x: 120, y: 200 });
  const [pipEmotion, setPipEmotion] = useState<CompanionMessage['emotion']>('happy');
  const [pipIsDrawing, setPipIsDrawing] = useState(false);
  const [bubbleText, setBubbleText] = useState("hey 👋 I'm Pip!");
  const [showBubble, setShowBubble] = useState(true);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [companionStroke, setCompanionStroke] = useState<Stroke | null>(null);
  const strokeQueueRef  = useRef<Stroke[]>([]);
  const shapeQueueRef   = useRef<PlacedShape[]>([]);
  const pendingPtsRef   = useRef<{ x: number; y: number }[]>([]);
  const currentPtsRef   = useRef<{ x: number; y: number }[]>([]);
  const strokeMetaRef   = useRef<{ id: string; color: string; width: number } | null>(null);
  const busyRef         = useRef(false);

  const prevStrokeCountRef = useRef(0);
  const idleCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pip style + prompt state
  const [pipStyle, setPipStyle] = useState<PipStyle>('normal');
  const pipStyleRef = useRef<PipStyle>('normal');
  useEffect(() => { pipStyleRef.current = pipStyle; }, [pipStyle]);
  const [promptText, setPromptText] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);

  // Portrait sketch image (dataURL)
  const [portraitImage, setPortraitImage] = useState<string | null>(null);

  // ── Canvas measure ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const s = { width: Math.floor(r.width), height: Math.floor(r.height) };
      setCanvasSize(s);
      onDisplaySizeChange(s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onDisplaySizeChange]);

  const showPipSay = useCallback((msg: CompanionMessage, duration = 6000) => {
    setPipEmotion(msg.emotion);
    setBubbleText(msg.text);
    setShowBubble(true);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => setShowBubble(false), duration);
  }, []);

  const movePipTo = useCallback((cx: number, cy: number) => {
    const { width, height } = canvasSizeRef.current;
    const halfW = width / 2;
    const x = Math.max(10, Math.min(halfW - PIP_W - 10, cx - PIP_W / 2));
    const y = Math.max(10, Math.min(height - PIP_H - 10, cy - PIP_H - 10));
    setPipPos({ x, y });
  }, []);

  const enqueueStrokes = useCallback((ss: Stroke[]) => {
    const styled = applyPipStyle(ss, pipStyleRef.current);
    styled.forEach(s => pipStrokeIdsRef.current.add(s.id));
    strokeQueueRef.current.push(...styled);
    busyRef.current = true;
    setPipIsDrawing(true);
  }, []);

  const enqueueShapes = useCallback((ss: PlacedShape[]) => {
    shapeQueueRef.current.push(...ss);
    busyRef.current = true;
  }, []);

  const pipEraseSelf = useCallback(() => {
    const ids = new Set(pipStrokeIdsRef.current);
    if (ids.size === 0) return;
    onRemoveStrokesByIds(ids);
    pipStrokeIdsRef.current.clear();
  }, [onRemoveStrokesByIds]);

  const commitCurrentStroke = useCallback(() => {
    const meta = strokeMetaRef.current;
    const pts  = currentPtsRef.current;
    if (meta && pts.length >= 2) {
      onAddStroke({ id: meta.id, points: pts, color: meta.color, width: meta.width, offsetX: 0, offsetY: 0 });
    }
    strokeMetaRef.current = null;
    currentPtsRef.current = [];
    pendingPtsRef.current = [];
    setCompanionStroke(null);
  }, [onAddStroke]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (strokeMetaRef.current) {
        const batch = pendingPtsRef.current.splice(0, PTS_PER_TICK);
        if (!batch.length) { commitCurrentStroke(); return; }
        currentPtsRef.current = [...currentPtsRef.current, ...batch];
        const m = strokeMetaRef.current;
        setCompanionStroke({ id: m.id, points: currentPtsRef.current, color: m.color, width: m.width, offsetX: 0, offsetY: 0 });
        return;
      }
      const ns = strokeQueueRef.current.shift();
      if (ns) {
        strokeMetaRef.current = { id: ns.id, color: ns.color, width: ns.width };
        pendingPtsRef.current = [...ns.points];
        currentPtsRef.current = [];
        setCompanionStroke({ ...ns, points: [] });
        return;
      }
      const sh = shapeQueueRef.current.shift();
      if (sh) { onAddShape(sh); return; }
      if (busyRef.current) { busyRef.current = false; setPipIsDrawing(false); }
    }, 33);
    return () => clearInterval(tick);
  }, [commitCurrentStroke, onAddShape]);

  const drawAtPos = useCallback(async (cx: number, cy: number) => {
    const { width, height } = canvasSizeRef.current;
    const pipStrokes = strokesRef.current.filter(s => pipStrokeIdsRef.current.has(s.id));
    const spot = findPipSpot(pipStrokes, shapesRef.current, width / 2, height);
    if (spot.x > width / 2 - 80) {
      showPipSay({ text: "hmm getting crowded... let me clean up 🧹", emotion: 'thinking' }, 4000);
      await sleep(1200);
      pipEraseSelf();
      await sleep(500);
    }
    movePipTo(cx, cy);
    await sleep(900);
    const drawFn = pickRandomDraw();
    const result = drawFn(cx, cy);
    showPipSay(result.msg, 7000);
    if (result.strokes) enqueueStrokes(result.strokes);
    if (result.shapes) enqueueShapes(result.shapes);
  }, [movePipTo, showPipSay, enqueueStrokes, enqueueShapes, pipEraseSelf]);

  const performScript = useCallback(async (scriptIdx: number) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const actions = COMPANION_SCRIPTS[scriptIdx];
    const centroid = scriptCentroid(actions);
    const { width } = canvasSizeRef.current;
    const safeX = Math.min(centroid.x, width / 2 - 80);
    movePipTo(safeX, centroid.y);
    await sleep(700);
    for (const action of actions) {
      if (action.delay) await sleep(action.delay);
      if (action.message) showPipSay(action.message);
      if (action.strokes) { setPipIsDrawing(true); enqueueStrokes(action.strokes); }
      if (action.shapes) enqueueShapes(action.shapes);
    }
  }, [movePipTo, showPipSay, enqueueStrokes, enqueueShapes]);

  const performDraw = useCallback(async () => {
    if (busyRef.current) return;
    const { width, height } = canvasSizeRef.current;
    const pipStrokes = strokesRef.current.filter(s => pipStrokeIdsRef.current.has(s.id));
    const spot = findPipSpot(pipStrokes, shapesRef.current, width / 2, height);
    await drawAtPos(spot.x, spot.y);
  }, [drawAtPos]);

  // ── Prompt-to-Drawing ─────────────────────────────────────────────────────
  const handlePromptDraw = useCallback(async () => {
    if (!promptText.trim() || promptLoading || busyRef.current) return;
    setPromptLoading(true);
    const trimmed = promptText.trim();
    showPipSay({ text: `ooh "${trimmed}"? let me cook 🍳`, emotion: 'thinking' }, 5000);
    setPromptText('');
    try {
      const { width, height } = canvasSizeRef.current;
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, canvasWidth: width, canvasHeight: height }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        fallback?: boolean;
        pip_says?: string;
        pip_emotion?: string;
        elements?: Array<{ fn: string; cx: number; cy: number; size: number; color: string }>;
      };

      if (data.fallback) {
        showPipSay({ text: "AI is napping, drawing freestyle 🎨", emotion: 'thinking' }, 4000);
        setTimeout(() => performDraw(), 1500);
      } else {
        if (data.pip_says) {
          showPipSay({
            text: data.pip_says,
            emotion: (data.pip_emotion as CompanionMessage['emotion']) ?? 'excited',
          }, 8000);
        }
        movePipTo(width / 4, height / 2);
        await sleep(800);
        for (const el of (data.elements ?? [])) {
          const fn = DRAW_FN_MAP[el.fn];
          if (!fn) continue;
          const result = fn(el.cx, el.cy, el.size, el.color);
          if (Array.isArray(result) && result.length > 0) {
            if ('points' in result[0]) {
              enqueueStrokes(result as Stroke[]);
            } else {
              enqueueShapes(result as PlacedShape[]);
            }
          }
        }
      }
    } catch (err) {
      console.error('prompt draw error:', err);
      showPipSay({ text: "whoops, something glitched 💫 drawing freestyle!", emotion: 'happy' }, 4000);
      setTimeout(() => performDraw(), 1500);
    } finally {
      setPromptLoading(false);
    }
  }, [promptText, promptLoading, showPipSay, performDraw, movePipTo, enqueueStrokes, enqueueShapes]);

  // ── Portrait Mode ─────────────────────────────────────────────────────────
  const handlePortrait = useCallback(() => {
    if (!videoRef?.current || busyRef.current) return;
    showPipSay({ text: "okay I see you 👀 sketching your face...", emotion: 'thinking' }, 7000);
    movePipTo(canvasSizeRef.current.width * 0.1, canvasSizeRef.current.height * 0.5);
    const dataUrl = capturePortraitFilter(videoRef.current);
    if (!dataUrl) {
      showPipSay({ text: "step into the light! can't see ya 💡", emotion: 'curious' }, 4000);
      return;
    }
    setPortraitImage(dataUrl);
    // Auto-dismiss portrait after 15s
    setTimeout(() => setPortraitImage(null), 15000);
  }, [videoRef, showPipSay, movePipTo]);

  // ── Personality loop ──────────────────────────────────────────────────────
  useEffect(() => {
    let scriptIdx = -1;
    const intro = setTimeout(async () => {
      scriptIdx = 0;
      await performScript(0);
    }, 1400);
    const activityTimer = setInterval(async () => {
      if (busyRef.current) return;
      const roll = Math.random();
      if (roll < 0.2) showPipSay(pickRandom(IDLE_QUIPS));
      else if (roll < 0.38) showPipSay(pickRandom(QUESTION_QUIPS));
      else if (roll < 0.55) {
        const idx = getRandomScript(scriptIdx);
        scriptIdx = idx;
        await performScript(idx);
      } else await performDraw();
    }, 12000);
    return () => { clearTimeout(intro); clearInterval(activityTimer); };
  }, [showPipSay, performScript, performDraw]);

  // ── React to user strokes ─────────────────────────────────────────────────
  useEffect(() => {
    const count = strokes.length;
    if (count <= prevStrokeCountRef.current) { prevStrokeCountRef.current = count; return; }
    prevStrokeCountRef.current = count;

    const newest = strokes.filter(s => !pipStrokeIdsRef.current.has(s.id)).slice(-1)[0];
    if (newest && !busyRef.current && Math.random() < 0.5) {
      const kind = classifyUserStroke(newest.points);
      const reactions = STROKE_RECOGNITION_REACTIONS[kind] ?? REACTION_QUIPS;
      showPipSay(pickRandom(reactions), 5500);
    }

    if (idleCheckRef.current) clearTimeout(idleCheckRef.current);
    idleCheckRef.current = setTimeout(() => {
      if (busyRef.current) return;
      const userStrokes = strokesRef.current.filter(s => !pipStrokeIdsRef.current.has(s.id));
      const recent = userStrokes.slice(-5);
      const bbox = getStrokesBBox(recent);
      if (!bbox || bbox.w < 20) return;
      const ratio = bbox.w / (bbox.h || 1);
      const isHeartLike = ratio > 0.35 && ratio < 2.6 && bbox.w > 45 && bbox.h > 40;
      if (isHeartLike && Math.random() < 0.65) {
        showPipSay(pickRandom(HEART_DETECT_QUIPS), 7000);
        const cx = bbox.x + bbox.w / 2, cy = bbox.y + bbox.h / 2;
        movePipTo(Math.min(cx, canvasSizeRef.current.width / 2 - 80), cy);
        setTimeout(() => {
          const sparkCx = Math.min(cx, canvasSizeRef.current.width / 2 - 80);
          enqueueStrokes(makeSparkles(sparkCx, cy, Math.min(bbox.w, bbox.h) * 0.5 + 45));
          enqueueShapes(makeStarField(sparkCx, cy, 4));
        }, 2200);
      } else if (Math.random() < 0.45) {
        showPipSay(pickRandom(COMPLETION_QUIPS), 5000);
        setTimeout(() => performDraw(), 1800);
      }
    }, 3000);
  }, [strokes.length, showPipSay, movePipTo, enqueueStrokes, enqueueShapes, performDraw]);

  useEffect(() => {
    if (!busyRef.current) {
      const map: Record<string, CompanionMessage['emotion']> = {
        happy: 'love', calm: 'happy', energetic: 'excited', creative: 'curious',
      };
      setPipEmotion(map[mood] ?? 'happy');
    }
  }, [mood]);

  useEffect(() => {
    const wander = setInterval(() => {
      if (busyRef.current) return;
      const { width, height } = canvasSizeRef.current;
      const halfW = width / 2;
      setPipPos(prev => ({
        x: Math.max(10, Math.min(halfW - PIP_W - 10, prev.x + (Math.random() - 0.5) * 120)),
        y: Math.max(10, Math.min(height - PIP_H - 30, prev.y + (Math.random() - 0.5) * 80)),
      }));
    }, 7000 + Math.random() * 4000);
    return () => clearInterval(wander);
  }, []);

  const moodColor = MOOD_COLORS[mood] ?? '#818cf8';
  const totalCount = strokes.length + shapes.length;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Sidebar
        mode={gestureState.mode}
        strokeStyle={strokeStyle}
        color={color}
        brushSize={brushSize}
        opacity={opacity}
        eraserSize={eraserSize}
        shapeFilled={shapeFilled}
        selectedShape={selectedShapeKind}
        strokeCount={totalCount}
        onStrokeStyleChange={onStrokeStyleChange}
        onColorChange={onColorChange}
        onBrushSizeChange={onBrushSizeChange}
        onOpacityChange={onOpacityChange}
        onEraserSizeChange={onEraserSizeChange}
        onShapeFilledChange={onShapeFilledChange}
        onShapeSelect={onShapeSelect}
        onClear={() => {
          pipStrokeIdsRef.current.clear();
          setPortraitImage(null);
          onClear();
          showPipSay({ text: "clean slate!! let's go again 🎨", emotion: 'excited' });
        }}
        onUndo={onUndo}
        // Companion props
        moodColor={moodColor}
        mood={mood}
        voiceEnabled={voiceEnabled}
        voiceListening={voiceListening}
        voiceLastCommand={voiceLastCommand}
        onVoiceToggle={onVoiceToggle}
        pipStyle={pipStyle}
        onPipStyleChange={setPipStyle}
        onPortrait={videoRef ? handlePortrait : undefined}
        promptText={promptText}
        onPromptChange={setPromptText}
        onPromptDraw={handlePromptDraw}
        promptLoading={promptLoading}
      />

      {/* Canvas + Pip */}
      <div ref={containerRef} style={{
        flex: 1, position: 'relative',
        background: '#ffffff',
        borderRadius: 12, margin: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(0,0,0,0.18)',
      }}>
        <style>{`
          @keyframes pipWiggle { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
          @keyframes pipFloat  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-8px)} }
        `}</style>

        {/* Vertical divider */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: '50%', width: 1,
          background: 'rgba(0,0,0,0.06)',
          zIndex: 5, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 10, left: '25%',
          transform: 'translateX(-50%)',
          color: 'rgba(0,0,0,0.1)', fontFamily: 'monospace', fontSize: 10,
          letterSpacing: '0.15em', pointerEvents: 'none', userSelect: 'none', zIndex: 5,
        }}>PIP'S SIDE</div>
        <div style={{
          position: 'absolute', top: 10, left: '75%',
          transform: 'translateX(-50%)',
          color: 'rgba(0,0,0,0.1)', fontFamily: 'monospace', fontSize: 10,
          letterSpacing: '0.15em', pointerEvents: 'none', userSelect: 'none', zIndex: 5,
        }}>YOUR SIDE</div>

        {/* Portrait dismiss button */}
        {portraitImage && (
          <button
            onClick={() => setPortraitImage(null)}
            style={{
              position: 'absolute', top: 28, left: 10, zIndex: 40,
              padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)',
              background: 'rgba(255,255,255,0.8)', color: 'rgba(0,0,0,0.5)',
              fontFamily: 'monospace', fontSize: 10, cursor: 'pointer',
              backdropFilter: 'blur(6px)',
            }}
          >
            ✕ clear sketch
          </button>
        )}

        <CanvasOverlay
          strokes={strokes}
          currentStroke={currentStroke}
          shapes={shapes}
          previewShape={previewShape}
          gestureState={gestureState}
          width={canvasSize.width}
          height={canvasSize.height}
          videoSize={videoSize}
          companionStroke={companionStroke}
          portraitImage={portraitImage}
        />

        {/* Pip character */}
        <div
          style={{
            position: 'absolute',
            left: pipPos.x, top: pipPos.y,
            width: PIP_W, zIndex: 20, cursor: 'pointer',
            transition: 'left 2.4s cubic-bezier(0.25,0.46,0.45,0.94), top 2.4s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
          onClick={() => {
            if (busyRef.current) return;
            const clicks: CompanionMessage[] = [
              { text: "hey that tickles 😂 do it again", emotion: 'excited' },
              { text: "ouch!! kidding I love you 💕", emotion: 'love' },
              { text: "did you just click me?? okay then", emotion: 'curious' },
              { text: "I'm a blob of pure feelings and I felt that 😆", emotion: 'excited' },
              { text: "okay fine I'll draw something. happy? 😤", emotion: 'happy' },
            ];
            showPipSay(pickRandom(clicks), 5000);
            setTimeout(() => { if (!busyRef.current) performDraw(); }, 2800);
          }}
          title="Click Pip!"
        >
          <CloudBubble text={bubbleText} visible={showBubble} />
          <div style={{
            animation: pipIsDrawing
              ? 'pipWiggle 0.38s ease-in-out infinite'
              : 'pipFloat 3.5s ease-in-out infinite',
          }}>
            <PipCharacter emotion={pipEmotion} isDrawing={pipIsDrawing} moodColor={moodColor} />
          </div>
        </div>

        {/* Watermark */}
        <div style={{
          position: 'absolute', bottom: 12, right: 14,
          color: 'rgba(0,0,0,0.06)', fontFamily: 'monospace',
          fontSize: 11, letterSpacing: '0.2em', pointerEvents: 'none', userSelect: 'none',
        }}>
          AIR CANVAS
        </div>
      </div>
    </div>
  );
}
