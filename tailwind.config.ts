import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'imperial-navy':     '#0E1B3A',
        'imperial-burgundy': '#6B1B2A',
        'imperial-gold':     '#C9A24C',
        'imperial-cream':    '#F4ECD8',
        'imperial-ink':      '#1B1410',
      },
      boxShadow: {
        'imperial': '0 10px 40px rgba(20, 12, 4, 0.55)',
        'gold-glow': '0 0 0 2px #C9A24C, 0 0 16px rgba(201, 162, 76, 0.55)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body:    ['"EB Garamond"', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
