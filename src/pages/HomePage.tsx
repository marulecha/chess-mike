import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main data-testid="home-page" className="min-h-screen relative overflow-hidden">
      <DamaskBackground />
      <div className="relative z-10 mx-auto max-w-6xl grid md:grid-cols-2 items-center min-h-screen px-8 gap-8">
        <section className="text-center md:text-left">
          <h1
            aria-label="Michalis Chess Master"
            className="font-display text-imperial-gold text-5xl md:text-7xl tracking-wide mb-4"
          >
            <span className="block">Michalis</span>
            <span className="block">Chess Master</span>
          </h1>
          <p className="font-body text-imperial-cream/90 text-xl mb-8 italic">
            Challenge the Emperor of the 64 Squares.
          </p>
          <Link
            to="/play"
            className="inline-block font-display text-imperial-cream text-xl border-2 border-imperial-gold bg-imperial-burgundy/80 px-8 py-3 rounded-sm shadow-imperial hover:shadow-gold-glow transition"
          >
            Begin the Duel
          </Link>
        </section>
        <section className="flex justify-center">
          <div className="rounded-full p-2 bg-imperial-gold shadow-imperial">
            <div className="rounded-full overflow-hidden border-4 border-imperial-navy w-72 h-72 md:w-96 md:h-96">
              <img
                src="/img/michalis-napoleon.png"
                alt="Michalis as Napoleon"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      </div>
      <footer className="absolute bottom-2 left-0 right-0 text-center text-imperial-cream/40 text-xs">
        Michalis Chess Master · Built for the parlour, played in the browser.
      </footer>
    </main>
  );
}

function DamaskBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden>
      <defs>
        <pattern id="damask" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M30 0 L40 20 L60 30 L40 40 L30 60 L20 40 L0 30 L20 20 Z" fill="#C9A24C" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#damask)" />
    </svg>
  );
}
