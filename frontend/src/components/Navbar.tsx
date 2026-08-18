import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Users, LayoutDashboard, Eye, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rolLabel: Record<string, string> = {
    ADMIN: 'Administrador',
    OPERADOR: 'Control de Asistencia',
    VISUALIZACION: 'Visualización en Vivo',
  };

  return (
    <nav className="bg-primary-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/app" className="flex items-center gap-2 font-bold text-lg">
              <Calendar className="h-5 w-5" />
              Eventos Corp.
            </Link>

            <div className="hidden sm:flex items-center gap-4 text-sm">
              {(usuario?.rol === 'ADMIN' || usuario?.rol === 'OPERADOR') && (
                <Link
                  to="/app"
                  className="flex items-center gap-1.5 hover:text-primary-200 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}
              {usuario?.rol === 'ADMIN' && (
                <Link
                  to="/app/usuarios"
                  className="flex items-center gap-1.5 hover:text-primary-200 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Usuarios
                </Link>
              )}
              {usuario?.rol === 'VISUALIZACION' && (
                <Link
                  to="/app"
                  className="flex items-center gap-1.5 hover:text-primary-200 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Mis Eventos
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary-300" />
              <span className="text-primary-200">{rolLabel[usuario?.rol ?? '']}</span>
              <span className="text-white font-medium">{usuario?.nombre}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-primary-200 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
