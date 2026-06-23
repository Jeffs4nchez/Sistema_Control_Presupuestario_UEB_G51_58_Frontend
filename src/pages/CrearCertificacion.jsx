import { useState, useEffect, startTransition } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle, AlertCircle, Trash2, ClipboardList, Package, X, Building2, ChevronRight, ChevronLeft } from 'lucide-react'
import { useFiscalYear } from "../contexts/FiscalYearContext"
import ConfirmModal from "../components/ConfirmModal"

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT = '#2e6ca4'
const GREEN  = '#059669'
const RED    = '#b91c1c'
const GOLD   = '#d97706'
const TEXT   = '#1a3a5c'
const MUTED  = '#5a7a9f'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const INPUT_S = {
  width: '100%', padding: '7px 9px',
  background: BG, border: '1px solid rgba(46,108,164,0.22)',
  borderRadius: '8px', color: TEXT, fontSize: '12px',
  fontFamily: 'var(--font-primary)', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
}

const LABEL_S = {
  display: 'block', fontSize: '10px', fontWeight: 700,
  color: MUTED, marginBottom: '4px',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

const SECTION_S = {
  background: CARD, border: `1px solid ${BORDER}`,
  borderRadius: '14px', padding: '16px',
  backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)',
}

const SECTION_HDR = {
  display: 'flex', alignItems: 'center', gap: '7px',
  marginBottom: '14px', paddingBottom: '10px',
  borderBottom: '1px solid rgba(46,108,164,0.08)',
}

const GROUP_LBL = {
  margin: '0 0 6px', fontSize: '10px', fontWeight: 700,
  color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em',
  display: 'flex', alignItems: 'center', gap: '5px',
}

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

