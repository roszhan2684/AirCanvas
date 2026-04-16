import { useCallback, useRef, useState, useEffect } from 'react';
import { useCamera } from './hooks/useCamera';
import { useHandTracking } from './hooks/useHandTracking';
import { useGestureState } from './hooks/useGestureState';
import { useDrawingState } from './hooks/useDrawingState';
import { useCollaboration } from './hooks/useCollaboration';
import { useVoiceCommands } from './hooks/useVoiceCommands';
import { TabBar, type Tab } from './components/layout/TabBar';
import { CameraPip } from './components/layout/CameraPip';
import { CanvasTab } from './components/tabs/CanvasTab';
import { CollabTab } from './components/tabs/CollabTab';
import { CompanionTab } from './components/tabs/CompanionTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import type { Landmark } from './types/hand';
import type { Stroke } from './types/stroke';
import type { PlacedShape } from './types/shape';

const CURSOR_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fb923c', '#60a5fa'];

// Simple mood heuristic: analyze drawing patterns
function computeMood(strokes: Stroke[]): 'happy' | 'calm' | 'energetic' | 'creative' {
  if (strokes.length === 0) return 'calm';
  const recentColors = strokes.slice(-8).map(s => s.color);
  const warmCount = recentColors.filter(c =>
    ['#ef4444','#f97316','#eab308','#ec4899','#f87171'].some(w => c === w)
  ).length;
  const avgWidth = strokes.slice(-5).reduce((a, s) => a + s.width, 0) / Math.min(5, strokes.length);
  if (strokes.length > 15 && avgWidth > 8) return 'energetic';
  if (warmCount > 3) return 'happy';
  if (strokes.length > 8) return 'creative';
  return 'calm';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('canvas');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [mood, setMood] = useState<'happy' | 'calm' | 'energetic' | 'creative'>('calm');

  const { videoRef, videoReady, videoSize, error: cameraError } = useCamera();

  const displaySizeRef = useRef<{ width: number; height: number }>({ width: 900, height: 600 });
  const [landmarksAll, setLandmarksAll] = useState<Landmark[][] | null>(null);

  // Remote cursors for live collab
  const [remoteCursors, setRemoteCursors] = useState<{ x: number; y: number; name: string; color: string }[]>([]);

  // Stable refs so collab callbacks don't stale-close
  const addStrokeRef = useRef<(s: Stroke) => void>(() => {});
  const addShapeRef  = useRef<(s: PlacedShape) => void>(() => {});
  const clearRef     = useRef<() => void>(() => {});
  const sendRef      = useRef<((msg: Parameters<ReturnType<typeof useCollaboration>['send']>[0]) => void)>(() => {});

  const onRemoteStroke = useCallback((s: Stroke) => addStrokeRef.current(s), []);
  const onRemoteShape  = useCallback((s: PlacedShape) => addShapeRef.current(s), []);
  const onRemoteClear  = useCallback(() => clearRef.current(), []);
  const onRemoteCursor = useCallback((x: number, y: number, name: string) => {
    setRemoteCursors(prev => {
      const color = CURSOR_COLORS[Math.abs(name.split('').reduce((a,c) => a + c.charCodeAt(0), 0)) % CURSOR_COLORS.length];
      const idx = prev.findIndex(c => c.name === name);
      const next = [...prev];
      if (idx >= 0) next[idx] = { x, y, name, color };
      else next.push({ x, y, name, color });
      return next;
    });
  }, []);

  const collab = useCollaboration({ onRemoteStroke, onRemoteShape, onRemoteClear, onRemoteCursor });
  sendRef.current = collab.send;

  // Wire collab → drawing with local broadcast
  const drawingState = useDrawingState({
    onLocalStroke: (s) => sendRef.current({ type: 'stroke_add', stroke: s }),
    onLocalShape:  (s) => sendRef.current({ type: 'shape_add', shape: s }),
  });

  addStrokeRef.current = drawingState.addStroke;
  addShapeRef.current  = drawingState.addShape;
  clearRef.current     = drawingState.clear;

  const { gestureState, processLandmarks } = useGestureState(videoSize);

  const handleResults = useCallback(
    (all: Landmark[][] | null) => {
      setLandmarksAll(all);
      processLandmarks(all, drawingState.selectedShapeKind !== null);
    },
    [processLandmarks, drawingState.selectedShapeKind]
  );

  const { trackingReady } = useHandTracking({ videoRef, videoReady, onResults: handleResults });

  // Broadcast live cursor position when drawing
  useEffect(() => {
    if (collab.status !== 'connected') return;
    if (gestureState.mode === 'drawing' && gestureState.indexTip) {
      const { width: vw, height: vh } = videoSize;
      const { width: dw, height: dh } = displaySizeRef.current;
      const va = vw/vh, ca = dw/dh;
      let scale: number, ox = 0, oy = 0;
      if (va > ca) { scale = dh/vh; ox = (dw - vw*scale)/2; }
      else          { scale = dw/vw; oy = (dh - vh*scale)/2; }
      const x = gestureState.indexTip.x * scale + ox;
      const y = gestureState.indexTip.y * scale + oy;
      sendRef.current({ type: 'cursor', x, y, name: collab.peerName });
    }
  }, [gestureState, videoSize, collab.status, collab.peerName]);

  // Voice commands
  const voiceActive = voiceEnabled && (activeTab === 'canvas' || activeTab === 'companion');
  const { listening: voiceListening, lastCommand: voiceLastCommand } = useVoiceCommands({
    enabled: voiceActive,
    currentBrushSize: drawingState.brushSize,
    onColorChange: drawingState.setColor,
    onBrushSizeChange: drawingState.setBrushSize,
    onStrokeStyleChange: drawingState.setStrokeStyle,
    onClear: drawingState.clear,
    onUndo: drawingState.undo,
  });

  // Mood analysis — update every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setMood(computeMood(drawingState.strokes));
    }, 5000);
    return () => clearInterval(t);
  }, [drawingState.strokes]);

  // Feed gesture into drawing state
  const prevGestureRef = useRef(gestureState);
  if (prevGestureRef.current !== gestureState) {
    prevGestureRef.current = gestureState;
    if (activeTab === 'canvas' || activeTab === 'companion') {
      drawingState.processGesture(gestureState, videoSize, displaySizeRef.current);
    }
  }

  const sharedCanvasProps = {
    strokes: drawingState.strokes,
    currentStroke: drawingState.currentStroke,
    shapes: drawingState.shapes,
    previewShape: drawingState.previewShape,
    gestureState,
    videoSize,
    color: drawingState.color,
    brushSize: drawingState.brushSize,
    strokeStyle: drawingState.strokeStyle,
    opacity: drawingState.opacity,
    eraserSize: drawingState.eraserSize,
    shapeFilled: drawingState.shapeFilled,
    selectedShapeKind: drawingState.selectedShapeKind,
    onColorChange: drawingState.setColor,
    onBrushSizeChange: drawingState.setBrushSize,
    onStrokeStyleChange: drawingState.setStrokeStyle,
    onOpacityChange: drawingState.setOpacity,
    onEraserSizeChange: drawingState.setEraserSize,
    onShapeFilledChange: drawingState.setShapeFilled,
    onShapeSelect: drawingState.setSelectedShapeKind,
    onClear: drawingState.clear,
    onUndo: drawingState.undo,
    onDisplaySizeChange: (s: { width: number; height: number }) => { displaySizeRef.current = s; },
  };

  // Theme accent color based on mood
  const moodAccent = { happy:'#f472b6', calm:'#818cf8', energetic:'#f97316', creative:'#22c55e' }[mood];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0a0a0f',
      overflow: 'hidden',
      fontFamily: 'monospace',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; }
        input[type=range] { cursor: pointer; }
        input[type=color] { -webkit-appearance: none; border: none; }
        input[type=color]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type=color]::-webkit-color-swatch { border: none; border-radius: 50%; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      `}</style>

      <TabBar active={activeTab} onChange={setActiveTab} moodAccent={moodAccent} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', paddingTop: 52 }}>
        {cameraError && activeTab === 'canvas' && (
          <div style={{
            position: 'absolute', inset: 0, top: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444', fontFamily: 'monospace', fontSize: 13,
            textAlign: 'center', padding: 32, zIndex: 5,
          }}>
            {cameraError}
          </div>
        )}

        {activeTab === 'canvas' && (
          <CanvasTab
            {...sharedCanvasProps}
            remoteCursors={remoteCursors}
            voiceEnabled={voiceEnabled}
            voiceListening={voiceListening}
            voiceLastCommand={voiceLastCommand}
            onVoiceToggle={() => setVoiceEnabled(v => !v)}
          />
        )}

        {activeTab === 'collab' && (
          <CollabTab
            status={collab.status}
            roomCode={collab.roomCode}
            error={collab.error}
            peerName={collab.peerName}
            onCreateRoom={collab.createRoom}
            onJoinRoom={collab.joinRoom}
            onDisconnect={collab.disconnect}
          />
        )}

        {activeTab === 'companion' && (
          <CompanionTab
            {...sharedCanvasProps}
            onAddStroke={drawingState.addStroke}
            onAddShape={drawingState.addShape}
            onRemoveStrokesByIds={drawingState.removeStrokesByIds}
            videoRef={videoRef}
            voiceEnabled={voiceEnabled}
            voiceListening={voiceListening}
            voiceLastCommand={voiceLastCommand}
            onVoiceToggle={() => setVoiceEnabled(v => !v)}
            mood={mood}
          />
        )}

        {activeTab === 'settings' && <SettingsTab />}
      </div>

      <CameraPip
        videoRef={videoRef}
        landmarksAll={landmarksAll}
        videoSize={videoSize}
        trackingReady={trackingReady}
      />
    </div>
  );
}
