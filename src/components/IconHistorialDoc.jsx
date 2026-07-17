export default function IconHistorialDoc({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Documento */}
      <rect x="6" y="4" width="12" height="16" rx="2" ry="2" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
      <line x1="9" y1="9"  x2="11" y2="9"  />
      {/* Reloj encima del documento (esquina superior derecha) */}
      <circle cx="16" cy="6" r="3.5" fill="white" stroke={color} strokeWidth="1.6" />
      <line x1="16" y1="4.5" x2="16" y2="6"   strokeWidth="1.4" />
      <line x1="16" y1="6"   x2="17.2" y2="6.8" strokeWidth="1.4" />
    </svg>
  )
}
