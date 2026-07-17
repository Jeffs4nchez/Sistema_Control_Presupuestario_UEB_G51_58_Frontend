import React, { useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import SessionWarningModal from '../components/SessionWarningModal';

// 30 minutos de inactividad total; 60 segundos de aviso previo al cierre
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_MS      = 60 * 1000;

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, logout } = useAuth();

  const handleIdle = useCallback(() => {
    logout();
  }, [logout]);

  const { isWarning, secondsLeft, resetTimer } = useIdleTimeout({
    timeoutMs:  IDLE_TIMEOUT_MS,
    warningMs:  WARNING_MS,
    onIdle:     handleIdle,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      <SessionWarningModal
        open={isWarning}
        secondsLeft={secondsLeft}
        onContinue={resetTimer}
        onLogout={logout}
      />
    </>
  );
};
