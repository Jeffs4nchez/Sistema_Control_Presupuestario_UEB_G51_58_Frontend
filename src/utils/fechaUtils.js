const TZ = 'America/Guayaquil'

/**
 * Devuelve la fecha actual en Ecuador como string YYYY-MM-DD.
 * Evita el bug de toISOString() que usa UTC y puede dar el día incorrecto.
 */
export function fechaHoy() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

/**
 * Parsea un string de fecha/hora que viene del backend (ya en hora Ecuador)
 * y lo formatea de forma legible: DD/MM/YYYY HH:MM:SS
 */
export function formatFechaHora(str) {
  if (!str) return '—'
  // El backend envía strings sin sufijo de zona (p.ej. "2026-06-01 03:15:00")
  // Los tratamos como Ecuador appending el offset fijo UTC-5
  const normalized = str.replace(' ', 'T')
  const hasTZ = normalized.includes('+') || normalized.includes('Z')
  const d = new Date(hasTZ ? normalized : normalized + '-05:00')
  if (isNaN(d)) return str
  return d.toLocaleString('es-EC', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

/**
 * Parsea un string de fecha YYYY-MM-DD y lo formatea como DD/MM/YYYY.
 * Usa mediodía para evitar el bug de UTC midnight que cambia el día.
 */
export function formatFecha(str) {
  if (!str) return '—'
  const d = new Date(str + 'T12:00:00-05:00')
  if (isNaN(d)) return str
  return d.toLocaleDateString('es-EC', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
}

/**
 * Parsea una fecha del backend para cálculos internos (p.ej. agrupar por mes).
 * Retorna un Date object correcto en Ecuador.
 */
export function parseDate(str) {
  if (!str) return null
  const d = new Date(str.includes('T') ? str + (str.includes('+') || str.includes('Z') ? '' : '-05:00') : str + 'T12:00:00-05:00')
  return isNaN(d) ? null : d
}
