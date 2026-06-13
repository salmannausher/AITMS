import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans:    ['Onest', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
      },
      fontWeight: {
        '700': '700',
        '800': '800',
      },
    },
  },
  plugins: [],
};

export default config;
