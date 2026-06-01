import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shepherd: {
          navy: '#1a2744',
          'navy-light': '#243363',
          gold: '#c9a84c',
          'gold-soft': '#d8c178',
          cream: '#f9f5ef',
          stone: '#8b7355',
          ink: '#2b2f38',
          line: '#ece5d8',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(40,30,15,.04)',
        'card-hover': '0 4px 14px -8px rgba(40,30,15,.22)',
        cta: '0 8px 22px -10px rgba(26,39,68,.55)',
      },
      borderRadius: { card: '14px' },
    },
  },
  plugins: [],
} satisfies Config;
