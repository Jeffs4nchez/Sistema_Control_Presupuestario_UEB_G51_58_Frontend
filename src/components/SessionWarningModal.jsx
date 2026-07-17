import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

const BLUE = '#0d2f5e';
const BTN_BLUE = '#2e86c1';

export default function SessionWarningModal({ open, secondsLeft, onContinue, onLogout }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')} min`
    : `${secs} segundo${secs !== 1 ? 's' : ''}`;

  const pct = Math.min(100, (secondsLeft / 60) * 100);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(10,25,50,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            style={{
              background: '#ffffff', borderRadius: '20px',
              padding: '40px 32px 32px', maxWidth: '420px', width: '100%',
              boxShadow: '0 28px 70px rgba(0,0,0,0.28)',
              textAlign: 'center',
            }}
          >
            {/* Ícono */}
            <div style={{
              width: '68px', height: '68px', borderRadius: '50%',
              background: '#eff6ff', border: '2px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <ShieldAlert size={32} color={BTN_BLUE} strokeWidth={2} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 700, color: BLUE }}>
              Sesión a punto de cerrarse
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#5a7a9f', lineHeight: 1.6 }}>
              Por inactividad, su sesión se cerrará automáticamente en:
            </p>

            {/* Contador */}
            <div style={{
              fontSize: '42px', fontWeight: 800, color: secondsLeft <= 15 ? '#dc2626' : BLUE,
              letterSpacing: '-1px', margin: '0 0 16px',
              transition: 'color 0.4s',
            }}>
              {display}
            </div>

            {/* Barra de progreso */}
            <div style={{
              height: '6px', borderRadius: '99px',
              background: '#e5e7eb', margin: '0 0 28px', overflow: 'hidden',
            }}>
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'linear' }}
                style={{
                  height: '100%', borderRadius: '99px',
                  background: secondsLeft <= 15
                    ? 'linear-gradient(90deg,#dc2626,#f87171)'
                    : 'linear-gradient(90deg,#0d2f5e,#2e86c1)',
                }}
              />
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onLogout}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1.5px solid #d1d5db', background: '#f9fafb',
                  color: '#374151', fontWeight: 600, cursor: 'pointer',
                  fontSize: '14px', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
              >
                Cerrar sesión
              </button>
              <button
                onClick={onContinue}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${BLUE} 0%, ${BTN_BLUE} 100%)`,
                  color: '#fff', fontWeight: 700, cursor: 'pointer',
                  fontSize: '14px', transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Continuar sesión
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
