import { useRef, useEffect, useState } from 'react';
import { CanvasOverlay } from '../CanvasOverlay';
import { Sidebar } from '../Sidebar';
import type { GestureState } from '../../types/hand';
import type { StrokeStyle } from '../../types/stroke';
import type { Stroke } from '../../types/stroke';
import type { PlacedShape, ShapeKind } from '../../types/shape';

interface RemoteCursor { x: number; y: number; name: string; color: string; }

interface Props {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  shapes: PlacedShape[];
  previewShape: PlacedShape | null;
  gestureState: GestureState;
  videoSize: { width: number; height: number };
  // sidebar state
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
  onDisplaySizeChange: (s: { width: number; height: number }) => void;
  remoteCursors?: RemoteCursor[];
  voiceEnabled?: boolean;
  voiceListening?: boolean;
  voiceLastCommand?: string | null;
  onVoiceToggle?: () => void;
}

export function CanvasTab({
  strokes, currentStroke, shapes, previewShape,
  gestureState, videoSize,
  color, brushSize, strokeStyle, opacity, eraserSize, shapeFilled, selectedShapeKind,
  onColorChange, onBrushSizeChange, onStrokeStyleChange, onOpacityChange,
  onEraserSizeChange, onShapeFilledChange, onShapeSelect,
  onClear, onUndo, onDisplaySizeChange,
  remoteCursors, voiceEnabled, voiceListening, voiceLastCommand, onVoiceToggle,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 });

  useEffect(() => {
    const el = canvasRef.current;
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

  const totalCount = strokes.length + shapes.length;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Left sidebar */}
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
        onClear={onClear}
        onUndo={onUndo}
      />

      {/* White canvas area */}
      <div
        ref={canvasRef}
        style={{
          flex: 1,
          position: 'relative',
          background: '#ffffff',
          margin: '8px 8px 8px 0',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 20px rgba(0,0,0,0.18)',
        }}
      >
        <CanvasOverlay
          strokes={strokes}
          currentStroke={currentStroke}
          shapes={shapes}
          previewShape={previewShape}
          gestureState={gestureState}
          width={canvasSize.width}
          height={canvasSize.height}
          videoSize={videoSize}
          remoteCursors={remoteCursors}
        />
        {/* Voice toggle button + status */}
        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button
            onClick={onVoiceToggle}
            title={voiceEnabled ? 'Turn off voice commands' : 'Turn on voice commands'}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
              border: voiceEnabled ? '1.5px solid rgba(129,140,248,0.55)' : '1.5px solid rgba(255,255,255,0.12)',
              background: voiceEnabled ? 'rgba(129,140,248,0.15)' : 'rgba(0,0,0,0.25)',
              backdropFilter: 'blur(8px)',
              color: voiceEnabled ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
              fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.05em',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 14 }}>🎤</span>
            {voiceEnabled ? 'VOICE ON' : 'VOICE OFF'}
            {voiceEnabled && (
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: voiceListening ? '#818cf8' : 'rgba(129,140,248,0.3)',
                boxShadow: voiceListening ? '0 0 6px #818cf8' : 'none',
                animation: voiceListening ? 'pulse 1.2s infinite' : 'none',
              }} />
            )}
          </button>
          {voiceLastCommand && (
            <div style={{
              padding: '5px 12px', borderRadius: 14,
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)',
              color: 'rgba(34,197,94,0.9)', fontFamily: 'monospace', fontSize: 11,
              backdropFilter: 'blur(8px)',
            }}>
              ✓ {voiceLastCommand}
            </div>
          )}
        </div>
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
