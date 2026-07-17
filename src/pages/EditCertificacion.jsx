import { useState, useEffect, startTransition } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Check, AlertCircle, Edit2, Plus, Package, ChevronDown, ChevronUp } from "lucide-react"
import ConfirmModal from "../components/ConfirmModal"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

const CARD   = 'rgba(255,255,255,0.97)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT = '#2e6ca4'
const GREEN  = '#059669'
const RED    = '#b91c1c'
const GOLD   = '#d97706'
const TEXT   = '#1a3a5c'
const MUTED  = '#5a7a9f'

const INPUT = {
  width: '100%', padding: '8px 11px', background: BG,
  border: '1px solid rgba(46,108,164,0.22)', color: TEXT,
  borderRadius: '8px', boxSizing: 'border-box', fontSize: '13px',
  fontFamily: 'var(--font-primary)', outline: 'none',
}

const INPUT_S = {
  width: '100%', padding: '7px 9px', background: BG,
  border: '1px solid rgba(46,108,164,0.22)', color: TEXT,
  borderRadius: '8px', boxSizing: 'border-box', fontSize: '12px',
  fontFamily: 'var(--font-primary)', outline: 'none',
}

const LABEL = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: MUTED, marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

const LABEL_S = {
  display: 'block', fontSize: '10px', fontWeight: 700,
  color: MUTED, marginBottom: '4px',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

const FIELD = { marginBottom: '14px' }

const focusIn  = e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }
const focusOut = e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }

