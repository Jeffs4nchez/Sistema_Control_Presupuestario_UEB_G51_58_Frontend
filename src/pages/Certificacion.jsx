import { useState, useEffect } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Lock } from 'lucide-react'
import CrearCertificacion from "./CrearCertificacion"
import ListaCertificaciones from "./ListaCertificaciones"
import { useFiscalYear } from '../contexts/FiscalYearContext'
import { invalidateCache } from '../utils/apiCache'

export default function Certificacion() {
  const { isReadOnly, selectedCedula } = useFiscalYear()
  const [activeTab, setActiveTab] = useState("lista")
  const [refresh,   setRefresh]   = useState(0)
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  // Si cambia a solo lectura y estaba en crear, volver a lista
  useEffect(() => {
    if (isReadOnly && activeTab === 'crear') setActiveTab('lista')
  }, [isReadOnly])

  const handleCertificadoCreado = () => {
    invalidateCache('/certificacion')
    setRefresh(p => p + 1)
    setActiveTab("lista")
  }

  const P = isMobile ? '20px' : '28px'
  const tabs = [
    { id: 'lista', label: 'Lista de Certificados', icon: FileText },
    ...(!isReadOnly ? [{ id: 'crear', label: 'Crear Certificado', icon: Plus }] : []),
  ]

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)', fontFamily: 'var(--font-primary)' }}>

      {/* Page header with tabs */}
      <div style={{
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(26,58,92,0.08)',
        boxShadow: '0 2px 16px rgba(26,58,92,0.06)',
        padding: `20px ${P} 0`,
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(46,108,164,0.10)', border: '1px solid rgba(46,108,164,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={18} color="#2e6ca4" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
                Gestión de Certificados
              </h1>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                {isReadOnly
                  ? `Año fiscal ${selectedCedula?.anio} — Solo visualización`
                  : 'Crear y gestionar certificados presupuestarios'}
              </p>
            </div>
          </div>

          {/* Banner solo lectura */}
          {isReadOnly && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: 'rgba(217,119,6,0.08)',
                border: '1px solid rgba(217,119,6,0.25)',
                borderRadius: '10px', padding: '8px 14px',
                fontSize: '12px', fontWeight: 700, color: '#d97706',
              }}
            >
              <Lock size={13} />
              Año {selectedCedula?.anio} — Solo lectura. No se pueden crear ni modificar certificados.
            </motion.div>
          )}
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {tabs.map((tab, i) => {
            const active = activeTab === tab.id
            const Icon   = tab.icon
            return (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '10px 18px',
                  background: 'none', border: 'none',
                  borderBottom: active ? '2.5px solid #2e6ca4' : '2.5px solid transparent',
                  color: active ? '#1a3a5c' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  fontFamily: 'var(--font-primary)',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap', marginBottom: '-1px',
                }}
              >
                <span style={{ color: active ? '#2e6ca4' : 'inherit', display: 'flex' }}>
                  <Icon size={15} />
                </span>
                {tab.label}
                {active && (
                  <motion.div layoutId="tab-indicator"
                    style={{ display: 'inline-flex', width: '6px', height: '6px', borderRadius: '50%', background: '#2e6ca4', marginLeft: '2px' }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: P }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {activeTab === "lista" && <ListaCertificaciones refresh={refresh} />}
            {activeTab === "crear" && !isReadOnly && <CrearCertificacion onCreated={handleCertificadoCreado} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
