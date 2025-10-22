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
        'safe-left': 'var(--safe-area-left, 0px)',
        'safe-right': 'var(--safe-area-right, 0px)',
        'safe-top': 'var(--safe-area-top, 0px)',
        'safe-bottom': 'var(--safe-area-bottom, 0px)',
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
        'glow': 'glow 0.6s ease-out',
        'glow-pulse': 'glowPulse 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ripple': 'ripple 0.8s ease-out',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'confetti': 'confetti 2.5s ease-in',
        'shimmer': 'shimmer 2s infinite',
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
        'glow': {
          '0%': {
            boxShadow: '0 0 0 0 rgba(0, 217, 255, 0.7)',
          },
          '50%': {
            boxShadow: '0 0 0 20px rgba(0, 217, 255, 0)',
          },
          '100%': {
            boxShadow: '0 0 0 0 rgba(0, 217, 255, 0)',
          },
        },
        'glowPulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(0, 217, 255, 0.6)',
          },
        },
        'slideUp': {
          'from': {
            transform: 'translateY(20px)',
            opacity: '0',
          },
          'to': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'scaleIn': {
          'from': {
            transform: 'scale(0)',
            opacity: '0',
          },
          'to': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
        'ripple': {
          '0%': {
            transform: 'scale(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(4)',
            opacity: '0',
          },
        },
        'bounceIn': {
          '0%': {
            transform: 'scale(0)',
            opacity: '0',
          },
          '50%': {
            transform: 'scale(1.05)',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
        'confetti': {
          '0%': {
            transform: 'translateY(0) rotate(0deg)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(500px) rotate(720deg)',
            opacity: '0',
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
      },
      minHeight: {
        'screen': 'var(--tg-viewport-height, 100vh)',
        'full': '100%',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.will-animate': {
          willChange: 'transform, opacity',
        },
        '.will-transform': {
          willChange: 'transform',
        },
        '.will-opacity': {
          willChange: 'opacity',
        },
      });
    },
  ],
}
