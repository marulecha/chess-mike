import type { Color, Promotion } from '../types/chess';

const OPTIONS: { piece: Promotion; label: string }[] = [
  { piece: 'q', label: 'Queen' },
  { piece: 'r', label: 'Rook' },
  { piece: 'b', label: 'Bishop' },
  { piece: 'n', label: 'Knight' },
];

export function PromotionPicker({
  color, onSelect, onCancel,
}: { color: Color; onSelect: (p: Promotion) => void; onCancel: () => void }) {
  return (
    <div
      data-testid="promotion-backdrop"
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="bg-imperial-crimson border-2 border-imperial-gold rounded-sm shadow-imperial p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-imperial-gold text-xl mb-4 text-center">Promote to</h3>
        <div className="flex gap-3">
          {OPTIONS.map((o) => (
            <button
              key={o.piece}
              aria-label={o.label}
              onClick={() => onSelect(o.piece)}
              className="w-20 h-20 bg-imperial-cream rounded-sm hover:shadow-gold-glow"
            >
              <img src={`/pieces/${color}${o.piece.toUpperCase()}.svg`} alt={o.label} className="w-full h-full" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
