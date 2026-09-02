import type { Config } from 'tailwindcss';

/**
 * Tailwind 3.4.19（ADR-002 刻意不升 v4：微信 X5 内核对 @property / oklch 支持不完整）。
 * 全部色值来自 src/styles/tokens.css 的 CSS 变量，配置里不出现任何 hex 字面量。
 */
const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/features/**/*.{ts,tsx}', './src/ui/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          sunken: 'var(--surface-sunken)',
          raised: 'var(--surface-raised)',
        },
        fg: {
          DEFAULT: 'var(--fg)',
          2: 'var(--fg-2)',
          'on-accent': 'var(--fg-on-accent)',
        },
        muted: 'var(--muted)',
        meta: 'var(--meta)',
        border: {
          DEFAULT: 'var(--border)',
          soft: 'var(--border-soft)',
          strong: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          active: 'var(--accent-active)',
          on: 'var(--accent-on)',
          wash: 'var(--accent-wash)',
          border: 'var(--accent-border)',
        },
        success: {
          DEFAULT: 'var(--success)',
          wash: 'var(--success-wash)',
          border: 'var(--success-border)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          wash: 'var(--warn-wash)',
          border: 'var(--warn-border)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          wash: 'var(--danger-wash)',
          border: 'var(--danger-border)',
        },
        data: {
          1: 'var(--data-1)',
          2: 'var(--data-2)',
          3: 'var(--data-3)',
          track: 'var(--data-track)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
      },
      fontWeight: {
        read: 'var(--weight-read)',
        emphasize: 'var(--weight-emphasize)',
        announce: 'var(--weight-announce)',
      },
      lineHeight: {
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        body: 'var(--leading-body)',
        relaxed: 'var(--leading-relaxed)',
      },
      letterSpacing: {
        display: 'var(--tracking-display)',
        heading: 'var(--tracking-heading)',
        body: 'var(--tracking-body)',
        small: 'var(--tracking-small)',
        caps: 'var(--tracking-caps)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        tap: 'var(--tap-min)',
        header: 'var(--header-h)',
        'cta-bar': 'var(--cta-bar-h)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        ring: 'var(--elev-ring)',
        'ring-strong': 'var(--elev-ring-strong)',
        'ring-accent': 'var(--elev-ring-accent)',
        raised: 'var(--elev-raised)',
        overlay: 'var(--elev-overlay)',
        sticky: 'var(--elev-sticky)',
        focus: 'var(--focus-ring)',
        'focus-danger': 'var(--focus-ring-danger)',
      },
      maxWidth: {
        reading: 'var(--container-reading)',
        app: 'var(--container-app)',
      },
      transitionDuration: {
        instant: 'var(--motion-instant)',
        fast: 'var(--motion-fast)',
        base: 'var(--motion-base)',
        slow: 'var(--motion-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
        'ease-out': 'var(--ease-out)',
        'ease-in-out': 'var(--ease-in-out)',
      },
      zIndex: {
        raised: 'var(--z-raised)',
        'sticky-header': 'var(--z-sticky-header)',
        'sticky-cta': 'var(--z-sticky-cta)',
        dropdown: 'var(--z-dropdown)',
        backdrop: 'var(--z-backdrop)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
      },
    },
  },
  plugins: [],
};

export default config;