const SelectField = ({ label, value, onChange, options, idKey, labelFn, disabled }) => (
  <div>
    <label style={LABEL_S}>{label}</label>
    <select
      value={value} onChange={onChange}
      style={{ ...INPUT_S, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer', pointerEvents: disabled ? 'none' : 'auto' }}
      onFocus={focusIn} onBlur={focusOut}
    >
      <option value="">— Seleccionar —</option>
      {options.map(o => <option key={o[idKey]} value={o[idKey]}>{labelFn(o)}</option>)}
    </select>
  </div>
)

const EMPTY_ITEM_FORM = {
  id_programa: "", id_subprograma: "", id_proyecto: "", id_actividad: "",
  id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "",
}

export default function EditCertificacion({ certId, onClose, onSaved }) {
  const [form,          setForm]          = useState(null)
  const [items,         setItems]         = useState([])
  const [entidades,     setEntidades]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState("")
  const [itemMsg,       setItemMsg]       = useState("")
  const [estadoCert,    setEstadoCert]    = useState("")
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [confirmDlg,    setConfirmDlg]    = useState({ open: false, item: null })

  // cedula del certificado (para filtrar cascada por año)
  const [cedulaId, setCedulaId] = useState(null)

  // Panel agregar ítem
  const [showAddItem,  setShowAddItem]  = useState(false)
  const [addingItem,   setAddingItem]   = useState(false)
  const [itemForm,     setItemForm]     = useState(EMPTY_ITEM_FORM)
  const [montoDisp,    setMontoDisp]    = useState(null)

  // Catálogos para la cascada
  const [programas,    setProgramas]    = useState([])
  const [subprogramas, setSubprogramas] = useState([])
  const [proyectos,    setProyectos]    = useState([])
  const [actividades,  setActividades]  = useState([])
  const [fuentes,      setFuentes]      = useState([])
  const [itemsOpts,    setItemsOpts]    = useState([])

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const token = Cookies.get("auth_token")
        const [certRes, entRes] = await Promise.all([
          axios.get(`${API_BASE}/certificacion/${certId}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/certificacion/unidades-requirientes`),
        ])
        const d = certRes.data.data
        setEstadoCert(d.estado || "")
        setMotivoRechazo(d.motivo_rechazo || "")
        setCedulaId(d.id_cedula_presupuestaria ?? null)
        setForm({
          descripcion:           d.descripcion            || "",
          clase_registro:        d.clase_registro          || "",
          clase_gasto:           d.clase_gasto             || "",
          tipo_doc_respaldo:     d.tipo_doc_respaldo       || "",
          clase_doc_respaldo:    d.clase_doc_respaldo      || "",
          seccion_memorando:     d.seccion_memorando       || "",
          id_unidad_requiriente: d.id_unidad_requiriente ? String(d.id_unidad_requiriente) : "",
        })
        setItems((d.items || []).map(it => ({ ...it, montoEdit: String(it.monto ?? "") })))
        setEntidades(entRes.data.data)
      } catch { setError("No se pudo cargar el certificado.") }
      finally { setLoading(false) }
    })()
  }, [certId])

  // Carga los catálogos de cascada la primera vez que se abre el panel
  useEffect(() => {
    if (!showAddItem || programas.length > 0) return
    ;(async () => {
      try {
        const cedParam = cedulaId ? `?cedula=${cedulaId}` : ""
        const progRes = await axios.get(`${API_BASE}/certificacion/programas${cedParam}`)
        startTransition(() => setProgramas(progRes.data.data))
      } catch { /* silent */ }
    })()
  }, [showAddItem, cedulaId])

  // ── Guardar datos generales ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.descripcion?.trim())       return setError("Descripción es requerida")
    if (!form.seccion_memorando?.trim()) return setError("Memorando N° es requerido")
    if (!form.id_unidad_requiriente)    return setError("Unidad Requiriente es requerida")
    setSaving(true); setError("")
    try {
      const token = Cookies.get("auth_token")
      await axios.put(`${API_BASE}/certificacion/${certId}`, form, { headers: { Authorization: `Bearer ${token}` } })
      onSaved(); onClose()
    } catch (err) { setError(err.response?.data?.message || "Error al guardar") }
    finally { setSaving(false) }
  }

  // ── Monto de item existente ─────────────────────────────────────────────────
  const handleGuardarMonto = async (it) => {
    const monto = parseFloat(it.montoEdit.toString().replace(',', '.'))
    if (!it.montoEdit || isNaN(monto) || monto <= 0) { setItemMsg("El monto debe ser mayor a 0"); return }
    try {
      const token = Cookies.get("auth_token")
      const verfRes = await axios.get(`${API_BASE}/certificacion/verificar-monto/${it.id_item}/${it.id_fuente}${cedParam}`)
      if (verfRes.data.success) {
        const tope = verfRes.data.data.disponible_final + parseFloat(String(it.monto).replace(',', '.'))
        if (monto > tope) { setItemMsg(`Máximo: $${tope.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`); return }
      }
      await axios.patch(`${API_BASE}/certificacion/${certId}/item/${it.id_certificacion_item}`, { monto }, { headers: { Authorization: `Bearer ${token}` } })
      setItems(prev => prev.map(i => i.id_certificacion_item === it.id_certificacion_item ? { ...i, monto, montoEdit: String(monto) } : i))
      setItemMsg("Monto actualizado"); setTimeout(() => setItemMsg(""), 2500)
    } catch (err) { setItemMsg(err.response?.data?.message || "Error al actualizar monto") }
  }

  const handleEliminarItem = (it) => {
    setConfirmDlg({ open: true, item: it })
  }

  const handleConfirmEliminar = async () => {
    const it = confirmDlg.item
    setConfirmDlg({ open: false, item: null })
    try {
      const token = Cookies.get("auth_token")
      await axios.delete(`${API_BASE}/certificacion/${certId}/item/${it.id_certificacion_item}`, { headers: { Authorization: `Bearer ${token}` } })
      setItems(prev => prev.filter(i => i.id_certificacion_item !== it.id_certificacion_item))
      setItemMsg("Ítem eliminado correctamente"); setTimeout(() => setItemMsg(""), 2000)
    } catch (err) { setItemMsg(err.response?.data?.message || "Error al eliminar ítem") }
  }

  // ── Cascada: agregar ítem ──────────────────────────────────────────────────

  const cedParam = cedulaId ? `?cedula=${cedulaId}` : ""

  const handleProgramaChange = async (e) => {
    const id = e.target.value
    setItemForm(prev => ({ ...prev, id_programa: id, id_subprograma: "", id_proyecto: "", id_actividad: "", id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "" }))
    setSubprogramas([]); setProyectos([]); setActividades([]); setFuentes([]); setItemsOpts([]); setMontoDisp(null)
    if (id) {
      try { const r = await axios.get(`${API_BASE}/certificacion/subprogramas/${id}${cedParam}`); startTransition(() => setSubprogramas(r.data.data)) }
      catch { /* cascade load failed */ }
    }
  }

  const handleSubprogramaChange = async (e) => {
    const id = e.target.value
    setItemForm(prev => ({ ...prev, id_subprograma: id, id_proyecto: "", id_actividad: "", id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "" }))
    setProyectos([]); setActividades([]); setFuentes([]); setItemsOpts([]); setMontoDisp(null)
    if (id) {
      try { const r = await axios.get(`${API_BASE}/certificacion/proyectos/${id}${cedParam}`); startTransition(() => setProyectos(r.data.data)) }
      catch { /* cascade load failed */ }
    }
  }

  const handleProyectoChange = async (e) => {
    const id = e.target.value
    setItemForm(prev => ({ ...prev, id_proyecto: id, id_actividad: "", id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "" }))
    setActividades([]); setFuentes([]); setItemsOpts([]); setMontoDisp(null)
    if (id) {
      try { const r = await axios.get(`${API_BASE}/certificacion/actividades/${id}${cedParam}`); startTransition(() => setActividades(r.data.data)) }
      catch { /* cascade load failed */ }
    }
  }

  const handleActividadChange = async (e) => {
    const id = e.target.value
    setItemForm(prev => ({ ...prev, id_actividad: id, id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "" }))
    setFuentes([]); setItemsOpts([]); setMontoDisp(null)
    if (id) {
      try {
        const r = await axios.get(`${API_BASE}/certificacion/fuentes/${id}${cedParam}`)
        startTransition(() => setFuentes(r.data.data))
      } catch { /* silent */ }
    }
  }

  const handleFuenteChange = async (e) => {
    const id = e.target.value
    setItemForm(prev => ({ ...prev, id_fuente: id, id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "" }))
    setItemsOpts([])
    setMontoDisp(null)
    if (id && itemForm.id_actividad) {
      const params = new URLSearchParams()
      params.append('fuente', id)
      if (cedulaId) params.append('cedula', cedulaId)
      try {
        const r = await axios.get(`${API_BASE}/certificacion/items-by-actividad-fuente/${itemForm.id_actividad}?${params}`)
        startTransition(() => setItemsOpts(r.data.data))
      } catch { /* silent */ }
    }
  }

  const obtenerMontoDisponible = async (idItem, idFuente) => {
    try {
      const r = await axios.get(`${API_BASE}/certificacion/verificar-monto/${idItem}/${idFuente}${cedParam}`)
      if (r.data.success) setMontoDisp(r.data.data)
      else setMontoDisp(null)
    } catch { setMontoDisp(null) }
  }

  const validarItem = () => {
    const { id_programa, id_subprograma, id_proyecto, id_actividad, id_fuente, id_item, id_ubicacion, id_organismo, id_naturaleza, monto } = itemForm
    if (!id_programa)    return "Programa es requerido"
    if (!id_subprograma) return "Subprograma es requerido"
    if (!id_proyecto)    return "Proyecto es requerido"
    if (!id_actividad)   return "Actividad es requerida"
    if (!id_fuente)      return "Fuente es requerida"
    if (!id_item)        return "Ítem es requerido"
    if (!id_ubicacion)   return "Ubicación es requerida"
    if (!id_organismo)   return "Organismo es requerido"
    if (!id_naturaleza)  return "N Prestación es requerida"
    const n = parseFloat(monto.toString().replace(',', '.'))
    if (!monto || isNaN(n) || n <= 0) return "Monto debe ser mayor a 0"
    return null
  }

  const handleAgregarItem = async () => {
    const err = validarItem()
    if (err) { setItemMsg(err); return }
    if (montoDisp) {
      const n = parseFloat(itemForm.monto.toString().replace(',', '.'))
      if (montoDisp.disponible_final <= 0) { setItemMsg("Este item no tiene saldo disponible"); return }
      if (n > montoDisp.disponible_final) {
        setItemMsg(`Máximo disponible: $${montoDisp.disponible_final.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`)
        return
      }
    }
    setAddingItem(true)
    try {
      const token = Cookies.get("auth_token")
      const payload = {
        id_programa:    parseInt(itemForm.id_programa),
        id_subprograma: parseInt(itemForm.id_subprograma),
        id_proyecto:    parseInt(itemForm.id_proyecto),
        id_actividad:   parseInt(itemForm.id_actividad),
        id_fuente:      parseInt(itemForm.id_fuente),
        id_ubicacion:   parseInt(itemForm.id_ubicacion),
        id_item:        parseInt(itemForm.id_item),
        id_organismo:   parseInt(itemForm.id_organismo),
        id_naturaleza:  parseInt(itemForm.id_naturaleza),
        monto:          parseFloat(itemForm.monto.toString().replace(',', '.')),
      }
      await axios.post(`${API_BASE}/certificacion/${certId}/agregar-item`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Recargar ítems frescos desde el servidor
      const certRes = await axios.get(`${API_BASE}/certificacion/${certId}`, { headers: { Authorization: `Bearer ${token}` } })
      setItems((certRes.data.data.items || []).map(it => ({ ...it, montoEdit: String(it.monto ?? "") })))
      setItemMsg("Item agregado correctamente")
      setTimeout(() => setItemMsg(""), 2500)
      setItemForm(EMPTY_ITEM_FORM)
      setSubprogramas([]); setProyectos([]); setActividades([]); setFuentes([]); setItemsOpts([]); setMontoDisp(null)
      setShowAddItem(false)
    } catch (err) {
      setItemMsg(err.response?.data?.message || "Error al agregar item")
    } finally { setAddingItem(false) }
  }

  const totalItems = items.reduce((s, i) => s + parseFloat(i.monto || 0), 0)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
    >
      <ConfirmModal
        open={confirmDlg.open}
        title="Eliminar ítem"
        message={`¿Está seguro de que desea eliminar el ítem "${confirmDlg.item?.item?.nombre_item ?? 'seleccionado'}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onConfirm={handleConfirmEliminar}
        onCancel={() => setConfirmDlg({ open: false, item: null })}
      />
      <motion.div initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '950px', maxHeight: '90vh', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', fontFamily: 'var(--font-primary)', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'linear-gradient(135deg, #0d1f35, #1a3a5c)', borderRadius: '18px 18px 0 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit2 size={16} color="#54b3e0" />
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Editar Certificado</span>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.10)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} />
          </motion.button>
        </div>

        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>

          {/* Aviso rechazado */}
          {estadoCert === 'RECHAZADO' && (
            <div style={{ background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.25)', borderRadius: '12px', padding: '14px 16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: RED, fontWeight: 700, fontSize: '13px', marginBottom: motivoRechazo ? '8px' : 0 }}>
                <AlertCircle size={14} /> Certificado Rechazado — revisión requerida
              </div>
              {motivoRechazo && (
                <div style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: '1.5', marginBottom: '8px' }}>
                  <strong>Motivo:</strong> {motivoRechazo}
                </div>
              )}
              <div style={{ fontSize: '12px', color: RED, background: 'rgba(185,28,28,0.10)', borderRadius: '8px', padding: '8px 10px' }}>
                Al guardar los cambios, el certificado volverá automáticamente a estado <strong>REGISTRADO</strong> para que el director lo revise nuevamente.
              </div>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: RED, fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><AlertCircle size={14} /> <span>{error}</span></div>
                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer' }}><X size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div style={{ color: MUTED, textAlign: 'center', padding: '48px', fontSize: '13px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid rgba(46,108,164,0.15)', borderTopColor: ACCENT, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
              Cargando...
            </div>
          ) : form && (
            <>
              {/* ── Datos Generales ── */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${BORDER}`, paddingBottom: '8px', marginBottom: '16px' }}>
                  Datos Generales
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>

                    <div style={FIELD}>
                      <label style={LABEL}>Unidad Requiriente *</label>
                      <select style={{ ...INPUT, cursor: 'pointer' }} value={form.id_unidad_requiriente}
                        onChange={e => setForm({ ...form, id_unidad_requiriente: e.target.value })}
                        onFocus={focusIn} onBlur={focusOut}
                      >
                        <option value="">-- Seleccionar --</option>
                        {entidades.map(en => (
                          <option key={en.id_unidad_requiriente} value={String(en.id_unidad_requiriente)}>{en.nombre_entidad}</option>
                        ))}
                      </select>
                    </div>

                    {[
                      { label: 'Clase de Registro',  key: 'clase_registro',    opts: ['COM'] },
                      { label: 'Clase de Gasto',      key: 'clase_gasto',       opts: ['OGA'] },
                      { label: 'Tipo Doc. Respaldo',  key: 'tipo_doc_respaldo', opts: ['COMPROBANTES ADMINISTRATIVOS DE GASTOS'] },
                      { label: 'Clase Doc. Respaldo', key: 'clase_doc_respaldo',opts: ['COMPROMISO NORMAL OTROS GASTOS'] },
                    ].map(({ label, key, opts }) => (
                      <div key={key} style={FIELD}>
                        <label style={LABEL}>{label}</label>
                        <select style={{ ...INPUT, cursor: 'pointer' }} value={form[key]}
                          onChange={e => setForm({ ...form, [key]: e.target.value })}
                          onFocus={focusIn} onBlur={focusOut}
                        >
                          <option value="">— Seleccionar —</option>
                          {opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}

                    <div style={FIELD}>
                      <label style={LABEL}>Memorando N° *</label>
                      <input style={INPUT} value={form.seccion_memorando}
                        onChange={e => setForm({ ...form, seccion_memorando: e.target.value })}
                        maxLength={30} onFocus={focusIn} onBlur={focusOut} />
                    </div>
                  </div>

                  <div style={FIELD}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <label style={LABEL}>Descripción General *</label>
                      <span style={{ fontSize: '10px', color: form.descripcion.length > 900 ? '#b91c1c' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {form.descripcion.length}/1000
                      </span>
                    </div>
                    <textarea
                      rows={3} maxLength={1000}
                      style={{ ...INPUT, resize: 'vertical', lineHeight: '1.5', paddingTop: '8px' }}
                      value={form.descripcion}
                      onChange={e => setForm({ ...form, descripcion: e.target.value })}
                      onFocus={focusIn} onBlur={focusOut}
                    />
                  </div>
                </div>
              </div>

              {/* ── Items existentes ── */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${BORDER}`, paddingBottom: '8px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={13} color={GREEN} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Items del Certificado
                    </span>
                    {items.length > 0 && (
                      <span style={{ background: `${GREEN}18`, color: GREEN, borderRadius: '999px', padding: '1px 7px', fontSize: '10px', fontWeight: 800 }}>
                        {items.length}
                      </span>
                    )}
                  </div>
                  {itemMsg && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '12px', fontWeight: 600, color: itemMsg.startsWith('Error') || itemMsg.startsWith('Máximo') || itemMsg.startsWith('El monto') || itemMsg.includes('requerido') || itemMsg.includes('disponible') ? RED : GREEN }}>
                      {itemMsg}
                    </motion.span>
                  )}
                </div>

                {items.length === 0 ? (
                  <div style={{ color: MUTED, fontSize: '13px', padding: '20px', background: BG, borderRadius: '10px', textAlign: 'center', border: `1px solid ${BORDER}`, marginBottom: '12px' }}>Sin items</div>
                ) : (
                  <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                    <table className="ueb-table" style={{ minWidth: '700px', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          {['PG','SP','PY','ACT','ITEM','UBG','FTE','ORG','N. Prest.','Descripción','Monto',''].map(h => (
                            <th key={h} style={{ textAlign: h === 'Monto' ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => (
                          <tr key={it.id_certificacion_item}>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{it.programa?.cod_programa ?? '-'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{String(it.subprograma?.cod_subprograma ?? '').slice(-2) || '-'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{String(it.proyecto?.cod_proyecto ?? '').slice(-3) || '-'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{String(it.actividad?.cod_actividad ?? '').slice(-3) || '-'}</td>
                            <td style={{ fontFamily: 'monospace', color: ACCENT, fontWeight: 700, fontSize: '11px' }}>{it.item?.cod_item ?? '-'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{it.ubicacion?.cod_ubicacion ?? '-'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{it.fuente?.cod_fuente ?? '-'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{it.organismo?.cod_organismo ?? '-'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{it.naturaleza?.cod_naturaleza ?? '-'}</td>
                            <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.item?.nombre_item ?? '-'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <input type="text" inputMode="decimal" value={it.montoEdit}
                                onChange={e => {
                                  const v = e.target.value.replace('.', ',')
                                  if (/^\d*[,]?\d{0,2}$/.test(v)) setItems(prev => prev.map(i => i.id_certificacion_item === it.id_certificacion_item ? { ...i, montoEdit: v } : i))
                                }}
                                style={{ width: '90px', padding: '4px 6px', background: BG, border: '1px solid rgba(46,108,164,0.22)', color: GREEN, borderRadius: '6px', fontSize: '12px', textAlign: 'right', fontFamily: 'var(--font-primary)', outline: 'none' }}
                                onFocus={focusIn} onBlur={focusOut}
                              />
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                  onClick={() => handleGuardarMonto(it)} title="Guardar monto"
                                  style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.30)', borderRadius: '6px', color: GREEN, cursor: 'pointer' }}
                                >
                                  <Check size={12} />
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEliminarItem(it)} title="Eliminar item"
                                  style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(185,28,28,0.10)', border: '1px solid rgba(185,28,28,0.25)', borderRadius: '6px', color: RED, cursor: 'pointer' }}
                                >
                                  <Trash2 size={12} />
                                </motion.button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: `2px solid ${BORDER}`, background: 'rgba(240,244,248,0.80)' }}>
                          <td colSpan={10} style={{ padding: '8px 14px', textAlign: 'right', color: MUTED, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Total</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', color: GREEN, fontWeight: 700, fontSize: '13px' }}>
                            ${totalItems.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* ── Toggle agregar ítem ── */}
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => setShowAddItem(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', width: '100%', padding: '9px 14px', background: showAddItem ? 'rgba(46,108,164,0.08)' : 'rgba(46,108,164,0.05)', border: `1px solid ${showAddItem ? 'rgba(46,108,164,0.28)' : BORDER}`, borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: ACCENT, fontFamily: 'var(--font-primary)', transition: 'all 0.15s ease' }}
                >
                  {showAddItem ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  <Plus size={12} />
                  Agregar Ítem al Certificado
                </motion.button>
              </div>

              {/* ── Panel cascada agregar ítem ── */}
              <AnimatePresence>
                {showAddItem && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.20 }}
                    style={{ overflow: 'hidden', marginBottom: '16px' }}
                  >
                    <div style={{ background: 'rgba(46,108,164,0.03)', border: `1px solid rgba(46,108,164,0.18)`, borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Package size={12} color={GREEN} /> Nuevo Ítem
                      </div>

                      {/* Estructura programática */}
                      <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Estructura Programática
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                        <SelectField label="Programa *"    value={itemForm.id_programa}    onChange={handleProgramaChange}    options={programas}    idKey="id_programa"    labelFn={p  => `${p.cod_programa} - ${p.nombre_programa}`} />
                        <SelectField label="Subprograma *" value={itemForm.id_subprograma} onChange={handleSubprogramaChange} options={subprogramas} idKey="id_subprograma" labelFn={sp => `${String(sp.cod_subprograma).slice(-2)} - ${sp.nombre_subprograma}`}  disabled={!itemForm.id_programa} />
                        <SelectField label="Proyecto *"    value={itemForm.id_proyecto}    onChange={handleProyectoChange}    options={proyectos}    idKey="id_proyecto"    labelFn={py => `${String(py.cod_proyecto).slice(-3)} - ${py.nombre_proyecto}`}      disabled={!itemForm.id_subprograma} />
                        <SelectField label="Actividad *"   value={itemForm.id_actividad}   onChange={handleActividadChange}   options={actividades}  idKey="id_actividad"  labelFn={a  => `${String(a.cod_actividad).slice(-3)} - ${a.nombre_actividad}`}        disabled={!itemForm.id_proyecto} />
                      </div>

                      <div style={{ height: '1px', background: BORDER, margin: '0 0 10px' }} />

                      {/* Clasificador */}
                      <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Clasificador Presupuestario
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                        {/* Fuente — se activa tras elegir Actividad */}
                        <SelectField label="Fuente *" value={itemForm.id_fuente} onChange={handleFuenteChange} options={fuentes} idKey="id_fuente" labelFn={f => `${f.cod_fuente} - ${f.nombre_fuente}`} disabled={!itemForm.id_actividad} />

                        {/* Ítem — filtrado por actividad + fuente, sin duplicados */}
                        <div>
                          <label style={LABEL_S}>Ítem *</label>
                          <select
                            value={itemForm.id_item}
                            onChange={e => {
                              const idItem = e.target.value
                              const selItem = itemsOpts.find(i => String(i.id_item) === idItem)
                              setItemForm(prev => ({
                                ...prev,
                                id_item:       idItem,
                                id_ubicacion:  selItem ? String(selItem.id_ubicacion)  : "",
                                id_organismo:  selItem ? String(selItem.id_organismo)  : "",
                                id_naturaleza: selItem ? String(selItem.id_naturaleza) : "",
                                monto: "",
                              }))
                              setMontoDisp(null)
                              if (idItem && itemForm.id_fuente) obtenerMontoDisponible(idItem, itemForm.id_fuente)
                            }}
                            style={{ ...INPUT_S, opacity: !itemForm.id_fuente ? 0.45 : 1, cursor: !itemForm.id_fuente ? 'not-allowed' : 'pointer', pointerEvents: !itemForm.id_fuente ? 'none' : 'auto' }}
                            onFocus={focusIn} onBlur={focusOut}
                          >
                            <option value="">— Seleccionar —</option>
                            {itemsOpts.map(i => <option key={i.id_item} value={i.id_item}>{i.cod_item} - {i.nombre_item}</option>)}
                          </select>
                        </div>

                        {/* Ubicación — auto desde ítem */}
                        <div>
                          <label style={LABEL_S}>Ubicación</label>
                          <div style={{
                            ...INPUT_S, display: 'flex', alignItems: 'center',
                            background: itemForm.id_item ? 'rgba(46,108,164,0.05)' : BG,
                            color: itemForm.id_item ? TEXT : MUTED,
                            opacity: itemForm.id_item ? 1 : 0.55,
                            minHeight: '32px',
                          }}>
                            {itemForm.id_item
                              ? (() => { const s = itemsOpts.find(i => String(i.id_item) === String(itemForm.id_item)); return s ? `${s.cod_ubicacion} — ${s.nombre_ubicacion}` : '—' })()
                              : 'Se completa al seleccionar ítem'}
                          </div>
                        </div>

                        {/* Organismo — auto desde ítem */}
                        <div>
                          <label style={LABEL_S}>Organismo</label>
                          <div style={{
                            ...INPUT_S, display: 'flex', alignItems: 'center',
                            background: itemForm.id_item ? 'rgba(46,108,164,0.05)' : BG,
                            color: itemForm.id_item ? TEXT : MUTED,
                            opacity: itemForm.id_item ? 1 : 0.55,
                            minHeight: '32px',
                          }}>
                            {itemForm.id_item
                              ? (() => { const s = itemsOpts.find(i => String(i.id_item) === String(itemForm.id_item)); return s ? `${s.cod_organismo} — ${s.nombre_organismo}` : '—' })()
                              : 'Se completa al seleccionar ítem'}
                          </div>
                        </div>

                        {/* N Prestación — auto desde ítem */}
                        <div>
                          <label style={LABEL_S}>N Prestación</label>
                          <div style={{
                            ...INPUT_S, display: 'flex', alignItems: 'center',
                            background: itemForm.id_item ? 'rgba(46,108,164,0.05)' : BG,
                            color: itemForm.id_item ? TEXT : MUTED,
                            opacity: itemForm.id_item ? 1 : 0.55,
                            minHeight: '32px',
                          }}>
                            {itemForm.id_item
                              ? (() => { const s = itemsOpts.find(i => String(i.id_item) === String(itemForm.id_item)); return s ? `${s.cod_naturaleza} — ${s.nombre_naturaleza}` : '—' })()
                              : 'Se completa al seleccionar ítem'}
                          </div>
                        </div>

                        {/* Monto */}
                        <div>
                          <label style={LABEL_S}>Monto *</label>
                          <input
                            type="text" inputMode="decimal" placeholder="0,00"
                            value={itemForm.monto}
                            onChange={e => {
                              const v = e.target.value.replace('.', ',')
                              if (/^\d*[,]?\d{0,2}$/.test(v)) setItemForm(prev => ({ ...prev, monto: v }))
                            }}
                            style={{ ...INPUT_S, color: GREEN, fontWeight: 700 }}
                            onFocus={focusIn} onBlur={focusOut}
                          />
                          {itemForm.id_item && montoDisp && (() => {
                            const fmt = v => `$${v.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`
                            const n = parseFloat(itemForm.monto.toString().replace(',', '.'))
                            const disp = montoDisp.disponible_final
                            if (disp <= 0) return <p style={{ margin: '4px 0 0', fontSize: '10px', color: RED, fontWeight: 700 }}>✗ Sin saldo — Codificado: {fmt(montoDisp.codificado)}</p>
                            if (n > 0 && n > disp) return <p style={{ margin: '4px 0 0', fontSize: '10px', color: RED, fontWeight: 700 }}>✗ Excede máximo: {fmt(disp)}</p>
                            if (n > 0) return <p style={{ margin: '4px 0 0', fontSize: '10px', color: GREEN, fontWeight: 700 }}>✓ Disponible: {fmt(disp)}</p>
                            return <p style={{ margin: '4px 0 0', fontSize: '10px', color: MUTED, fontWeight: 600 }}>Disponible: {fmt(disp)}</p>
                          })()}
                        </div>
                      </div>

                      {/* Franja presupuesto */}
                      {montoDisp && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: montoDisp.disponible_final > 0 ? 'rgba(5,150,105,0.07)' : 'rgba(185,28,28,0.07)', border: `1px solid ${(montoDisp.disponible_final > 0 ? GREEN : RED)}40`, borderRadius: '10px', padding: '8px 12px', marginBottom: '10px' }}
                        >
                          <span style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Presupuesto:</span>
                          {[
                            { label: 'Codificado',  value: montoDisp.codificado,        color: ACCENT },
                            { label: 'Certificado', value: montoDisp.certificado_actual, color: GOLD },
                            { label: 'Disponible',  value: montoDisp.disponible_final,   color: montoDisp.disponible_final > 0 ? GREEN : RED, bold: true },
                          ].map((s, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '7px', fontSize: '11px' }}>
                              <span style={{ color: MUTED, fontWeight: 600 }}>{s.label}:</span>
                              <span style={{ color: s.color, fontWeight: s.bold ? 800 : 700 }}>
                                ${s.value.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                              </span>
                            </span>
                          ))}
                        </motion.div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => { setShowAddItem(false); setItemForm(EMPTY_ITEM_FORM); setSubprogramas([]); setProyectos([]); setActividades([]); setFuentes([]); setItemsOpts([]); setMontoDisp(null) }}
                          style={{ padding: '7px 14px', background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-primary)' }}
                        >
                          Cancelar
                        </button>
                        <motion.button
                          whileHover={!addingItem ? { scale: 1.02 } : {}} whileTap={!addingItem ? { scale: 0.98 } : {}}
                          onClick={handleAgregarItem} disabled={addingItem}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 18px', background: `linear-gradient(135deg, ${GREEN}, #047857)`, color: '#fff', border: 'none', borderRadius: '8px', cursor: addingItem ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, opacity: addingItem ? 0.6 : 1, fontFamily: 'var(--font-primary)', boxShadow: '0 3px 12px rgba(5,150,105,0.24)' }}
                        >
                          <Plus size={13} /> {addingItem ? 'Agregando...' : 'Agregar Item'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Acciones finales ── */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px', paddingTop: '16px', borderTop: `1px solid ${BORDER}` }}>
                <motion.button whileHover={!saving ? { scale: 1.02, boxShadow: '0 8px 24px rgba(26,58,92,0.30)' } : {}} whileTap={!saving ? { scale: 0.98 } : {}}
                  onClick={handleSave} disabled={saving}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: saving ? 'rgba(26,58,92,0.08)' : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: saving ? MUTED : '#fff', border: 'none', borderRadius: '10px', cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-primary)', boxShadow: saving ? 'none' : '0 4px 16px rgba(26,58,92,0.25)', transition: 'all 0.18s ease' }}
                >
                  <Save size={15} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                </motion.button>
                <button onClick={onClose}
                  style={{ padding: '10px 20px', background: 'rgba(26,58,92,0.06)', color: MUTED, border: '1px solid rgba(26,58,92,0.12)', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-primary)', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.color = TEXT }}
                  onMouseLeave={e => { e.currentTarget.style.color = MUTED }}
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
