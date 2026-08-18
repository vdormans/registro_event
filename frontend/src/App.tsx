import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Páginas de error
import AccesoDenegadoPage from './pages/AccesoDenegadoPage';

// Admin / Operador
import DashboardPage from './pages/app/DashboardPage';
import EventoDetallePage from './pages/app/EventoDetallePage';
import CrearEventoPage from './pages/app/CrearEventoPage';
import EditarEventoPage from './pages/app/EditarEventoPage';
import InvitadosPage from './pages/app/InvitadosPage';
import UsuariosPage from './pages/app/UsuariosPage';

// Control de Asistencia
import AsistenciaPage from './pages/app/AsistenciaPage';

// Visualización en Vivo
import VivoPage from './pages/app/VivoPage';

// Registro Público
import RegistroPublicoPage from './pages/publico/RegistroPublicoPage';
import ConfirmacionPage from './pages/publico/ConfirmacionPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Rutas públicas ──────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro/:eventoId" element={<RegistroPublicoPage />} />
        <Route path="/registro/:eventoId/confirmacion" element={<ConfirmacionPage />} />
        <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />

        {/* ── Rutas protegidas ────────────────────────────────── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard — Admin y Operador */}
          <Route
            index
            element={
              <ProtectedRoute roles={['ADMIN', 'OPERADOR', 'VISUALIZACION']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Gestión de eventos — Admin */}
          <Route
            path="eventos/nuevo"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <CrearEventoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="eventos/:id"
            element={
              <ProtectedRoute roles={['ADMIN', 'OPERADOR']}>
                <EventoDetallePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="eventos/:id/editar"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <EditarEventoPage />
              </ProtectedRoute>
            }
          />

          {/* Listado de invitados — Admin y Operador */}
          <Route
            path="eventos/:id/invitados"
            element={
              <ProtectedRoute roles={['ADMIN', 'OPERADOR']}>
                <InvitadosPage />
              </ProtectedRoute>
            }
          />

          {/* Control de asistencia — Admin y Operador */}
          <Route
            path="eventos/:id/asistencia"
            element={
              <ProtectedRoute roles={['ADMIN', 'OPERADOR']}>
                <AsistenciaPage />
              </ProtectedRoute>
            }
          />

          {/* Visualización en vivo — todos los roles */}
          <Route
            path="eventos/:id/vivo"
            element={
              <ProtectedRoute roles={['ADMIN', 'OPERADOR', 'VISUALIZACION']}>
                <VivoPage />
              </ProtectedRoute>
            }
          />

          {/* Gestión de usuarios — solo Admin */}
          <Route
            path="usuarios"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Redirect raíz */}
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AuthProvider>
  );
}
