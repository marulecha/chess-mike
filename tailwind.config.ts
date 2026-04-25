import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Imperial Crimson Court palette
        'imperial-crimson': '#3A0E15', // primary background (deep oxblood)
        'imperial-burgundy': '#7A1F2D', // accent panels, buttons (richer ruby)
        'imperial-noir':    '#0F0507', // board dark squares, deep wells
        'imperial-gold':    '#D4AF6F', // warmer gilt (was colder #C9A24C)
        'imperial-cream':   '#F4ECD8', // light squares, body text on dark
        'imperial-ink':     '#1B1410', // body text on cream
      },
      boxShadow: {
        'imperial':   '0 18px 60px rgba(15, 5, 7, 0.7), 0 4px 12px rgba(15, 5, 7, 0.45)',
        'gold-glow':  '0 0 0 2px #D4AF6F, 0 0 22px rgba(212, 175, 111, 0.55)',
        'gold-rule':  'inset 0 0 0 1px rgba(212, 175, 111, 0.55), inset 0 0 0 4px #3A0E15, inset 0 0 0 5px rgba(212, 175, 111, 0.85)',
        'inset-deep': 'inset 0 2px 12px rgba(15, 5, 7, 0.7)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body:    ['"EB Garamond"', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'imperial-vignette': 'radial-gradient(ellipse at 50% 0%, rgba(212, 175, 111, 0.12) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(15, 5, 7, 0.55) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
};

export default config;
