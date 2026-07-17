import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { cachedAxiosGet, invalidateCache } from '../utils/apiCache';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, UserPlus, Users, UserCheck, UserX, ShieldOff, ShieldCheck, X, Lock, Eye, EyeOff, Search, Bell, BellOff, Save, CheckSquare, Square, RefreshCw, FileText, History, ChevronDown, ChevronUp } from 'lucide-react';
import { can } from '../utils/permissions';
import ConfirmModal from '../components/ConfirmModal';

const CARGOS = [
  'Director(a) financiero',
  'Analista de presupuesto 1',
  'Analista de presupuesto 3',
  'Director(a) de talento humano',
  'Rector',
  'Administrador del sistema',
];

const CARGOS_PERMISOS = [
  'Director(a) financiero',
  'Analista de presupuesto 1',
  'Analista de presupuesto 3',
  'Director(a) de talento humano',
  'Rector',
  'Administrador del sistema',
];

const CARGO_LABELS = {
  'Director(a) financiero':          'Dir. Financiero',
  'Analista de presupuesto 1':       'Analista 1',
  'Analista de presupuesto 3':       'Analista 3',
  'Director(a) de talento humano':   'Dir. T. Humano',
  'Rector':                          'Rector',
  'Administrador del sistema':       'Administrador',
};

const ACCION_LABELS = {
  ver:      'Ver',
  crear:    'Crear',
  editar:   'Editar',
  aprobar:  'Aprobar',
  rechazar: 'Rechazar',
  reenviar: 'Reenviar',
  errar:    'Errar',
  anular:   'Anular',
  eliminar: 'Eliminar',
};

const permThBase = {
  padding: '10px 14px', textAlign: 'left', fontWeight: 700,
  color: '#374151', background: '#f1f5f9', fontSize: '12px',
};
const permTdBase = {
  padding: '10px 14px', borderBottom: '1px solid rgba(46,108,164,0.08)',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  background: '#f8fafd',
  border: '1px solid rgba(46,108,164,0.22)',
  borderRadius: '8px',
  color: '#1a3a5c',
  fontSize: '13px',
  fontFamily: 'var(--font-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#5a7a9f',
  marginBottom: '5px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: 'var(--font-primary)',
};

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <FormField label={label}>
      <div style={{ position: 'relative' }}>
        <Lock size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8fa3c0', pointerEvents: 'none' }} />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ ...inputStyle, paddingLeft: '30px', paddingRight: '34px' }}
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
    </FormField>
  );
}

function SkeletonUsuariosStats({ isMobile }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.95)', borderRadius: '14px', boxShadow: '0 4px 20px rgba(26,58,92,0.08)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
            <div className="skeleton" style={{ width: '80px', height: '11px', borderRadius: '6px' }} />
          </div>
          <div className="skeleton" style={{ width: '50px', height: '28px', borderRadius: '8px' }} />
        </div>
      ))}
    </div>
  )
}

