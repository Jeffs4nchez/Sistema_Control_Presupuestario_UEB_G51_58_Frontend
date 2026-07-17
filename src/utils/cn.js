/**
 * Función para mezclar clases CSS de forma segura
 * Similar a clsx + tailwind-merge pero sin dependencias externas
 */
export function cn(...classes) {
  return classes
    .filter((c) => c && typeof c === 'string')
    .join(' ')
    .trim();
}
