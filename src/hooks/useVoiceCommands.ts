import { useEffect, useRef, useCallback, useState } from 'react';
import type { StrokeStyle } from '../types/stroke';

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', yellow: '#eab308',
  green: '#22c55e', teal: '#14b8a6', cyan: '#06b6d4',
  blue: '#3b82f6', indigo: '#818cf8', purple: '#8b5cf6',
  violet: '#a78bfa', pink: '#ec4899', coral: '#f87171',
  white: '#ffffff', black: '#1a1a2e',
};

const STYLE_MAP: Record<string, StrokeStyle> = {
  marker: 'marker', neon: 'neon', rainbow: 'rainbow',
  spray: 'spray', dashed: 'dashed', dash: 'dashed', pen: 'pen',
};

interface Props {
  enabled: boolean;
  currentBrushSize: number;
  onColorChange: (c: string) => void;
  onBrushSizeChange: (s: number) => void;
  onStrokeStyleChange: (s: StrokeStyle) => void;
  onClear: () => void;
  onUndo: () => void;
}

export function useVoiceCommands({
  enabled, currentBrushSize,
  onColorChange, onBrushSizeChange, onStrokeStyleChange, onClear, onUndo,
}: Props) {
  const [listening, setListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const brushRef = useRef(currentBrushSize);
  brushRef.current = currentBrushSize;
  const callbacksRef = useRef({ onColorChange, onBrushSizeChange, onStrokeStyleChange, onClear, onUndo });
  callbacksRef.current = { onColorChange, onBrushSizeChange, onStrokeStyleChange, onClear, onUndo };

  const processCommand = useCallback((raw: string) => {
    const t = raw.toLowerCase().trim();

    for (const [name, hex] of Object.entries(COLOR_MAP)) {
      if (t.includes(name)) {
        callbacksRef.current.onColorChange(hex);
        setLastCommand(`color → ${name}`);
        return;
      }
    }

    for (const [word, style] of Object.entries(STYLE_MAP)) {
      if (t.includes(word)) {
        callbacksRef.current.onStrokeStyleChange(style);
        setLastCommand(`style → ${style}`);
        return;
      }
    }

    if (t.includes('bigger') || t.includes('larger') || t.includes('thicker') || t.includes('increase')) {
      callbacksRef.current.onBrushSizeChange(Math.min(40, brushRef.current + 6));
      setLastCommand('brush bigger');
      return;
    }
    if (t.includes('smaller') || t.includes('thinner') || t.includes('decrease')) {
      callbacksRef.current.onBrushSizeChange(Math.max(1, brushRef.current - 6));
      setLastCommand('brush smaller');
      return;
    }
    if (t.includes('undo') || t.includes('go back')) {
      callbacksRef.current.onUndo();
      setLastCommand('undo');
      return;
    }
    if (t.includes('clear') || t.includes('reset') || t.includes('start over')) {
      callbacksRef.current.onClear();
      setLastCommand('clear canvas');
      return;
    }

    setLastCommand(null);
  }, []);

  useEffect(() => {
    const SR = (window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      ?? (window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR || !enabled) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recog = new (SR as any)();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onresult = (e: any) => {
      const transcript: string = e.results[e.results.length - 1][0].transcript;
      processCommand(transcript);
      // Clear after 2s
      setTimeout(() => setLastCommand(null), 2000);
    };
    recog.onstart = () => setListening(true);
    recog.onend = () => {
      setListening(false);
      if (enabled) setTimeout(() => { try { recog.start(); } catch { /* restarted */ } }, 800);
    };
    recog.onerror = () => { setListening(false); };

    try { recog.start(); } catch { /* already started */ }
    return () => { try { recog.stop(); } catch { /* stopping */ } };
  }, [enabled, processCommand]);

  return { listening, lastCommand };
}
