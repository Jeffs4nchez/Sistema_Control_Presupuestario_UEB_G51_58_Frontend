import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

const RED = '#b91c1c'

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'Eliminar' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff', borderRadius: '18px',
              padding: '36px 32px 28px', maxWidth: '420px', width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: '#fff1f2', border: '2px solid #fecdd3',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <AlertTriangle size={28} color={RED} strokeWidth={2.2} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#1a3a5c', letterSpacing: '-0.2px' }}>
              {title ?? '¿Confirmar acción?'}
            </h3>
            <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#5a7a9f', lineHeight: '1.65' }}>
              {message}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  border: '1.5px solid #d1d5db', background: '#f9fafb',
                  color: '#374151', fontWeight: 600, cursor: 'pointer',
                  fontSize: '14px', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  border: 'none', background: RED,
                  color: '#fff', fontWeight: 700, cursor: 'pointer',
                  fontSize: '14px', transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
