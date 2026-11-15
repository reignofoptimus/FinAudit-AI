/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#08090B',
          50: '#f5f5f6',
          100: '#e5e6e8',
          200: '#c5c7cb',
          300: '#9fa3a9',
          400: '#6f747e',
          500: '#4a4f59',
          600: '#343841',
          700: '#23262d',
          800: '#14161b',
          900: '#08090B',
        },
        purewhite: {
          DEFAULT: '#F5F3EF',
          light: '#FAF9F6',
          dark: '#EBE8E1',
        },
        golden: {
          DEFAULT: '#FFC900',
          light: '#FFD733',
          dark: '#E6B500',
          50: '#FFFBE6',
          100: '#FFF7CC',
          200: '#FFED99',
          300: '#FFE366',
          400: '#FFD933',
          500: '#FFC900',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glass': 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 12px 32px -4px rgba(8, 9, 11, 0.05)',
        'glass-hover': 'inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 16px 40px -4px rgba(8, 9, 11, 0.08)',
        'glass-sm': 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 16px -2px rgba(8, 9, 11, 0.04)',
      },
    },
  },
  plugins: [],
}
