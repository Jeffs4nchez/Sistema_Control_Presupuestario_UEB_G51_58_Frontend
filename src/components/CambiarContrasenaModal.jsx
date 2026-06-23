import { useState } from 'react'
import Cookies from 'js-cookie'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck, X } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const inputStyle = {
  width: '100%', padding: '9px 36px 9px 32px',
  background: '#f8fafd',
  border: '1px solid rgba(46,108,164,0.22)',
  borderRadius: '8px',
  color: '#1a3a5c', fontSize: '13px',
  fontFamily: 'var(--font-primary)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#5a7a9f', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-primary)' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Lock size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8fa3c0', pointerEvents: 'none' }} />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8fa3c0', cursor: 'pointer', padding: 0, display: 'flex' }}
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </div>
  )
}

export default function CambiarContrasenaModal({ onClose }) {
  const { user, updateUser } = useAuth()
  const esObligatoria = !!user?.contrasena_temporal

  const [form, setForm]   = useState({ actual: '', nueva: '', confirmar: '' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [ok,     setOk]     = useState(false)

  const set = (key) => (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setError('') }

  const tieneMinimo8   = form.nueva.length >= 8
  const tieneMayuscula = /[A-Z]/.test(form.nueva)
  const tieneNumero    = /[0-9]/.test(form.nueva)
  const tieneEspecial  = /[^a-zA-Z0-9]/.test(form.nueva)
  const nuevaOk  = tieneMinimo8 && tieneMayuscula && tieneNumero && tieneEspecial
  const coincide = form.nueva === form.confirmar && form.confirmar.length > 0
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
        setTimeout(() => onClose(), 1500)
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={esObligatoria ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,30,55,0.55)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          fontFamily: 'var(--font-primary)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 22px',
          background: 'linear-gradient(135deg, #0d1f35, #1a3a5c)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={18} color="#54b3e0" />
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Cambiar Contraseña</span>
          </div>
          {!esObligatoria && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.10)', border: 'none',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                width: '28px', height: '28px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ padding: '22px' }}>
          {/* Aviso contraseña temporal */}
          {esObligatoria && (
            <div style={{
              background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.22)',
              borderRadius: '10px', padding: '10px 13px', marginBottom: '16px',
              display: 'flex', gap: '9px', alignItems: 'flex-start',
            }}>
              <AlertCircle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '12px', color: '#b45309', lineHeight: 1.5 }}>
                Tu cuenta tiene una contraseña temporal. Debes cambiarla para continuar.
              </span>
            </div>
          )}

          {/* Éxito */}
          <AnimatePresence>
            {ok && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.22)',
                  borderRadius: '10px', padding: '10px 13px', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '9px',
                }}
              >
                <CheckCircle size={14} color="#059669" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#047857' }}>¡Contraseña actualizada correctamente!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  background: 'rgba(139,15,15,0.08)', border: '1px solid rgba(139,15,15,0.22)',
                  borderRadius: '10px', padding: '10px 13px', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <AlertCircle size={13} color="#b91c1c" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#b91c1c' }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <PasswordField label="Contraseña actual *"    value={form.actual}    onChange={set('actual')}    placeholder="Tu contraseña actual" />
            <PasswordField label="Nueva contraseña *"     value={form.nueva}     onChange={set('nueva')}     placeholder="Mínimo 8 caracteres" />
            <PasswordField label="Confirmar contraseña *" value={form.confirmar} onChange={set('confirmar')} placeholder="Repite la nueva contraseña" />

            {/* Real-time requirements */}
            {(form.nueva || form.confirmar) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  background: 'rgba(240,244,248,0.8)',
                  border: '1px solid rgba(26,58,92,0.10)',
                  borderRadius: '8px', padding: '9px 12px',
                  marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '5px',
                }}
              >
                {[
                  { ok: tieneMinimo8,   text: 'Mínimo 8 caracteres' },
                  { ok: tieneMayuscula, text: 'Al menos una letra mayúscula' },
                  { ok: tieneNumero,    text: 'Al menos un número' },
                  { ok: tieneEspecial,  text: 'Al menos un carácter especial (!@#$...)' },
                  { ok: coincide,       text: 'Las contraseñas coinciden' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: r.ok ? '#059669' : '#8fa3c0', fontWeight: r.ok ? 700 : 500 }}>
                    <CheckCircle size={11} style={{ opacity: r.ok ? 1 : 0.3 }} color={r.ok ? '#059669' : '#8fa3c0'} />
                    {r.text}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {!esObligatoria && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '9px',
                    background: 'rgba(26,58,92,0.06)',
                    color: '#5a7a9f',
                    border: '1px solid rgba(26,58,92,0.12)',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 600,
                    fontFamily: 'var(--font-primary)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26,58,92,0.10)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(26,58,92,0.06)'; }}
                >
                  Cancelar
                </button>
              )}
              <motion.button
                whileHover={!saving && puedeEnviar && !ok ? { scale: 1.02, boxShadow: '0 8px 24px rgba(26,58,92,0.30)' } : {}}
                whileTap={!saving && puedeEnviar && !ok ? { scale: 0.98 } : {}}
                type="submit"
                disabled={saving || !puedeEnviar || ok}
                style={{
                  flex: 2, padding: '9px',
                  background: (saving || !puedeEnviar || ok)
                    ? 'rgba(26,58,92,0.08)'
                    : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)',
                  color: (saving || !puedeEnviar || ok) ? '#8fa3c0' : '#fff',
                  border: 'none', borderRadius: '8px',
                  cursor: (saving || !puedeEnviar || ok) ? 'default' : 'pointer',
                  fontSize: '13px', fontWeight: 700,
                  fontFamily: 'var(--font-primary)',
                  boxShadow: (saving || !puedeEnviar || ok) ? 'none' : '0 4px 16px rgba(26,58,92,0.25)',
                  transition: 'all 0.18s ease',
                }}
              >
                {saving ? 'Guardando...' : ok ? '¡Contraseña cambiada!' : 'Cambiar Contraseña'}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}
