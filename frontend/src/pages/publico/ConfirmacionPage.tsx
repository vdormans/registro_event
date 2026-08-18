import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, UserPlus, Calendar, MapPin, Hash } from 'lucide-react';
import type { RegistroPublicoResult } from '../../types';

interface LocationState {
  result: RegistroPublicoResult;
  permitirAcompanante: boolean;
  eventoId: string;
}

export default function ConfirmacionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { eventoId } = useParams<{ eventoId: string }>();

  const state = location.state as LocationState | null;

  // Si alguien llega directo sin state, redirigir al inicio
  if (!state?.result) {
    navigate(`/registro/${eventoId}`, { replace: true });
    return null;
  }

  const { result, permitirAcompanante } = state;

  const handleAcompanante = () => {
    // RF-10: redirige al formulario vacío del mismo evento
    navigate(`/registro/${eventoId}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">

        {/* Ícono de éxito */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full shadow-lg mb-3">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">¡Registro exitoso!</h1>
          <p className="text-gray-500 text-sm mt-1">Tu lugar está confirmado</p>
        </div>

        {/* Tarjeta de datos (RF-09) */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6 space-y-4">
          {/* Código único — elemento destacado */}
          <div className="text-center bg-primary-50 rounded-xl p-4 border border-primary-100">
            <p className="text-xs text-primary-600 font-semibold uppercase tracking-wider mb-1">Tu código de asistencia</p>
            <p className="text-4xl font-bold font-mono text-primary-800 tracking-widest">
              {result.codigoUnico}
            </p>
            <p className="text-xs text-gray-400 mt-1">Guarda este código o toma una captura</p>
          </div>

          <div className="space-y-3">
            <DatoRow icon={<Hash className="h-4 w-4 text-gray-400" />} label="Nombre" value={result.nombreCompleto} />
            <DatoRow
              icon={<MapPin className="h-4 w-4 text-gray-400" />}
              label="Ciudad"
              value={result.ciudad}
            />
            <DatoRow
              icon={<Calendar className="h-4 w-4 text-gray-400" />}
              label="Fecha del evento"
              value={new Date(result.fechaEvento).toLocaleDateString('es-BO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
          </div>
        </div>

        {/* RF-08 / RN-08: botón de acompañante solo si está activo */}
        {permitirAcompanante && (
          <button
            onClick={handleAcompanante}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-primary-300 text-primary-700 font-medium hover:bg-primary-50 transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            Registrar a un acompañante
          </button>
        )}

        <p className="text-center text-xs text-gray-400 px-4">
          Presenta este código el día del evento para confirmar tu asistencia.
        </p>
      </div>
    </div>
  );
}

function DatoRow({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-900 capitalize">{value}</p>
      </div>
    </div>
  );
}
