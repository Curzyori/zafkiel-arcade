/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zafkiel: {
          dark: '#0a0a0a',
          darker: '#050505',
          crimson: '#8a0303',
          crimsonBright: '#dc143c',
          gold: '#d4af37',
        }
      },
      fontFamily: {
        gothic: ['"Cinzel Decorative"', 'serif'],
        roman: ['"Times New Roman"', 'serif']
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'spin-reverse': 'spin 12s linear infinite reverse',
      }
    },
  },
  plugins: [],
}
