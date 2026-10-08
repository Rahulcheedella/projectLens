/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFBF7',
          100: '#FAF7F0',
          200: '#F4EFE6',
          300: '#E8E2D5',
          400: '#D5CDC0',
          500: '#B8AD9C',
        },
        charcoal: {
          900: '#151618',
          800: '#1F2124',
          700: '#2F3237',
          600: '#484B52',
          500: '#646872',
          400: '#8E93A0',
          300: '#B8BDC9',
          200: '#E2E5EC',
          100: '#F1F3F7',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E5EDE6',
          200: '#C7DBC9',
          500: '#4E6B56',
          600: '#3D5443',
          700: '#2C3E31',
        },
        dusty: {
          50: '#F3F6F9',
          100: '#E2ECF2',
          200: '#C3D8E5',
          500: '#436B88',
          600: '#34556D',
          700: '#263F52',
        },
        lavender: {
          50: '#F6F4F9',
          100: '#ECE6F3',
          200: '#D9CDE7',
          500: '#6E5D88',
          600: '#58496D',
          700: '#433753',
        },
        terracotta: {
          50: '#FAF4F2',
          100: '#F4E5E1',
          200: '#E7C6BD',
          500: '#9E4A3B',
          600: '#823C2F',
          700: '#652D23',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(20, 22, 25, 0.04)',
        'soft': '0 2px 8px -1px rgba(20, 22, 25, 0.05), 0 1px 3px -1px rgba(20, 22, 25, 0.03)',
        'soft-md': '0 8px 20px -3px rgba(20, 22, 25, 0.06), 0 3px 6px -2px rgba(20, 22, 25, 0.03)',
        'soft-lg': '0 16px 32px -4px rgba(20, 22, 25, 0.08), 0 6px 12px -3px rgba(20, 22, 25, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
