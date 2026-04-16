import type { GestureMode } from '../types/hand';
import type { StrokeStyle } from '../types/stroke';
import type { ShapeKind } from '../types/shape';
import type { PipStyle } from '../lib/pipStyles';
import { PIP_STYLE_LABELS } from '../lib/pipStyles';

const MODE_CONFIG: Record<GestureMode, { label: string; color: string; icon: string }> = {
  idle:          { label: 'Tracking',  color: '#64748b', icon: '◉' },
  drawing:       { label: 'Drawing',   color: '#22c55e', icon: '✏' },
  grabbing:      { label: 'Grabbing',  color: '#f59e0b', icon: '⊕' },
  erasing:       { label: 'Erasing',   color: '#ef4444', icon: '✌' },
  shape_placing: { label: 'Shape',     color: '#818cf8', icon: '◻' },
  shape_resize:  { label: 'Resizing',  color: '#c084fc', icon: '⤢' },
};

const TOOLS: { style: StrokeStyle; icon: string; label: string }[] = [
  { style: 'pen',     icon: '✏',  label: 'Pen'      },
  { style: 'marker',  icon: '▬',  label: 'Marker'   },
  { style: 'neon',    icon: '✦',  label: 'Neon'     },
  { style: 'rainbow', icon: '🌈', label: 'Rainbow'  },
  { style: 'spray',   icon: '💨', label: 'Spray'    },
  { style: 'dashed',  icon: '- -', label: 'Dashed'  },
];

const SHAPES: { kind: ShapeKind; icon: string }[] = [
  { kind: 'rectangle', icon: '▭' },
  { kind: 'circle',    icon: '○' },
  { kind: 'triangle',  icon: '△' },
  { kind: 'star',      icon: '✦' },
  { kind: 'heart',     icon: '♥' },
  { kind: 'arrow',     icon: '→' },
  { kind: 'diamond',   icon: '◆' },
  { kind: 'hexagon',   icon: '⬡' },
];

const PALETTE = [
  '#1a1a2e', '#000000', '#ffffff', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  '#a78bfa', '#f9a8d4', '#bbf7d0', '#fef08a',
];

interface SidebarProps {
  mode: GestureMode;
  strokeStyle: StrokeStyle;
  color: string;
  brushSize: number;
  opacity: number;
  eraserSize: number;
  shapeFilled: boolean;
  selectedShape: ShapeKind | null;
  strokeCount: number;
  onStrokeStyleChange: (s: StrokeStyle) => void;
  onColorChange: (c: string) => void;
  onBrushSizeChange: (s: number) => void;
  onOpacityChange: (o: number) => void;
  onEraserSizeChange: (s: number) => void;
  onShapeFilledChange: (f: boolean) => void;
  onShapeSelect: (k: ShapeKind | null) => void;
  onClear: () => void;
  onUndo: () => void;

