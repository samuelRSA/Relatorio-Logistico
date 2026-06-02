import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#07090d',
          900: '#0d1118',
          850: '#111722',
          800: '#17202c',
          700: '#263241',
        },
        signal: {
          amber: '#f4b860',
          blue: '#65b7ff',
          mint: '#6ee7b7',
          coral: '#ff7a7a',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        body: ['"Manrope"', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        executive: '0 24px 70px rgba(0, 0, 0, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
