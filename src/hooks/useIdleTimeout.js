import { useEffect, useRef, useState, useCallback } from 'react';

const EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export function useIdleTimeout({ timeoutMs = 30 * 60 * 1000, warningMs = 60 * 1000, onIdle }) {
  const [isWarning, setIsWarning]     = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const idleTimer      = useRef(null);
  const warnTimer      = useRef(null);
  const countdownRef   = useRef(null);
  const isWarningRef   = useRef(false); // ref para leer en event listeners sin stale closure
  const onIdleRef      = useRef(onIdle);

  // Mantén onIdleRef actualizado sin re-crear timers
  useEffect(() => { onIdleRef.current = onIdle; }, [onIdle]);

  const clearAll = useCallback(() => {
    clearTimeout(idleTimer.current);
    clearTimeout(warnTimer.current);
    clearInterval(countdownRef.current);
  }, []);

  const startCountdown = useCallback((seconds) => {
    setSecondsLeft(seconds);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetTimer = useCallback(() => {
    clearAll();
    isWarningRef.current = false;
    setIsWarning(false);
    setSecondsLeft(0);

    warnTimer.current = setTimeout(() => {
      isWarningRef.current = true;
      setIsWarning(true);
      startCountdown(Math.round(warningMs / 1000));
    }, timeoutMs - warningMs);

    idleTimer.current = setTimeout(() => {
      clearAll();
      isWarningRef.current = false;
      setIsWarning(false);
      onIdleRef.current();
    }, timeoutMs);
  }, [timeoutMs, warningMs, clearAll, startCountdown]);

  useEffect(() => {
    resetTimer();

    const handleActivity = () => {
      // Usa ref en vez de setState callback — sin side effects dentro de updaters
      if (!isWarningRef.current) resetTimer();
    };

    EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

    return () => {
      clearAll();
      EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
    };
  // resetTimer solo cambia si cambian timeoutMs/warningMs — estable en producción
  }, [resetTimer, clearAll]);

  return { isWarning, secondsLeft, resetTimer };
}
