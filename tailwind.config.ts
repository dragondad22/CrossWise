import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#0f172a',
        primary: '#2563eb',
        'primary-foreground': '#f8fafc',
        secondary: '#9333ea',
        'secondary-foreground': '#faf5ff',
        muted: '#f4f5f7',
        'muted-foreground': '#6b7280',
        card: '#ffffff',
        'card-foreground': '#1f2937',
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#2563eb',
        // Non-blocking caution notices (e.g. partial-puzzle disclosure, #99).
        warning: '#92400e',
        'warning-muted': '#fef3c7',
        'warning-border': '#fcd34d',
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        card: '0 10px 30px -15px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