export default function CrearCertificacion({ onCreated }) {
  const { selectedCedula } = useFiscalYear()
  const cedulaId    = selectedCedula?.id_cedula_presupuestaria || ""
  const sinCedula = selectedCedula !== null && selectedCedula?.tiene_estructura === false

  const [step,       setStep]       = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [createStep, setCreateStep] = useState(-1)
  const [error,      setError]      = useState("")
  const [confirmDlg, setConfirmDlg] = useState({ open: false, index: null })
  const [success,    setSuccess]    = useState("")

  const [certificado, setCertificado] = useState({
    descripcion: "", clase_registro: "",
    clase_gasto: "", tipo_doc_respaldo: "", clase_doc_respaldo: "",
    seccion_memorando: "", id_unidad_requiriente: "", id_cedula_presupuestaria: "",
  })

  const [programas,    setProgramas]    = useState([])
  const [subprogramas, setSubprogramas] = useState([])
  const [proyectos,    setProyectos]    = useState([])
  const [actividades,  setActividades]  = useState([])
  const [fuentes,      setFuentes]      = useState([])
  const [items,        setItems]        = useState([])
  const [entidades,    setEntidades]    = useState([])

  const [itemForm, setItemForm] = useState({
    id_programa: "", id_subprograma: "", id_proyecto: "", id_actividad: "",
    id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "",
    monto: "", descripcion: "",
  })

  const [itemsAgregados,  setItemsAgregados]  = useState([])
  const [montoDisponible, setMontoDisponible] = useState(null)

  const [showModalEntidad, setShowModalEntidad] = useState(false)
  const [formEntidad, setFormEntidad] = useState({
    nombre_entidad: "", responsable_entidad: "", correo_institucional: "",
  })

  // Carga datos estáticos que no dependen del año fiscal
  useEffect(() => { cargarDatosEstaticos() }, [])

  // Cuando cambia el año fiscal: sincroniza cédula, resetea cascadas y recarga programas filtrados
  useEffect(() => {
    setCertificado(prev => ({ ...prev, id_cedula_presupuestaria: cedulaId }))
    if (!cedulaId) return
    setProgramas([])
    setSubprogramas([]); setProyectos([]); setActividades([])
    setFuentes([]); setItems([])
    setMontoDisponible(null)
    setItemForm({ id_programa: "", id_subprograma: "", id_proyecto: "", id_actividad: "", id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "", descripcion: "" })
    axios.get(`${API_BASE}/certificacion/programas?cedula=${cedulaId}`)
      .then(res => startTransition(() => setProgramas(res.data.data)))
      .catch(() => {})
  }, [cedulaId])

  const cargarDatosEstaticos = async () => {
    try {
      const res = await axios.get(`${API_BASE}/certificacion/unidades-requirientes`)
      setEntidades(res.data.data)
    } catch {
      setError("Error al cargar datos iniciales")
    }
  }

  const resetItemsConOrg = () => { setItems([]); setMontoDisponible(null) }

  const handleProgramaChange = async (e) => {
    const id = e.target.value
    setItemForm(prev => ({ ...prev, id_programa: id, id_subprograma: "", id_proyecto: "", id_actividad: "", id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "" }))
    setSubprogramas([]); setProyectos([]); setActividades([]); setFuentes([]); resetItemsConOrg()
    if (id) {
      const cedParam = cedulaId ? `?cedula=${cedulaId}` : ""
      try { const res = await axios.get(`${API_BASE}/certificacion/subprogramas/${id}${cedParam}`); startTransition(() => setSubprogramas(res.data.data)) }
      catch { /* cascade load failed — dropdown stays empty */ }
    }
  }

  const handleSubprogramaChange = async (e) => {
    const id = e.target.value
    setItemForm(prev => ({ ...prev, id_subprograma: id, id_proyecto: "", id_actividad: "", id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "" }))
    setProyectos([]); setActividades([]); setFuentes([]); resetItemsConOrg()
    if (id) {
      const cedParam = cedulaId ? `?cedula=${cedulaId}` : ""
      try { const res = await axios.get(`${API_BASE}/certificacion/proyectos/${id}${cedParam}`); startTransition(() => setProyectos(res.data.data)) }
      catch { /* cascade load failed — dropdown stays empty */ }
    }
  }

  const handleProyectoChange = async (e) => {
    const id = e.target.value
    setItemForm(prev => ({ ...prev, id_proyecto: id, id_actividad: "", id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "" }))
    setActividades([]); setFuentes([]); resetItemsConOrg()
    if (id) {
      const cedParam = cedulaId ? `?cedula=${cedulaId}` : ""
      try { const res = await axios.get(`${API_BASE}/certificacion/actividades/${id}${cedParam}`); startTransition(() => setActividades(res.data.data)) }
      catch { /* cascade load failed — dropdown stays empty */ }
    }
  }

  const handleActividadChange = async (e) => {
    const id = e.target.value
    setItemForm(prev => ({ ...prev, id_actividad: id, id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "" }))
    setFuentes([]); resetItemsConOrg()
    if (id) {
      const cedParam = cedulaId ? `?cedula=${cedulaId}` : ""
      try {
        const res = await axios.get(`${API_BASE}/certificacion/fuentes/${id}${cedParam}`)
        startTransition(() => setFuentes(res.data.data))
      } catch { /* cascade load failed */ }
    }
  }

  const handleFuenteChange = async (e) => {
    const id = e.target.value
    setItemForm(prev => ({ ...prev, id_fuente: id, id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "" }))
    setItems([])
    setMontoDisponible(null)
    if (id && itemForm.id_actividad) {
      const params = new URLSearchParams()
      params.append('fuente', id)
      if (cedulaId) params.append('cedula', cedulaId)
      try {
        const res = await axios.get(`${API_BASE}/certificacion/items-by-actividad-fuente/${itemForm.id_actividad}?${params}`)
        startTransition(() => setItems(res.data.data))
      } catch { /* cascade load failed */ }
    }
  }

  const obtenerMontoDisponible = async (idItem, idFuente) => {
    try {
      const cedParam = cedulaId ? `?cedula=${cedulaId}` : ""
      const res = await axios.get(`${API_BASE}/certificacion/verificar-monto/${idItem}/${idFuente}${cedParam}`)
      if (res.data.success) {
        setMontoDisponible(res.data.data)
        if (!res.data.data.puede_certificar) {
          setError(`Este item no tiene saldo disponible. Codificado: $${res.data.data.codificado.toFixed(2)}, Certificado: $${res.data.data.certificado_actual.toFixed(2)}`)
        } else { setError("") }
      } else {
        setError(res.data.message || "Error al verificar monto disponible")
        setMontoDisponible(null)
      }
    } catch (err) {
      if (err.response?.status === 404) { setMontoDisponible(null) }
      else { setError(err.response?.data?.message || "Error al obtener información presupuestaria"); setMontoDisponible(null) }
    }
  }

  const validarCertificado = () => {
    const { descripcion, clase_registro, clase_gasto, tipo_doc_respaldo, clase_doc_respaldo, seccion_memorando, id_unidad_requiriente } = certificado
    if (!descripcion?.trim())        return "Descripción General es requerida"
    if (!clase_registro?.trim())     return "Clase de Registro es requerida"
    if (!clase_gasto?.trim())        return "Clase de Gasto es requerida"
    if (!tipo_doc_respaldo?.trim())  return "Tipo de Documento Respaldo es requerido"
    if (!clase_doc_respaldo?.trim()) return "Clase de Documento Respaldo es requerida"
    if (!seccion_memorando?.trim())  return "Memorando N° es requerido"
    if (!id_unidad_requiriente)      return "Unidad Requiriente es requerida"
    return null
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
    const montoNum = parseFloat(monto.toString().replace(',', '.'))
    if (!monto || isNaN(montoNum) || montoNum <= 0) return "Monto debe ser mayor a 0"
    if (montoNum > 999999999999.99) return "Monto demasiado grande"
    return null
  }

  const handleCrearCertificado = async (e) => {
    e.preventDefault()
    setLoading(true); setError(""); setSuccess("")
    setCreateStep(0)
    const errCert = validarCertificado()
    if (errCert) { setError(errCert); setLoading(false); setCreateStep(-1); return }
    if (itemsAgregados.length === 0) { setError("Debes agregar al menos un item al certificado"); setLoading(false); setCreateStep(-1); return }
    try {
      const token = Cookies.get("auth_token")
      if (!token) { setError("No hay token de autenticación. Por favor inicia sesión nuevamente"); setLoading(false); setCreateStep(-1); return }
      if (token.length !== 64) { setError(`Token inválido (longitud: ${token.length}, esperada: 64)`); setLoading(false); setCreateStep(-1); return }
      await new Promise(r => setTimeout(r, 280))
      setCreateStep(1)
      const dataToSend = {
        descripcion: certificado.descripcion,
        clase_registro: certificado.clase_registro,
        clase_gasto: certificado.clase_gasto,
        tipo_doc_respaldo: certificado.tipo_doc_respaldo,
        clase_doc_respaldo: certificado.clase_doc_respaldo,
        seccion_memorando: certificado.seccion_memorando,
        id_unidad_requiriente: parseInt(certificado.id_unidad_requiriente),
        id_cedula_presupuestaria: parseInt(certificado.id_cedula_presupuestaria),
        items: itemsAgregados.map(item => ({
          ...item,
          id_programa: parseInt(item.id_programa),   id_subprograma: parseInt(item.id_subprograma),
          id_proyecto: parseInt(item.id_proyecto),    id_actividad: parseInt(item.id_actividad),
          id_fuente: parseInt(item.id_fuente),        id_ubicacion: parseInt(item.id_ubicacion),
          id_item: parseInt(item.id_item),            id_organismo: parseInt(item.id_organismo),
          id_naturaleza: parseInt(item.id_naturaleza), monto: parseFloat(item.monto.toString().replace(',', '.')),
        })),
      }
      await axios.post(`${API_BASE}/certificacion`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCreateStep(2)
      await new Promise(r => setTimeout(r, 350))
      setCreateStep(3)
      setSuccess("Certificado creado exitosamente")
      setTimeout(() => {
        setCreateStep(-1)
        onCreated()
        setCertificado({ descripcion: "", clase_registro: "", clase_gasto: "", tipo_doc_respaldo: "", clase_doc_respaldo: "", seccion_memorando: "", id_unidad_requiriente: "", id_cedula_presupuestaria: "" })
        setItemsAgregados([])
        setStep(1)
      }, 1500)
    } catch (err) {
      setCreateStep(-1)
      setError(err.response?.data?.message || "Error al crear certificado")
    } finally { setLoading(false) }
  }

  const handleAgregarEntidad = async () => {
    if (!formEntidad.nombre_entidad?.trim())       { setError("Nombre de entidad es requerido"); return }
    if (!formEntidad.responsable_entidad?.trim())  { setError("Responsable es requerido"); return }
    if (!formEntidad.correo_institucional?.trim()) { setError("Correo es requerido"); return }
    try {
      const token = Cookies.get("auth_token")
      const res = await axios.post(`${API_BASE}/certificacion/unidades-requirientes`, formEntidad, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const nuevaEntidad = res.data.data
      setEntidades([...entidades, nuevaEntidad])
      setCertificado({ ...certificado, id_unidad_requiriente: nuevaEntidad.id_unidad_requiriente })
      setShowModalEntidad(false)
      setFormEntidad({ nombre_entidad: "", responsable_entidad: "", correo_institucional: "" })
      setSuccess("Entidad agregada exitosamente")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al agregar entidad")
    }
  }

  const handleAgregarItem = () => {
    const errItem = validarItem()
    if (errItem) { setError(errItem); return }
    if (montoDisponible) {
      const monto = parseFloat(itemForm.monto.toString().replace(',', '.'))
      const disponible = montoDisponible.disponible_final
      if (monto > disponible) {
        setError(`Monto no permitido. Disponible: $${disponible.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
        return
      }
      if (disponible <= 0) {
        setError(`Este item no tiene saldo disponible. Codificado: $${montoDisponible.codificado.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
        return
      }
    }
    setError("")
    const selItem   = items.find(i => String(i.id_item) === String(itemForm.id_item))
    const selFuente = fuentes.find(f => String(f.id_fuente) === String(itemForm.id_fuente))
    const nuevoItem = {
      id_programa: itemForm.id_programa,     id_subprograma: itemForm.id_subprograma,
      id_proyecto: itemForm.id_proyecto,     id_actividad:   itemForm.id_actividad,
      id_fuente:   itemForm.id_fuente,       id_ubicacion:   itemForm.id_ubicacion,
      id_item:     itemForm.id_item,         id_organismo:   itemForm.id_organismo,
      id_naturaleza: itemForm.id_naturaleza, monto:          itemForm.monto,
      descripcion: itemForm.descripcion,
      programa:    programas.find(p => p.id_programa == itemForm.id_programa),
      subprograma: subprogramas.find(sp => sp.id_subprograma == itemForm.id_subprograma),
      proyecto:    proyectos.find(py => py.id_proyecto == itemForm.id_proyecto),
      actividad:   actividades.find(a => a.id_actividad == itemForm.id_actividad),
      item:        selItem ? { cod_item: selItem.cod_item, nombre_item: selItem.nombre_item } : null,
      fuente:      selFuente ? { id_fuente: selFuente.id_fuente, cod_fuente: selFuente.cod_fuente, nombre_fuente: selFuente.nombre_fuente } : null,
      ubicacion:   selItem ? { id_ubicacion: selItem.id_ubicacion, cod_ubicacion: selItem.cod_ubicacion, nombre_ubicacion: selItem.nombre_ubicacion } : null,
      organismo:   selItem ? { id_organismo: selItem.id_organismo, cod_organismo: selItem.cod_organismo, nombre_organismo: selItem.nombre_organismo } : null,
      naturaleza:  selItem ? { id_naturaleza: selItem.id_naturaleza, cod_naturaleza: selItem.cod_naturaleza, nombre_naturaleza: selItem.nombre_naturaleza } : null,
    }
    const duplicado = itemsAgregados.some(i => i.id_item === itemForm.id_item && i.id_fuente === itemForm.id_fuente)
    if (duplicado) { setError("Este item ya está agregado al certificado"); return }
    setItemsAgregados([...itemsAgregados, nuevoItem])
    setSuccess("Item agregado correctamente")
    setItemForm({ id_programa: "", id_subprograma: "", id_proyecto: "", id_actividad: "", id_fuente: "", id_item: "", id_ubicacion: "", id_organismo: "", id_naturaleza: "", monto: "", descripcion: "" })
    setSubprogramas([]); setProyectos([]); setActividades([]); setFuentes([]); setItems([])
    setMontoDisponible(null)
  }

  const handleRemoverItem = (index) => {
    setConfirmDlg({ open: true, index })
  }

  const handleConfirmRemover = () => {
    setItemsAgregados(itemsAgregados.filter((_, i) => i !== confirmDlg.index))
    setSuccess("Ítem eliminado correctamente")
    setConfirmDlg({ open: false, index: null })
  }

  const certValid  = validarCertificado() === null
  const totalMonto = itemsAgregados.reduce((sum, i) => sum + parseFloat(String(i.monto || 0).replace(',', '.')), 0)

  const unidadNombre = entidades.find(e => e.id_unidad_requiriente == certificado.id_unidad_requiriente)?.nombre_entidad || ''

  return (
    <div style={{ padding: '16px', fontFamily: 'var(--font-primary)' }}>

      <ConfirmModal
        open={confirmDlg.open}
        title="Eliminar ítem"
        message="¿Está seguro de que desea eliminar este ítem de la certificación? Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        onConfirm={handleConfirmRemover}
        onCancel={() => setConfirmDlg({ open: false, index: null })}
      />

      {/* Toasts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '10px', padding: '9px 13px', marginBottom: '12px', color: RED, fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}><AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} /> {error}</div>
            <button onClick={() => setError("")} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', flexShrink: 0, padding: 0 }}><X size={13} /></button>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.22)', borderRadius: '10px', padding: '9px 13px', marginBottom: '12px', color: GREEN, fontSize: '12px', display: 'flex', gap: '7px', alignItems: 'center' }}
          >
            <CheckCircle size={14} /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bloqueo: sin cédula presupuestaria */}
      {sinCedula && (
        <div style={{
          background: 'rgba(185,28,28,0.06)',
          border: '1px solid rgba(185,28,28,0.28)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '14px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <AlertCircle size={20} color={RED} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: RED }}>
              Sin cédula presupuestaria — Año {selectedCedula?.anio}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7f1d1d', lineHeight: 1.55 }}>
              No se puede crear una certificación porque el año {selectedCedula?.anio} no tiene
              ítems presupuestarios cargados. Primero carga la cédula presupuestaria del año
              y luego podrás certificar.
            </p>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: '12px', padding: '10px 16px', marginBottom: '14px',
        backdropFilter: 'blur(12px)', boxShadow: '0 1px 8px rgba(26,58,92,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            background: step === 1 ? `linear-gradient(135deg, ${ACCENT}, #1a3a5c)` : GREEN,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 800,
            boxShadow: step === 1 ? '0 3px 10px rgba(46,108,164,0.40)' : '0 2px 6px rgba(5,150,105,0.30)',
            transition: 'all 0.28s ease',
          }}>
            {step > 1 ? <CheckCircle size={13} /> : '1'}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: step === 1 ? TEXT : MUTED, transition: 'color 0.28s', lineHeight: 1.3 }}>Datos del Certificado</p>
            <p style={{ margin: 0, fontSize: '9px', color: step === 1 ? ACCENT : GREEN, fontWeight: 600, lineHeight: 1.2, transition: 'color 0.28s' }}>
              {step === 1 ? 'En progreso' : 'Completado ✓'}
            </p>
          </div>
        </div>

        <div style={{ flex: 1, height: '2px', background: step > 1 ? `linear-gradient(90deg, ${GREEN}, rgba(5,150,105,0.25))` : BORDER, margin: '0 14px', borderRadius: '2px', transition: 'background 0.35s ease', minWidth: '16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            background: step === 2 ? `linear-gradient(135deg, ${ACCENT}, #1a3a5c)` : 'rgba(46,108,164,0.08)',
            color: step === 2 ? '#fff' : MUTED,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 800,
            border: step !== 2 ? `2px solid rgba(46,108,164,0.16)` : 'none',
            boxShadow: step === 2 ? '0 3px 10px rgba(46,108,164,0.40)' : 'none',
            transition: 'all 0.28s ease',
          }}>
            2
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: step === 2 ? TEXT : MUTED, transition: 'color 0.28s', lineHeight: 1.3 }}>Agregar Ítems</p>
            <p style={{ margin: 0, fontSize: '9px', color: step === 2 ? ACCENT : 'rgba(90,122,159,0.55)', fontWeight: 600, lineHeight: 1.2 }}>
              {step === 2 ? 'En progreso' : 'Pendiente'}
            </p>
          </div>
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.20, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >

            <div style={SECTION_S}>
              <div style={SECTION_HDR}>
                <div style={{ width: '3px', height: '15px', background: ACCENT, borderRadius: '2px', flexShrink: 0 }} />
                <ClipboardList size={13} style={{ color: ACCENT }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: TEXT }}>Datos del Certificado</span>
                {certValid && (
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(5,150,105,0.10)', color: GREEN, borderRadius: '999px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                    <CheckCircle size={9} /> Completo
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Unidad Requiriente — fila completa destacada */}
                <div style={{ background: 'rgba(46,108,164,0.04)', border: '1px solid rgba(46,108,164,0.12)', borderRadius: '10px', padding: '10px 12px' }}>
                  <label style={LABEL_S}>Unidad Requiriente *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={certificado.id_unidad_requiriente}
                      onChange={e => setCertificado({ ...certificado, id_unidad_requiriente: e.target.value })}
                      style={{ ...INPUT_S, background: '#fff', minWidth: 0 }} onFocus={focusIn} onBlur={focusOut}
                    >
                      <option value="">— Seleccionar unidad —</option>
                      {entidades.map(e => <option key={e.id_unidad_requiriente} value={e.id_unidad_requiriente}>{e.nombre || e.nombre_entidad}</option>)}
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setShowModalEntidad(true)}
                      style={{ padding: '7px 11px', background: `linear-gradient(135deg, ${GREEN}, #047857)`, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'var(--font-primary)', display: 'flex', alignItems: 'center', gap: '3px', boxShadow: '0 2px 8px rgba(5,150,105,0.22)', flexShrink: 0 }}
                    >
                      <Plus size={11} /> Nueva
                    </motion.button>
                  </div>
                </div>

                {/* Divisor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: BORDER }} />
                  <span style={{ fontSize: '9px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap' }}>Información del Registro</span>
                  <div style={{ flex: 1, height: '1px', background: BORDER }} />
                </div>

                {/* 2×2 grid — 4 campos requeridos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    ['Clase de Registro *',   'clase_registro',     'Ej: MODIFICATIVO', 30],
                    ['Clase de Gasto *',      'clase_gasto',        'Ej: CORRIENTE',    30],
                    ['Tipo Doc. Respaldo *',  'tipo_doc_respaldo',  '',                 50],
                    ['Clase Doc. Respaldo *', 'clase_doc_respaldo', '',                 50],
                  ].map(([lbl, field, ph, max]) => (
                    <div key={field}>
                      <label style={LABEL_S}>{lbl}</label>
                      <input
                        type="text" placeholder={ph} maxLength={max}
                        value={certificado[field]}
                        onChange={e => setCertificado({ ...certificado, [field]: e.target.value })}
                        style={INPUT_S} onFocus={focusIn} onBlur={focusOut}
                      />
                    </div>
                  ))}
                </div>

                {/* Memorando — campo opcional, media anchura */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={LABEL_S}>Memorando N° *</label>
                    <input
                      type="text" placeholder="Ej: 001-2026" maxLength={30}
                      value={certificado.seccion_memorando}
                      onChange={e => setCertificado({ ...certificado, seccion_memorando: e.target.value })}
                      style={INPUT_S} onFocus={focusIn} onBlur={focusOut} required
                    />
                  </div>
                </div>

                {/* Divisor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: BORDER }} />
                  <span style={{ fontSize: '9px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap' }}>Descripción</span>
                  <div style={{ flex: 1, height: '1px', background: BORDER }} />
                </div>

                {/* Descripción General */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <label style={LABEL_S}>Descripción General *</label>
                    <span style={{ fontSize: '10px', color: certificado.descripcion.length > 900 ? '#b91c1c' : MUTED, fontVariantNumeric: 'tabular-nums' }}>
                      {certificado.descripcion.length}/1000
                    </span>
                  </div>
                  <textarea
                    rows={3} maxLength={1000}
                    placeholder="Describe el propósito o detalle de este certificado..."
                    value={certificado.descripcion}
                    onChange={e => setCertificado({ ...certificado, descripcion: e.target.value })}
                    style={{ ...INPUT_S, resize: 'vertical', lineHeight: '1.55', paddingTop: '8px' }}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </div>

              </div>
            </div>

            {/* Botón Siguiente */}
            <motion.button
              whileHover={!sinCedula ? { scale: 1.015, boxShadow: '0 10px 32px rgba(26,58,92,0.30)' } : {}}
              whileTap={!sinCedula ? { scale: 0.985 } : {}}
              disabled={sinCedula}
              onClick={() => {
                if (sinCedula) return
                const err = validarCertificado()
                if (err) { setError(err); return }
                setError("")
                setStep(2)
              }}
              style={{
                width: '100%', padding: '14px 20px',
                background: sinCedula
                  ? 'rgba(185,28,28,0.15)'
                  : 'linear-gradient(135deg, #1a3a5c 0%, #2e6ca4 55%, #3b82c0 100%)',
                color: sinCedula ? '#b91c1c' : '#fff',
                border: sinCedula ? '1px solid rgba(185,28,28,0.30)' : 'none',
                borderRadius: '12px',
                cursor: sinCedula ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-primary)',
                boxShadow: sinCedula ? 'none' : '0 4px 20px rgba(26,58,92,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.18s ease',
                opacity: sinCedula ? 0.7 : 1,
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>
                {sinCedula ? 'No disponible — sin cédula presupuestaria' : 'Continuar — Agregar Ítems'}
              </span>
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: sinCedula ? 'rgba(185,28,28,0.12)' : 'rgba(255,255,255,0.18)',
                borderRadius: '8px',
                padding: '4px 7px', gap: '2px',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.85 }}>{sinCedula ? '⚠' : 'Paso 2'}</span>
                {!sinCedula && <ChevronRight size={14} />}
              </span>
            </motion.button>

          </motion.div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.20, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >

            {/* Resumen paso 1 */}
            <div style={{ ...SECTION_S, padding: '12px 16px', background: 'rgba(46,108,164,0.04)', boxShadow: 'none', border: `1px solid rgba(46,108,164,0.12)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '9px' }}>
                <CheckCircle size={12} style={{ color: GREEN }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Datos del Certificado</span>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setStep(1)}
                  style={{ marginLeft: 'auto', padding: '3px 8px', background: 'rgba(46,108,164,0.10)', border: `1px solid rgba(46,108,164,0.18)`, borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, color: ACCENT, fontFamily: 'var(--font-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <ChevronLeft size={10} /> Editar
                </motion.button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 14px' }}>
                {[
                  ['Unidad Requiriente', unidadNombre || '—'],
                  ['Clase de Registro',  certificado.clase_registro  || '—'],
                  ['Clase de Gasto',     certificado.clase_gasto     || '—'],
                  ['Tipo Doc. Respaldo', certificado.tipo_doc_respaldo || '—'],
                  ['Clase Doc. Respaldo', certificado.clase_doc_respaldo || '—'],
                  ['Memorando',          certificado.seccion_memorando || '—'],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</span>
                    <span style={{ fontSize: '11px', color: TEXT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
                  </div>
                ))}
                {certificado.descripcion && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descripción</span>
                    <span style={{ fontSize: '11px', color: TEXT, lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{certificado.descripcion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Agregar Items */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ ...SECTION_S, padding: '12px' }}>
              <div style={{ ...SECTION_HDR, marginBottom: '10px', paddingBottom: '8px' }}>
                <div style={{ width: '3px', height: '13px', background: GREEN, borderRadius: '2px', flexShrink: 0 }} />
                <Package size={12} style={{ color: GREEN }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: TEXT }}>Agregar Ítems al Certificado</span>
              </div>

              <p style={{ ...GROUP_LBL, marginBottom: '5px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
                Estructura Programática
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                <SelectField label="Programa *"    value={itemForm.id_programa}    onChange={handleProgramaChange}    options={programas}    idKey="id_programa"    labelFn={p  => `${p.cod_programa} - ${p.nombre_programa}`} />
                <SelectField label="Subprograma *" value={itemForm.id_subprograma} onChange={handleSubprogramaChange} options={subprogramas} idKey="id_subprograma" labelFn={sp => `${String(sp.cod_subprograma).slice(-2)} - ${sp.nombre_subprograma}`} disabled={!itemForm.id_programa} />
                <SelectField label="Proyecto *"    value={itemForm.id_proyecto}    onChange={handleProyectoChange}    options={proyectos}    idKey="id_proyecto"    labelFn={py => `${String(py.cod_proyecto).slice(-3)} - ${py.nombre_proyecto}`}     disabled={!itemForm.id_subprograma} />
                <SelectField label="Actividad *"   value={itemForm.id_actividad}   onChange={handleActividadChange}   options={actividades}  idKey="id_actividad"  labelFn={a  => `${String(a.cod_actividad).slice(-3)} - ${a.nombre_actividad}`}       disabled={!itemForm.id_proyecto} />
              </div>

              <div style={{ height: '1px', background: 'rgba(46,108,164,0.09)', margin: '0 0 8px' }} />

              <p style={{ ...GROUP_LBL, marginBottom: '5px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: GOLD, display: 'inline-block' }} />
                Clasificador Presupuestario
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
                {/* Fuente — se activa tras elegir Actividad */}
                <SelectField label="Fuente *" value={itemForm.id_fuente} onChange={handleFuenteChange} options={fuentes} idKey="id_fuente" labelFn={f => `${f.cod_fuente} - ${f.nombre_fuente}`} disabled={!itemForm.id_actividad} />

                {/* Ítem — filtrado por actividad + fuente, sin duplicados */}
                <div>
                  <label style={LABEL_S}>Ítem *</label>
                  <select
                    value={itemForm.id_item}
                    onChange={e => {
                      const idItem = e.target.value
                      const selItem = items.find(i => String(i.id_item) === idItem)
                      setItemForm(prev => ({
                        ...prev,
                        id_item:       idItem,
                        id_ubicacion:  selItem ? String(selItem.id_ubicacion)  : "",
                        id_organismo:  selItem ? String(selItem.id_organismo)  : "",
                        id_naturaleza: selItem ? String(selItem.id_naturaleza) : "",
                        monto: "",
                      }))
                      setMontoDisponible(null)
                      if (idItem && itemForm.id_fuente) obtenerMontoDisponible(idItem, itemForm.id_fuente)
                    }}
                    style={{ ...INPUT_S, opacity: !itemForm.id_fuente ? 0.45 : 1, cursor: !itemForm.id_fuente ? 'not-allowed' : 'pointer', pointerEvents: !itemForm.id_fuente ? 'none' : 'auto' }}
                    onFocus={focusIn} onBlur={focusOut}
                  >
                    <option value="">— Seleccionar —</option>
                    {items.map(i => <option key={i.id_item} value={i.id_item}>{i.cod_item} - {i.nombre_item}</option>)}
                  </select>
                </div>

                {/* Ubicación — auto desde ítem */}
                <div>
                  <label style={LABEL_S}>Ubicación</label>
                  <div style={{
                    ...INPUT_S, display: 'flex', alignItems: 'center',
                    background: itemForm.id_item ? 'rgba(46,108,164,0.05)' : '#f8fafd',
                    color: itemForm.id_item ? TEXT : MUTED,
                    opacity: itemForm.id_item ? 1 : 0.55,
                    minHeight: '32px',
                  }}>
                    {itemForm.id_item
                      ? (() => { const s = items.find(i => String(i.id_item) === String(itemForm.id_item)); return s ? `${s.cod_ubicacion} — ${s.nombre_ubicacion}` : '—' })()
                      : 'Se completa al seleccionar ítem'}
                  </div>
                </div>

                {/* Organismo — auto desde ítem */}
                <div>
                  <label style={LABEL_S}>Organismo</label>
                  <div style={{
                    ...INPUT_S, display: 'flex', alignItems: 'center',
                    background: itemForm.id_item ? 'rgba(46,108,164,0.05)' : '#f8fafd',
                    color: itemForm.id_item ? TEXT : MUTED,
                    opacity: itemForm.id_item ? 1 : 0.55,
                    minHeight: '32px',
                  }}>
                    {itemForm.id_item
                      ? (() => { const s = items.find(i => String(i.id_item) === String(itemForm.id_item)); return s ? `${s.cod_organismo} — ${s.nombre_organismo}` : '—' })()
                      : 'Se completa al seleccionar ítem'}
                  </div>
                </div>

                {/* N Prestación — auto desde ítem */}
                <div>
                  <label style={LABEL_S}>N Prestación</label>
                  <div style={{
                    ...INPUT_S, display: 'flex', alignItems: 'center',
                    background: itemForm.id_item ? 'rgba(46,108,164,0.05)' : '#f8fafd',
                    color: itemForm.id_item ? TEXT : MUTED,
                    opacity: itemForm.id_item ? 1 : 0.55,
                    minHeight: '32px',
                  }}>
                    {itemForm.id_item
                      ? (() => { const s = items.find(i => String(i.id_item) === String(itemForm.id_item)); return s ? `${s.cod_naturaleza} — ${s.nombre_naturaleza}` : '—' })()
                      : 'Se completa al seleccionar ítem'}
                  </div>
                </div>

                <div>
                  <label style={LABEL_S}>Monto *</label>
                  <input
                    type="text" inputMode="decimal" placeholder="0,00"
                    value={itemForm.monto}
                    onChange={e => {
                      const v = e.target.value.replace('.', ',')
                      if (/^\d*[,]?\d{0,2}$/.test(v)) setItemForm({ ...itemForm, monto: v })
                    }}
                    style={{ ...INPUT_S, color: GREEN, fontWeight: 700 }}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                  {itemForm.id_item && (() => {
                    const fmt = v => `$${v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    const montoNum = parseFloat(itemForm.monto.toString().replace(',', '.'))
                    const tieneValor = itemForm.monto !== "" && !isNaN(montoNum) && montoNum > 0
                    if (!montoDisponible) return (
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: GOLD, fontWeight: 600 }}>
                        ⚠ Sin información presupuestaria para este ítem
                      </p>
                    )
                    const disp = montoDisponible.disponible_final
                    if (disp <= 0) return (
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: RED, fontWeight: 700 }}>
                        ✗ Sin saldo disponible — Codificado: {fmt(montoDisponible.codificado)}
                      </p>
                    )
                    if (tieneValor && montoNum > disp) return (
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: RED, fontWeight: 700 }}>
                        ✗ Excede el disponible — máximo: {fmt(disp)}
                      </p>
                    )
                    if (tieneValor) return (
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: GREEN, fontWeight: 700 }}>
                        ✓ Válido — disponible: {fmt(disp)}
                      </p>
                    )
                    return (
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: MUTED, fontWeight: 600 }}>
                        Disponible: {fmt(disp)}
                      </p>
                    )
                  })()}
                </div>
              </div>

              {/* Budget strip */}
              {montoDisponible && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: montoDisponible.disponible_final > 0 ? 'rgba(5,150,105,0.07)' : 'rgba(185,28,28,0.07)', border: `1px solid ${(montoDisponible.disponible_final > 0 ? GREEN : RED)}40`, borderRadius: '10px', padding: '10px 14px', marginBottom: '10px' }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '2px' }}>Presupuesto:</span>
                  {[
                    { label: 'Codificado',  value: montoDisponible.codificado,        color: ACCENT },
                    { label: 'Certificado', value: montoDisponible.certificado_actual, color: GOLD },
                    { label: 'Disponible',  value: montoDisponible.disponible_final,   color: montoDisponible.disponible_final > 0 ? GREEN : RED, bold: true },
                  ].map((s, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '7px', fontSize: '12px' }}>
                      <span style={{ color: MUTED, fontWeight: 600 }}>{s.label}:</span>
                      <span style={{ color: s.color, fontWeight: s.bold ? 800 : 700, fontSize: s.bold ? '13px' : '12px' }}>
                        ${s.value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </span>
                  ))}
                </motion.div>
              )}

              {itemForm.id_item && !montoDisponible && (
                <div style={{ background: 'rgba(217,119,6,0.08)', border: `1px solid ${GOLD}40`, borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontSize: '11px', color: GOLD }}>
                  Sin información presupuestaria para este item. Verifica el monto.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(5,150,105,0.32)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAgregarItem}
                  disabled={loading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: `linear-gradient(135deg, ${GREEN}, #047857)`, color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, opacity: loading ? 0.6 : 1, fontFamily: 'var(--font-primary)', boxShadow: '0 3px 12px rgba(5,150,105,0.24)' }}
                >
                  <Plus size={13} /> Agregar Item
                </motion.button>
              </div>
            </motion.div>

            {/* Tabla de ítems */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ ...SECTION_S, padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Package size={12} style={{ color: GREEN }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: TEXT }}>Ítems del Certificado</span>
                {itemsAgregados.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: `${GREEN}18`, color: GREEN, borderRadius: '999px', padding: '1px 7px', fontSize: '10px', fontWeight: 800 }}>
                    {itemsAgregados.length}
                  </span>
                )}
              </div>

              <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', minWidth: '620px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(46,108,164,0.07)' }}>
                      {[
                        'Programa', 'Subprograma', 'Proyecto', 'Actividad',
                        'Ítem', 'Fuente', 'Ubicación', 'Organismo', 'N. Prest.', 'Monto', '',
                      ].map((h, i) => (
                        <th key={i} style={{
                          padding: '6px 8px', textAlign: i === 9 ? 'right' : 'left',
                          fontWeight: 700, color: MUTED, textTransform: 'uppercase',
                          letterSpacing: '0.05em', whiteSpace: 'nowrap', fontSize: '9px',
                          borderBottom: `1px solid ${BORDER}`,
                          borderRight: i < 10 ? `1px solid ${BORDER}` : 'none',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itemsAgregados.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ padding: '26px', textAlign: 'center', color: MUTED, fontSize: '11px', fontWeight: 600 }}>
                          Sin ítems aún — agrega al menos uno para continuar
                        </td>
                      </tr>
                    ) : (
                      itemsAgregados
                        .map((item, originalIdx) => ({ item, originalIdx }))
                        .reverse()
                        .map(({ item, originalIdx }, displayIdx) => (
                          <tr key={originalIdx} style={{ borderBottom: `1px solid rgba(46,108,164,0.07)`, background: displayIdx % 2 === 0 ? CARD : BG }}>
                            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}` }}>
                              {item.programa?.cod_programa || '—'}
                            </td>
                            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}` }}>
                              {item.subprograma ? String(item.subprograma.cod_subprograma).slice(-2) : '—'}
                            </td>
                            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}` }}>
                              {item.proyecto ? String(item.proyecto.cod_proyecto).slice(-3) : '—'}
                            </td>
                            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}` }}>
                              {item.actividad ? String(item.actividad.cod_actividad).slice(-3) : '—'}
                            </td>
                            <td style={{ padding: '6px 8px', borderRight: `1px solid ${BORDER}`, minWidth: '110px' }}>
                              <p style={{ margin: '0 0 1px', fontSize: '10px', fontWeight: 800, color: ACCENT, fontFamily: 'monospace' }}>{item.item?.cod_item || '—'}</p>
                              <p style={{ margin: 0, fontSize: '10px', color: TEXT, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item?.nombre_item || '—'}</p>
                            </td>
                            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}` }}>
                              {item.fuente?.cod_fuente || '—'}
                            </td>
                            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}` }}>
                              {item.ubicacion?.cod_ubicacion || '—'}
                            </td>
                            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}` }}>
                              {item.organismo?.cod_organismo || '—'}
                            </td>
                            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}` }}>
                              {item.naturaleza?.cod_naturaleza || '—'}
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: GREEN, whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}` }}>
                              ${parseFloat(String(item.monto || 0).replace(',', '.')).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => handleRemoverItem(originalIdx)}
                                style={{ padding: '4px', background: 'rgba(185,28,28,0.08)', border: `1px solid ${RED}35`, borderRadius: '5px', cursor: 'pointer', color: RED, display: 'inline-flex', alignItems: 'center' }}>
                                <Trash2 size={10} />
                              </motion.button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {itemsAgregados.length > 0 && (
                <div style={{ marginTop: '10px', padding: '8px 10px', background: `${GREEN}10`, border: `1px solid ${GREEN}30`, borderRadius: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: GREEN }}>
                  TOTAL: ${totalMonto.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </motion.div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setStep(1)}
                style={{ flex: '0 0 auto', padding: '12px 18px', background: 'rgba(26,58,92,0.07)', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-primary)', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.background = 'rgba(26,58,92,0.11)' }}
                onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = 'rgba(26,58,92,0.07)' }}
              >
                <ChevronLeft size={14} /> Volver
              </motion.button>

              <motion.button
                whileHover={(!loading && itemsAgregados.length > 0) ? { scale: 1.02, boxShadow: '0 8px 28px rgba(26,58,92,0.28)' } : {}}
                whileTap={(!loading && itemsAgregados.length > 0) ? { scale: 0.98 } : {}}
                onClick={handleCrearCertificado}
                disabled={loading || itemsAgregados.length === 0}
                style={{
                  flex: 1, padding: '12px',
                  background: (loading || itemsAgregados.length === 0) ? 'rgba(26,58,92,0.07)' : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)',
                  color: (loading || itemsAgregados.length === 0) ? MUTED : '#fff',
                  border: 'none', borderRadius: '10px',
                  cursor: (loading || itemsAgregados.length === 0) ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: (loading || itemsAgregados.length === 0) ? 'none' : '0 4px 18px rgba(26,58,92,0.22)',
                  transition: 'all 0.18s ease', letterSpacing: '0.02em',
                }}
              >
                {loading ? 'Creando Certificado...' : 'Crear Certificado'}
              </motion.button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* Overlay de progreso */}
      <AnimatePresence>
        {createStep >= 0 && (() => {
          const PCT  = [10, 50, 80, 100]
          const pct  = PCT[createStep] ?? 0
          const R    = 38
          const C    = 2 * Math.PI * R
          const done = pct === 100
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
            >
              <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 24 }}
                animate={{ scale: 1,    opacity: 1, y: 0  }}
                exit={{   scale: 0.88, opacity: 0, y: 24  }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                style={{ background: '#ffffff', borderRadius: '18px', padding: '36px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', minWidth: '220px' }}
              >
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(26,58,92,0.10)" strokeWidth="7" />
                  <circle
                    cx="50" cy="50" r={R} fill="none"
                    stroke={done ? GREEN : ACCENT}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - pct / 100)}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 0.45s ease, stroke 0.3s ease' }}
                  />
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="17" fontWeight="800" fontFamily="Arial,sans-serif" fill={done ? GREEN : TEXT}>
                    {pct}%
                  </text>
                </svg>
                <div style={{ fontSize: '13px', fontWeight: 700, color: done ? GREEN : TEXT, fontFamily: 'var(--font-primary)', letterSpacing: '-0.01em' }}>
                  {done ? '¡Certificado creado!' : 'Creando certificado...'}
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Modal: Agregar Entidad */}
      <AnimatePresence>
        {showModalEntidad && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
            onClick={e => { if (e.target === e.currentTarget) setShowModalEntidad(false) }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              style={{ background: '#ffffff', borderRadius: '18px', overflow: 'hidden', maxWidth: '480px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
            >
              <div style={{ background: 'linear-gradient(135deg, #0d1f35, #1a3a5c)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={16} color="rgba(255,255,255,0.80)" />
                  <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>Agregar Unidad Requiriente</h2>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowModalEntidad(false)}
                  style={{ background: 'rgba(255,255,255,0.10)', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'rgba(255,255,255,0.70)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={15} />
                </motion.button>
              </div>

              <div style={{ padding: '22px' }}>
                <form onSubmit={e => { e.preventDefault(); handleAgregarEntidad() }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                    {[
                      ['Nombre Entidad *',   'nombre_entidad',       'text'],
                      ['Responsable *',      'responsable_entidad',  'text'],
                      ['Correo *',           'correo_institucional', 'email'],
                    ].map(([lbl, field, type]) => (
                      <div key={field}>
                        <label style={LABEL_S}>{lbl}</label>
                        <input
                          type={type} required
                          value={formEntidad[field]}
                          onChange={e => setFormEntidad({ ...formEntidad, [field]: e.target.value })}
                          style={INPUT_S} onFocus={focusIn} onBlur={focusOut}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      type="submit"
                      style={{ flex: 1, padding: '9px', background: `linear-gradient(135deg, ${GREEN}, #047857)`, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-primary)', boxShadow: '0 3px 10px rgba(5,150,105,0.22)' }}
                    >
                      Guardar Entidad
                    </motion.button>
                    <button
                      type="button" onClick={() => setShowModalEntidad(false)}
                      style={{ flex: 1, padding: '9px', background: 'rgba(26,58,92,0.06)', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-primary)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = TEXT }}
                      onMouseLeave={e => { e.currentTarget.style.color = MUTED }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
