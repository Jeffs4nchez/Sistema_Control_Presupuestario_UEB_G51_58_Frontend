import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, LogOut, TrendingUp, FileText,
  CheckCircle2, Menu, ChevronLeft, ChevronRight, KeyRound,
  Building2, FileDown, Clock, X, AlertTriangle, Banknote, BarChart2,
  HelpCircle, BookOpen, Mail, ChevronDown,
} from 'lucide-react';
import CambiarContrasenaModal from '../components/CambiarContrasenaModal';
import { useFiscalYear } from '../contexts/FiscalYearContext';
import logo from '../assets/logo.webp';

const SIDEBAR_W_OPEN     = '264px';
const SIDEBAR_W_COLLAPSED = '64px';

const buildMenuGroups = (user, isReadOnly = false) => {
  const groups = [];

  groups.push({
    label: 'Principal',
    items: [{ label: 'Inicio', path: '/dashboard', icon: LayoutDashboard }],
  });

  if (isReadOnly) {
    // Año anterior: solo consulta — no se puede modificar estructura, entidades ni usuarios
    const presupuesto = [];
    if (can.verCedula(user))
      presupuesto.push({ label: 'Cédula Presupuestaria', path: '/dashboard/cedula-presupuestaria', icon: CheckCircle2 });
    if (presupuesto.length) groups.push({ label: 'Presupuesto', items: presupuesto });

    const ops = [];
    if (can.verCertificacion(user))
      ops.push({ label: 'Certificación',  path: '/dashboard/certificacion',  icon: TrendingUp });
    if (can.verLiquidaciones(user))
      ops.push({ label: 'Liquidaciones',  path: '/dashboard/liquidaciones',  icon: BarChart2 });
    if (ops.length) groups.push({ label: 'Operaciones', items: ops });

    const admin = [];
    if (can.verReportes(user))
      admin.push({ label: 'Reportes',  path: '/dashboard/reportes',  icon: FileDown });
    if (can.verAuditoria(user))
      admin.push({ label: 'Auditoría', path: '/dashboard/auditoria', icon: Clock });
    if (admin.length) groups.push({ label: 'Administración', items: admin });

    return groups;
  }

  // Año actual: menú completo
  const presupuesto = [];
  if (can.verCedula(user))
    presupuesto.push({ label: 'Cédula Presupuestaria', path: '/dashboard/cedula-presupuestaria', icon: CheckCircle2 });
  if (presupuesto.length) groups.push({ label: 'Presupuesto', items: presupuesto });

  const ops = [];
  if (can.verCertificacion(user))
    ops.push({ label: 'Certificación',      path: '/dashboard/certificacion',      icon: TrendingUp });
  if (can.verLiquidaciones(user))
    ops.push({ label: 'Liquidaciones',      path: '/dashboard/liquidaciones',      icon: Banknote });
  if (can.verUnidadRequiriente(user))
    ops.push({ label: 'Unidad Requiriente', path: '/dashboard/unidad-requiriente', icon: Building2 });
  if (ops.length) groups.push({ label: 'Operaciones', items: ops });

  const admin = [];
  if (can.verUsuarios(user))
    admin.push({ label: 'Gestión de Usuarios', path: '/dashboard/usuarios',  icon: Users });
  if (can.verReportes(user))
    admin.push({ label: 'Reportes',            path: '/dashboard/reportes',  icon: FileDown });
  if (can.verAuditoria(user))
    admin.push({ label: 'Auditoría',           path: '/dashboard/auditoria', icon: Clock });
  if (admin.length) groups.push({ label: 'Administración', items: admin });

  return groups;
};

const abreviarCargo = (cargo) => {
  if (!cargo) return '';
  if (cargo.includes('Analista de presupuesto 1')) return 'Analista 1';
  if (cargo.includes('Analista de presupuesto 3')) return 'Analista 3';
  if (cargo.includes('Director(a) financiero'))    return 'Dir. Financiero';
  if (cargo.includes('Director(a) de talento'))    return 'Dir. T. Humano';
  if (cargo.includes('Rector'))                    return 'Rector';
  if (cargo.includes('Administrador'))             return 'Administrador';
  return cargo;
};

