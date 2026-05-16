import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bedpro: {
          red: '#E8191A',
          black: '#111111',
          bg: '#F6F6F6',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,.05)',
      },
      borderRadius: {
        card: '13px',
      },
    },
  },
  plugins: [],
}

export default config
