import { useState } from 'react';
import type { GameSettings, OnlineConfig } from '../types/chess';
import type { TimeControl } from '../game/online/protocol';
import { generateCode, normalizeCode, isValidCode, formatCode } from '../game/online/code';

type Mode = 'choose' | 'host' | 'join';

const TIME_OPTIONS: { label: string; value: TimeControl | null }[] = [
  { label: 'No clock', value: null },
  { label: '3 + 0',    value: { initialMs: 3 * 60_000, incrementMs: 0 } },
  { label: '5 + 0',    value: { initialMs: 5 * 60_000, incrementMs: 0 } },
  { label: '10 + 5',   value: { initialMs: 10 * 60_000, incrementMs: 5_000 } },
];

export function OnlineSubForm({
  onConfirm,
}: {
  onConfirm: (online: OnlineConfig, derivedSettings: Partial<GameSettings>) => void;
}) {
  const [mode, setMode] = useState<Mode>('choose');

  if (mode === 'choose') {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => setMode('host')}
          className="flex-1 font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-3"
        >Host a Party</button>
        <button
          onClick={() => setMode('join')}
          className="flex-1 font-display text-imperial-cream border border-imperial-gold bg-imperial-crimson hover:shadow-gold-glow rounded-sm px-4 py-3"
        >Join a Party</button>
      </div>
    );
  }

  if (mode === 'host') return <HostCard onConfirm={onConfirm} />;
  return <JoinCard onConfirm={onConfirm} />;
}

function HostCard({
  onConfirm,
}: {
  onConfirm: (online: OnlineConfig, derivedSettings: Partial<GameSettings>) => void;
}) {
  const [color, setColor] = useState<'white' | 'black' | 'random'>('white');
  const [tc, setTc] = useState<TimeControl | null>(null);
  const [code] = useState<string>(() => generateCode());

  return (
    <div className="space-y-3">
      <div>
        <span className="font-display text-imperial-gold/80 mr-2">Color:</span>
        {(['white', 'black', 'random'] as const).map((c) => (
          <label key={c} className="capitalize mr-3">
            <input type="radio" name="online-color" checked={color === c} onChange={() => setColor(c)} /> {c}
          </label>
        ))}
      </div>
      <div>
        <span className="font-display text-imperial-gold/80 mr-2">Time:</span>
        <select
          className="bg-imperial-cream text-imperial-ink rounded-sm px-2 py-1"
          value={JSON.stringify(tc)}
          onChange={(e) => setTc(JSON.parse(e.target.value))}
        >
          {TIME_OPTIONS.map((o) => (
            <option key={o.label} value={JSON.stringify(o.value)}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <span className="font-display text-imperial-gold/80 mr-2">Code:</span>
        <code data-testid="host-code" className="font-mono text-imperial-cream text-xl tracking-widest">{formatCode(code)}</code>
        <button
          onClick={() => navigator.clipboard?.writeText(formatCode(code))}
          className="ml-3 text-imperial-cream/80 underline text-sm"
        >Copy</button>
      </div>
      <button
        onClick={() => onConfirm(
          { role: 'host', code, hostInit: { color, timeControl: tc } },
          { timeControl: tc, boardOrientation: color === 'black' ? 'black' : 'white' },
        )}
        className="font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-2"
      >Open Party</button>
      <p className="text-imperial-cream/60 text-sm italic">Share the code with your opponent.</p>
    </div>
  );
}

function JoinCard({
  onConfirm,
}: {
  onConfirm: (online: OnlineConfig, derivedSettings: Partial<GameSettings>) => void;
}) {
  const [raw, setRaw] = useState('');
  const normalized = normalizeCode(raw);
  const valid = isValidCode(normalized);

  return (
    <div className="space-y-3">
      <div>
        <span className="font-display text-imperial-gold/80 mr-2">Code:</span>
        <input
          aria-label="party code"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="XXX-XXX"
          className="bg-imperial-cream text-imperial-ink font-mono px-2 py-1 rounded-sm tracking-widest"
        />
      </div>
      <button
        disabled={!valid}
        onClick={() => onConfirm({ role: 'join', code: normalized }, {})}
        className="font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >Connect</button>
    </div>
  );
}
