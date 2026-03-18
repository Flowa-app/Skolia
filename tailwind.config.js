/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Source Sans 3"', '"Source Sans Pro"', 'system-ui', 'sans-serif'],
      },
      colors: {
        plum: {
          50:  '#F7F1FD',
          100: '#EDE0FA',
          200: '#D9BFF2',
          300: '#BC91E3',
          400: '#9B64CF',
          500: '#7C44B8',
          600: '#5E2D9A',
          700: '#4A2278',
          800: '#331756',
          900: '#1D0D33',
        },
        sage: {
          50:  '#F3FAF5',
          100: '#E1F3E7',
          200: '#C2E6CE',
          500: '#52A875',
          600: '#3D8A5D',
          700: '#2D6A4A',
          900: '#1A3D2B',
        },
        amber: {
          50:  '#FFFBF0',
          100: '#FEF3D0',
          200: '#FDE49E',
          600: '#D97706',
          700: '#B45309',
          900: '#78350F',
        },
        parchment: {
          50:  '#FDFAED',
          100: '#FAF2D0',
          200: '#F3E2A0',
        },
        paper: '#FAF8F3',
      },
    },
  },
  plugins: [],
}
