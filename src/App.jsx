import { lazy, Suspense, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { FiscalYearProvider } from './contexts/FiscalYearContext';
import { ProtectedRoute } from './contexts/ProtectedRoute';
import { LoadingScreen } from './components/LoadingScreen';
import { can } from './utils/permissions';
import './App.css';

// Carga inmediata: Login es la primera pantalla que ve el usuario
import { Login } from './pages/Login';

// Lazy loading: el resto se carga solo cuando se navega a esa ruta
const Dashboard            = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Usuarios             = lazy(() => import('./pages/Usuarios').then(m => ({ default: m.Usuarios })));
const Inicio               = lazy(() => import('./pages/Inicio').then(m => ({ default: m.Inicio })));
const CedulaPresupuestaria = lazy(() => import('./pages/CedulaPresupuestaria'));
const Certificacion        = lazy(() => import('./pages/Certificacion'));
const Liquidaciones        = lazy(() => import('./pages/Liquidaciones'));
const RecuperarContrasena  = lazy(() => import('./pages/RecuperarContrasena'));
const RestablecerContrasena = lazy(() => import('./pages/RestablecerContrasena'));
const EntidadRequiriente   = lazy(() => import('./pages/EntidadRequiriente'));
const Reportes             = lazy(() => import('./pages/Reportes'));
const ReportePrint         = lazy(() => import('./pages/ReportePrint'));
const Auditoria            = lazy(() => import('./pages/Auditoria'));

function RoleRoute({ check, children }) {
  const { user } = useContext(AuthContext);
  if (!check(user)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppContent() {
  const { isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
        <Route path="/reporte-print" element={<ReportePrint />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route path="usuarios" element={
            <RoleRoute check={can.verUsuarios}>
              <Usuarios />
            </RoleRoute>
          } />

          <Route path="estructura-presupuestaria" element={<Navigate to="/dashboard/cedula-presupuestaria" replace />} />
          <Route path="estructura-presupuestaria-data" element={<Navigate to="/dashboard/cedula-presupuestaria" replace />} />

          <Route path="cedula-presupuestaria" element={
            <RoleRoute check={can.verCedula}>
              <CedulaPresupuestaria />
            </RoleRoute>
          } />

          <Route path="certificacion" element={
            <RoleRoute check={can.verCertificacion}>
              <Certificacion />
            </RoleRoute>
          } />

          <Route path="liquidaciones" element={
            <RoleRoute check={can.verLiquidaciones}>
              <Liquidaciones />
            </RoleRoute>
          } />

          <Route path="unidad-requiriente" element={
            <RoleRoute check={can.verEntidadRequiriente}>
              <EntidadRequiriente />
            </RoleRoute>
          } />

          <Route path="reportes" element={
            <RoleRoute check={can.verReportes}>
              <Reportes />
            </RoleRoute>
          } />

          <Route path="auditoria" element={
            <RoleRoute check={can.verAuditoria}>
              <Auditoria />
            </RoleRoute>
          } />

          <Route index element={<Inicio />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <FiscalYearProvider>
          <AppContent />
        </FiscalYearProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
