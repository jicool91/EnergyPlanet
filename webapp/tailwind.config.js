/** @type {import('tailwindcss').Config} */

const spacingTokens = {
  xs: 'var(--spacing-xs)',
  'xs-plus': 'var(--spacing-xs-plus)',
  sm: 'var(--spacing-sm)',
  'sm-plus': 'var(--spacing-sm-plus)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
  '2xl': 'var(--spacing-2xl)',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors (2025 palette)
        cyan: '#00d9ff',
        lime: '#00ff88',
        gold: '#ffd700',
        orange: '#ff8d4d',
        'gold-metallic': '#ffd700',
        'silver-metallic': '#e8e8e8',
        'magenta-neon': '#ff00ff',

        // Status Colors (brighter for AAA contrast)
        success: '#00ff88',
        warning: '#ff8d4d',
        error: '#ff3333',
        'red-error': '#ff3333',
        info: '#00d9ff',

        // Background Colors
        'dark-bg': '#0a0e27',
        'dark-secondary': '#101328',
        'dark-tertiary': '#1a2540',
        'dark-elevated': '#141836',

        // Component Colors (preset combinations)
        'card-dark': 'rgba(10, 14, 32, 0.9)',
        'card-dark-secondary': 'rgba(16, 19, 40, 0.6)',
        'button-primary': 'linear-gradient(135deg, rgba(0,217,255,0.3) 0%, rgba(0,255,136,0.4) 100%)',
        'button-secondary': 'rgba(0, 217, 255, 0.22)',
        'button-success': 'linear-gradient(135deg, #ffd700 0%, #ff8d4d 100%)',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #001a3f 0%, #0a0e27 100%)',
        'gradient-accent': 'linear-gradient(90deg, #00d9ff 0%, #00ff88 100%)',
        'gradient-premium': 'linear-gradient(135deg, #ffd700 0%, #ff8d4d 100%)',
        'gradient-holographic': 'linear-gradient(135deg, #00d9ff 0%, #ff00ff 50%, #ffd700 100%)',
      },
      spacing: {
        ...spacingTokens,
        'safe-left': 'var(--safe-area-left, 0px)',
        'safe-right': 'var(--safe-area-right, 0px)',
        'safe-top': 'var(--safe-area-top, 0px)',
        'safe-bottom': 'var(--safe-area-bottom, 0px)',
      },
      fontSize: {
        display: ['48px', { lineHeight: '56px', fontWeight: '700' }],
        heading: ['24px', { lineHeight: '32px', fontWeight: '600' }],
        title: ['20px', { lineHeight: '28px', fontWeight: '700' }],
        subheading: ['16px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        micro: ['11px', { lineHeight: '14px', fontWeight: '600' }],
        label: ['11px', { lineHeight: '14px', fontWeight: '700' }],
        // Legacy sizes for backwards compatibility
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
      },
      boxShadow: {
        sm: '0 4px 12px rgba(0, 0, 0, 0.15)',
        md: '0 12px 24px rgba(0, 0, 0, 0.25)',
        lg: '0 20px 48px rgba(0, 0, 0, 0.35)',
        xl: '0 24px 60px rgba(0, 0, 0, 0.45)',
        card: '0 2px 8px rgba(0, 217, 255, 0.1)',
        'card-hover': '0 4px 16px rgba(0, 217, 255, 0.2)',
        glow: '0 0 20px rgba(0, 217, 255, 0.3)',
        'glow-lime': '0 0 18px rgba(0, 255, 136, 0.35)',
        'glow-gold': '0 0 18px rgba(255, 215, 0, 0.35)',
        'glow-magenta': '0 0 18px rgba(255, 0, 255, 0.35)',
        'elevation-1': '0 1px 2px rgba(0,0,0,0.08)',
        'elevation-2': '0 4px 12px rgba(0,0,0,0.12)',
        'elevation-3': '0 12px 24px rgba(0,0,0,0.16)',
        'elevation-4': '0 20px 40px rgba(0,0,0,0.2)',
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
