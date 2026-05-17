import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0c1116',
        paper: '#f7f2e9',
        tide: '#0f766e',
        ember: '#f97316',
        mist: '#e7dfd3',
        navy: '#0d1e36',
        gold: '#f5a623',
      },
      boxShadow: {
        soft: '0 12px 30px -20px rgba(15, 23, 42, 0.45)',
        glow: '0 18px 50px -28px rgba(15, 118, 110, 0.45)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
