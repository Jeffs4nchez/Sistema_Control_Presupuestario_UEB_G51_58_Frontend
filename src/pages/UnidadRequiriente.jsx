import { useState, useEffect, useCallback } from 'react'
import Cookies from 'js-cookie'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Plus, Search, RefreshCw, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react'
import { cachedFetch, invalidateCache } from '../utils/apiCache'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT = '#2e6ca4'
const GREEN  = '#059669'
const RED    = '#b91c1c'
const TEXT   = '#1a3a5c'
const MUTED  = '#5a7a9f'

const INPUT_S = {
  padding: '8px 11px',
  background: BG,
  border: '1px solid rgba(46,108,164,0.22)',
  borderRadius: '8px',
  color: TEXT,
  fontSize: '13px',
  fontFamily: 'var(--font-primary)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const LABEL_S = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: MUTED, marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

const EMPTY_FORM = { nombre_entidad: '', responsable_entidad: '', correo_institucional: '' }

function SkeletonUnidadesRows() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="ueb-table">
        <thead>
          <tr>
            {['Unidad', 'Responsable', 'Correo Institucional', 'Acciones'].map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4].map(i => (
            <tr key={i}>
              <td><div className="skeleton" style={{ width: '160px', height: '13px', borderRadius: '6px' }} /></td>
              <td><div className="skeleton" style={{ width: '120px', height: '12px', borderRadius: '6px' }} /></td>
              <td><div className="skeleton" style={{ width: '180px', height: '12px', borderRadius: '6px' }} /></td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div className="skeleton" style={{ width: '62px', height: '28px', borderRadius: '6px' }} />
                  <div className="skeleton" style={{ width: '70px', height: '28px', borderRadius: '6px' }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function UnidadRequiriente() {
  const [unidades,   setUnidades]   = useState([])
  const [loading,    setLoading]    = useState(false)
  const [search,     setSearch]     = useState('')
  const [modal,      setModal]      = useState({ open: false, mode: 'create', id: null })
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [formError,  setFormError]  = useState('')
  const [formOk,     setFormOk]     = useState('')
  const [deleteId,   setDeleteId]   = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  const headers = () => ({ Authorization: `Bearer ${Cookies.get('auth_token')}`, 'Content-Type': 'application/json' })

  const fetchUnidades = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const res  = await cachedFetch(`${API}/unidades-requirientes?search=${encodeURIComponent(q)}`, { headers: headers() })
      const json = await res.json()
      if (json.success) setUnidades(json.data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUnidades() }, [fetchUnidades])

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(''); setFormOk(''); setModal({ open: true, mode: 'create', id: null }) }
  const openEdit   = (u) => {
    setForm({ nombre_entidad: u.nombre_entidad || '', responsable_entidad: u.responsable_entidad || '', correo_institucional: u.correo_institucional || '' })
    setFormError(''); setFormOk('')
    setModal({ open: true, mode: 'edit', id: u.id_unidad_requiriente })
  }
  const closeModal = () => { setModal({ open: false, mode: 'create', id: null }); setFormError(''); setFormOk('') }

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(''); setFormOk(''); setSaving(true)
    if (!form.correo_institucional.toLowerCase().endsWith('@ueb.edu.ec')) {
      setFormError('El correo debe pertenecer al dominio @ueb.edu.ec.')
      setSaving(false)
      return
    }
    try {
      const url    = modal.mode === 'create' ? `${API}/unidades-requirientes` : `${API}/unidades-requirientes/${modal.id}`
      const method = modal.mode === 'create' ? 'POST' : 'PUT'
      const res  = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) })
      const json = await res.json()
      if (json.success) {
        invalidateCache('/unidades-requirientes')
        fetchUnidades(search)
        setFormOk(json.message || 'Guardado exitosamente.')
        setTimeout(() => closeModal(), 1200)
      } else { setFormError(json.message || 'Error al guardar.') }
    } catch { setFormError('Error de conexión.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res  = await fetch(`${API}/unidades-requirientes/${deleteId}`, { method: 'DELETE', headers: headers() })
      const json = await res.json()
      if (json.success) { setDeleteId(null); invalidateCache('/unidades-requirientes'); fetchUnidades(search) }
    } catch { /* silent */ }
    finally { setDeleting(false) }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)', fontFamily: 'var(--font-primary)' }}>

      {/* Page header */}
      <div style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(26,58,92,0.08)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)', padding: '20px 28px', marginBottom: '24px' }}>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(46,108,164,0.10)', border: '1px solid rgba(46,108,164,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color={ACCENT} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>Unidades Requirientes</h1>
              <p style={{ margin: 0, fontSize: '12px', color: MUTED }}>Organismos que solicitan certificaciones presupuestarias.</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(26,58,92,0.30)' }} whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', boxShadow: '0 4px 16px rgba(26,58,92,0.25)' }}
          >
            <Plus size={15} /> Nueva Unidad
          </motion.button>
        </motion.div>
      </div>

      <div style={{ padding: '0 28px 28px' }}>
        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', marginBottom: '16px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
        >
          <form onSubmit={e => { e.preventDefault(); fetchUnidades(search) }} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={LABEL_S}>Buscar unidad</label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value.slice(0, 100))} maxLength={100} placeholder="Nombre, responsable o correo..."
                  style={{ ...INPUT_S, paddingLeft: '28px' }}
                  onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
              style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', whiteSpace: 'nowrap', boxShadow: '0 3px 12px rgba(26,58,92,0.20)' }}
            >
              Buscar
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => { setSearch(''); fetchUnidades('') }}
              style={{ padding: '8px 12px', background: 'rgba(26,58,92,0.06)', color: MUTED, border: '1px solid rgba(26,58,92,0.12)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <RefreshCw size={13} />
            </motion.button>
          </form>
          {!loading && <div style={{ marginTop: '8px', fontSize: '12px', color: MUTED }}>{unidades.length} unidad(es) registrada(s)</div>}
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
        >
          {loading ? (
            <SkeletonUnidadesRows />
          ) : unidades.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: MUTED, fontSize: '13px' }}>
              No hay unidades registradas.{' '}
              <button onClick={openCreate} style={{ color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontSize: '13px', textDecoration: 'underline' }}>
                Crear la primera
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ueb-table">
                <thead>
                  <tr>
                    {['Unidad', 'Responsable', 'Correo Institucional', 'Acciones'].map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unidades.map((unidad, idx) => (
                    <motion.tr key={unidad.id_unidad_requiriente}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.22 }}
                    >
                      <td style={{ fontWeight: 600, color: TEXT }}>{unidad.nombre_entidad}</td>
                      <td>{unidad.responsable_entidad}</td>
                      <td style={{ color: MUTED }}>{unidad.correo_institucional}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => openEdit(unidad)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'rgba(46,108,164,0.10)', border: '1px solid rgba(46,108,164,0.25)', borderRadius: '6px', color: ACCENT, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-primary)' }}
                          >
                            <Edit2 size={11} /> Editar
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setDeleteId(unidad.id_unidad_requiriente)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'rgba(185,28,28,0.10)', border: '1px solid rgba(185,28,28,0.25)', borderRadius: '6px', color: RED, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-primary)' }}
                          >
                            <Trash2 size={11} /> Eliminar
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Crear / Editar */}
      <AnimatePresence>
        {modal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
          >
            <motion.div initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden', fontFamily: 'var(--font-primary)' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'linear-gradient(135deg, #0d1f35, #1a3a5c)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={16} color="#54b3e0" />
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                    {modal.mode === 'create' ? 'Nueva Unidad Requiriente' : 'Editar Unidad'}
                  </span>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={closeModal}
                  style={{ background: 'rgba(255,255,255,0.10)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </motion.button>
              </div>

              <div style={{ padding: '22px' }}>
                <AnimatePresence>
                  {formError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '10px', padding: '10px 13px', marginBottom: '14px', color: RED, fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}
                    >
                      <AlertCircle size={13} /> {formError}
                    </motion.div>
                  )}
                  {formOk && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.22)', borderRadius: '10px', padding: '10px 13px', marginBottom: '14px', color: GREEN, fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}
                    >
                      <Check size={13} /> {formOk}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'Nombre de la unidad *', key: 'nombre_entidad',       type: 'text',  placeholder: 'Ej: Dirección Financiera',        max: 100 },
                      { label: 'Responsable *',          key: 'responsable_entidad',  type: 'text',  placeholder: 'Nombre completo del responsable',  max: 80  },
                      { label: 'Correo institucional *', key: 'correo_institucional', type: 'email', placeholder: 'correo@ueb.edu.ec',               max: 60  },
                    ].map(({ label, key, type, placeholder, max }) => (
                      <div key={key}>
                        <label style={LABEL_S}>{label}</label>
                        <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value.slice(0, max) }))}
                          placeholder={placeholder} maxLength={max}
                          required style={INPUT_S}
                          onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                    <button type="button" onClick={closeModal}
                      style={{ flex: 1, padding: '9px', background: 'rgba(26,58,92,0.06)', color: MUTED, border: '1px solid rgba(26,58,92,0.12)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-primary)' }}
                    >
                      Cancelar
                    </button>
                    <motion.button whileHover={!saving ? { scale: 1.02, boxShadow: '0 8px 24px rgba(26,58,92,0.30)' } : {}} whileTap={!saving ? { scale: 0.98 } : {}}
                      type="submit" disabled={saving}
                      style={{ flex: 2, padding: '9px', background: saving ? 'rgba(26,58,92,0.08)' : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: saving ? MUTED : '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', boxShadow: saving ? 'none' : '0 4px 16px rgba(26,58,92,0.25)', transition: 'all 0.18s ease' }}
                    >
                      {saving ? 'Guardando...' : modal.mode === 'create' ? 'Crear Unidad' : 'Guardar Cambios'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Confirmar Eliminar */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
          >
            <motion.div initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '380px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}
            >
              <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #6b0f0f, #b91c1c)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trash2 size={16} color="#fff" />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Eliminar Unidad</span>
              </div>
              <div style={{ padding: '22px' }}>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>
                  ¿Está seguro? Esta acción no se puede deshacer. Si la unidad tiene certificaciones asociadas, no podrá eliminarse.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '9px', background: 'rgba(26,58,92,0.06)', color: MUTED, border: '1px solid rgba(26,58,92,0.12)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-primary)' }}>
                    Cancelar
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleDelete} disabled={deleting}
                    style={{ flex: 1, padding: '9px', background: deleting ? 'rgba(185,28,28,0.40)' : 'linear-gradient(135deg, #8b0f0f, #b91c1c)', color: '#fff', border: 'none', borderRadius: '8px', cursor: deleting ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', boxShadow: '0 4px 12px rgba(185,28,28,0.30)', transition: 'all 0.15s ease' }}
                  >
                    {deleting ? 'Eliminando...' : 'Eliminar'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
