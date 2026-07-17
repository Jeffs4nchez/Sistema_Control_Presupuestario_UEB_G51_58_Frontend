/**
 * Estilos Globales de Página - Reutilizables
 * 
 * Contiene estilos comunes para todas las páginas
 * para mantener consistencia con el tema UEB
 */

import { theme } from './theme';

export const PageStyles = {
  // Contenedor de página
  container: {
    padding: theme.spacing.lg,
    background: theme.colors.secondary,
    borderRadius: theme.border.radiusMd,
    boxShadow: theme.shadow.md,
    fontFamily: theme.typography.fontFamily,
  },

  // Título de página
  pageTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  },

  // Subtítulo
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },

  // Sección
  section: {
    marginBottom: theme.spacing.xl,
  },

  // Encabezado de sección
  sectionHeader: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottom: `2px solid ${theme.colors.primary}`,
    fontFamily: theme.typography.fontFamily,
  },

  // Grid de contenido
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  // Tabla
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: theme.typography.fontFamily,
  },

  tableHeader: {
    background: theme.colors.primary,
    color: theme.colors.secondary,
  },

  tableCell: {
    padding: theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.gray['200']}`,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },

  tableRow: {
    '&:hover': {
      background: theme.colors.gray['100'],
    },
  },

  // Botones de acción
  buttonGroup: {
    display: 'flex',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },

  // Formulario
  formGroup: {
    marginBottom: theme.spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },

  formLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },

  // Alert/Notificación
  alert: (type = 'info') => {
    const typeMap = {
      success: {
        background: theme.colors.success.light,
        border: theme.colors.state.success,
        text: theme.colors.success.text,
      },
      error: {
        background: theme.colors.error.light,
        border: theme.colors.state.error,
        text: theme.colors.error.text,
      },
      warning: {
        background: theme.colors.warning.light,
        border: theme.colors.state.warning,
        text: theme.colors.warning.text,
      },
      info: {
        background: theme.colors.info.light,
        border: theme.colors.state.info,
        text: theme.colors.info.text,
      },
    };

    const style = typeMap[type] || typeMap.info;

    return {
      background: style.background,
      border: `2px solid ${style.border}`,
      borderRadius: theme.border.radiusSmall,
      padding: theme.spacing.md,
      color: style.text,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
    };
  },

  // Card
  card: {
    background: theme.colors.secondary,
    border: `1px solid ${theme.colors.gray['200']}`,
    borderRadius: theme.border.radiusMd,
    padding: theme.spacing.lg,
    boxShadow: theme.shadow.md,
    fontFamily: theme.typography.fontFamily,
  },

  // Carga
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    minHeight: '200px',
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing.xl,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
  },
};

export default PageStyles;
