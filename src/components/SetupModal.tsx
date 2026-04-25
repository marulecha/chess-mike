import { useState } from 'react';
import type { GameSettings } from '../types/chess';
import { OnlineSubForm } from './OnlineSubForm';

type Props = {
  initial: GameSettings;
  aiAvailable: boolean;
  onConfirm: (s: GameSettings) => void;
  onClose: () => void;
};

const TIME_OPTIONS: { label: string; value: GameSettings['timeControl'] }[] = [
  { label: 'No clock',   value: null },
  { label: '3 + 0',      value: { initialMs: 3 * 60_000, incrementMs: 0 } },
  { label: '5 + 0',      value: { initialMs: 5 * 60_000, incrementMs: 0 } },
  { label: '10 + 5',     value: { initialMs: 10 * 60_000, incrementMs: 5_000 } },
];

export function SetupModal({ initial, aiAvailable, onConfirm, onClose }: Props) {
  const [s, setS] = useState<GameSettings>({ ...initial, mode: aiAvailable ? initial.mode : 'human-vs-human' });

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-imperial-crimson border-2 border-imperial-gold rounded-sm shadow-imperial p-6 w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-imperial-gold text-2xl mb-4">Prepare for Battle</h2>

        <fieldset className="mb-4">
          <legend className="font-display text-imperial-gold/80 mb-2">Opponent</legend>
          <label className="block">
            <input
              type="radio"
              name="mode"
              checked={s.mode === 'human-vs-ai'}
              disabled={!aiAvailable}
              onChange={() => setS({ ...s, mode: 'human-vs-ai' })}
            /> Vs Michalis (AI)
          </label>
          <label className="block">
            <input
              type="radio"
              name="mode"
              checked={s.mode === 'human-vs-human'}
              onChange={() => setS({ ...s, mode: 'human-vs-human' })}
            /> Two Players
          </label>
          <label className="block">
            <input
              type="radio"
              name="mode"
              checked={s.mode === 'two-players-online'}
              onChange={() => setS({ ...s, mode: 'two-players-online' })}
            /> Two Players Online
          </label>
        </fieldset>

        {s.mode === 'human-vs-ai' && (
          <fieldset className="mb-4">
            <legend className="font-display text-imperial-gold/80 mb-2">Difficulty</legend>
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <label key={d} className="block">
                <input
                  type="radio"
                  name="diff"
                  checked={s.aiDifficulty === d}
                  onChange={() => setS({ ...s, aiDifficulty: d })}
                /> {d.charAt(0).toUpperCase() + d.slice(1)}
              </label>
            ))}
          </fieldset>
        )}

        {s.mode === 'human-vs-ai' && (
          <fieldset className="mb-4">
            <legend className="font-display text-imperial-gold/80 mb-2">Play as</legend>
            {(['white', 'black'] as const).map((c) => (
              <label key={c} className="capitalize mr-4">
                <input
                  type="radio"
                  name="color"
                  checked={s.playerColor === c}
                  onChange={() => setS({ ...s, playerColor: c, boardOrientation: c })}
                /> {c}
              </label>
            ))}
          </fieldset>
        )}

        {s.mode !== 'two-players-online' && (
          <fieldset className="mb-4">
            <legend className="font-display text-imperial-gold/80 mb-2">Time control</legend>
            <select
              className="bg-imperial-cream text-imperial-ink rounded-sm px-2 py-1"
              value={JSON.stringify(s.timeControl)}
              onChange={(e) => setS({ ...s, timeControl: JSON.parse(e.target.value) })}
            >
              {TIME_OPTIONS.map((o) => (
                <option key={o.label} value={JSON.stringify(o.value)}>{o.label}</option>
              ))}
            </select>
          </fieldset>
        )}

        {s.mode === 'two-players-online' && (
          <OnlineSubForm
            onConfirm={(online, derived) => {
              onConfirm({ ...s, ...derived, online, mode: 'two-players-online' });
            }}
          />
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="font-display text-imperial-cream/80 px-3 py-2"
          >Cancel</button>
          {s.mode !== 'two-players-online' && (
            <button
              onClick={() => onConfirm(s)}
              className="font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-2"
            >Begin the Duel</button>
          )}
        </div>
      </div>
    </div>
  );
}
