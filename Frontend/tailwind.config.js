/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        border: 'var(--border)',
        ring: 'var(--ring)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        destructive: 'var(--destructive)',
      },
      borderRadius: {
        sm: '12px',
        DEFAULT: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '28px',
        full: '9999px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(232, 168, 56, 0.15)',
        'glow-teal': '0 0 24px rgba(0, 180, 138, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'signal-in': 'signal-in 2s ease-out infinite',
        'signal-out': 'signal-out 2s ease-out infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'signal-in': {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(0)', opacity: '0.3' },
        },
        'signal-out': {
          '0%': { transform: 'translateX(0)', opacity: '0.3' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(8px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
