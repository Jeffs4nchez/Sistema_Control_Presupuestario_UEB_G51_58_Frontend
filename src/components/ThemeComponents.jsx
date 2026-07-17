/**
 * Componentes Reutilizables con Tema UEB Integrado
 * 
 * Estos componentes están diseñados para usar el sistema de temas
 * y mantener consistencia visual en toda la aplicación.
 * 
 * Uso:
 * import { Button, Card, Alert } from './ThemeComponents';
 * 
 * <Button variant="primary">Click me</Button>
 * <Card title="Mi Tarjeta">Contenido</Card>
 * <Alert type="success">¡Éxito!</Alert>
 */

import { theme } from '../config/theme';

// ============================================================================
// BOTÓN
// ============================================================================

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  fullWidth = false,
  ...props
}) => {
  const variants = {
    primary: {
      background: theme.colors.primary,
      color: theme.colors.secondary,
      hover: theme.colors.accent.blue
    },
    secondary: {
      background: theme.colors.accent.blue,
      color: theme.colors.secondary,
      hover: theme.colors.primary
    },
    success: {
      background: theme.colors.state.success,
      color: theme.colors.secondary,
      hover: theme.colors.accent.green
    },
    danger: {
      background: theme.colors.state.error,
      color: theme.colors.secondary,
      hover: theme.colors.accent.red
    },
    warning: {
      background: theme.colors.state.warning,
      color: '#fff',
      hover: theme.colors.accent.amber
    },
    ghost: {
      background: 'transparent',
      color: theme.colors.primary,
      border: `2px solid ${theme.colors.primary}`,
      hover: theme.colors.accent.blue
    }
  };

  const sizes = {
    sm: {
      padding: theme.components.button.padding.sm,
      height: theme.components.button.height.sm,
      fontSize: theme.typography.fontSize.sm
    },
    md: {
      padding: theme.components.button.padding.md,
      height: theme.components.button.height.md,
      fontSize: theme.typography.fontSize.base
    },
    lg: {
      padding: theme.components.button.padding.lg,
      height: theme.components.button.height.lg,
      fontSize: theme.typography.fontSize.lg
    }
  };

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.md;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizeStyle,
        background: disabled ? theme.colors.gray['300'] : variantStyle.background,
        color: disabled ? theme.colors.gray['500'] : variantStyle.color,
        border: variantStyle.border || 'none',
        borderRadius: theme.border.radiusSmall,
        fontFamily: theme.typography.fontFamily,
        fontWeight: theme.typography.fontWeight.medium,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: theme.transition.normal,
        opacity: disabled ? 0.6 : 1,
        boxShadow: disabled ? 'none' : theme.shadow.sm,
        width: fullWidth ? '100%' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.background = variantStyle.hover;
          e.target.style.boxShadow = theme.shadow.md;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.background = variantStyle.background;
          e.target.style.boxShadow = theme.shadow.sm;
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// ============================================================================
// CARD
// ============================================================================

export const Card = ({
  children,
  title,
  subtitle,
  footer,
  padding = 'md',
  shadow = 'md',
  ...props
}) => {
  const paddingSizes = {
    sm: theme.components.card.padding.sm,
    md: theme.components.card.padding.md,
    lg: theme.components.card.padding.lg
  };

  return (
    <div
      style={{
        background: theme.colors.secondary,
        border: `1px solid ${theme.colors.gray['200']}`,
        borderRadius: theme.border.radiusMd,
        padding: paddingSizes[padding] || paddingSizes.md,
        boxShadow: theme.shadow[shadow] || theme.shadow.md,
        fontFamily: theme.typography.fontFamily,
        overflow: 'hidden'
      }}
      {...props}
    >
      {title && (
        <h3
          style={{
            margin: `0 0 ${theme.spacing.sm} 0`,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary
          }}
        >
          {title}
        </h3>
      )}

      {subtitle && (
        <p
          style={{
            margin: `0 0 ${theme.spacing.md} 0`,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary
          }}
        >
          {subtitle}
        </p>
      )}

      <div
        style={{
          color: theme.colors.text.primary,
          fontSize: theme.typography.fontSize.base
        }}
      >
        {children}
      </div>

      {footer && (
        <div
          style={{
            marginTop: theme.spacing.md,
            paddingTop: theme.spacing.md,
            borderTop: `1px solid ${theme.colors.gray['200']}`
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ALERT
// ============================================================================

export const Alert = ({
  children,
  type = 'info',
  title,
  closeable = false,
  onClose,
  ...props
}) => {
  const types = {
    success: {
      bg: theme.colors.success.light,
      border: theme.colors.state.success,
      text: theme.colors.success.text,
      icon: '✓'
    },
    error: {
      bg: theme.colors.error.light,
      border: theme.colors.state.error,
      text: theme.colors.error.text,
      icon: '✕'
    },
    warning: {
      bg: theme.colors.warning.light,
      border: theme.colors.state.warning,
      text: theme.colors.warning.text,
      icon: '⚠️'
    },
    info: {
      bg: theme.colors.info.light,
      border: theme.colors.state.info,
      text: theme.colors.info.text,
      icon: 'ℹ️'
    }
  };

  const alertStyle = types[type] || types.info;

  return (
    <div
      style={{
        background: alertStyle.bg,
        border: `2px solid ${alertStyle.border}`,
        borderRadius: theme.border.radiusSmall,
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        fontFamily: theme.typography.fontFamily,
        position: 'relative'
      }}
      {...props}
    >
      <span style={{ fontSize: '20px', flexShrink: 0 }}>{alertStyle.icon}</span>

      <div style={{ flex: 1 }}>
        {title && (
          <p
            style={{
              color: alertStyle.text,
              fontWeight: theme.typography.fontWeight.bold,
              margin: `0 0 ${theme.spacing.sm} 0`,
              fontSize: theme.typography.fontSize.base
            }}
          >
            {title}
          </p>
        )}

        <p
          style={{
            color: alertStyle.text,
            fontSize: theme.typography.fontSize.sm,
            margin: 0,
            lineHeight: theme.typography.lineHeight.normal
          }}
        >
          {children}
        </p>
      </div>

      {closeable && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: alertStyle.text,
            fontSize: '20px',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

// ============================================================================
// INPUT
// ============================================================================

export const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  label,
  disabled = false,
  size = 'md',
  ...props
}) => {
  const sizes = {
    sm: {
      padding: theme.spacing.sm,
      fontSize: theme.typography.fontSize.sm
    },
    md: {
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSize.base
    },
    lg: {
      padding: theme.spacing.lg,
      fontSize: theme.typography.fontSize.lg
    }
  };

  const sizeStyle = sizes[size] || sizes.md;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {label && (
        <label
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            fontFamily: theme.typography.fontFamily
          }}
        >
          {label}
        </label>
      )}

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...sizeStyle,
          background: disabled ? theme.colors.input.disabled : theme.colors.input.background,
          border: `2px solid ${error ? theme.colors.state.error : theme.colors.input.border}`,
          borderRadius: theme.border.radiusSmall,
          color: theme.colors.text.primary,
          fontFamily: theme.typography.fontFamily,
          outline: 'none',
          transition: theme.transition.fast,
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none'
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = error ? theme.colors.state.error : theme.colors.input.focus;
            e.target.style.boxShadow = `0 0 0 3px ${error ? theme.colors.state.error : theme.colors.input.focus}30`;
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? theme.colors.state.error : theme.colors.input.border;
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />

      {error && (
        <p
          style={{
            color: theme.colors.error.text,
            fontSize: theme.typography.fontSize.xs,
            margin: 0,
            fontFamily: theme.typography.fontFamily
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// BADGE
// ============================================================================

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const variants = {
    primary: {
      background: theme.colors.primary,
      color: theme.colors.secondary
    },
    success: {
      background: theme.colors.state.success,
      color: theme.colors.secondary
    },
    error: {
      background: theme.colors.state.error,
      color: theme.colors.secondary
    },
    warning: {
      background: theme.colors.state.warning,
      color: '#000'
    },
    info: {
      background: theme.colors.state.info,
      color: theme.colors.secondary
    },
    gray: {
      background: theme.colors.gray['300'],
      color: theme.colors.text.primary
    }
  };

  const sizes = {
    sm: {
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      fontSize: theme.typography.fontSize.xs
    },
    md: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: theme.typography.fontSize.sm
    },
    lg: {
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      fontSize: theme.typography.fontSize.base
    }
  };

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.md;

  return (
    <span
      style={{
        ...variantStyle,
        ...sizeStyle,
        borderRadius: theme.border.radiusFull,
        display: 'inline-block',
        fontFamily: theme.typography.fontFamily,
        fontWeight: theme.typography.fontWeight.semibold,
        whiteSpace: 'nowrap'
      }}
      {...props}
    >
      {children}
    </span>
  );
};

// ============================================================================
// DIVIDER
// ============================================================================

export const Divider = ({ color = 'light', margin = 'md', ...props }) => {
  const colors = {
    light: theme.colors.gray['200'],
    medium: theme.colors.gray['300'],
    dark: theme.colors.gray['400']
  };

  return (
    <hr
      style={{
        border: 'none',
        borderTop: `1px solid ${colors[color] || colors.light}`,
        margin: `${theme.spacing[margin] || theme.spacing.md} 0`,
        ...props
      }}
    />
  );
};

// ============================================================================
// CONTAINER
// ============================================================================

export const Container = ({
  children,
  maxWidth = 'lg',
  padding = 'md',
  ...props
}) => {
  const widths = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1200px',
    '2xl': '1400px'
  };

  const paddingSizes = {
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
    xl: theme.spacing.xl
  };

  return (
    <div
      style={{
        maxWidth: widths[maxWidth] || widths.lg,
        margin: '0 auto',
        padding: paddingSizes[padding] || paddingSizes.md,
        ...props
      }}
    >
      {children}
    </div>
  );
};

// ============================================================================
// GRID
// ============================================================================

export const Grid = ({
  children,
  columns = 3,
  gap = 'md',
  responsive = true,
  isMobile,
  ...props
}) => {
  const responsiveColumns = responsive && isMobile ? 1 : columns;
  const gapSize = theme.spacing[gap] || theme.spacing.md;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
        gap: gapSize,
        ...props
      }}
    >
      {children}
    </div>
  );
};

// ============================================================================
// FLEX
// ============================================================================

export const Flex = ({
  children,
  gap = 'md',
  direction = 'row',
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  ...props
}) => {
  const gapSize = theme.spacing[gap] || theme.spacing.md;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: gapSize,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...props
      }}
    >
      {children}
    </div>
  );
};
