export type Tab = 'canvas' | 'collab' | 'companion' | 'settings';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  moodAccent?: string;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'canvas',    label: 'Canvas',      icon: '✏' },
  { id: 'collab',    label: 'Collaborate', icon: '⟡' },
  { id: 'companion', label: 'Companion',   icon: '✦' },
  { id: 'settings',  label: 'Settings',   icon: '⚙' },
];

export function TabBar({ active, onChange, moodAccent = '#818cf8' }: Props) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      height: 52,
      background: 'rgba(15,15,20,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${moodAccent}44`,
      display: 'flex', alignItems: 'center',
      padding: '0 20px',
      gap: 4,
      transition: 'border-color 1.2s ease',
    }}>
      {/* Logo — subtle mood glow */}
      <span style={{
        fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.2em',
        color: 'rgba(255,255,255,0.9)', marginRight: 24, fontWeight: 600,
        textShadow: `0 0 18px ${moodAccent}55`,
        transition: 'text-shadow 1.2s ease',
      }}>
        AIR CANVAS
      </span>

      {TABS.map(({ id, label, icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: isActive ? `1px solid ${moodAccent}66` : '1px solid transparent',
              background: isActive ? `${moodAccent}18` : 'transparent',
              color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
              fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.06em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
          >
            <span style={{ fontSize: 14 }}>{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
