/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
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
        darkSurface: '#03153F',   // Deep Navy Blue - gradient fallback (rebuild spec)
        darkCard: '#132B5C',      // Card surface
        darkBorder: '#234480',
        darkMuted: '#9FB3D1',

        // Stage tokens
        bgDeep: '#07163A',
        card: '#132B5C',
        cardHi: '#16346B',
        border: '#234480',
        borderStrong: '#4A6AA5',
        textSoft: '#C9D8EE',
        cyanHi: '#8CF5F8',
        success: '#4ADE80',
        warning: '#FBBF24',

        // Stadium lines detail
        lineMain: '#5FE3E8',  // same as primary
        lineInner: '#2CCFD6', // Cool Aqua

        // Light theme (keep simple for now)
        light: '#F9FAFB',
        lightSurface: '#FFFFFF',
        lightCard: '#F3F4F6',
        lightBorder: '#E5E7EB',
        lightMuted: '#6B7280',

        danger: '#F87171',
      },
      fontFamily: {
        sans: ['System'],
        heading: ['EASports15'],
      },
    },
  },
  plugins: [],
};
