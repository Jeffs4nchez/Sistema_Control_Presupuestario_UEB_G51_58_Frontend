import React from 'react';
import logo from '../assets/logo.webp';

export const LoadingScreen = ({ message = 'Iniciando sistema...' }) => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #0a1929 0%, #1a3a5c 50%, #0d1f35 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: "'Montserrat', system-ui, sans-serif",
      overflow: 'hidden',
      animation: 'ls-fadein 0.4s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;600;700;800&display=swap');
        @keyframes ls-fadein  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ls-bar     { 0% { transform: translateX(-100%); } 50% { transform: translateX(0%); } 100% { transform: translateX(100%); } }
        @keyframes ls-spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ls-pulse   { 0%,100% { box-shadow: 0 0 30px rgba(84,179,224,0.3); } 50% { box-shadow: 0 0 60px rgba(84,179,224,0.55); } }
        @keyframes ls-float   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes ls-logo    { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes ls-slideup { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Background floating shapes */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(84,179,224,0.08), transparent)', animation: 'ls-float 7s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '250px', height: '250px', borderRadius: '40px', background: 'radial-gradient(circle, rgba(46,108,164,0.07), transparent)', animation: 'ls-float 10s ease-in-out infinite reverse', transform: 'rotate(20deg)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,58,92,0.4), transparent 60%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: '28px', animation: 'ls-logo 0.6s cubic-bezier(0.175,0.885,0.32,1.275) both, ls-float 3s ease-in-out 0.6s infinite' }}>
          <img
            src={logo}
            alt="Sicop"
            style={{ width: '220px', filter: 'drop-shadow(0 8px 24px rgba(84,179,224,0.35))' }}
          />
        </div>

        {/* Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '8px', animation: 'ls-slideup 0.5s 0.3s both' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: 'rgba(84,179,224,0.75)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Sistema de Control Presupuestario
          </p>
        </div>

        {/* Spinner */}
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid rgba(255,255,255,0.08)',
          borderTopColor: '#54b3e0',
          borderRightColor: 'rgba(84,179,224,0.4)',
          borderRadius: '50%',
          animation: 'ls-spin 0.9s linear infinite',
          marginTop: '28px',
          marginBottom: '16px',
        }} />

        {/* Message */}
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, animation: 'ls-fadein 0.5s 0.7s both' }}>
          {message}
        </p>

        {/* Progress bar */}
        <div style={{ width: '220px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', animation: 'ls-fadein 0.5s 0.8s both' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, transparent, #54b3e0, #2e6ca4, transparent)',
            borderRadius: '2px',
            animation: 'ls-bar 1.6s ease-in-out infinite',
          }} />
        </div>
      </div>
    </div>
  );
};
