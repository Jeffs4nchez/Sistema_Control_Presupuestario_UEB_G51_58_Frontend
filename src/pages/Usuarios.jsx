import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { cachedAxiosGet, invalidateCache } from '../utils/apiCache';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, UserPlus, Users, UserCheck, UserX, ShieldOff, ShieldCheck, X, Lock, Eye, EyeOff, Search, Bell, BellOff } from 'lucide-react';

const CARGOS = [
  'Director(a) financiero',
  'Analista de presupuesto 1',
  'Analista de presupuesto 3',
  'Director(a) de talento humano',
  'Rector',
];

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
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [globalMsg, setGlobalMsg] = useState({ text: '', type: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
        setGlobalMsg({ text: 'Usuario eliminado exitosamente', type: 'success' });
        setShowDeleteDialog(false);
        invalidateCache('/usuarios');
        cargarUsuarios();
        setTimeout(() => setGlobalMsg({ text: '', type: '' }), 3500);
      }
    } catch (err) {
      setGlobalMsg({ text: err.response?.data?.message || err.message, type: 'error' });
    } finally { setIsLoading(false); }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombres.toLowerCase().includes(filtroNombre.toLowerCase()) ||
    u.apellidos.toLowerCase().includes(filtroNombre.toLowerCase()) ||
    u.correo_institucional.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  const totalUsuarios = usuarios.length;
  const activos       = usuarios.filter(u => u.estado === 'activo').length;
  const inactivos     = usuarios.filter(u => u.estado === 'inactivo').length;
  const bloqueados    = usuarios.filter(u => u.estado === 'bloqueado').length;

  const P = isMobile ? '20px' : '28px';

  return (
    <div style={{ background: 'var(--page-bg)', minHeight: '100%', padding: P, fontFamily: 'var(--font-primary)' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '24px' }}
      >
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '20px' : '22px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
          Gestión de Usuarios
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Administra los usuarios del sistema de control presupuestario
        </p>
      </motion.div>

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
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 120, damping: 18 }}
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.95)',
                borderRadius: '14px',
                boxShadow: '0 4px 20px rgba(26,58,92,0.08)',
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}12`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={s.color} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.03em' }}>
                {s.value}
              </p>
            </motion.div>
          );
        })}
      </div>
      )}

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row', marginBottom: '14px' }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#8fa3c0', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o correo..."
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value.slice(0, 100))} maxLength={100}
            style={{ ...inputStyle, paddingLeft: '32px' }}
            onFocus={(e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(46,108,164,0.35)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAbrirCrear}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 20px',
            background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)',
            color: '#fff', border: 'none', borderRadius: '8px',
            cursor: 'pointer', fontSize: '13px', fontWeight: 700,
            whiteSpace: 'nowrap', fontFamily: 'var(--font-primary)',
            boxShadow: '0 4px 16px rgba(26,58,92,0.25)',
          }}
        >
          <UserPlus size={16} />
          Crear Usuario
        </motion.button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.95)',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(26,58,92,0.10)',
          overflow: 'hidden',
        }}
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
                    <th key={i} style={{
                      padding: '11px 16px',
                      textAlign: i >= 4 ? 'center' : 'left',
                      fontSize: '11px', fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u, idx) => (
                  <motion.tr
                    key={u.id_usuario}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, type: 'spring', stiffness: 180, damping: 22 }}
                    style={{ borderBottom: '1px solid rgba(26,58,92,0.07)', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(240,244,248,0.85)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>
                          {(u.nombres || '?')[0].toUpperCase()}
                        </div>
                        {u.nombres} {u.apellidos}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {u.correo_institucional}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-blue">{u.cargo}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.estado === 'activo'
                        ? <span className="badge badge-green">Activo</span>
                        : u.estado === 'bloqueado'
                          ? <span className="badge" style={{ background: 'rgba(217,119,6,0.12)', color: '#92400e', border: '1px solid rgba(217,119,6,0.30)', borderRadius: '999px', padding: '2px 10px', fontSize: '11px', fontWeight: 700 }}>Bloqueado</span>
                          : <span className="badge badge-red">Inactivo</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span title={u.recibe_notificaciones !== false ? 'Recibe notificaciones' : 'Notificaciones desactivadas'}>
                        {u.recibe_notificaciones !== false
                          ? <Bell size={15} color="#2e6ca4" />
                          : <BellOff size={15} color="#cbd5e1" />
                        }
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {u.estado === 'bloqueado' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDesbloquear(u)}
                            title="Desbloquear cuenta"
                            style={{
                              width: '32px', height: '32px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(217,119,6,0.10)',
                              border: '1px solid rgba(217,119,6,0.28)',
                              borderRadius: '8px', color: '#d97706', cursor: 'pointer',
                            }}
                          >
                            <ShieldCheck size={14} />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAbrirEditar(u)}
                          title="Editar"
                          style={{
                            width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(46,108,164,0.10)',
                            border: '1px solid rgba(46,108,164,0.20)',
                            borderRadius: '8px', color: '#2e6ca4', cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={14} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAbrirEliminar(u)}
                          title="Eliminar"
                          style={{
                            width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(139,15,15,0.08)',
                            border: '1px solid rgba(139,15,15,0.20)',
                            borderRadius: '8px', color: '#b91c1c', cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
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

      {/* ── Modals ──────────────────────────────────────────────────── */}

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
                  {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
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
                  {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
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
          <UEBModal title="Confirmar Eliminación" onClose={() => setShowDeleteDialog(false)} isMobile={isMobile} small icon={Trash2} gradient="linear-gradient(135deg, #7f1d1d, #b91c1c)">
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(139,15,15,0.10)', border: '1px solid rgba(139,15,15,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Trash2 size={22} color="#b91c1c" />
            </div>
            <p style={{ color: 'var(--text-body)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.65, textAlign: 'center' }}>
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong style={{ color: 'var(--text-heading)' }}>{usuarioAEliminar.nombres} {usuarioAEliminar.apellidos}</strong>?
              {' '}Esta acción no se puede deshacer.
            </p>
            <ModalActions onCancel={() => setShowDeleteDialog(false)} onConfirm={handleEliminarUsuario} confirmLabel={isLoading ? 'Eliminando...' : 'Eliminar Usuario'} disabled={isLoading} danger />
          </UEBModal>
        )}
      </AnimatePresence>
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
