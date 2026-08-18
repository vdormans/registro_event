import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export default function AccesoDenegadoPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <ShieldX className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso denegado</h1>
        <p className="text-gray-500 mb-6">No tienes permiso para acceder a esta sección.</p>
        <button className="btn-primary" onClick={() => navigate('/app')}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
