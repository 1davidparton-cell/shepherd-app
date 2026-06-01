import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shepherd: {
          navy: '#1a2744',
          gold: '#c9a84c',
          cream: '#f9f5ef',
          stone: '#8b7355',
          'navy-light': '#243363',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
