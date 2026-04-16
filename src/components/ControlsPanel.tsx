import type { GestureMode } from '../types/hand';

interface Props {
  mode: GestureMode;
  color: string;
  brushSize: number;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onUndo: () => void;
  strokeCount: number;
  dark?: boolean;
}

const MODE_CONFIG: Record<GestureMode, { label: string; color: string; icon: string }> = {
  idle:          { label: 'Tracking',  color: '#64748b', icon: '◉' },
  drawing:       { label: 'Drawing',   color: '#22c55e', icon: '✏' },
  grabbing:      { label: 'Grabbing',  color: '#f59e0b', icon: '⊕' },
  erasing:       { label: 'Erasing',   color: '#ef4444', icon: '◌' },
  shape_placing: { label: 'Shape',     color: '#818cf8', icon: '◻' },
  shape_resize:  { label: 'Resizing',  color: '#c084fc', icon: '⤢' },
};

const PALETTE = [
  '#ffffff', '#22c55e', '#3b82f6', '#f59e0b',
  '#ef4444', '#a855f7', '#ec4899', '#06b6d4',
];

export function ControlsPanel({
  mode,
  color,
  brushSize,
  onColorChange,
  onBrushSizeChange,
  onClear,
  onUndo,
  strokeCount,
  dark = true,
}: Props) {
  const modeInfo = MODE_CONFIG[mode];
  const bg = dark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)';
  const border = dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)';
  const textMuted = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const textNormal = dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        userSelect: 'none',
      }}
    >
      {/* Mode indicator */}
      <div
        style={{
          background: bg,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${modeInfo.color}44`,
          borderRadius: 12,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 140,
          boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <span style={{ fontSize: 18, color: modeInfo.color }}>{modeInfo.icon}</span>
        <span
          style={{
            color: modeInfo.color,
            fontFamily: 'monospace',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {modeInfo.label}
        </span>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: modeInfo.color,
            boxShadow: `0 0 8px ${modeInfo.color}`,
            marginLeft: 'auto',
            animation: mode !== 'idle' ? 'pulse 1.5s infinite' : 'none',
          }}
        />
      </div>

      {/* Controls panel */}
      <div
        style={{
          background: bg,
          backdropFilter: 'blur(12px)',
          border,
          borderRadius: 12,
          boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.08)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Color palette */}
        <div>
          <div style={{ color: textMuted, fontSize: 10, letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'monospace' }}>
            COLOR
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 180 }}>
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: color === c ? `0 0 8px ${c}` : 'none',
                  transition: 'box-shadow 0.15s, border 0.15s',
                }}
              />
            ))}
            {/* Custom color input */}
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                padding: 0,
                background: 'none',
              }}
              title="Custom color"
            />
          </div>
        </div>

        {/* Brush size */}
        <div>
          <div style={{ color: textMuted, fontSize: 10, letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'monospace' }}>
            BRUSH SIZE — {brushSize}px
          </div>
          <input
            type="range"
            min={2}
            max={30}
            value={brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onUndo}
            disabled={strokeCount === 0}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: 8,
              border: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.12)',
              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: strokeCount === 0 ? (dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)') : textNormal,
              cursor: strokeCount === 0 ? 'default' : 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
              letterSpacing: '0.05em',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (strokeCount > 0) (e.target as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
            }}
          >
            UNDO
          </button>
          <button
            onClick={onClear}
            disabled={strokeCount === 0}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.08)',
              color: strokeCount === 0 ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.8)',
              cursor: strokeCount === 0 ? 'default' : 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
              letterSpacing: '0.05em',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (strokeCount > 0) (e.target as HTMLElement).style.background = 'rgba(239,68,68,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
            }}
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Gesture guide */}
      <div
        style={{
          background: dark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ color: textMuted, fontSize: 10, letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'monospace' }}>
          GESTURES
        </div>
        {[
          { icon: '☝', text: 'Index finger → Draw' },
          { icon: '🤌', text: 'Pinch → Move stroke' },
          { icon: '✋', text: 'Open palm → Erase' },
          { icon: '◻', text: 'Select shape → Place' },
          { icon: '🤏', text: 'Both pinch → Resize' },
        ].map(({ icon, text }) => (
          <div
            key={text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 5,
              color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              fontSize: 11,
              fontFamily: 'monospace',
            }}
          >
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
