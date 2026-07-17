import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { Button, Input, Alert, Flex, Container } from '../components/ThemeComponents';
import logoSNC from '../assets/logo.webp';
import { theme, createGradient } from '../config/theme';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [intentosRestantes, setIntentosRestantes] = useState(null);
  const [cuentaBloqueada, setCuentaBloqueada] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const checkMobile = () => window.innerWidth < 768 || window.innerHeight < 600;
  const [isMobile, setIsMobile] = useState(checkMobile());
  const navigate = useNavigate();
  const { login } = useAuth();

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Validar email
  const isValidEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  // Validar formulario
  const validateForm = () => {
    const errors = { email: '', password: '' };
    let isValid = true;

    // Validar email
    if (!email.trim()) {
      errors.email = '📧 El correo es requerido';
      isValid = false;
    } else if (!isValidEmail(email.trim())) {
      errors.email = '❌ Formato de correo inválido';
      isValid = false;
    }

    // Validar contraseña
    if (!password) {
      errors.password = '🔒 La contraseña es requerida';
      isValid = false;
    } else if (password.length < 3) {
      errors.password = '🔒 Mínimo 3 caracteres';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', password: '' });
    setIntentosRestantes(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        setShowSuccessScreen(true);
        navigate('/dashboard');
      } else {
        if (result.bloqueado) {
          setCuentaBloqueada(true);
          setIntentosRestantes(null);
        } else {
          let errorMessage = result.error || 'Error al iniciar sesión';
          if (errorMessage.includes('Usuario no encontrado')) {
            errorMessage = '👤 El usuario no existe en el sistema';
          }
          setError(errorMessage);
          if (result.intentos_restantes !== null && result.intentos_restantes !== undefined) {
            setIntentosRestantes(result.intentos_restantes);
          }
        }
      }
    } catch {
      setError('❌ Error de conexión. Verifica tu conexión a internet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showSuccessScreen && <LoadingScreen message="Cargando el sistema..." />}

    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? theme.spacing.lg : theme.spacing.md,
        fontFamily: theme.typography.fontFamily,
        background: isMobile
          ? `linear-gradient(180deg, ${theme.colors.primary} 43%, #ffffff 43%)`
          : createGradient({
              start: theme.colors.primary,
              startPercent: 50,
              end: theme.colors.secondary,
              endPercent: 50
            }, 110, false)
      }}
    >
      {/* DIV CENTRAL ÚNICO */}
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '400px' : theme.components.login.containerDesktop.maxWidth,
        minHeight: isMobile ? '82vh' : theme.components.login.containerDesktop.minHeight,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        borderRadius: isMobile ? '18px' : theme.border.radius,
        boxShadow: theme.shadow.lg,
        overflow: isMobile ? 'hidden' : undefined,
        margin: '0'
      }}>

        {/* LOGO - 50% del ancho (en desktop), área azul en móvil */}
        <div style={{
          width: isMobile ? '100%' : '50%',
          minHeight: isMobile ? '180px' : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'center' : 'flex-end',
          padding: isMobile ? `${theme.spacing.xl} ${theme.spacing.md}` : theme.spacing['3xl']
        }}>
          <img
            src={logoSNC}
            alt="SNC UEB Logo"
            style={{
              width: '100%',
              maxWidth: isMobile ? theme.components.login.logoMaxWidth.mobile : theme.components.login.logoMaxWidth.desktop,
              filter: `drop-shadow(${theme.shadow.drop})`
            }}
          />
        </div>

        {/* CREDENCIALES - 50% del ancho (en desktop), panel blanco en móvil */}
        <div style={{
          width: isMobile ? '100%' : '50%',
          flex: isMobile ? '1' : undefined,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: isMobile ? `${theme.spacing.xl} ${theme.spacing.lg} ${theme.spacing.lg}` : theme.spacing['4xl'],
          borderRadius: '0'
        }}>
          <h2 style={{
            fontSize: isMobile ? theme.typography.fontSize.lg : theme.typography.fontSize.xl,
            color: theme.colors.text.primary,
            marginBottom: isMobile ? theme.spacing.lg : '2.5rem',
            fontWeight: theme.typography.fontWeight.light,
            letterSpacing: '0.5px',
            textAlign: 'center'
          }}>
            Credenciales Institucionales
          </h2>

          {/* Cuenta bloqueada */}
          {cuentaBloqueada && (
            <div style={{
              marginBottom: theme.spacing.lg,
              padding: `${theme.spacing.lg} ${theme.spacing.lg}`,
              background: '#fff7ed',
              border: '2px solid #f97316',
              borderRadius: theme.border.radiusSmall,
              display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md,
            }}>
              <span style={{ fontSize: '24px', lineHeight: '1.2', flexShrink: 0 }}>🔒</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#9a3412', fontSize: theme.typography.fontSize.sm, fontWeight: 700, margin: '0 0 4px 0' }}>
                  Cuenta bloqueada
                </p>
                <p style={{ color: '#c2410c', fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm, margin: '0 0 8px 0', lineHeight: 1.5 }}>
                  Tu cuenta fue bloqueada por 3 intentos fallidos. Comunícate con el administrador del sistema para que la desbloquee.
                </p>
              </div>
            </div>
          )}

          {/* Error general */}
          {error && !cuentaBloqueada && (
            <div style={{
              marginBottom: theme.spacing.lg,
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              background: '#fef2f2',
              border: `2px solid ${theme.colors.error.border}`,
              borderRadius: theme.border.radiusSmall,
              display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md,
            }}>
              <span style={{ fontSize: '20px', lineHeight: '1.4' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: theme.colors.error.text, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium, margin: '0 0 4px 0' }}>
                  Error al iniciar sesión
                </p>
                <p style={{ color: '#b91c1c', fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm, margin: '0 0 6px 0' }}>
                  {error}
                </p>
                {intentosRestantes !== null && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '4px 10px',
                    background: intentosRestantes === 1 ? '#fef2f2' : '#fff7ed',
                    border: `1px solid ${intentosRestantes === 1 ? '#fca5a5' : '#fed7aa'}`,
                    borderRadius: '6px',
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: 700,
                    color: intentosRestantes === 1 ? '#b91c1c' : '#c2410c',
                  }}>
                    {intentosRestantes === 1 ? '🔴' : '🟡'}
                    {intentosRestantes === 1
                      ? 'Último intento — si falla, tu cuenta quedará bloqueada'
                      : `Te quedan ${intentosRestantes} intentos`}
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg, opacity: cuentaBloqueada ? 0.45 : 1, pointerEvents: cuentaBloqueada ? 'none' : 'auto' }}>
            {/* Campo Correo */}
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '90px 1fr' : '160px 1fr',
                alignItems: 'flex-start',
                gap: isMobile ? '6px' : '8px'
              }}>
                <label style={{
                  fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                  textAlign: isMobile ? 'left' : 'right',
                  paddingTop: '8px'
                }}>
                  <span style={{ color: theme.colors.text.error, marginRight: '4px' }}>*</span> Correo Institucional:
                </label>
                <div style={{ width: '100%' }}>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.ueb.edu.ec"
                    autoComplete="email"
                    style={{
                      background: theme.colors.input.background,
                      border: `2px solid ${fieldErrors.email ? '#dc2626' : theme.colors.input.border}`,
                      borderRadius: theme.border.radiusSmall,
                      padding: isMobile ? '8px 10px' : '6px 12px',
                      fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
                      outline: 'none',
                      transition: theme.transition.fast,
                      boxSizing: 'border-box',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      color: '#333',
                      fontFamily: 'inherit',
                      width: '100%'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = fieldErrors.email ? '#dc2626' : theme.colors.input.focus;
                      e.target.style.boxShadow = `0 0 0 1px ${fieldErrors.email ? '#dc2626' : theme.colors.input.focus}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.email ? '#dc2626' : theme.colors.input.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {fieldErrors.email && (
                    <p style={{
                      color: '#dc2626',
                      fontSize: theme.typography.fontSize.xs,
                      margin: `4px 0 0 0`,
                      fontWeight: theme.typography.fontWeight.medium
                    }}>
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '90px 1fr' : '160px 1fr',
                alignItems: 'flex-start',
                gap: isMobile ? '6px' : '8px'
              }}>
                <label style={{
                  fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                  textAlign: isMobile ? 'left' : 'right',
                  paddingTop: '8px'
                }}>
                  <span style={{ color: theme.colors.text.error, marginRight: '4px' }}>*</span> Contraseña:
                </label>
                <div style={{ width: '100%' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    style={{
                      background: theme.colors.input.background,
                      border: `2px solid ${fieldErrors.password ? '#dc2626' : theme.colors.input.border}`,
                      borderRadius: theme.border.radiusSmall,
                      padding: isMobile ? '8px 10px' : '6px 12px',
                      fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
                      outline: 'none',
                      transition: theme.transition.fast,
                      boxSizing: 'border-box',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      color: '#333',
                      fontFamily: 'inherit',
                      width: '100%'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = fieldErrors.password ? '#dc2626' : theme.colors.input.focus;
                      e.target.style.boxShadow = `0 0 0 1px ${fieldErrors.password ? '#dc2626' : theme.colors.input.focus}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.password ? '#dc2626' : theme.colors.input.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {fieldErrors.password && (
                    <p style={{
                      color: '#dc2626',
                      fontSize: theme.typography.fontSize.xs,
                      margin: `4px 0 0 0`,
                      fontWeight: theme.typography.fontWeight.medium
                    }}>
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMobile ? 'stretch' : 'flex-end',
              gap: '1.25rem',
              paddingTop: theme.spacing.sm
            }}>
              <button
                type="button"
                onClick={() => navigate('/recuperar-contrasena')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0000ee',
                  fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  textAlign: isMobile ? 'center' : 'right',
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                He olvidado mi contraseña
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: isLoading ? theme.colors.text.light : theme.colors.input.focus,
                  color: theme.colors.secondary,
                  padding: isMobile ? `10px ${theme.spacing.lg}` : '7px 1.75rem',
                  borderRadius: theme.border.radiusSmall,
                  border: 'none',
                  fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: theme.transition.fast,
                  boxShadow: theme.shadow.sm,
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.background = '#1765cc';
                    e.target.style.boxShadow = theme.shadow.md;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.background = theme.colors.input.focus;
                    e.target.style.boxShadow = theme.shadow.sm;
                  }
                }}
              >
                {isLoading ? 'Iniciando sesión...' : 'Acceder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};