function SkeletonUsuariosRows() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
        <thead>
          <tr style={{ background: '#f0f4f8', borderBottom: '2px solid rgba(26,58,92,0.08)' }}>
            {['Nombre', 'Correo', 'Cargo', 'Estado', 'Acciones'].map((h, i) => (
              <th key={i} style={{ padding: '11px 16px', textAlign: i === 4 ? 'center' : 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4].map(i => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(26,58,92,0.07)' }}>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                  <div className="skeleton" style={{ width: '120px', height: '13px', borderRadius: '6px' }} />
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}><div className="skeleton" style={{ width: '160px', height: '12px', borderRadius: '6px' }} /></td>
              <td style={{ padding: '12px 16px' }}><div className="skeleton" style={{ width: '100px', height: '20px', borderRadius: '999px' }} /></td>
              <td style={{ padding: '12px 16px' }}><div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '999px' }} /></td>
              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                  <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const Usuarios = () => {
  const { token, user, refreshPermisos } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activo');
  const [isLoading, setIsLoading] = useState(true);
  const [globalMsg, setGlobalMsg] = useState({ text: '', type: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState('usuarios');

  // Estado para el tab de Permisos
  const [permMatriz,  setPermMatriz]  = useState({});
  const [permModulos, setPermModulos] = useState({});
  const [permDirty,   setPermDirty]   = useState({});
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving,  setPermSaving]  = useState(false);
  const [permMsg,     setPermMsg]     = useState(null);
  const [confirmQuitarVer, setConfirmQuitarVer] = useState(null);
  const [docModal,    setDocModal]    = useState({ open: false, error: '' });
  const [docForm,     setDocForm]     = useState({ tipo_documento: 'memorando', numero_documento: '', fecha_documento: '', observacion: '' });
  const [historial,   setHistorial]   = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histVisible, setHistVisible] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog,   setShowEditDialog]   = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [usuarioAEditar,   setUsuarioAEditar]   = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [dialogMsg, setDialogMsg] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    nombres: '', apellidos: '', correo_institucional: '',
    contrasena: '', cargo: '', estado: 'activo', recibe_notificaciones: true,
  });

  useEffect(() => { cargarUsuarios(); }, []);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const cargarUsuarios = async () => {
    try {
      setIsLoading(true);
      const res = await cachedAxiosGet(`${import.meta.env.VITE_API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === 'success') setUsuarios(res.data.data);
    } catch (err) {
      setGlobalMsg({ text: 'Error al cargar usuarios: ' + (err.response?.data?.message || err.message), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirCrear = () => {
    setFormData({ nombres: '', apellidos: '', correo_institucional: '', contrasena: '', cargo: '', estado: 'activo', recibe_notificaciones: true });
    setUsuarioAEditar(null);
    setDialogMsg({ text: '', type: '' });
    setShowCreateDialog(true);
  };

  const handleAbrirEditar = (u) => {
    setFormData({ nombres: u.nombres, apellidos: u.apellidos, correo_institucional: u.correo_institucional, contrasena: '', cargo: u.cargo, estado: u.estado, recibe_notificaciones: u.recibe_notificaciones !== false });
    setUsuarioAEditar(u);
    setDialogMsg({ text: '', type: '' });
    setShowEditDialog(true);
  };

  const handleAbrirEliminar = (u) => { setUsuarioAEliminar(u); setShowDeleteDialog(true); };

  const handleActivar = async (u) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/usuarios/${u.id_usuario}`, { estado: 'activo' }, { headers: { Authorization: `Bearer ${token}` } });
      setGlobalMsg({ text: 'Usuario activado exitosamente', type: 'success' });
      invalidateCache('/usuarios');
      cargarUsuarios();
      setTimeout(() => setGlobalMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      setGlobalMsg({ text: err.response?.data?.message || 'Error al activar usuario', type: 'error' });
    }
  };


  const handleDesbloquear = async (u) => {
    try {
      setIsLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/usuarios/${u.id_usuario}/desbloquear`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') {
        setGlobalMsg({ text: `Cuenta de ${u.nombres} desbloqueada correctamente`, type: 'success' });
        invalidateCache('/usuarios');
        cargarUsuarios();
        setTimeout(() => setGlobalMsg({ text: '', type: '' }), 3500);
      }
    } catch (err) {
      setGlobalMsg({ text: err.response?.data?.message || err.message, type: 'error' });
    } finally { setIsLoading(false); }
  };

  const handleCrearUsuario = async () => {
    if (!formData.nombres || !formData.apellidos || !formData.correo_institucional || !formData.cargo) {
      setDialogMsg({ text: 'Todos los campos son requeridos', type: 'error' }); return;
    }
    if (!formData.correo_institucional.toLowerCase().endsWith('@ueb.edu.ec')) {
      setDialogMsg({ text: 'El correo debe pertenecer al dominio @ueb.edu.ec', type: 'error' }); return;
    }
    try {
      setIsLoading(true);
      const { contrasena, ...createData } = formData;
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/usuarios`, createData, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') {
        setDialogMsg({ text: 'Usuario creado. Se envió un correo con las credenciales de acceso.', type: 'success' });
        setTimeout(() => { setShowCreateDialog(false); setDialogMsg({ text: '', type: '' }); invalidateCache('/usuarios'); cargarUsuarios(); }, 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : err.response?.data?.message || err.message;
      setDialogMsg({ text: msg, type: 'error' });
    } finally { setIsLoading(false); }
  };

  const handleActualizarUsuario = async () => {
    if (!formData.nombres || !formData.apellidos || !formData.correo_institucional || !formData.cargo) {
      setDialogMsg({ text: 'Nombre, apellido, correo y cargo son requeridos', type: 'error' }); return;
    }
    if (!formData.correo_institucional.toLowerCase().endsWith('@ueb.edu.ec')) {
      setDialogMsg({ text: 'El correo debe pertenecer al dominio @ueb.edu.ec', type: 'error' }); return;
    }
    try {
      setIsLoading(true);
      const datos = { ...formData };
      if (!datos.contrasena) delete datos.contrasena;
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/usuarios/${usuarioAEditar.id_usuario}`, datos, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') {
        setDialogMsg({ text: 'Usuario actualizado exitosamente', type: 'success' });
        setTimeout(() => { setShowEditDialog(false); setDialogMsg({ text: '', type: '' }); invalidateCache('/usuarios'); cargarUsuarios(); }, 1400);
      }
    } catch (err) {
      const msg = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : err.response?.data?.message || err.message;
      setDialogMsg({ text: msg, type: 'error' });
    } finally { setIsLoading(false); }
  };

  const handleEliminarUsuario = async () => {
    try {
      setIsLoading(true);
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/usuarios/${usuarioAEliminar.id_usuario}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') {
        setGlobalMsg({ text: 'Usuario desactivado exitosamente', type: 'success' });
        setShowDeleteDialog(false);
        invalidateCache('/usuarios');
        cargarUsuarios();
        setTimeout(() => setGlobalMsg({ text: '', type: '' }), 3500);
      }
    } catch (err) {
      setGlobalMsg({ text: err.response?.data?.message || err.message, type: 'error' });
    } finally { setIsLoading(false); }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideNombre =
      u.nombres.toLowerCase().includes(filtroNombre.toLowerCase()) ||
      u.apellidos.toLowerCase().includes(filtroNombre.toLowerCase()) ||
      u.correo_institucional.toLowerCase().includes(filtroNombre.toLowerCase());
    const coincideEstado = filtroEstado === 'todos' || u.estado === filtroEstado;
    return coincideNombre && coincideEstado;
  });

  const totalUsuarios = usuarios.length;
  const activos       = usuarios.filter(u => u.estado === 'activo').length;
  const inactivos     = usuarios.filter(u => u.estado === 'inactivo').length;
  const bloqueados    = usuarios.filter(u => u.estado === 'bloqueado').length;

  // ── Funciones de Permisos ────────────────────────────────────────
  const cargarPermisos = useCallback(async () => {
    setPermLoading(true);
    setPermMsg(null);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/permisos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const modsData = res.data.modulos || {};
        setPermModulos(modsData);
        const data = res.data.data || {};
        const full = {};
        for (const cargo of CARGOS_PERMISOS) {
          full[cargo] = {};
          for (const modulo of Object.keys(modsData)) {
            full[cargo][modulo] = (data[cargo]?.[modulo] || []).slice();
          }
        }
        setPermMatriz(full);
        setPermDirty({});
      }
    } catch {
      setPermMsg({ tipo: 'error', texto: 'Error al cargar los permisos' });
    } finally {
      setPermLoading(false);
    }
  }, [token]);

  const togglePermiso = (cargo, modulo, accion) => {
    const actual = permMatriz[cargo]?.[modulo] || [];
    const activando = !actual.includes(accion);

    // Desmarcar 'ver' con otras acciones activas → pedir confirmación
    if (!activando && accion === 'ver' && actual.filter(a => a !== 'ver').length > 0) {
      setConfirmQuitarVer({ cargo, modulo });
      return;
    }

    setPermMatriz(prev => {
      const base = prev[cargo]?.[modulo] || [];
      let siguiente = activando
        ? [...base, accion]
        : base.filter(a => a !== accion);
      // Al activar cualquier acción, auto-marcar 'ver' en el mismo módulo
      if (activando && accion !== 'ver' && !siguiente.includes('ver')) {
        siguiente = [...siguiente, 'ver'];
      }
      // Al activar cualquier permiso de liquidaciones, auto-marcar 'ver' en certificaciones
      let nuevoPrev = { ...prev, [cargo]: { ...prev[cargo], [modulo]: siguiente } };
      if (activando && modulo === 'liquidaciones') {
        const certActual = nuevoPrev[cargo]?.['certificaciones'] || [];
        if (!certActual.includes('ver')) {
          nuevoPrev = { ...nuevoPrev, [cargo]: { ...nuevoPrev[cargo], certificaciones: [...certActual, 'ver'] } };
        }
      }
      return nuevoPrev;
    });
    const dirty = { [`${cargo}|${modulo}`]: true };
    if (activando && modulo === 'liquidaciones') dirty[`${cargo}|certificaciones`] = true;
    setPermDirty(prev => ({ ...prev, ...dirty }));
  };

  const confirmarQuitarVer = () => {
    const { cargo, modulo } = confirmQuitarVer;
    setPermMatriz(prev => {
      const updated = { ...prev[cargo], [modulo]: [] };
      // Si se quitan todos los permisos de certificaciones, también limpiar liquidaciones
      if (modulo === 'certificaciones') updated['liquidaciones'] = [];
      return { ...prev, [cargo]: updated };
    });
    const dirty = { [`${cargo}|${modulo}`]: true };
    if (modulo === 'certificaciones') dirty[`${cargo}|liquidaciones`] = true;
    setPermDirty(prev => ({ ...prev, ...dirty }));
    setConfirmQuitarVer(null);
  };

  const guardarPermisos = () => {
    const cambios = Object.keys(permDirty).filter(k => permDirty[k]);
    if (!cambios.length) return;
    setDocForm({ tipo_documento: 'quipux', numero_documento: '', observacion: '', archivo: null });
    setDocModal({ open: true, error: '' });
  };

  const confirmarGuardarPermisos = async () => {
    if (!docForm.numero_documento.trim()) {
      setDocModal(m => ({ ...m, error: 'El número de documento es obligatorio.' }));
      return;
    }
    if (!docForm.archivo) {
      setDocModal(m => ({ ...m, error: 'Debe subir el documento de respaldo en formato PDF.' }));
      return;
    }
    setDocModal(m => ({ ...m, error: '' }));
    setPermSaving(true);
    setPermMsg(null);
    const cambios = Object.keys(permDirty).filter(k => permDirty[k]);
    try {
      for (const clave of cambios) {
        const [cargo, modulo] = clave.split('|');
        const fd = new FormData();
        fd.append('cargo',            cargo);
        fd.append('modulo',           modulo);
        const acciones = permMatriz[cargo]?.[modulo] || [];
        acciones.forEach(a => fd.append('acciones[]', a));
        fd.append('tipo_documento',   docForm.tipo_documento);
        fd.append('numero_documento', docForm.numero_documento.trim());
        fd.append('observacion',      docForm.observacion.trim() || '');
        if (docForm.archivo) fd.append('archivo', docForm.archivo);
        fd.append('_method', 'PUT');
        await axios.post(`${import.meta.env.VITE_API_URL}/permisos`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
      }
      setPermDirty({});
      setDocModal({ open: false, error: '' });
      setPermMsg({ tipo: 'ok', texto: 'Permisos guardados correctamente con respaldo documental.' });
      refreshPermisos();
      cargarHistorial();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      let msg = 'Error al guardar los permisos. Intenta nuevamente.';
      if (errors?.archivo) msg = 'El archivo debe ser PDF y no superar 5MB.';
      else if (errors?.numero_documento) msg = 'El número de documento es obligatorio.';
      else if (err?.response?.data?.message) msg = err.response.data.message;
      setDocModal(m => ({ ...m, error: msg }));
    } finally {
      setPermSaving(false);
    }
  };

  const cargarHistorial = async () => {
    setHistLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/permisos-historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setHistorial(res.data.data);
    } catch { /* silencioso */ } finally {
      setHistLoading(false);
    }
  };

  // Cargar permisos e historial cuando se abre el tab
  useEffect(() => {
    if (activeTab === 'permisos') {
      if (Object.keys(permMatriz).length === 0) cargarPermisos();
      if (historial.length === 0) cargarHistorial();
    }
  }, [activeTab]);

  const hayDirtyPermisos = Object.values(permDirty).some(Boolean);

  const P = isMobile ? '20px' : '28px';

  const tabs = [
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    ...(can.verPermisos(user) ? [{ id: 'permisos', label: 'Permisos', icon: ShieldCheck }] : []),
  ];

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)', fontFamily: 'var(--font-primary)' }}>

      {/* Sticky header con tabs */}
      <div style={{
        background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(26,58,92,0.08)',
        boxShadow: '0 2px 16px rgba(26,58,92,0.06)',
        padding: `20px ${P} 12px`, position: 'sticky', top: 0, zIndex: 40,
      }}>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(46,108,164,0.10)', border: '1px solid rgba(46,108,164,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} color="#2e6ca4" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: '#1a3a5c', letterSpacing: '-0.02em' }}>
              Gestión de Usuarios
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#5a7a9f' }}>
              {activeTab === 'permisos'
                ? 'Configure el acceso por cargo a cada módulo del sistema'
                : 'Administra los usuarios del sistema de control presupuestario'}
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', background: 'rgba(26,58,92,0.06)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {tabs.map((tab, i) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <motion.button key={tab.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '8px 16px',
                  background: active ? '#ffffff' : 'none',
                  border: active ? '1px solid rgba(46,108,164,0.18)' : '1px solid transparent',
                  borderRadius: '8px',
                  boxShadow: active ? '0 1px 5px rgba(26,58,92,0.13)' : 'none',
                  color: active ? '#1a3a5c' : '#5a7a9f',
                  cursor: 'pointer', fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  fontFamily: 'var(--font-primary)',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: active ? '#2e6ca4' : 'inherit', display: 'flex' }}>
                  <Icon size={15} />
                </span>
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Contenido del tab */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >

          {/* ── TAB: Usuarios ── */}
          {activeTab === 'usuarios' && (
            <div style={{ padding: P }}>

              {/* Global message */}
              <AnimatePresence>
                {globalMsg.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      padding: '10px 14px', marginBottom: '16px',
                      background: globalMsg.type === 'error' ? 'rgba(139,15,15,0.08)' : 'rgba(5,150,105,0.08)',
                      border: `1px solid ${globalMsg.type === 'error' ? 'rgba(139,15,15,0.25)' : 'rgba(5,150,105,0.25)'}`,
                      borderRadius: '10px',
                      color: globalMsg.type === 'error' ? '#b91c1c' : '#047857',
                      fontSize: '13px', fontWeight: 500,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span>{globalMsg.text}</span>
                    <button onClick={() => setGlobalMsg({ text: '', type: '' })} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 0 0 12px', fontSize: '16px' }}>✕</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats */}
              {isLoading && usuarios.length === 0 ? (
                <SkeletonUsuariosStats isMobile={isMobile} />
              ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Total',      value: totalUsuarios, icon: Users,      color: '#2e6ca4' },
                  { label: 'Activos',    value: activos,       icon: UserCheck,  color: '#059669' },
                  { label: 'Inactivos',  value: inactivos,     icon: UserX,      color: '#8b0f0f' },
                  { label: 'Bloqueados', value: bloqueados,    icon: ShieldOff,  color: '#d97706' },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, type: 'spring', stiffness: 120, damping: 18 }}
                      style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.95)', borderRadius: '14px', boxShadow: '0 4px 20px rgba(26,58,92,0.08)', padding: '18px 20px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}12`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={18} color={s.color} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.03em' }}>{s.value}</p>
                    </motion.div>
                  );
                })}
              </div>
              )}

              {/* Toolbar */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row', marginBottom: '14px', flexWrap: 'wrap' }}
              >
                <div style={{ flex: 1, position: 'relative', minWidth: '180px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#8fa3c0', pointerEvents: 'none' }} />
                  <input type="text" placeholder="Buscar por nombre, apellido o correo..."
                    value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value.slice(0, 100))} maxLength={100}
                    style={{ ...inputStyle, paddingLeft: '32px' }}
                    onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {[
                    { key: 'activo',   label: 'Activos',   color: '#059669' },
                    { key: 'inactivo', label: 'Inactivos', color: '#b91c1c' },
                    { key: 'todos',    label: 'Todos',     color: '#2e6ca4' },
                  ].map(({ key, label, color }) => (
                    <button key={key} onClick={() => setFiltroEstado(key)}
                      style={{
                        padding: '8px 14px', borderRadius: '8px', border: `1px solid ${filtroEstado === key ? color : 'rgba(46,108,164,0.20)'}`,
                        background: filtroEstado === key ? `${color}15` : 'transparent',
                        color: filtroEstado === key ? color : '#5a7a9f',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
                        transition: 'all 0.15s ease',
                      }}
                    >{label}</button>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(46,108,164,0.35)' }} whileTap={{ scale: 0.98 }}
                  onClick={handleAbrirCrear}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'var(--font-primary)', boxShadow: '0 4px 16px rgba(26,58,92,0.25)' }}
                >
                  <UserPlus size={16} />
                  Crear Usuario
                </motion.button>
              </motion.div>

              {/* Table */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.95)', borderRadius: '16px', boxShadow: '0 4px 24px rgba(26,58,92,0.10)', overflow: 'hidden' }}
              >
                {isLoading && usuariosFiltrados.length === 0 ? (
                  <SkeletonUsuariosRows />
                ) : usuariosFiltrados.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center' }}>
                    <Users size={36} color="rgba(26,58,92,0.15)" style={{ marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay usuarios que coincidan con la búsqueda</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                      <thead>
                        <tr style={{ background: '#f0f4f8', borderBottom: '2px solid rgba(26,58,92,0.08)' }}>
                          {['Nombre', 'Correo', 'Cargo', 'Estado', 'Notif.', 'Acciones'].map((h, i) => (
                            <th key={i} style={{ padding: '11px 16px', textAlign: i >= 4 ? 'center' : 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usuariosFiltrados.map((u, idx) => (
                          <motion.tr key={u.id_usuario}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 180, damping: 22 }}
                            style={{ borderBottom: '1px solid rgba(26,58,92,0.07)', transition: 'background 0.15s ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(240,244,248,0.85)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                  {(u.nombres || '?')[0].toUpperCase()}
                                </div>
                                {u.nombres} {u.apellidos}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{u.correo_institucional}</td>
                            <td style={{ padding: '12px 16px' }}><span className="badge badge-blue">{u.cargo}</span></td>
                            <td style={{ padding: '12px 16px' }}>
                              {u.estado === 'activo'
                                ? <span className="badge badge-green">Activo</span>
                                : u.estado === 'bloqueado'
                                  ? <span className="badge" style={{ background: 'rgba(217,119,6,0.12)', color: '#92400e', border: '1px solid rgba(217,119,6,0.30)', borderRadius: '999px', padding: '2px 10px', fontSize: '11px', fontWeight: 700 }}>Bloqueado</span>
                                  : <span className="badge badge-red">Inactivo</span>}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <span title={u.recibe_notificaciones !== false ? 'Recibe notificaciones' : 'Notificaciones desactivadas'}>
                                {u.recibe_notificaciones !== false ? <Bell size={15} color="#2e6ca4" /> : <BellOff size={15} color="#cbd5e1" />}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                {u.estado === 'bloqueado' && (
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDesbloquear(u)} title="Desbloquear cuenta"
                                    style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.28)', borderRadius: '8px', color: '#d97706', cursor: 'pointer' }}
                                  ><ShieldCheck size={14} /></motion.button>
                                )}
                                {u.estado === 'inactivo' ? (
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleActivar(u)} title="Activar usuario"
                                    style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.28)', borderRadius: '8px', color: '#059669', cursor: 'pointer' }}
                                  ><UserCheck size={14} /></motion.button>
                                ) : (
                                  <>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleAbrirEditar(u)} title="Editar"
                                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(46,108,164,0.10)', border: '1px solid rgba(46,108,164,0.20)', borderRadius: '8px', color: '#2e6ca4', cursor: 'pointer' }}
                                    ><Edit2 size={14} /></motion.button>
                                    {u.id_usuario !== user?.id_usuario && (
                                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleAbrirEliminar(u)} title="Desactivar usuario"
                                        style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139,15,15,0.08)', border: '1px solid rgba(139,15,15,0.20)', borderRadius: '8px', color: '#b91c1c', cursor: 'pointer' }}
                                      ><UserX size={14} /></motion.button>
                                    )}
                                  </>
                                )}
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
          )}

          {/* ── TAB: Permisos ── */}
          {activeTab === 'permisos' && (
            <div style={{ padding: P }}>
              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#5a7a9f' }}>
                  Las filas con <span style={{ color: '#d97706', fontWeight: 700 }}>●</span> tienen cambios pendientes de guardar.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={cargarPermisos} disabled={permLoading || permSaving}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(46,108,164,0.14)', background: '#fff', color: '#5a7a9f', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                  ><RefreshCw size={14} /> Recargar</button>
                  <button onClick={guardarPermisos} disabled={!hayDirtyPermisos || permSaving}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: hayDirtyPermisos && !permSaving ? '#2e6ca4' : '#b0c4de', color: '#fff', cursor: hayDirtyPermisos && !permSaving ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 600 }}
                  ><Save size={14} /> {permSaving ? 'Guardando…' : 'Guardar cambios'}</button>
                </div>
              </div>

              {/* Mensaje */}
              {permMsg && (
                <div style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '8px', background: permMsg.tipo === 'ok' ? '#d1fae5' : '#fee2e2', color: permMsg.tipo === 'ok' ? '#065f46' : '#991b1b', fontSize: '13px', fontWeight: 500 }}>
                  {permMsg.texto}
                </div>
              )}

              {permLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#5a7a9f' }}>Cargando permisos…</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(46,108,164,0.08)', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ ...permThBase, width: '160px', borderBottom: '2px solid rgba(46,108,164,0.14)' }} rowSpan={2}>Cargo</th>
                        {Object.entries(permModulos).map(([modulo, acciones]) => (
                          <th key={modulo} colSpan={acciones.length}
                            style={{ ...permThBase, textAlign: 'center', background: modulo === 'certificaciones' ? '#eff6ff' : '#f0fdf4', color: modulo === 'certificaciones' ? '#1e40af' : '#166534', borderBottom: `2px solid ${modulo === 'certificaciones' ? '#bfdbfe' : '#bbf7d0'}`, textTransform: 'capitalize', letterSpacing: '0.5px' }}
                          >{modulo}</th>
                        ))}
                      </tr>
                      <tr>
                        {Object.entries(permModulos).flatMap(([modulo, acciones]) =>
                          acciones.map(accion => (
                            <th key={`${modulo}-${accion}`} style={{ ...permThBase, textAlign: 'center', fontWeight: 500, color: '#5a7a9f', borderBottom: '2px solid rgba(46,108,164,0.14)', whiteSpace: 'nowrap', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              {ACCION_LABELS[accion] || accion}
                            </th>
                          ))
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {CARGOS_PERMISOS.map((cargo, idx) => {
                        const rowDirty = Object.entries(permDirty).some(([k, v]) => v && k.startsWith(`${cargo}|`));
                        return (
                          <tr key={cargo} style={{ background: rowDirty ? '#fffbeb' : idx % 2 === 0 ? '#ffffff' : '#f8fafd', transition: 'background 0.15s' }}>
                            <td style={{ ...permTdBase, fontWeight: 600, color: '#1a3a5c', borderRight: '1px solid rgba(46,108,164,0.14)' }}>
                              {CARGO_LABELS[cargo] || cargo}
                              {rowDirty && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#d97706', fontWeight: 700 }}>●</span>}
                            </td>
                            {Object.entries(permModulos).flatMap(([modulo, acciones]) =>
                              acciones.map(accion => {
                                const checked = (permMatriz[cargo]?.[modulo] || []).includes(accion);
                                return (
                                  <td key={`${cargo}-${modulo}-${accion}`} style={{ ...permTdBase, textAlign: 'center' }}>
                                    <button onClick={() => togglePermiso(cargo, modulo, accion)} title={checked ? 'Quitar permiso' : 'Dar permiso'}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: checked ? '#2ea466' : '#cbd5e1', transition: 'color 0.15s, transform 0.1s' }}
                                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                      {checked ? <CheckSquare size={18} strokeWidth={2.2} /> : <Square size={18} strokeWidth={1.5} />}
                                    </button>
                                  </td>
                                );
                              })
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Historial de cambios */}
              {activeTab === 'permisos' && (
                <div style={{ marginTop: '32px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(46,108,164,0.12)', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setHistVisible(v => !v); if (!histVisible && historial.length === 0) cargarHistorial(); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <History size={16} color="#2e6ca4" />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a3a5c' }}>Historial de cambios de permisos</span>
                      <span style={{ fontSize: '11px', background: 'rgba(46,108,164,0.10)', color: '#2e6ca4', borderRadius: '20px', padding: '2px 8px', fontWeight: 700 }}>{historial.length}</span>
                    </div>
                    {histVisible ? <ChevronUp size={16} color="#5a7a9f" /> : <ChevronDown size={16} color="#5a7a9f" />}
                  </button>

                  {histVisible && (
                    <div style={{ borderTop: '1px solid rgba(46,108,164,0.10)', overflowX: 'auto' }}>
                      {histLoading ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#5a7a9f', fontSize: '13px' }}>Cargando historial…</div>
                      ) : historial.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#5a7a9f', fontSize: '13px' }}>No hay cambios registrados aún.</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                              {['Fecha', 'Usuario', 'Cargo modificado', 'Módulo', 'Documento', 'N° Documento', 'Acciones anteriores', 'Acciones nuevas', 'Observación', 'Archivo'].map(h => (
                                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap', borderBottom: '2px solid rgba(46,108,164,0.14)' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {historial.map((h, i) => (
                              <tr key={h.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafd' }}>
                                <td style={{ padding: '8px 12px', color: '#374151', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(46,108,164,0.07)' }}>{h.created_at}</td>
                                <td style={{ padding: '8px 12px', color: '#374151', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(46,108,164,0.07)' }}>{h.nombre_usuario}</td>
                                <td style={{ padding: '8px 12px', color: '#1a3a5c', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(46,108,164,0.07)' }}>{CARGO_LABELS[h.cargo_modificado] || h.cargo_modificado}</td>
                                <td style={{ padding: '8px 12px', color: '#374151', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(46,108,164,0.07)' }}>{h.modulo}</td>
                                <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(46,108,164,0.07)' }}>
                                  <span style={{ background: 'rgba(46,108,164,0.10)', color: '#2e6ca4', borderRadius: '6px', padding: '2px 7px', fontWeight: 700, textTransform: 'capitalize' }}>{h.tipo_documento}</span>
                                </td>
                                <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(46,108,164,0.07)' }}>{h.numero_documento}</td>
                                <td style={{ padding: '8px 12px', color: '#b91c1c', borderBottom: '1px solid rgba(46,108,164,0.07)' }}>{(h.acciones_anteriores || []).join(', ') || '—'}</td>
                                <td style={{ padding: '8px 12px', color: '#065f46', borderBottom: '1px solid rgba(46,108,164,0.07)' }}>{(h.acciones_nuevas || []).join(', ') || '—'}</td>
                                <td style={{ padding: '8px 12px', color: '#5a7a9f', borderBottom: '1px solid rgba(46,108,164,0.07)', maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{h.observacion || '—'}</td>
                                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(46,108,164,0.07)', whiteSpace: 'nowrap' }}>
                                  {h.archivo_url
                                    ? <a href={h.archivo_url} target="_blank" rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2e6ca4', fontWeight: 600, fontSize: '12px', textDecoration: 'none' }}>
                                        <FileText size={13} /> Ver PDF
                                      </a>
                                    : <span style={{ color: '#cbd5e1' }}>—</span>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Modals ──────────────────────────────────────────────────── */}

      {/* Modal respaldo documental para guardar permisos */}
      <AnimatePresence>
        {docModal.open && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(15,30,55,0.55)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px' }}
            onClick={e => { if (e.target === e.currentTarget && !permSaving) setDocModal({ open:false, error:'' }) }}
          >
            <motion.div initial={{ scale:0.88, opacity:0, y:24 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.88, opacity:0, y:24 }}
              transition={{ type:'spring', stiffness:320, damping:26 }}
              style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'480px', overflow:'hidden', boxShadow:'0 24px 64px rgba(15,30,55,0.28)' }}
            >
              <div style={{ background:'linear-gradient(135deg,#0d1035,#2e31a4)', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <FileText size={16} color="rgba(255,255,255,0.80)" />
                  <div>
                    <div style={{ fontSize:'15px', fontWeight:800, color:'#fff' }}>Respaldo documental</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.60)', marginTop:'1px' }}>Ingrese el documento que autoriza este cambio</div>
                  </div>
                </div>
                <button onClick={() => !permSaving && setDocModal({ open:false, error:'' })} disabled={permSaving}
                  style={{ background:'rgba(255,255,255,0.10)', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', width:'28px', height:'28px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}
                ><X size={14} /></button>
              </div>
              <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <div>
                    <label style={labelStyle}>Tipo de documento *</label>
                    <select value={docForm.tipo_documento} onChange={e => setDocForm(f => ({ ...f, tipo_documento: e.target.value }))}
                      style={{ ...inputStyle }}>
                      <option value="quipux">Quipux</option>
                      <option value="oficio">Oficio</option>
                      <option value="memorando">Memorando</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>N° Documento *</label>
                    <input type="text" value={docForm.numero_documento} onChange={e => setDocForm(f => ({ ...f, numero_documento: e.target.value.slice(0, 50) }))}
                      placeholder="Ej: MEM-2026-001" style={{ ...inputStyle }} maxLength={50} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Subir documento * (PDF — máx. 5MB)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="file" id="archivo-permiso" accept=".pdf,application/pdf"
                      onChange={e => setDocForm(f => ({ ...f, archivo: e.target.files[0] || null }))}
                      style={{ display: 'none' }} />
                    <label htmlFor="archivo-permiso" style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '9px 12px', background: '#f8fafd',
                      border: '1px dashed rgba(46,108,164,0.40)', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '13px', color: docForm.archivo ? '#1a3a5c' : '#5a7a9f',
                      fontFamily: 'var(--font-primary)', transition: 'border-color 0.18s',
                    }}>
                      <FileText size={15} color="#2e6ca4" />
                      {docForm.archivo ? docForm.archivo.name : 'Seleccionar archivo…'}
                    </label>
                    {docForm.archivo && (
                      <button onClick={() => setDocForm(f => ({ ...f, archivo: null }))}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', display: 'flex' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label style={labelStyle}>Observación (opcional)</label>
                    <span style={{ fontSize: '10px', color: docForm.observacion.length > 450 ? '#b91c1c' : '#5a7a9f' }}>{docForm.observacion.length}/500</span>
                  </div>
                  <textarea value={docForm.observacion} onChange={e => setDocForm(f => ({ ...f, observacion: e.target.value.slice(0, 500) }))}
                    placeholder="Motivo del cambio de permisos..." rows={2} maxLength={500}
                    style={{ ...inputStyle, resize:'vertical', minHeight:'60px' }} />
                </div>
                {docModal.error && (
                  <div style={{ background:'rgba(185,28,28,0.08)', border:'1px solid rgba(185,28,28,0.22)', borderRadius:'8px', padding:'9px 13px', color:'#b91c1c', fontSize:'12px', fontWeight:500 }}>{docModal.error}</div>
                )}
                <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', paddingTop:'4px' }}>
                  <button onClick={() => setDocModal({ open:false, error:'' })} disabled={permSaving}
                    style={{ padding:'8px 16px', background:'rgba(26,58,92,0.06)', border:'1px solid rgba(26,58,92,0.14)', borderRadius:'8px', color:'#5a7a9f', cursor:'pointer', fontSize:'13px', fontFamily:'var(--font-primary)' }}>
                    Cancelar
                  </button>
                  <button onClick={confirmarGuardarPermisos} disabled={permSaving}
                    style={{ padding:'8px 20px', background: permSaving ? 'rgba(46,108,164,0.50)' : '#2e6ca4', border:'none', borderRadius:'8px', color:'#fff', cursor: permSaving ? 'default' : 'pointer', fontSize:'13px', fontWeight:700, fontFamily:'var(--font-primary)', display:'flex', alignItems:'center', gap:'6px' }}>
                    <Save size={13} /> {permSaving ? 'Guardando…' : 'Confirmar y guardar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crear */}
      <AnimatePresence>
        {showCreateDialog && (
          <UEBModal title="Crear Nuevo Usuario" onClose={() => setShowCreateDialog(false)} isMobile={isMobile} icon={UserPlus}>
            <DialogMsg msg={dialogMsg} onClose={() => setDialogMsg({ text: '', type: '' })} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 14px' }}>
              <FormField label="Nombres *">
                <input type="text" value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value.slice(0, 50) })} maxLength={50} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
                />
              </FormField>
              <FormField label="Apellidos *">
                <input type="text" value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value.slice(0, 50) })} maxLength={50} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
                />
              </FormField>
            </div>
            <FormField label="Correo Institucional *">
              <input type="email" value={formData.correo_institucional} onChange={(e) => setFormData({ ...formData, correo_institucional: e.target.value.slice(0, 60) })} maxLength={60} style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
              />
            </FormField>
            <div style={{ padding: '9px 12px', marginBottom: '14px', background: 'rgba(84,179,224,0.07)', border: '1px solid rgba(84,179,224,0.25)', borderRadius: '8px', fontSize: '12px', color: '#2e6ca4' }}>
              Se generará una contraseña temporal y se enviará al correo del usuario.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 14px' }}>
              <FormField label="Cargo *">
                <select value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="">Seleccionar cargo</option>
                  {CARGOS.filter(c => c !== 'Administrador del sistema' || user?.cargo === 'Administrador del sistema').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Estado">
                <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </FormField>
            </div>
            <ToggleNotificaciones value={formData.recibe_notificaciones} onChange={v => setFormData({ ...formData, recibe_notificaciones: v })} />
            <ModalActions onCancel={() => setShowCreateDialog(false)} onConfirm={handleCrearUsuario} confirmLabel={isLoading ? 'Creando...' : 'Crear Usuario'} disabled={isLoading} />
          </UEBModal>
        )}
      </AnimatePresence>

      {/* Editar */}
      <AnimatePresence>
        {showEditDialog && usuarioAEditar && (
          <UEBModal title="Editar Usuario" onClose={() => setShowEditDialog(false)} isMobile={isMobile} icon={Edit2}>
            <DialogMsg msg={dialogMsg} onClose={() => setDialogMsg({ text: '', type: '' })} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 14px' }}>
              <FormField label="Nombres *">
                <input type="text" value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value.slice(0, 50) })} maxLength={50} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
                />
              </FormField>
              <FormField label="Apellidos *">
                <input type="text" value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value.slice(0, 50) })} maxLength={50} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
                />
              </FormField>
            </div>
            <FormField label="Correo Institucional *">
              <input type="email" value={formData.correo_institucional} onChange={(e) => setFormData({ ...formData, correo_institucional: e.target.value.slice(0, 60) })} maxLength={60} style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
              />
            </FormField>
            <PasswordField label="Nueva Contraseña (dejar vacío para no cambiar)" value={formData.contrasena} onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })} placeholder="Opcional — mínimo 8 caracteres" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 14px' }}>
              <FormField label="Cargo *">
                <select value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="">Seleccionar cargo</option>
                  {CARGOS.filter(c => c !== 'Administrador del sistema' || user?.cargo === 'Administrador del sistema').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Estado">
                <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </FormField>
            </div>
            <ToggleNotificaciones value={formData.recibe_notificaciones} onChange={v => setFormData({ ...formData, recibe_notificaciones: v })} />
            <ModalActions onCancel={() => setShowEditDialog(false)} onConfirm={handleActualizarUsuario} confirmLabel={isLoading ? 'Guardando...' : 'Guardar Cambios'} disabled={isLoading} />
          </UEBModal>
        )}
      </AnimatePresence>

      {/* Eliminar */}
      <AnimatePresence>
        {showDeleteDialog && usuarioAEliminar && (
          <UEBModal title="Desactivar Usuario" onClose={() => setShowDeleteDialog(false)} isMobile={isMobile} small icon={Trash2} gradient="linear-gradient(135deg, #7f1d1d, #b91c1c)">
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(139,15,15,0.10)', border: '1px solid rgba(139,15,15,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Trash2 size={22} color="#b91c1c" />
            </div>
            <p style={{ color: 'var(--text-body)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.65, textAlign: 'center' }}>
              ¿Estás seguro de que deseas desactivar a{' '}
              <strong style={{ color: 'var(--text-heading)' }}>{usuarioAEliminar.nombres} {usuarioAEliminar.apellidos}</strong>?
              {' '}El usuario pasará a estado inactivo.
            </p>
            <ModalActions onCancel={() => setShowDeleteDialog(false)} onConfirm={handleEliminarUsuario} confirmLabel={isLoading ? 'Desactivando...' : 'Desactivar Usuario'} disabled={isLoading} danger />
          </UEBModal>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!confirmQuitarVer}
        title="¿Quitar permiso Ver?"
        message={confirmQuitarVer?.modulo === 'certificaciones'
          ? `Al desmarcar "Ver" en certificaciones se eliminarán todos los permisos de certificaciones y también los de liquidaciones, ya que requieren poder ver certificaciones. ¿Continuar?`
          : `Al desmarcar "Ver" se eliminarán todos los permisos de ese módulo para este cargo. ¿Continuar?`}
        confirmLabel="Sí, quitar todos"
        onConfirm={confirmarQuitarVer}
        onCancel={() => setConfirmQuitarVer(null)}
      />
    </div>
  );
};

/* ── Sub-components ──────────────────────────────────────────────── */

function UEBModal({ title, onClose, isMobile, small, icon: Icon, gradient, children }) {
  const headerBg = gradient || 'linear-gradient(135deg, #1a3a5c, #2e6ca4)'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,30,55,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
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
          width: '100%',
          maxWidth: small ? '420px' : '540px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          fontFamily: 'var(--font-primary)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header con color */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px', background: headerBg, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {Icon && <Icon size={16} color="rgba(255,255,255,0.85)" />}
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{title}</span>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} />
          </button>
        </div>
        {/* Contenido */}
        <div style={{ padding: isMobile ? '22px' : '28px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ToggleNotificaciones({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 12px', marginBottom: '14px',
      background: value ? 'rgba(46,108,164,0.06)' : 'rgba(100,116,139,0.06)',
      border: `1px solid ${value ? 'rgba(46,108,164,0.20)' : 'rgba(100,116,139,0.18)'}`,
      borderRadius: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {value ? <Bell size={14} color="#2e6ca4" /> : <BellOff size={14} color="#94a3b8" />}
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: value ? '#1a3a5c' : '#64748b' }}>
            Recibe notificaciones por correo
          </span>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
            Correos de aprobación y rechazo de certificaciones
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: '40px', height: '22px', borderRadius: '999px', border: 'none',
          background: value ? '#2e6ca4' : '#cbd5e1',
          cursor: 'pointer', position: 'relative', flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: '3px',
          left: value ? '21px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}

function DialogMsg({ msg, onClose }) {
  if (!msg.text) return null;
  const isErr = msg.type === 'error';
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      style={{
        padding: '9px 12px', marginBottom: '14px',
        background: isErr ? 'rgba(139,15,15,0.08)' : 'rgba(5,150,105,0.08)',
        border: `1px solid ${isErr ? 'rgba(139,15,15,0.22)' : 'rgba(5,150,105,0.22)'}`,
        borderRadius: '8px',
        color: isErr ? '#b91c1c' : '#047857',
        fontSize: '13px', fontWeight: 500,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      <span>{msg.text}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '15px', padding: '0 0 0 10px' }}>✕</button>
    </motion.div>
  );
}

function ModalActions({ onCancel, onConfirm, confirmLabel, disabled, danger }) {
  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCancel}
        style={{
          padding: '9px 18px',
          background: 'transparent',
          border: '1px solid rgba(26,58,92,0.18)',
          borderRadius: '8px',
          color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          fontFamily: 'var(--font-primary)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26,58,92,0.06)'; e.currentTarget.style.color = 'var(--text-heading)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        Cancelar
      </motion.button>
      <motion.button
        whileHover={!disabled ? { scale: 1.02, boxShadow: danger ? '0 8px 24px rgba(139,15,15,0.35)' : '0 8px 24px rgba(46,108,164,0.35)' } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onClick={onConfirm}
        disabled={disabled}
        style={{
          padding: '9px 20px',
          background: danger
            ? 'linear-gradient(135deg, #8b0f0f, #b91c1c)'
            : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)',
          border: 'none', borderRadius: '8px',
          color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '13px', fontWeight: 700, opacity: disabled ? 0.55 : 1,
          fontFamily: 'var(--font-primary)',
          boxShadow: danger
            ? '0 4px 14px rgba(139,15,15,0.25)'
            : '0 4px 14px rgba(26,58,92,0.25)',
        }}
      >
        {confirmLabel}
      </motion.button>
    </div>
  );
}
