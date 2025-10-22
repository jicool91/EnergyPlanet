/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: '#00d9ff',
        gold: '#ffd700',
        lime: '#48ffad',
        orange: '#ff8d4d',
        'red-error': '#ff5a5a',
        'dark-bg': '#0a0e27',
        'dark-secondary': '#101328',
      },
      spacing: {
        'safe-left': 'var(--tg-safe-area-left, 0px)',
        'safe-right': 'var(--tg-safe-area-right, 0px)',
        'safe-top': 'var(--tg-safe-area-top, 0px)',
        'safe-bottom': 'var(--tg-safe-area-bottom, 0px)',
        'content-safe-top': 'var(--tg-content-safe-area-top, var(--tg-safe-area-top, 0px))',
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 217, 255, 0.1)',
        'card-hover': '0 4px 16px rgba(0, 217, 255, 0.2)',
        'glow': '0 0 20px rgba(0, 217, 255, 0.3)',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'spin': 'spin 1s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
      },
      keyframes: {
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'spin': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        'fadeIn': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
      minHeight: {
        'screen': 'var(--tg-viewport-height, 100vh)',
        'full': '100%',
      },
    },
  },
  plugins: [],
}
