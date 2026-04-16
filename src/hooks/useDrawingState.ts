import { useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Stroke, StrokeStyle } from '../types/stroke';
import type { PlacedShape, ShapeKind } from '../types/shape';
import type { GestureState } from '../types/hand';
import { findNearestStroke, eraseStrokePoints, translateStroke } from '../lib/strokeUtils';
import { findNearestShape } from '../lib/shapeUtils';
import { distance } from '../lib/geometry';

const MIN_DRAW_DISTANCE = 3;
const DEFAULT_SHAPE_SIZE = 70;

export interface DrawingCallbacks {
  onLocalStroke?: (stroke: Stroke) => void;
  onLocalShape?: (shape: PlacedShape) => void;
}

export function useDrawingState(callbacks?: DrawingCallbacks) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [shapes, setShapes] = useState<PlacedShape[]>([]);
  const [previewShape, setPreviewShape] = useState<PlacedShape | null>(null);
  const [selectedShapeKind, setSelectedShapeKind] = useState<ShapeKind | null>(null);
  const [color, setColor] = useState('#1a1a2e');
  const [brushSize, setBrushSize] = useState(4);
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>('pen');
  const [opacity, setOpacity] = useState(1);
  const [shapeFilled, setShapeFilled] = useState(false);
  const [eraserSize, setEraserSize] = useState(40);

  const strokesRef = useRef(strokes); strokesRef.current = strokes;
  const currentStrokeRef = useRef(currentStroke); currentStrokeRef.current = currentStroke;
  const colorRef = useRef(color); colorRef.current = color;
  const brushSizeRef = useRef(brushSize); brushSizeRef.current = brushSize;
  const strokeStyleRef = useRef(strokeStyle); strokeStyleRef.current = strokeStyle;
  const opacityRef = useRef(opacity); opacityRef.current = opacity;
  const shapeFilledRef = useRef(shapeFilled); shapeFilledRef.current = shapeFilled;
  const eraserSizeRef = useRef(eraserSize); eraserSizeRef.current = eraserSize;
  const selectedShapeKindRef = useRef(selectedShapeKind); selectedShapeKindRef.current = selectedShapeKind;
  const shapesRef = useRef(shapes); shapesRef.current = shapes;

  // Stable ref for callbacks so processGesture doesn't recreate on every render
  const cbRef = useRef(callbacks); cbRef.current = callbacks;

  const grabbedIdRef = useRef<string | null>(null);
  const lastPinchPosRef = useRef<{ x: number; y: number } | null>(null);
  const resizingIdRef = useRef<string | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const prevGestureRef = useRef<GestureState | null>(null);

  const processGesture = useCallback((
    curr: GestureState,
    videoSize: { width: number; height: number },
    displaySize: { width: number; height: number }
  ) => {
    const prev = prevGestureRef.current;
    prevGestureRef.current = curr;
    if (!prev) return;

    const mode = curr.mode, prevMode = prev.mode;

    const s2d = (p: { x: number; y: number }) => {
      const { width: vw, height: vh } = videoSize;
      const { width: dw, height: dh } = displaySize;
      const va = vw / vh, ca = dw / dh;
      let scale: number, ox = 0, oy = 0;
      if (va > ca) { scale = dh / vh; ox = (dw - vw * scale) / 2; }
      else          { scale = dw / vw; oy = (dh - vh * scale) / 2; }
      return { x: p.x * scale + ox, y: p.y * scale + oy };
    };

    // ── DRAWING ──────────────────────────────────────────────────────────
    if (mode === 'drawing' && curr.indexTip) {
      const dp = s2d(curr.indexTip);
      if (prevMode !== 'drawing' || !currentStrokeRef.current) {
        setCurrentStroke({
          id: uuidv4(), points: [dp],
          color: colorRef.current, width: brushSizeRef.current,
          style: strokeStyleRef.current, opacity: opacityRef.current,
          offsetX: 0, offsetY: 0,
        });
      } else {
        const cs = currentStrokeRef.current;
        const last = cs.points[cs.points.length - 1];
        if (distance(last, dp) >= MIN_DRAW_DISTANCE) {
          setCurrentStroke({ ...cs, points: [...cs.points, dp] });
        }
      }
    } else if (prevMode === 'drawing' && mode !== 'drawing') {
      const cs = currentStrokeRef.current;
      if (cs && cs.points.length >= 2) {
        setStrokes(prev => [...prev, cs]);
        cbRef.current?.onLocalStroke?.(cs);
      }
      setCurrentStroke(null);
    }

    // ── SHAPE PLACING ─────────────────────────────────────────────────────
    if (mode === 'shape_placing' && curr.indexTip && selectedShapeKindRef.current) {
      const dp = s2d(curr.indexTip);
      setPreviewShape({
        id: '__preview__', kind: selectedShapeKindRef.current,
        cx: dp.x, cy: dp.y, size: DEFAULT_SHAPE_SIZE,
        color: colorRef.current, lineWidth: brushSizeRef.current,
        filled: shapeFilledRef.current, opacity: opacityRef.current,
      });
    } else if (prevMode === 'shape_placing' && mode !== 'shape_placing') {
      setPreviewShape(null);
      if (mode === 'grabbing' && prev.indexTip && selectedShapeKindRef.current) {
        const dp = s2d(prev.indexTip);
        const newShape: PlacedShape = {
          id: uuidv4(), kind: selectedShapeKindRef.current!,
          cx: dp.x, cy: dp.y, size: DEFAULT_SHAPE_SIZE,
          color: colorRef.current, lineWidth: brushSizeRef.current,
          filled: shapeFilledRef.current, opacity: opacityRef.current,
        };
        setShapes(prev => [...prev, newShape]);
        cbRef.current?.onLocalShape?.(newShape);
      }
    }

    // ── GRABBING ──────────────────────────────────────────────────────────
    if (mode === 'grabbing' && !curr.bothPinchDistance && curr.pinchCenter) {
      const dp = s2d(curr.pinchCenter);
      if (prevMode !== 'grabbing') {
        const ns = findNearestShape(shapesRef.current, dp);
        if (ns) { grabbedIdRef.current = `shape:${ns.id}`; }
        else { const st = findNearestStroke(strokesRef.current, dp); grabbedIdRef.current = st?.id ?? null; }
        lastPinchPosRef.current = dp;
      } else if (grabbedIdRef.current && lastPinchPosRef.current) {
        const dx = dp.x - lastPinchPosRef.current.x;
        const dy = dp.y - lastPinchPosRef.current.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          if (grabbedIdRef.current.startsWith('shape:')) {
            const sid = grabbedIdRef.current.slice(6);
            setShapes(p => p.map(s => s.id === sid ? { ...s, cx: s.cx + dx, cy: s.cy + dy } : s));
          } else {
            const id = grabbedIdRef.current;
            setStrokes(p => p.map(s => s.id === id ? translateStroke(s, dx, dy) : s));
          }
          lastPinchPosRef.current = dp;
        }
      }
    } else if (prevMode === 'grabbing' && mode !== 'grabbing' && mode !== 'shape_resize') {
      if (grabbedIdRef.current && !grabbedIdRef.current.startsWith('shape:')) {
        const id = grabbedIdRef.current;
        setStrokes(p => p.map(s => {
          if (s.id !== id || (s.offsetX === 0 && s.offsetY === 0)) return s;
          return {
            ...s,
            points: s.points.map(pt => ({ x: pt.x + s.offsetX, y: pt.y + s.offsetY })),
            offsetX: 0, offsetY: 0,
          };
        }));
      }
      grabbedIdRef.current = null;
      lastPinchPosRef.current = null;
    }

    // ── TWO-HAND RESIZE ───────────────────────────────────────────────────
    if (mode === 'shape_resize' && curr.bothPinchDistance !== null && curr.pinchCenter) {
      const { width: vw, height: vh } = videoSize;
      const { width: dw, height: dh } = displaySize;
      const scale = (vw / vh > dw / dh) ? dh / vh : dw / vw;
      const displayDist = curr.bothPinchDistance * scale;

      if (prevMode !== 'shape_resize') {
        const dp = s2d(curr.pinchCenter);
        const ns = findNearestShape(shapesRef.current, dp);
        if (ns) { resizingIdRef.current = `shape:${ns.id}`; }
        else { const st = findNearestStroke(strokesRef.current, dp); resizingIdRef.current = st ? `stroke:${st.id}` : null; }
        lastPinchDistRef.current = displayDist;
      } else if (resizingIdRef.current && lastPinchDistRef.current !== null) {
        const ratio = displayDist / Math.max(lastPinchDistRef.current, 1);
        if (Math.abs(ratio - 1) > 0.01) {
          if (resizingIdRef.current.startsWith('shape:')) {
            const sid = resizingIdRef.current.slice(6);
            setShapes(p => p.map(s => s.id === sid ? { ...s, size: Math.max(12, Math.min(600, s.size * ratio)) } : s));
          } else if (resizingIdRef.current.startsWith('stroke:')) {
            const sid = resizingIdRef.current.slice(7);
            const dp = s2d(curr.pinchCenter!);
            setStrokes(p => p.map(s => {
              if (s.id !== sid) return s;
              return {
                ...s,
                points: s.points.map(pt => ({
                  x: dp.x + (pt.x + s.offsetX - dp.x) * ratio,
                  y: dp.y + (pt.y + s.offsetY - dp.y) * ratio,
                })),
                offsetX: 0, offsetY: 0,
                width: Math.max(1, s.width * ratio),
              };
            }));
          }
          lastPinchDistRef.current = displayDist;
        }
      }
    } else if (prevMode === 'shape_resize' && mode !== 'shape_resize') {
      resizingIdRef.current = null; lastPinchDistRef.current = null;
    }

    // ── ERASING ───────────────────────────────────────────────────────────
    if (mode === 'erasing' && curr.palmCenter) {
      const dp = s2d(curr.palmCenter);
      const r = eraserSizeRef.current;
      setStrokes(p => eraseStrokePoints(p, dp, r));
      setShapes(p => p.filter(s => distance(dp, { x: s.cx, y: s.cy }) > s.size * 0.55));
    }
  }, []);

  const clear = useCallback(() => {
    setStrokes([]); setCurrentStroke(null); setShapes([]); setPreviewShape(null);
  }, []);

  const undo = useCallback(() => {
    if (shapesRef.current.length > 0) setShapes(p => p.slice(0, -1));
    else setStrokes(p => p.slice(0, -1));
  }, []);

  const addStroke = useCallback((s: Stroke) => setStrokes(p => [...p, s]), []);
  const addShape  = useCallback((s: PlacedShape) => setShapes(p => [...p, s]), []);
  const removeStrokesByIds = useCallback((ids: Set<string>) =>
    setStrokes(p => p.filter(s => !ids.has(s.id))), []);
  const replaceAll = useCallback((s: Stroke[], sh: PlacedShape[]) => { setStrokes(s); setShapes(sh); }, []);

  return {
    strokes, currentStroke, shapes, previewShape,
    selectedShapeKind, setSelectedShapeKind,
    color, setColor,
    brushSize, setBrushSize,
    strokeStyle, setStrokeStyle,
    opacity, setOpacity,
    shapeFilled, setShapeFilled,
    eraserSize, setEraserSize,
    processGesture, clear, undo, addStroke, addShape, removeStrokesByIds, replaceAll,
  };
}
