/**
 * UEB Design System — Sistema de Control Presupuestario
 * Universidad Estatal de Bolívar
 *
 * Brand colors sourced from UEB Corporate Identity Manual.
 */

export const theme = {

  // ── BRAND COLORS (UEB Corporate Identity) ────────────────────────
  colors: {
    // Primary palette
    primary:      '#1a3a5c',   // Primary Blue dark
    primaryMid:   '#2e6ca4',   // Primary Blue medium
    primaryLight: '#54b3e0',   // Primary Blue light
    red:          '#ff0000',   // Primary Red
    redDark:      '#8b0f0f',   // Accent red dark
    white:        '#FFFFFF',
    bg:           '#f0f4f8',   // Background

    // Sidebar (dark theme)
    sidebar: {
      from:   '#0a1929',
      to:     '#1a3a5c',
      text:   'rgba(255,255,255,0.60)',
      active: 'rgba(84,179,224,0.14)',
      border: 'rgba(84,179,224,0.12)',
    },

    // Glass cards (light bg)
    glass: {
      bg:     'rgba(255,255,255,0.85)',
      border: 'rgba(255,255,255,0.95)',
      shadow: '0 4px 24px rgba(26,58,92,0.10)',
    },

    // Text (light backgrounds)
    text: {
      heading:   '#1a3a5c',
      body:      '#2e4a6c',
      secondary: '#5a7a9f',
      muted:     '#8fa3c0',
      light:     '#b0c4d8',
      inverse:   '#ffffff',
      error:     '#b91c1c',
    },

    // Semantic states
    state: {
      success: '#059669',
      warning: '#d97706',
      error:   '#b91c1c',
      info:    '#2e6ca4',
    },

    // Input fields
    input: {
      bg:         '#f8fafd',
      background: '#f8fafd',
      border:     'rgba(46,108,164,0.22)',
      focus:      '#54b3e0',
      glow:       'rgba(84,179,224,0.18)',
    },

    secondary: '#ffffff',

    error: {
      border: '#fca5a5',
      text:   '#991b1b',
    },

    // Accent palette (charts, badges)
    accent: {
      blue:   '#2e6ca4',
      light:  '#54b3e0',
      teal:   '#0891b2',
      green:  '#059669',
      amber:  '#d97706',
      red:    '#8b0f0f',
      purple: '#7c3aed',
      orange: '#ea580c',
    },
  },

  // ── TYPOGRAPHY ───────────────────────────────────────────────────
  typography: {
    fontFamily: "'Montserrat', system-ui, sans-serif",
    fontSize: {
      xs:   '11px',
      sm:   '12px',
      md:   '13px',
      base: '14px',
      lg:   '15px',
      xl:   '16px',
      '2xl':'18px',
      '3xl':'20px',
      '4xl':'24px',
      '5xl':'28px',
      '6xl':'32px',
    },
    fontWeight: {
      light:    300,
      normal:   400,
      medium:   500,
      semibold: 600,
      bold:     700,
      black:    800,
    },
    lineHeight: {
      tight:   1.2,
      normal:  1.5,
      relaxed: 1.65,
    },
  },

  // ── BORDER ───────────────────────────────────────────────────────
  border: {
    radius:      '10px',
    radiusSmall: '6px',
    radiusMd:    '10px',
    radiusLg:    '14px',
    radiusXl:    '20px',
    radiusFull:  '9999px',
  },

  // ── SHADOW ───────────────────────────────────────────────────────
  shadow: {
    sm:    '0 2px 8px rgba(26,58,92,0.08)',
    md:    '0 4px 20px rgba(26,58,92,0.10)',
    lg:    '0 20px 60px rgba(0,0,0,0.40), 0 6px 18px rgba(0,0,0,0.28)',
    xl:    '0 20px 60px rgba(26,58,92,0.18)',
    glow:  '0 0 20px rgba(84,179,224,0.35)',
  },

  // ── SPACING ──────────────────────────────────────────────────────
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem',
    '4xl': '3.5rem',
  },

  // ── TRANSITIONS ──────────────────────────────────────────────────
  transition: {
    fast:   'all 0.18s ease',
    normal: 'all 0.28s ease',
    slow:   'all 0.45s ease',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // ── COMPONENT DIMENSIONS ─────────────────────────────────────────
  components: {
    sidebar: {
      widthOpen:      '264px',
      widthCollapsed: '64px',
    },
    header: {
      height: '60px',
    },
    card: {
      padding: { sm: '14px', md: '20px', lg: '28px' },
      radius: '16px',
    },
    login: {
      containerDesktop: {
        maxWidth:  '1100px',
        minHeight: '390px',
      },
      containerMobile: {
        maxWidth:  '420px',
        minHeight: 'auto',
        margin:    '0 auto',
      },
      logoMaxWidth: {
        desktop: '480px',
        mobile:  '300px',
      },
    },
  },

  // ── Z-INDEX ──────────────────────────────────────────────────────
  zIndex: {
    base:    0,
    card:    10,
    header:  50,
    sidebar: 100,
    modal:   1000,
    toast:   1100,
    loading: 9999,
  },
};

export const createGradient = (opts, deg = 135, isMobile = false) => {
  if (opts && typeof opts === 'object' && 'start' in opts) {
    const pct = opts.startPercent ?? 50;
    return `linear-gradient(${deg}deg, ${opts.start} ${pct}%, ${opts.end ?? opts.start} ${pct}%)`;
  }
  return `linear-gradient(${deg}deg, ${opts}, ${isMobile})`;
};

export default theme;
