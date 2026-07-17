import { useState } from 'react'
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { theme } from '../config/theme'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const CARD   = theme.colors.dark['800']
const BORDER = theme.colors.dark['700']
const ELEV   = theme.colors.dark['600']
const ACCENT = theme.colors.accent.blue
const GREEN  = theme.colors.accent.green
const RED    = '#ff6b7a'
const GOLD   = theme.colors.accent.gold
const TEXT   = 'rgba(255,255,255,0.88)'
const MUTED  = 'rgba(255,255,255,0.45)'

const INPUT_S = {
  width: '100%',
  padding: '9px 36px 9px 11px',
  background: ELEV,
  border: `1px solid ${BORDER}`,
  borderRadius: theme.border.radiusMd,
  color: TEXT,
  fontSize: '13px',
  fontFamily: theme.typography.fontFamily,
  outline: 'none',
  boxSizing: 'border-box',
}

const LABEL_S = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: MUTED,
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={LABEL_S}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Lock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          style={{ ...INPUT_S, paddingLeft: '32px' }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: 0, display: 'flex' }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  )
}

function Requisito({ ok, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: ok ? GREEN : MUTED }}>
      <CheckCircle size={12} style={{ opacity: ok ? 1 : 0.3 }} />
      {text}
    </div>
  )
}

export default function CambiarContrasena() {
  const navigate  = useNavigate()
  const { user, updateUser } = useAuth()
  const esObligatoria = !!user?.contrasena_temporal

  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [ok,     setOk]     = useState(false)

  const set = (key) => (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setError('') }

  const nuevaOk    = form.nueva.length >= 8
  const coincide   = form.nueva === form.confirmar && form.confirmar.length > 0
  const puedeEnviar = form.actual && nuevaOk && coincide

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!puedeEnviar) return
    setSaving(true)
    setError('')
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${API}/change-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contrasena_actual:    form.actual,
          nueva_contrasena:     form.nueva,
          confirmar_contrasena: form.confirmar,
        }),
      })
      const json = await res.json()
      if (json.status === 'success') {
        setOk(true)
        updateUser({ contrasena_temporal: false })
        setForm({ actual: '', nueva: '', confirmar: '' })
        // Si era obligatoria, redirigir al inicio después de 1.5s
        if (esObligatoria) setTimeout(() => navigate('/dashboard'), 1500)
      } else {
        setError(json.message || 'Error al cambiar la contraseña.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: theme.colors.dark['900'], minHeight: '100%', padding: '28px', fontFamily: theme.typography.fontFamily }}>

      {/* Alerta si la contraseña es temporal (obligatorio cambiar) */}
      {esObligatoria && !ok && (
        <div style={{ background: 'rgba(217,119,6,0.10)', border: `1px solid rgba(217,119,6,0.35)`, borderRadius: theme.border.radiusMd, padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <AlertCircle size={16} color={GOLD} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: GOLD, marginBottom: '2px' }}>Cambio de contraseña obligatorio</div>
            <div style={{ fontSize: '12px', color: 'rgba(251,191,36,0.8)' }}>
              Tu cuenta fue creada con una contraseña temporal. Debes establecer una nueva contraseña antes de continuar.
            </div>
          </div>
        </div>
      )}

      {/* Título */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <ShieldCheck size={20} color={ACCENT} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: TEXT, letterSpacing: '-0.02em' }}>
            Cambiar Contraseña
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>
          Actualiza tu contraseña para mantener tu cuenta segura.
        </p>
      </div>

      <div style={{ maxWidth: '480px' }}>

        {/* Éxito */}
        {ok && (
          <div style={{ background: 'rgba(16,185,129,0.10)', border: `1px solid rgba(16,185,129,0.3)`, borderRadius: theme.border.radiusMd, padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={18} color={GREEN} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: GREEN }}>¡Contraseña actualizada!</div>
              {esObligatoria && <div style={{ fontSize: '12px', color: 'rgba(52,211,153,0.8)', marginTop: '2px' }}>Redirigiendo al sistema...</div>}
            </div>
          </div>
        )}

        {/* Formulario */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: theme.border.radiusMd, padding: '24px' }}>

          {/* Info usuario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: ELEV, borderRadius: theme.border.radiusMd, border: `1px solid ${BORDER}`, marginBottom: '20px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}, ${theme.colors.primary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{user?.nombres} {user?.apellidos}</div>
              <div style={{ fontSize: '11px', color: MUTED }}>{user?.correo_institucional}</div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(196,30,58,0.10)', border: `1px solid rgba(196,30,58,0.35)`, borderRadius: theme.border.radiusMd, padding: '10px 13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: RED }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <PasswordField label="Contraseña actual *" value={form.actual}    onChange={set('actual')}    placeholder="Tu contraseña actual" />
            <PasswordField label="Nueva contraseña *"  value={form.nueva}     onChange={set('nueva')}     placeholder="Mínimo 8 caracteres" />
            <PasswordField label="Confirmar contraseña *" value={form.confirmar} onChange={set('confirmar')} placeholder="Repite la nueva contraseña" />

            {/* Requisitos en tiempo real */}
            {(form.nueva || form.confirmar) && (
              <div style={{ background: ELEV, border: `1px solid ${BORDER}`, borderRadius: theme.border.radiusMd, padding: '10px 12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <Requisito ok={nuevaOk} text="Mínimo 8 caracteres" />
                <Requisito ok={coincide} text="Las contraseñas coinciden" />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              {!esObligatoria && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{ flex: 1, padding: '9px', background: ELEV, color: MUTED, border: `1px solid ${BORDER}`, borderRadius: theme.border.radiusMd, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: theme.typography.fontFamily }}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving || !puedeEnviar || ok}
                style={{ flex: 2, padding: '9px', background: (saving || !puedeEnviar || ok) ? ELEV : ACCENT, color: (saving || !puedeEnviar || ok) ? MUTED : '#fff', border: 'none', borderRadius: theme.border.radiusMd, cursor: (saving || !puedeEnviar || ok) ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: theme.typography.fontFamily }}
              >
                {saving ? 'Guardando...' : ok ? 'Contraseña cambiada ✓' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
