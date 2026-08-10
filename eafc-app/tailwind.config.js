/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.js'],
  presets: [require('nativewind/preset')],
  darkMode: 'media', // Uses React Native Appearance API - class strategy fails on native
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: '#5FE3E8',   // Neon Cyan - main glow
        primary2: '#2eaeb3',   // Neon Cyan - main glow
        accent: '#8CF5F8',    // Electric Cyan - brightest highlight
        secondary: '#22C55E', // Green - keep as success/confirm

        // Stadium blues (dark mode)
        dark: '#07163A',          // Midnight Blue - outer
        darkSurface: '#0A1F4A',   // Deep Navy Blue - main bg
        darkCard: '#1A3566',      // Soft Navy - cards/inner glow
        darkBorder: '#1A3566',
        darkMuted: '#6B7280',

        // Stadium lines detail
        lineMain: '#5FE3E8',  // same as primary
        lineInner: '#2CCFD6', // Cool Aqua

        // Light theme (keep simple for now)
        light: '#F9FAFB',
        lightSurface: '#FFFFFF',
        lightCard: '#F3F4F6',
        lightBorder: '#E5E7EB',
        lightMuted: '#6B7280',

        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['System'],
        heading: ['EASports15'],
      },
    },
  },
  plugins: [],
};
