/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.js'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#F5C518',
        secondary: '#22C55E',
        accent: '#3B82F6',
        dark: '#0F0F0F',
        surface: '#1A1A2E',
        card: '#16213E',
        muted: '#6B7280',
        border: '#2D2D4E',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
