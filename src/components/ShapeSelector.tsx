import type { ShapeKind } from '../types/shape';

interface Props {
  selectedShape: ShapeKind | null;
  onSelect: (kind: ShapeKind | null) => void;
  color: string;
  dark?: boolean;
}

const SHAPES: { kind: ShapeKind; label: string }[] = [
  { kind: 'rectangle', label: '▭' },
  { kind: 'circle',    label: '○' },
  { kind: 'triangle',  label: '△' },
  { kind: 'star',      label: '✦' },
];

export function ShapeSelector({ selectedShape, onSelect, color, dark = true }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        background: dark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: 12,
        padding: '8px 12px',
        alignItems: 'center',
        boxShadow: dark ? 'none' : '0 2px 16px rgba(0,0,0,0.12)',
      }}
    >
      <span
        style={{
          color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: '0.1em',
          marginRight: 4,
        }}
      >
        SHAPES
      </span>
      {SHAPES.map(({ kind, label }) => {
        const active = selectedShape === kind;
        return (
          <button
            key={kind}
            onClick={() => onSelect(active ? null : kind)}
            title={kind}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: active ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.12)',
              background: active ? `${color}22` : 'rgba(255,255,255,0.05)',
              color: active ? color : 'rgba(255,255,255,0.6)',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: active ? `0 0 10px ${color}55` : 'none',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
