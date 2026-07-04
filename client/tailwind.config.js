// Tailwind configuration – Design System Foundation (Spec 1)
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // ==========================
      // Color Tokens (Spec 1.1)
      // ==========================
      colors: {
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        'primary-hover': 'var(--primary-hover)',
        secondary: 'var(--secondary)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        ghost: 'var(--ghost)',
        border: 'var(--border)',
        surface: 'var(--surface)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
      },

      // ==========================
      // Font Family (Spec 1.2)
      // ==========================
      fontFamily: {
        sans: ['var(--font)', 'Inter', 'sans-serif'],
        bangla: ['Hind Siliguri', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      // ==========================
      // Typography Scale (Spec 1.2)
      // ==========================
      fontSize: {
        'hero': ['clamp(3rem, 5vw, 4rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['clamp(2rem, 3vw, 2.5rem)', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['clamp(1.375rem, 2vw, 1.75rem)', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['0.9375rem', { lineHeight: '1.6' }],
        'label': ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'price': ['clamp(1.25rem, 2vw, 1.75rem)', { lineHeight: '1.2', fontWeight: '700' }],
        'badge': ['0.6875rem', { lineHeight: '1', fontWeight: '600' }],
        'code': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
      },

      // ==========================
      // Border Radius (Spec 1.4)
      // ==========================
      borderRadius: {
        '10px': '10px',
        '20px': '20px',
        '24px': '24px',
      },

      // ==========================
      // Shadow System (Spec 1.5)
      // ==========================
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(75,68,176,0.12)',
        'modal': '0 20px 60px rgba(0,0,0,0.18)',
        'btn': '0 2px 8px rgba(75,68,176,0.25)',
        'input-focus': '0 0 0 3px rgba(75,68,176,0.15)',
        'sticky': '0 2px 12px rgba(0,0,0,0.08)',
      },

      // ==========================
      // Spacing (Spec 1.3 – default Tailwind 8px grid matches)
      // ==========================

      // ==========================
      // Animation Durations (Spec 1.6)
      // ==========================
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '180': '180ms',
        '300': '300ms',
        '400': '400ms',
      },

      // ==========================
      // Keyframes (Spec 1.6)
      // ==========================
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'cart-bounce': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-4px) scale(1.4)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite linear',
        'cart-bounce': 'cart-bounce 300ms ease-out',
      },
    },
  },
  plugins: [],
};
