import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { theme, createGradient } from '../config/theme'
import logoSNC from '../assets/logo.webp'
import { Mail, ArrowLeft, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const ACCENT = theme.colors.accent?.blue || '#2563eb'
const GREEN  = theme.colors.accent?.green || '#10b981'
const RED    = '#ff6b7a'

export default function RecuperarContrasena() {
  const navigate = useNavigate()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const checkMobile = () => window.innerWidth < 768 || window.innerHeight < 600
  const [isMobile, setIsMobile] = useState(checkMobile())
  useEffect(() => {
    const fn = () => setIsMobile(checkMobile())
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`${API}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.status === 'success') {
        setSent(true)
      } else {
        setError(json.message || 'Error al procesar la solicitud.')
      }
    } catch {
      setError('Error de conexión. Verifica tu red e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? theme.spacing.lg : theme.spacing.md,
      fontFamily: theme.typography.fontFamily,
      background: isMobile
        ? `linear-gradient(180deg, ${theme.colors.primary} 43%, #ffffff 43%)`
        : createGradient({ start: theme.colors.primary, startPercent: 50, end: theme.colors.secondary, endPercent: 50 }, 110, false),
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '400px' : theme.components.login.containerDesktop.maxWidth,
        minHeight: isMobile ? '82vh' : theme.components.login.containerDesktop.minHeight,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        borderRadius: isMobile ? '18px' : theme.border.radius,
        boxShadow: theme.shadow.lg,
        overflow: isMobile ? 'hidden' : undefined,
      }}>
        {/* Logo */}
        <div style={{
          width: isMobile ? '100%' : '50%',
          minHeight: isMobile ? '180px' : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'center' : 'flex-end',
          padding: isMobile ? `${theme.spacing.xl} ${theme.spacing.md}` : theme.spacing['3xl'],
        }}>
          <img
            src={logoSNC} alt="UEB"
            style={{
              width: '100%',
              maxWidth: isMobile ? theme.components.login.logoMaxWidth.mobile : theme.components.login.logoMaxWidth.desktop,
              filter: `drop-shadow(${theme.shadow.drop})`,
            }}
          />
        </div>

        {/* Panel */}
        <div style={{
          width: isMobile ? '100%' : '50%',
          flex: isMobile ? '1' : undefined,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: isMobile ? `${theme.spacing.xl} ${theme.spacing.lg} ${theme.spacing.lg}` : theme.spacing['4xl'],
          borderRadius: '0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={20} color={ACCENT} />
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? theme.typography.fontSize.lg : theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.light,
              color: theme.colors.text.primary,
              letterSpacing: '0.5px',
            }}>
              Recuperar Contraseña
            </h2>
          </div>
          <p style={{ margin: '0 0 24px', fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
            Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {sent ? (
            <div style={{
              background: 'rgba(16,185,129,0.10)',
              border: `1px solid rgba(16,185,129,0.35)`,
              borderRadius: theme.border.radiusSmall,
              padding: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              marginBottom: '20px',
            }}>
              <CheckCircle size={18} color={GREEN} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: GREEN, marginBottom: '4px' }}>
                  Correo enviado
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(52,211,153,0.85)', lineHeight: '1.5' }}>
                  Si tu correo está registrado, recibirás un enlace válido por 30 minutos.
                  Revisa también tu carpeta de spam.
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: `2px solid ${theme.colors.error?.border || '#fca5a5'}`,
                  borderRadius: theme.border.radiusSmall,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}>
                  <AlertCircle size={15} color={RED} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.error?.text || '#b91c1c' }}>
                    {error}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '90px 1fr' : '140px 1fr',
                    alignItems: 'flex-start',
                    gap: isMobile ? '6px' : '8px',
                  }}>
                    <label style={{
                      fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                      textAlign: isMobile ? 'left' : 'right',
                      paddingTop: '8px',
                    }}>
                      <span style={{ color: theme.colors.text.error, marginRight: '4px' }}>*</span>
                      Correo:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="tu@correo.ueb.edu.ec"
                      required
                      style={{
                        background: theme.colors.input.background,
                        border: `2px solid ${theme.colors.input.border}`,
                        borderRadius: theme.border.radiusSmall,
                        padding: isMobile ? '8px 10px' : '6px 12px',
                        fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#333',
                        fontFamily: 'inherit',
                        width: '100%',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = theme.colors.input.focus }}
                      onBlur={(e) => { e.target.style.borderColor = theme.colors.input.border }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    style={{
                      background: (loading || !email.trim()) ? theme.colors.text.light : theme.colors.input.focus,
                      color: theme.colors.secondary,
                      padding: isMobile ? `10px ${theme.spacing.lg}` : '7px 1.75rem',
                      borderRadius: theme.border.radiusSmall,
                      border: 'none',
                      fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      cursor: (loading || !email.trim()) ? 'not-allowed' : 'pointer',
                      boxShadow: theme.shadow.sm,
                      width: isMobile ? '100%' : 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Mail size={14} />
                    {loading ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </div>
              </form>
            </>
          )}

          <button
            onClick={() => navigate('/login')}
            style={{
              marginTop: '20px',
              background: 'none',
              border: 'none',
              color: '#0000ee',
              fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
              cursor: 'pointer',
              textAlign: isMobile ? 'center' : 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            <ArrowLeft size={13} />
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}
