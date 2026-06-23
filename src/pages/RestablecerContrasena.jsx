import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { theme, createGradient } from '../config/theme'
import logoSNC from '../assets/logo.webp'
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const ACCENT = theme.colors.accent?.blue || '#2563eb'
const GREEN  = theme.colors.accent?.green || '#10b981'
const RED    = '#ff6b7a'

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  const isMobile = window.innerWidth < 768
  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '110px 1fr' : '160px 1fr',
        alignItems: 'center',
        gap: isMobile ? '6px' : '8px',
      }}>
        <label style={{
          fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          textAlign: isMobile ? 'left' : 'right',
        }}>
          <span style={{ color: theme.colors.text.error, marginRight: '4px' }}>*</span>
          {label}:
        </label>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required
            style={{
              background: theme.colors.input.background,
              border: `2px solid ${theme.colors.input.border}`,
              borderRadius: theme.border.radiusSmall,
              padding: isMobile ? '8px 36px 8px 10px' : '6px 36px 6px 12px',
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
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute', right: '10px', top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              color: '#666', cursor: 'pointer', padding: 0, display: 'flex',
            }}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RestablecerContrasena() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form,    setForm]    = useState({ nueva: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const [ok,      setOk]      = useState(false)
  const [error,   setError]   = useState('')
  const isMobile = window.innerWidth < 768

  useEffect(() => {
    if (!token) {
      setError('El enlace de recuperación no es válido. Solicita uno nuevo.')
    }
  }, [token])

  const set = (key) => (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setError('') }

  const tieneMinimo8   = form.nueva.length >= 8
  const tieneMayuscula = /[A-Z]/.test(form.nueva)
  const tieneNumero    = /[0-9]/.test(form.nueva)
  const tieneEspecial  = /[^a-zA-Z0-9]/.test(form.nueva)
  const nuevaOk  = tieneMinimo8 && tieneMayuscula && tieneNumero && tieneEspecial
  const coincide = form.nueva === form.confirmar && form.confirmar.length > 0
  const puedeEnviar = token && nuevaOk && coincide

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!puedeEnviar) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`${API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nueva_contrasena:     form.nueva,
          confirmar_contrasena: form.confirmar,
        }),
      })
      const json = await res.json()
      if (json.status === 'success') {
        setOk(true)
        setTimeout(() => navigate('/login'), 2500)
      } else {
        setError(json.message || 'Error al restablecer la contraseña.')
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
      padding: theme.spacing.md,
      fontFamily: theme.typography.fontFamily,
      background: createGradient({
        start: theme.colors.primary,
        startPercent: isMobile ? 43 : 50,
        end: theme.colors.secondary,
        endPercent: isMobile ? 43 : 50,
      }, 110, isMobile),
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? theme.components.login.containerMobile.maxWidth : theme.components.login.containerDesktop.maxWidth,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        borderRadius: theme.border.radius,
        boxShadow: theme.shadow.lg,
      }}>
        {/* Logo */}
        <div style={{
          width: isMobile ? '100%' : '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'center' : 'flex-end',
          padding: isMobile ? `${theme.spacing.lg} ${theme.spacing.md}` : theme.spacing['3xl'],
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
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: isMobile ? `4rem ${theme.spacing.lg} ${theme.spacing.lg}` : theme.spacing['4xl'],
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Lock size={20} color={ACCENT} />
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? theme.typography.fontSize.lg : theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.light,
              color: theme.colors.text.primary,
              letterSpacing: '0.5px',
            }}>
              Nueva Contraseña
            </h2>
          </div>
          <p style={{ margin: '0 0 24px', fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
            Establece tu nueva contraseña para ingresar al sistema.
          </p>

          {ok ? (
            <div style={{
              background: 'rgba(16,185,129,0.10)',
              border: `1px solid rgba(16,185,129,0.35)`,
              borderRadius: theme.border.radiusSmall,
              padding: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}>
              <CheckCircle size={18} color={GREEN} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: GREEN, marginBottom: '4px' }}>
                  ¡Contraseña restablecida!
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(52,211,153,0.85)' }}>
                  Serás redirigido al inicio de sesión en unos segundos...
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

              {token && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                  <PasswordField label="Nueva contraseña"    value={form.nueva}     onChange={set('nueva')}     placeholder="Mínimo 8 caracteres" />
                  <PasswordField label="Confirmar contraseña" value={form.confirmar} onChange={set('confirmar')} placeholder="Repite la nueva contraseña" />

                  {(form.nueva || form.confirmar) && (
                    <div style={{
                      background: '#f8fafc',
                      border: `1px solid #e2e8f0`,
                      borderRadius: theme.border.radiusSmall,
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}>
                      {[
                        { ok: tieneMinimo8,   text: 'Mínimo 8 caracteres' },
                        { ok: tieneMayuscula, text: 'Al menos una letra mayúscula' },
                        { ok: tieneNumero,    text: 'Al menos un número' },
                        { ok: tieneEspecial,  text: 'Al menos un carácter especial (!@#$...)' },
                        { ok: coincide,       text: 'Las contraseñas coinciden' },
                      ].map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: r.ok ? GREEN : '#94a3b8' }}>
                          <CheckCircle size={11} style={{ opacity: r.ok ? 1 : 0.4 }} />
                          {r.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'stretch' : 'flex-end' }}>
                    <button
                      type="submit"
                      disabled={loading || !puedeEnviar}
                      style={{
                        background: (loading || !puedeEnviar) ? theme.colors.text.light : theme.colors.input.focus,
                        color: theme.colors.secondary,
                        padding: isMobile ? `10px ${theme.spacing.lg}` : '7px 1.75rem',
                        borderRadius: theme.border.radiusSmall,
                        border: 'none',
                        fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        cursor: (loading || !puedeEnviar) ? 'not-allowed' : 'pointer',
                        boxShadow: theme.shadow.sm,
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      {loading ? 'Guardando...' : 'Establecer contraseña'}
                    </button>
                  </div>
                </form>
              )}
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