export const Dashboard = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout, token } = useAuth();
  const { cedulas, selectedCedula, isReadOnly, changeCedula } = useFiscalYear();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const userPanelRef = useRef(null);
  const helpRef = useRef(null);

  useEffect(() => {
    if (!showUserPanel) return;
    const handleClickOutside = (e) => {
      if (userPanelRef.current && !userPanelRef.current.contains(e.target)) {
        setShowUserPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserPanel]);

  useEffect(() => {
    if (!showHelp) return;
    const handleClickOutside = (e) => {
      if (helpRef.current && !helpRef.current.contains(e.target)) {
        setShowHelp(false);
        setOpenFaq(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHelp]);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  useEffect(() => {
    if (user?.contrasena_temporal) setShowPasswordModal(true);
  }, [user?.contrasena_temporal]);

  useEffect(() => {
    const handle = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const SW = isMobile ? '0px' : sidebarOpen ? SIDEBAR_W_OPEN : SIDEBAR_W_COLLAPSED;
  const sidebarVisible = !isMobile || sidebarOpen;

  const menuGroups = buildMenuGroups(user, isReadOnly);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--page-bg)',
      fontFamily: 'var(--font-primary)',
      overflow: 'hidden',
    }}>

      {/* ── Floating background shapes ────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '8%', right: '12%',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(84,179,224,0.07), transparent 70%)',
          animation: 'floatShapeSlow 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', left: '30%',
          width: '240px', height: '240px', borderRadius: '40px',
          background: 'radial-gradient(circle, rgba(46,108,164,0.05), transparent 70%)',
          animation: 'floatShape 9s ease-in-out infinite',
          transform: 'rotate(20deg)',
        }} />
        <div style={{
          position: 'absolute', top: '45%', right: '5%',
          width: '180px', height: '180px', borderRadius: '30px',
          background: 'radial-gradient(circle, rgba(26,58,92,0.04), transparent 70%)',
          animation: 'floatShapeSlow 15s ease-in-out infinite reverse',
          transform: 'rotate(-15deg)',
        }} />
      </div>

      {/* ── Mobile overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(10, 25, 47, 0.55)',
              backdropFilter: 'blur(4px)',
              zIndex: 90,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ────────────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarVisible ? (sidebarOpen ? '264px' : '64px') : '0px',
          minWidth: sidebarVisible ? (sidebarOpen ? '264px' : '64px') : '0px',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
          background: 'linear-gradient(180deg, #0a1929 0%, #1a3a5c 100%)',
          borderRight: '1px solid rgba(84,179,224,0.10)',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'relative',
          left: 0, top: 0,
          height: '100vh',
          zIndex: isMobile ? 100 : 10,
          overflow: 'hidden',
          boxShadow: isMobile && sidebarOpen ? '4px 0 40px rgba(0,0,0,0.35)' : 'none',
          flexShrink: 0,
        }}
      >
        {/* Logo area + botón colapso */}
        <div style={{
          padding: '12px 10px',
          borderBottom: '1px solid rgba(84,179,224,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          minHeight: '84px',
          flexShrink: 0,
          gap: '8px',
        }}>
          {sidebarOpen && (
            <img
              src={logo} alt="UEB"
              width="62" height="62"
              style={{ width: '62px', height: '62px', objectFit: 'contain', flexShrink: 0 }}
            />
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            title={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
            style={{
              background: 'rgba(84,179,224,0.12)',
              border: '1.5px solid rgba(84,179,224,0.30)',
              color: 'rgba(84,179,224,0.9)',
              cursor: 'pointer',
              width: '30px', height: '30px',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {menuGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: '4px' }}>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: gi * 0.05 }}
                  style={{
                    padding: '10px 10px 5px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'rgba(84,179,224,0.5)',
                  }}
                >
                  {group.label}
                </motion.div>
              )}

              {group.items.map((item, ii) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (gi * 0.06) + (ii * 0.04), type: 'spring', stiffness: 140, damping: 18 }}
                    whileHover={{ x: active ? 0 : 3 }}
                    onClick={() => { navigate(item.path); if (isMobile) setSidebarOpen(false); }}
                    title={!sidebarOpen ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: sidebarOpen ? '8px 10px' : '9px',
                      marginBottom: '2px',
                      background: active ? 'rgba(84,179,224,0.14)' : 'transparent',
                      color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                      border: 'none',
                      borderLeft: `3px solid ${active ? '#54b3e0' : 'transparent'}`,
                      borderRadius: '0 8px 8px 0',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: active ? 700 : 400,
                      fontFamily: 'var(--font-primary)',
                      textAlign: 'left',
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      boxShadow: active ? '0 0 18px rgba(84,179,224,0.18), inset 2px 0 12px rgba(84,179,224,0.06)' : 'none',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                      }
                    }}
                  >
                    <span style={{
                      color: active ? '#54b3e0' : 'inherit',
                      flexShrink: 0,
                      display: 'flex',
                      filter: active ? 'drop-shadow(0 0 6px rgba(84,179,224,0.6))' : 'none',
                    }}>
                      <Icon size={16} />
                    </span>
                    {sidebarOpen && (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                        {item.label}
                      </span>
                    )}
                    {active && sidebarOpen && (
                      <motion.div
                        layoutId="active-pill"
                        style={{
                          marginLeft: 'auto',
                          width: '6px', height: '6px',
                          borderRadius: '50%',
                          background: '#54b3e0',
                          boxShadow: '0 0 8px rgba(84,179,224,0.8)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Ayuda y acerca de */}
        <div ref={helpRef} style={{ padding: '4px 8px 18px', borderTop: '1px solid rgba(84,179,224,0.08)', flexShrink: 0, position: 'relative' }}>
          <button
            onClick={() => { setShowHelp(v => !v); setOpenFaq(null); }}
            title="Ayuda y acerca de"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: sidebarOpen ? '10px 12px' : '10px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              background: showHelp ? 'rgba(84,179,224,0.08)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { if (!showHelp) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (!showHelp) e.currentTarget.style.background = 'transparent' }}
          >
            <HelpCircle size={13} color="rgba(84,179,224,0.45)" style={{ flexShrink: 0 }} />
            {sidebarOpen && (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', fontWeight: 500 }}>
                Ayuda y acerca de
              </span>
            )}
          </button>

          <AnimatePresence>
            {showHelp && (
              <>
                {/* Overlay + centrado */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => { setShowHelp(false); setOpenFaq(null); }}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9998, backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {/* Modal — detener propagación para que el click interno no cierre */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: '520px',
                      maxWidth: 'calc(100vw - 32px)',
                      maxHeight: '82vh',
                      background: '#0f2236',
                      border: '1px solid rgba(84,179,224,0.20)',
                      borderRadius: '16px',
                      boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
                      zIndex: 9999,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                  {/* Cabecera */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid rgba(84,179,224,0.10)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HelpCircle size={16} color="#54b3e0" />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Ayuda y acerca de</span>
                    </div>
                    <button
                      onClick={() => { setShowHelp(false); setOpenFaq(null); }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', display: 'flex', alignItems: 'center', padding: '4px' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.40)'}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Contenido scrollable */}
                  <div style={{ overflowY: 'auto', padding: '20px' }}>

                    {/* Manual de usuario */}
                    <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(84,179,224,0.55)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={11} />
                      Manual de Usuario
                    </div>
                    <div style={{ background: 'rgba(84,179,224,0.06)', border: '1px solid rgba(84,179,224,0.12)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '3px' }}>Manual del Sistema de Control Presupuestario</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Guía completa de uso del sistema</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <a
                          href="/manual-usuario.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ padding: '7px 14px', background: 'rgba(84,179,224,0.15)', border: '1px solid rgba(84,179,224,0.25)', borderRadius: '7px', color: 'rgba(84,179,224,0.95)', fontSize: '11px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(84,179,224,0.25)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(84,179,224,0.15)'}
                        >Ver</a>
                        <a
                          href="/manual-usuario.pdf"
                          download
                          style={{ padding: '7px 14px', background: 'rgba(84,179,224,0.15)', border: '1px solid rgba(84,179,224,0.25)', borderRadius: '7px', color: 'rgba(84,179,224,0.95)', fontSize: '11px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(84,179,224,0.25)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(84,179,224,0.15)'}
                        >Descargar</a>
                      </div>
                    </div>

                    {/* Preguntas frecuentes */}
                    <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(84,179,224,0.55)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HelpCircle size={11} />
                      Preguntas frecuentes
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      {[
                        { q: '¿Cómo crear una certificación?', a: 'Ve a Certificaciones → pestaña "Nueva Certificación", completa el formulario con el valor, la cédula presupuestaria y la unidad requiriente, luego guarda.' },
                        { q: '¿Cómo generar un reporte?', a: 'Ve a Reportes, selecciona el tipo de reporte y el rango de fechas, luego presiona "Generar gráfico". Puedes exportar a PDF o Excel.' },
                        { q: '¿Cómo cambiar permisos de un usuario?', a: 'Ve a Usuarios → pestaña "Permisos", selecciona el cargo y marca los módulos. Se requiere adjuntar un documento de respaldo (Quipux, Oficio o Memorando).' },
                        { q: '¿Qué significa el estado ERRADO?', a: 'Una certificación marcada como ERRADA fue emitida por error. Solo usuarios autorizados pueden marcar este estado y no puede revertirse.' },
                      ].map(({ q, a }, i) => (
                        <div key={i} style={{ marginBottom: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(84,179,224,0.08)', overflow: 'hidden' }}>
                          <button
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '8px' }}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{q}</span>
                            <ChevronDown size={13} color="rgba(84,179,224,0.55)" style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                          </button>
                          {openFaq === i && (
                            <div style={{ padding: '0 14px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{a}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Desarrollado por */}
                    <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(84,179,224,0.55)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={11} />
                      Desarrollado por
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      {[
                        { nombre: 'Jefferson Santiago Sanchez Quinatoa', email: 'jefferson.sanchez@ueb.edu.ec · jeff0967943615@gmail.com' },
                        { nombre: 'Cristofer Antony Montaluisa Zapata', email: 'cristofer.montaluisa@ueb.edu.ec · antony84mc@gmail.com' },
                      ].map(({ nombre, email }) => (
                        <div key={email} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(84,179,224,0.10)', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', marginBottom: '4px', lineHeight: 1.4 }}>{nombre}</div>
                          <a href={`mailto:${email}`} style={{ fontSize: '10px', color: 'rgba(84,179,224,0.65)', textDecoration: 'none' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#54b3e0'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(84,179,224,0.65)'}
                          >{email}</a>
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.20)', lineHeight: 1.6 }}>
                      Carrera de Software · Universidad Estatal de Bolívar · 2026
                    </div>

                  </div>
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </aside>

      {/* ── MAIN AREA ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative', zIndex: 1 }}>

        {/* Floating Header */}
        <motion.header
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '60px',
            background: 'rgba(240,244,248,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(26,58,92,0.08)',
            boxShadow: '0 2px 20px rgba(26,58,92,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Botón hamburguesa — solo móvil */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: 'rgba(46,108,164,0.12)',
                  border: '1.5px solid rgba(46,108,164,0.30)',
                  color: '#2e6ca4',
                  cursor: 'pointer',
                  padding: '7px 10px',
                  display: 'flex', alignItems: 'center',
                  borderRadius: '9px',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(46,108,164,0.20)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(46,108,164,0.12)' }}
              >
                <Menu size={17} />
              </button>
            )}

            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
              UEB — Control Presupuestario
            </span>

          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* Año activo — badge indicador */}
            {selectedCedula && (() => {
              const sinEst = selectedCedula.tiene_estructura === false;
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px',
                  background: sinEst ? 'rgba(185,28,28,0.10)' : isReadOnly ? 'rgba(217,119,6,0.10)' : 'rgba(46,108,164,0.08)',
                  border: `1px solid ${sinEst ? 'rgba(185,28,28,0.30)' : isReadOnly ? 'rgba(217,119,6,0.30)' : 'rgba(46,108,164,0.20)'}`,
                  borderRadius: '8px',
                  fontSize: '12px', fontWeight: 700,
                  color: sinEst ? '#b91c1c' : isReadOnly ? '#d97706' : 'var(--text-heading)',
                  pointerEvents: 'none',
                }}>
                  {sinEst
                    ? <AlertTriangle size={10} style={{ flexShrink: 0 }} />
                    : isReadOnly && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      )
                  }
                  Año {selectedCedula.anio}
                  {sinEst && <span style={{ fontWeight: 600, fontSize: '10px' }}>— sin datos</span>}
                </div>
              );
            })()}

            {/* Badge de rol */}
            {!isMobile && user?.cargo && (
              <div style={{
                padding: '4px 10px',
                background: 'rgba(46,108,164,0.08)',
                border: '1px solid rgba(46,108,164,0.20)',
                borderRadius: '20px',
                fontSize: '11px', fontWeight: 700,
                color: '#2e6ca4',
                whiteSpace: 'nowrap',
              }}>
                {abreviarCargo(user.cargo)}
              </div>
            )}

            {/* Avatar + panel desplegable */}
            <div ref={userPanelRef} style={{ position: 'relative' }}>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setShowUserPanel(v => !v)}
                style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: showUserPanel
                    ? 'linear-gradient(135deg, #2e6ca4, #54b3e0)'
                    : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 800, color: '#fff',
                  cursor: 'pointer', border: 'none',
                  boxShadow: showUserPanel
                    ? '0 0 0 3px rgba(84,179,224,0.35), 0 4px 14px rgba(26,58,92,0.30)'
                    : '0 2px 10px rgba(26,58,92,0.25)',
                  transition: 'box-shadow 0.18s ease',
                }}
              >
                {(user?.nombres || 'U')[0].toUpperCase()}
              </motion.button>

              {/* Panel desplegable */}
              <AnimatePresence>
                {showUserPanel && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -8 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                        width: '260px',
                        background: 'rgba(255,255,255,0.98)',
                        border: '1px solid rgba(46,108,164,0.14)',
                        borderRadius: '14px',
                        boxShadow: '0 16px 48px rgba(26,58,92,0.18)',
                        zIndex: 99,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Datos personales */}
                      <div style={{
                        padding: '14px 16px 14px',
                        background: 'linear-gradient(135deg, #0d1f35, #1a3a5c)',
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                      }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #2e6ca4, #54b3e0)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', fontWeight: 800, color: '#fff',
                          boxShadow: '0 3px 10px rgba(46,108,164,0.40)',
                          marginTop: '2px',
                        }}>
                          {(user?.nombres || 'U')[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {[user?.nombres, user?.apellidos].filter(Boolean).join(' ') || 'Usuario'}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'rgba(84,179,224,0.85)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.cargo || 'Sin cargo'}
                          </div>
                          {user?.correo_institucional && (
                            <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.42)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {user.correo_institucional}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>

                        {/* Selector de año fiscal */}
                        {cedulas.length > 0 && (
                          <div style={{
                            padding: '10px 12px',
                            background: 'rgba(46,108,164,0.05)',
                            border: '1px solid rgba(46,108,164,0.12)',
                            borderRadius: '10px',
                            marginBottom: '4px',
                          }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: '#5a7a9f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>
                              Año Fiscal
                            </div>
                            <select
                              value={selectedCedula?.id_cedula_presupuestaria ?? ''}
                              onChange={e => {
                                const ced = cedulas.find(c => String(c.id_cedula_presupuestaria) === e.target.value)
                                if (ced) { changeCedula(ced); setShowUserPanel(false) }
                              }}
                              style={{
                                width: '100%', padding: '8px 10px',
                                background: '#fff',
                                border: '1px solid rgba(46,108,164,0.22)',
                                borderRadius: '8px',
                                fontSize: '13px', fontWeight: 600,
                                color: '#1a3a5c',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-primary)',
                                outline: 'none',
                              }}
                            >
                              {cedulas.map(c => (
                                <option key={c.id_cedula_presupuestaria} value={c.id_cedula_presupuestaria}>
                                  {c.tiene_estructura === false
                                    ? `Año ${c.anio} — sin datos ⚠`
                                    : c.anio === new Date().getFullYear()
                                      ? `Año ${c.anio} — activo`
                                      : `Año ${c.anio} — solo lectura`}
                                </option>
                              ))}
                            </select>
                            {selectedCedula?.tiene_estructura === false && (
                              <div style={{
                                marginTop: '6px', padding: '6px 8px',
                                background: 'rgba(185,28,28,0.07)',
                                border: '1px solid rgba(185,28,28,0.20)',
                                borderRadius: '6px',
                                display: 'flex', alignItems: 'center', gap: '5px',
                                fontSize: '10px', fontWeight: 600, color: '#b91c1c',
                              }}>
                                <AlertTriangle size={10} style={{ flexShrink: 0 }} />
                                Sin cédula presupuestaria cargada. No se puede certificar.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Cambiar contraseña */}
                        <motion.button
                          whileHover={{ background: 'rgba(46,108,164,0.07)' }}
                          onClick={() => { setShowPasswordModal(true); setShowUserPanel(false) }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            width: '100%', padding: '8px 10px',
                            background: 'transparent', border: 'none', borderRadius: '8px',
                            cursor: 'pointer', fontFamily: 'var(--font-primary)',
                            color: '#5a7a9f', fontSize: '12.5px', fontWeight: 500,
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <KeyRound size={13} /> Cambiar contraseña
                        </motion.button>

                        {/* Cerrar sesión */}
                        <motion.button
                          whileHover={{ background: 'rgba(185,28,28,0.07)' }}
                          onClick={handleLogout}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            width: '100%', padding: '8px 10px',
                            background: 'transparent', border: 'none', borderRadius: '8px',
                            cursor: 'pointer', fontFamily: 'var(--font-primary)',
                            color: '#b91c1c', fontSize: '12.5px', fontWeight: 500,
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <LogOut size={13} /> Cerrar sesión
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </motion.header>

        {/* Content Area */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          background: 'var(--page-bg)',
          position: 'relative',
        }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ minHeight: '100%' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <CambiarContrasenaModal onClose={() => setShowPasswordModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
