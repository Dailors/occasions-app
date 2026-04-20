import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eaf0f7',
          100: '#c5d5e9',
          200: '#9db8d8',
          300: '#739bc8',
          400: '#4e82bb',
          500: '#2d5282',
          600: '#244369',
          700: '#1b3451',
          800: '#122538',
          900: '#091620',
        },
        navy: {
          50:  '#e8ecf0',
          100: '#c5cdd6',
          200: '#9eadb9',
          300: '#778d9d',
          400: '#597687',
          500: '#22303f',
          600: '#1c2833',
          700: '#162028',
          800: '#10181d',
          900: '#0a1013',
        },
        smoke: {
          50:  '#f0f3f5',
          100: '#d5dde4',
          200: '#b8c5cf',
          300: '#9aadb9',
          400: '#8499a9',
          500: '#788fa3',
          600: '#5f7384',
          700: '#475966',
          800: '#2f3f48',
          900: '#18252b',
        },
        beige: {
          50:  '#faf8f5',
          100: '#ede8df',
          200: '#ddd4c5',
          300: '#cdbfaa',
          400: '#c4b49a',
          500: '#b39e81',
          600: '#96836a',
          700: '#786853',
          800: '#5a4e3c',
          900: '#3c3428',
        },
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      maxWidth: {
        'mobile': '480px',
      },
    },
  },
  plugins: [],
}

export default config