  // Companion-specific (optional — only shown in Companion tab)
  pipStyle?: PipStyle;
  onPipStyleChange?: (s: PipStyle) => void;
  onPortrait?: () => void;
  promptText?: string;
  onPromptChange?: (t: string) => void;
  onPromptDraw?: () => void;
  promptLoading?: boolean;
  moodColor?: string;
  mood?: string;
  voiceEnabled?: boolean;
  voiceListening?: boolean;
  onVoiceToggle?: () => void;
  voiceLastCommand?: string | null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace',
      letterSpacing: '0.12em', marginTop: 12, marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

export function Sidebar({
  mode, strokeStyle, color, brushSize, opacity, eraserSize,
  shapeFilled, selectedShape, strokeCount,
  onStrokeStyleChange, onColorChange, onBrushSizeChange,
  onOpacityChange, onEraserSizeChange, onShapeFilledChange,
  onShapeSelect, onClear, onUndo,
  // companion
  pipStyle, onPipStyleChange, onPortrait,
  promptText, onPromptChange, onPromptDraw, promptLoading,
  moodColor = '#818cf8', mood,
  voiceEnabled, voiceListening, onVoiceToggle, voiceLastCommand,
}: SidebarProps) {
  const modeInfo = MODE_CONFIG[mode];
  const isCompanion = !!onPipStyleChange;

  return (
    <div style={{
      width: 196,
      height: '100%',
      background: '#111118',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
      flexShrink: 0,
      padding: '10px 12px 20px',
      userSelect: 'none',
    }}>

      {/* ── Mode indicator ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: `${modeInfo.color}18`,
        border: `1px solid ${modeInfo.color}44`,
        borderRadius: 8, padding: '8px 10px',
      }}>
        <span style={{ fontSize: 14, color: modeInfo.color }}>{modeInfo.icon}</span>
        <span style={{ color: modeInfo.color, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', flex: 1 }}>
          {modeInfo.label.toUpperCase()}
        </span>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: modeInfo.color,
          boxShadow: mode !== 'idle' ? `0 0 6px ${modeInfo.color}` : 'none',
          animation: mode !== 'idle' ? 'pulse 1.5s infinite' : 'none',
        }} />
      </div>

      {/* ── Companion: Mood + Voice ─────────────────────────── */}
      {isCompanion && (
        <>
          {mood && (
            <div style={{
              marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 8,
              background: `${moodColor}14`, border: `1px solid ${moodColor}33`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: moodColor, boxShadow: `0 0 5px ${moodColor}`, flexShrink: 0 }} />
              <span style={{ color: moodColor, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em' }}>
                {mood.toUpperCase()} VIBE
              </span>
            </div>
          )}
          {onVoiceToggle && (
            <button
              onClick={onVoiceToggle}
              style={{
                marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                border: voiceEnabled ? `1.5px solid ${moodColor}66` : '1.5px solid rgba(255,255,255,0.08)',
                background: voiceEnabled ? `${moodColor}18` : 'rgba(255,255,255,0.04)',
                color: voiceEnabled ? moodColor : 'rgba(255,255,255,0.4)',
                fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.06em',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 13 }}>🎤</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{voiceEnabled ? 'VOICE ON' : 'VOICE OFF'}</span>
              {voiceEnabled && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: voiceListening ? moodColor : `${moodColor}44`,
                  boxShadow: voiceListening ? `0 0 5px ${moodColor}` : 'none',
                }} />
              )}
            </button>
          )}
          {voiceLastCommand && (
            <div style={{
              marginTop: 4, padding: '5px 10px', borderRadius: 7,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              color: 'rgba(34,197,94,0.8)', fontFamily: 'monospace', fontSize: 10,
            }}>
              ✓ {voiceLastCommand}
            </div>
          )}
        </>
      )}

      {/* ── Tools ──────────────────────────────────────────── */}
      <SectionLabel>TOOL</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
        {TOOLS.map(t => {
          const active = strokeStyle === t.style;
          return (
            <button
              key={t.style}
              onClick={() => onStrokeStyleChange(t.style)}
              title={t.label}
              style={{
                padding: '7px 4px',
                borderRadius: 7,
                border: active ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.08)',
                background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                color: active ? color : 'rgba(255,255,255,0.55)',
                fontSize: t.icon.length > 2 ? 10 : 16,
                fontFamily: 'monospace',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                boxShadow: active ? `0 0 8px ${color}44` : 'none',
                transition: 'all 0.15s',
              }}
            >
              <span>{t.icon}</span>
              <span style={{ fontSize: 8, opacity: 0.7 }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Shapes ─────────────────────────────────────────── */}
      <SectionLabel>SHAPE</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {SHAPES.map(s => {
          const active = selectedShape === s.kind;
          return (
            <button
              key={s.kind}
              onClick={() => onShapeSelect(active ? null : s.kind)}
              title={s.kind}
              style={{
                aspectRatio: '1',
                borderRadius: 7,
                border: active ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.08)',
                background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                color: active ? color : 'rgba(255,255,255,0.5)',
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? `0 0 8px ${color}44` : 'none',
                transition: 'all 0.15s',
                padding: 0,
              }}
            >
              {s.icon}
            </button>
          );
        })}
      </div>

      {/* Fill toggle */}
      <div style={{ marginTop: 6 }}>
        <button
          onClick={() => onShapeFilledChange(!shapeFilled)}
          style={{
            width: '100%', padding: '6px 0',
            borderRadius: 7,
            border: shapeFilled ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.08)',
            background: shapeFilled ? `${color}22` : 'rgba(255,255,255,0.04)',
            color: shapeFilled ? color : 'rgba(255,255,255,0.4)',
            fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {shapeFilled ? '◼ FILLED' : '◻ OUTLINE'}
        </button>
      </div>

      {/* ── Colors ─────────────────────────────────────────── */}
      <SectionLabel>COLOR</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
        {PALETTE.map(c => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            title={c}
            style={{
              aspectRatio: '1',
              borderRadius: '50%',
              background: c,
              border: color === c ? '2.5px solid white' : '2px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              padding: 0,
              boxShadow: color === c ? `0 0 10px ${c}` : 'none',
              transition: 'all 0.12s',
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={color}
          onChange={e => onColorChange(e.target.value)}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            cursor: 'pointer', padding: 0, background: 'none',
          }}
          title="Custom color"
        />
        <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 10 }}>
          {color}
        </span>
      </div>

      {/* ── Brush size ─────────────────────────────────────── */}
      <SectionLabel>BRUSH — {brushSize}px</SectionLabel>
      <input
        type="range" min={1} max={40} value={brushSize}
        onChange={e => onBrushSizeChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
      />

      {/* ── Opacity ────────────────────────────────────────── */}
      <SectionLabel>OPACITY — {Math.round(opacity * 100)}%</SectionLabel>
      <input
        type="range" min={5} max={100} value={Math.round(opacity * 100)}
        onChange={e => onOpacityChange(Number(e.target.value) / 100)}
        style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
      />

      {/* ── Eraser size ────────────────────────────────────── */}
      <SectionLabel>ERASER — {eraserSize}px ✌</SectionLabel>
      <input
        type="range" min={10} max={120} value={eraserSize}
        onChange={e => onEraserSizeChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
      />

      {/* ── Actions ────────────────────────────────────────── */}
      <SectionLabel>ACTIONS</SectionLabel>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onUndo}
          disabled={strokeCount === 0}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            color: strokeCount === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
            fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.05em',
            cursor: strokeCount === 0 ? 'default' : 'pointer', transition: 'background 0.15s',
          }}
        >
          UNDO
        </button>
        <button
          onClick={onClear}
          disabled={strokeCount === 0}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 7,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.07)',
            color: strokeCount === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.85)',
            fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.05em',
            cursor: strokeCount === 0 ? 'default' : 'pointer', transition: 'background 0.15s',
          }}
        >
          CLEAR
        </button>
      </div>

      {/* ── Companion: Pip Style ─────────────────────────── */}
      {isCompanion && pipStyle !== undefined && onPipStyleChange && (
        <>
          <SectionLabel>PIP STYLE</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            {(Object.entries(PIP_STYLE_LABELS) as [PipStyle, { label: string; icon: string; tip: string }][]).map(([key, val]) => (
              <button
                key={key}
                title={val.tip}
                onClick={() => onPipStyleChange(key)}
                style={{
                  padding: '7px 4px', borderRadius: 7,
                  border: pipStyle === key ? `1.5px solid ${moodColor}` : '1.5px solid rgba(255,255,255,0.08)',
                  background: pipStyle === key ? `${moodColor}22` : 'rgba(255,255,255,0.04)',
                  color: pipStyle === key ? moodColor : 'rgba(255,255,255,0.5)',
                  fontSize: 14, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  boxShadow: pipStyle === key ? `0 0 8px ${moodColor}44` : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span>{val.icon}</span>
                <span style={{ fontSize: 8, opacity: 0.7, fontFamily: 'monospace' }}>{val.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Companion: Portrait ──────────────────────────── */}
      {isCompanion && onPortrait && (
        <>
          <SectionLabel>PORTRAIT</SectionLabel>
          <button
            onClick={onPortrait}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 8,
              border: `1px solid ${moodColor}44`,
              background: `${moodColor}12`,
              color: moodColor,
              fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.06em',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>📷</span> SKETCH ME
          </button>
          <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace', textAlign: 'center' }}>
            applies pencil sketch filter
          </div>
        </>
      )}

      {/* ── Companion: Prompt to Drawing ─────────────────── */}
      {isCompanion && onPromptDraw && (
        <>
          <SectionLabel>AI DRAW</SectionLabel>
          <input
            value={promptText ?? ''}
            onChange={e => onPromptChange?.(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onPromptDraw?.()}
            placeholder="draw a dragon..."
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 7, boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)', fontSize: 11,
              fontFamily: 'system-ui,sans-serif',
              outline: 'none',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = moodColor + '88')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <button
            onClick={onPromptDraw}
            disabled={!promptText?.trim() || promptLoading}
            style={{
              marginTop: 6, width: '100%', padding: '9px 0', borderRadius: 8, border: 'none',
              background: promptText?.trim() && !promptLoading ? moodColor : 'rgba(255,255,255,0.06)',
              color: promptText?.trim() && !promptLoading ? '#fff' : 'rgba(255,255,255,0.2)',
              fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              cursor: promptText?.trim() && !promptLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: promptText?.trim() && !promptLoading ? `0 2px 12px ${moodColor}44` : 'none',
              opacity: promptLoading ? 0.5 : 1,
            }}
          >
            {promptLoading ? 'THINKING...' : 'DRAW IT ✦'}
          </button>
        </>
      )}

      {/* ── Gesture guide ──────────────────────────────────── */}
      <SectionLabel>GESTURES</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          ['☝', 'Index → Draw'],
          ['🤌', 'Pinch → Move'],
          ['✌', '2 Fingers → Erase'],
          ['🤏', 'Both Pinch → Resize'],
        ].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13 }}>{icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace', fontSize: 10 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
