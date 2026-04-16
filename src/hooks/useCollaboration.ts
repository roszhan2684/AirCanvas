import { useRef, useState, useCallback, useEffect } from 'react';
import type { Stroke } from '../types/stroke';
import type { PlacedShape } from '../types/shape';

type CollabMsg =
  | { type: 'stroke_add'; stroke: Stroke }
  | { type: 'stroke_update'; stroke: Stroke }
  | { type: 'shape_add'; shape: PlacedShape }
  | { type: 'shape_update'; shape: PlacedShape }
  | { type: 'clear' }
  | { type: 'cursor'; x: number; y: number; name: string };

export type CollabStatus = 'idle' | 'hosting' | 'joining' | 'connected' | 'error';

interface Props {
  onRemoteStroke: (s: Stroke) => void;
  onRemoteShape: (s: PlacedShape) => void;
  onRemoteClear: () => void;
  onRemoteCursor: (x: number, y: number, name: string) => void;
}

export function useCollaboration({ onRemoteStroke, onRemoteShape, onRemoteClear, onRemoteCursor }: Props) {
  const peerRef = useRef<import('peerjs').Peer | null>(null);
  const connRef = useRef<import('peerjs').DataConnection | null>(null);
  const [status, setStatus] = useState<CollabStatus>('idle');
  const [roomCode, setRoomCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [peerName] = useState(() => `user_${Math.random().toString(36).slice(2, 6)}`);

  const cleanRoomCode = (code: string) =>
    code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const send = useCallback((msg: CollabMsg) => {
    try { connRef.current?.send(msg); } catch { /* ignore */ }
  }, []);

  const handleData = useCallback((data: unknown) => {
    const msg = data as CollabMsg;
    if (msg.type === 'stroke_add' || msg.type === 'stroke_update') onRemoteStroke(msg.stroke);
    if (msg.type === 'shape_add' || msg.type === 'shape_update') onRemoteShape(msg.shape);
    if (msg.type === 'clear') onRemoteClear();
    if (msg.type === 'cursor') onRemoteCursor(msg.x, msg.y, msg.name);
  }, [onRemoteStroke, onRemoteShape, onRemoteClear, onRemoteCursor]);

  const createRoom = useCallback(async () => {
    const code = generateCode();
    setRoomCode(code);
    setStatus('hosting');
    setError('');

    const { Peer } = await import('peerjs');
    const peer = new Peer(`aircanvas-${code}`, {
      host: '0.peerjs.com', port: 443, path: '/', secure: true,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    });
    peerRef.current = peer;

    peer.on('open', () => setStatus('hosting'));
    peer.on('connection', (conn) => {
      connRef.current = conn;
      conn.on('data', handleData);
      conn.on('open', () => setStatus('connected'));
      conn.on('close', () => setStatus('hosting'));
    });
    peer.on('error', (e) => { setError(e.message); setStatus('error'); });
  }, [handleData]);

  const joinRoom = useCallback(async (code: string) => {
    const clean = cleanRoomCode(code);
    if (clean.length !== 6) { setError('Enter a valid 6-character room code'); return; }
    setStatus('joining');
    setError('');

    const { Peer } = await import('peerjs');
    const peer = new Peer({ host: '0.peerjs.com', port: 443, path: '/', secure: true });
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(`aircanvas-${clean}`);
      connRef.current = conn;
      conn.on('data', handleData);
      conn.on('open', () => { setStatus('connected'); setRoomCode(clean); });
      conn.on('close', () => setStatus('idle'));
      conn.on('error', (e: Error) => { setError(e.message); setStatus('error'); });
    });
    peer.on('error', (e) => { setError(e.message); setStatus('error'); });
  }, [handleData]);

  const disconnect = useCallback(() => {
    connRef.current?.close();
    peerRef.current?.destroy();
    connRef.current = null;
    peerRef.current = null;
    setStatus('idle');
    setRoomCode('');
    setError('');
  }, []);

  useEffect(() => () => { peerRef.current?.destroy(); }, []);

  return { status, roomCode, error, peerName, send, createRoom, joinRoom, disconnect };
}
