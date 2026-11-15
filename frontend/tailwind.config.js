/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a0f1d',
          900: '#0f172a',
          850: '#151e34',
          800: '#1e293b',
          700: '#334155',
        },
        brand: {
          blue: '#2563eb',
          'blue-light': '#3b82f6',
          teal: '#0d9488',
          'teal-light': '#14b8a6',
        }
      }
    },
  },
  plugins: [],
}
