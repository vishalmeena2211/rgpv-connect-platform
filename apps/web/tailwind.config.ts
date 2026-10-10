import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Tailwind wired to the CSS custom properties in globals.css, so one set of
 * tokens drives light and dark. Colours are RGB channel triples, which keeps
 * opacity modifiers (`bg-primary/10`) working.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        subtle: token('subtle'),
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          foreground: token('primary-foreground'),
        },
        accent: {
          DEFAULT: token('accent'),
          strong: token('accent-strong'),
          foreground: token('accent-foreground'),
        },
        ink: {
          DEFAULT: token('ink'),
          foreground: token('ink-foreground'),
        },
        muted: {
          DEFAULT: token('muted'),
          foreground: token('muted-foreground'),
        },
        faint: token('faint-foreground'),
        success: {
          DEFAULT: token('success'),
          soft: token('success-soft'),
          foreground: token('success-foreground'),
        },
        warning: {
          DEFAULT: token('warning'),
          soft: token('warning-soft'),
          foreground: token('warning-foreground'),
        },
        destructive: {
          DEFAULT: token('destructive'),
          hover: token('destructive-hover'),
          soft: token('destructive-soft'),
          foreground: token('destructive-foreground'),
        },
        info: {
          DEFAULT: token('info'),
          soft: token('info-soft'),
          foreground: token('info-foreground'),
        },
        card: {
          DEFAULT: token('card'),
          foreground: token('card-foreground'),
        },
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 6px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Helvetica Neue', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Avenir Next', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--ink) / 0.06), 0 1px 1px rgb(var(--ink) / 0.03)',
        raised: '0 1px 2px rgb(var(--ink) / 0.06), 0 12px 32px -8px rgb(var(--ink) / 0.14)',
        float: '0 2px 4px rgb(var(--ink) / 0.06), 0 24px 64px -16px rgb(var(--ink) / 0.28)',
        button:
          'inset 0 1px 0 rgb(255 255 255 / 0.2), 0 1px 2px rgb(var(--primary) / 0.4)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [animate],
};

export default config;
