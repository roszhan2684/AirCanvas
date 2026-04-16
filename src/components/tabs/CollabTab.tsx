import { useState } from 'react';
import type { CollabStatus } from '../../hooks/useCollaboration';

interface Props {
  status: CollabStatus;
  roomCode: string;
  error: string;
  peerName: string;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onDisconnect: () => void;
}

export function CollabTab({ status, roomCode, error, peerName, onCreateRoom, onJoinRoom, onDisconnect }: Props) {
  const [joinCode, setJoinCode] = useState('');

  const pill = (label: string, color: string) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: `${color}18`, border: `1px solid ${color}44`,
      borderRadius: 20, padding: '4px 12px',
      color, fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.06em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  );

  const STATUS_LABEL: Record<CollabStatus, React.ReactNode> = {
    idle:      pill('NOT CONNECTED', '#64748b'),
    hosting:   pill('HOSTING — WAITING FOR PEER', '#f59e0b'),
    joining:   pill('JOINING...', '#818cf8'),
    connected: pill('CONNECTED', '#22c55e'),
    error:     pill('ERROR', '#ef4444'),
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 40, gap: 32,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⟡</div>
        <h2 style={{ color: '#fff', fontFamily: 'monospace', fontSize: 22, letterSpacing: '0.1em', margin: 0, marginBottom: 8 }}>
          COLLABORATE
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', fontSize: 13, margin: 0 }}>
          Draw together in real time. Share a room code with a friend — both of you draw on the same whiteboard.
        </p>
      </div>

      {/* Status */}
      <div>{STATUS_LABEL[status]}</div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '10px 18px',
          color: '#ef4444', fontFamily: 'monospace', fontSize: 12,
        }}>
          {error}
        </div>
      )}

      {status === 'idle' || status === 'error' ? (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Create room */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '28px 32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            minWidth: 220,
          }}>
            <div style={{ fontSize: 28 }}>🏠</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', fontSize: 14, fontWeight: 600, letterSpacing: '0.08em' }}>
              HOST A ROOM
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 11, textAlign: 'center' }}>
              Get a code and share it with your drawing partner
            </div>
            <button onClick={onCreateRoom} style={btnStyle('#818cf8')}>
              Create Room
            </button>
          </div>

          {/* Join room */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '28px 32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            minWidth: 220,
          }}>
            <div style={{ fontSize: 28 }}>🚪</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', fontSize: 14, fontWeight: 600, letterSpacing: '0.08em' }}>
              JOIN A ROOM
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 11, textAlign: 'center' }}>
              Enter the code your friend shared with you
            </div>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              onKeyDown={e => { if (e.key === 'Enter' && joinCode.length === 6) onJoinRoom(joinCode); }}
              placeholder="XXXXXX"
              maxLength={6}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, padding: '10px 14px',
                color: '#fff', fontFamily: 'monospace', fontSize: 18,
                letterSpacing: '0.3em', textAlign: 'center', width: '100%',
                outline: 'none',
              }}
            />
            <button
              onClick={() => onJoinRoom(joinCode)}
              disabled={joinCode.length !== 6}
              style={btnStyle('#22c55e', joinCode.length !== 6)}
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          {/* Room code display */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16, padding: '28px 40px', textAlign: 'center',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.12em', marginBottom: 12 }}>
              ROOM CODE
            </div>
            <div style={{
              color: '#fff', fontFamily: 'monospace', fontSize: 36, letterSpacing: '0.4em',
              fontWeight: 700, textShadow: '0 0 20px rgba(129,140,248,0.5)',
            }}>
              {roomCode}
            </div>
            {status === 'hosting' && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 11, marginTop: 12 }}>
                Share this code with your drawing partner
              </div>
            )}
            {status === 'connected' && (
              <div style={{ color: '#22c55e', fontFamily: 'monospace', fontSize: 12, marginTop: 12 }}>
                ✓ Drawing together now! Switch to the Canvas tab.
              </div>
            )}
          </div>

          <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 11 }}>
            Your ID: {peerName}
          </div>

          <button onClick={onDisconnect} style={btnStyle('#ef4444')}>
            Disconnect
          </button>
        </div>
      )}

      {/* How it works */}
      {(status === 'idle' || status === 'error') && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '18px 24px', maxWidth: 460,
        }}>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', marginBottom: 10 }}>
            HOW IT WORKS
          </div>
          {[
            '🔗 Peer-to-peer — no server stores your drawings',
            '✏ Both users draw and see changes in real time',
            '🌍 Works across devices and browsers',
            '🔒 Room codes are temporary and session-only',
          ].map(t => (
            <div key={t} style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', fontSize: 12, marginBottom: 7 }}>{t}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function btnStyle(accent: string, disabled = false): React.CSSProperties {
  return {
    padding: '10px 24px',
    borderRadius: 8,
    border: `1px solid ${accent}66`,
    background: disabled ? 'rgba(255,255,255,0.04)' : `${accent}22`,
    color: disabled ? 'rgba(255,255,255,0.25)' : accent,
    fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.06em',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background 0.15s',
    opacity: disabled ? 0.5 : 1,
  };
}
