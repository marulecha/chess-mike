import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main data-testid="home-page" className="min-h-screen relative overflow-hidden">
      <DamaskBackground />
      <Vignette />
      <div className="relative z-10 mx-auto max-w-6xl grid md:grid-cols-[1.1fr_1fr] items-center min-h-screen px-8 gap-12">
        <section className="text-center md:text-left">
          <span className="block font-mono text-[0.7rem] tracking-[0.4em] text-imperial-gold/60 mb-6 uppercase">
            ⸻ Anno MMXXVI ⸻
          </span>
          <h1
            aria-label="Michalis Chess Master"
            className="font-display text-imperial-gold text-6xl md:text-8xl leading-[0.95] tracking-tight mb-6 drop-shadow-[0_4px_22px_rgba(212,175,111,0.25)]"
          >
            <span className="block italic font-light">Michalis</span>
            <span className="block">Chess Master</span>
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
            <span className="h-px w-12 bg-imperial-gold/60"></span>
            <p className="font-body text-imperial-cream/90 text-lg md:text-xl italic">
              Challenge the Emperor of the 64 Squares.
            </p>
          </div>
          <Link
            to="/play"
            className="group relative inline-flex items-center gap-3 font-display text-imperial-cream text-lg md:text-xl border border-imperial-gold/80 bg-gradient-to-b from-imperial-burgundy to-[#5a1421] px-10 py-4 rounded-sm shadow-imperial hover:shadow-gold-glow transition-all duration-300 hover:translate-y-[-1px] tracking-wide uppercase"
          >
            <span className="absolute inset-0 rounded-sm bg-imperial-gold/0 group-hover:bg-imperial-gold/5 transition-colors" />
            <span className="relative">Begin the Duel</span>
            <span className="relative text-imperial-gold/80 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
          <p className="mt-6 font-mono text-[0.65rem] tracking-[0.3em] text-imperial-cream/40 uppercase">
            Vs Michalis · Local · Online · Free Forever
          </p>
        </section>

        <section className="flex justify-center md:justify-end">
          <PortraitFrame />
        </section>
      </div>
      <footer className="absolute bottom-3 left-0 right-0 text-center text-imperial-cream/30 text-[0.65rem] tracking-[0.25em] uppercase font-mono">
        Michalis Chess Master · Built for the parlour, played in the browser
      </footer>
    </main>
  );
}

function PortraitFrame() {
  return (
    <div className="relative">
      {/* Outer glow */}
      <div className="absolute -inset-8 rounded-full bg-imperial-gold/10 blur-3xl" aria-hidden />
      {/* Decorative laurel ring */}
      <svg
        className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] text-imperial-gold/40 animate-[spin_120s_linear_infinite]"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <defs>
          <path id="circle" d="M 50,50 m -47,0 a 47,47 0 1,1 94,0 a 47,47 0 1,1 -94,0" />
        </defs>
        <text fontSize="3.2" fill="currentColor" letterSpacing="0.55" fontFamily="JetBrains Mono">
          <textPath href="#circle" startOffset="0">
            ★ MICHALIS · IMPERATOR LUDI · CHESS MASTER · MMXXVI · ★ MICHALIS · IMPERATOR LUDI · CHESS MASTER · MMXXVI ·&nbsp;
          </textPath>
        </text>
      </svg>
      {/* Outer gold ring */}
      <div className="rounded-full p-[3px] bg-gradient-to-br from-imperial-gold via-[#E8C572] to-[#9A7A3D] shadow-imperial relative">
        {/* Crimson backing band */}
        <div className="rounded-full p-2 bg-imperial-crimson">
          {/* Inner gold rule */}
          <div className="rounded-full p-[2px] bg-gradient-to-br from-[#E8C572] via-imperial-gold to-[#9A7A3D]">
            {/* Portrait */}
            <div className="rounded-full overflow-hidden w-72 h-72 md:w-96 md:h-96 relative">
              <img
                src={`${import.meta.env.BASE_URL}img/michalis-napoleon.png`}
                alt="Michalis as Napoleon"
                className="w-full h-full object-cover"
              />
              {/* Vignette over portrait */}
              <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-imperial-noir/40" aria-hidden />
            </div>
          </div>
        </div>
      </div>
      {/* Title plaque under portrait */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-5 py-1 bg-imperial-noir border border-imperial-gold/70 rounded-sm shadow-imperial">
        <span className="font-display text-imperial-gold text-sm tracking-[0.3em] whitespace-nowrap">L'EMPEREUR</span>
      </div>
    </div>
  );
}

function DamaskBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.08] z-0" aria-hidden>
      <defs>
        <pattern id="damask" width="120" height="120" patternUnits="userSpaceOnUse">
          {/* Central fleur-de-lis silhouette */}
          <g transform="translate(60 60)" fill="#D4AF6F">
            <path d="M0 -28 C 6 -22, 10 -14, 6 -6 C 14 -10, 22 -6, 22 4 C 22 12, 14 18, 6 16 C 10 22, 6 28, 0 28 C -6 28, -10 22, -6 16 C -14 18, -22 12, -22 4 C -22 -6, -14 -10, -6 -6 C -10 -14, -6 -22, 0 -28 Z" />
            <ellipse cx="0" cy="0" rx="3" ry="3" fill="#3A0E15" />
          </g>
          {/* Corner accents */}
          <circle cx="0" cy="0" r="2.2" fill="#D4AF6F" />
          <circle cx="120" cy="0" r="2.2" fill="#D4AF6F" />
          <circle cx="0" cy="120" r="2.2" fill="#D4AF6F" />
          <circle cx="120" cy="120" r="2.2" fill="#D4AF6F" />
          {/* Cross lines linking flourish to corners */}
          <line x1="0" y1="0" x2="120" y2="120" stroke="#D4AF6F" strokeWidth="0.4" opacity="0.4" />
          <line x1="120" y1="0" x2="0" y2="120" stroke="#D4AF6F" strokeWidth="0.4" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#damask)" />
    </svg>
  );
}

function Vignette() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, transparent 30%, rgba(15, 5, 7, 0.55) 100%)',
      }}
    />
  );
}
