import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, WifiOff, Users, CheckCircle2, UserPlus, Building2 } from 'lucide-react';
import { eventosApi } from '../../api/endpoints';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import type { Evento, MetricasEvento, MetricasCiudad } from '../../types';

export default function VivoPage() {
  const { id: eventoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [metricas, setMetricas] = useState<MetricasEvento | null>(null);
  const [conectado, setConectado] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  // ── Carga inicial ────────────────────────────────────────────────
  useEffect(() => {
    if (!eventoId) return;
    Promise.all([eventosApi.obtener(eventoId), eventosApi.metricas(eventoId)]).then(
      ([ev, mt]) => {
        setEvento(ev.data);
        setMetricas(mt.data);
        setUltimaActualizacion(new Date());
      },
    );
  }, [eventoId]);

  // ── WebSocket: RF-20 / RNF-16 / RNF-17 ──────────────────────────
  const socketRef = useSocket(eventoId ?? null, accessToken);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('connect', () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));

    // Recibe métricas actualizadas tras cada acción de operadores
    socket.on(
      'metricas_actualizadas',
      (payload: { porCiudad: MetricasCiudad[] }) => {
        setMetricas((prev) => {
          if (!prev) return prev;
          const totalPreRegistros = payload.porCiudad.reduce((s, c) => s + c.preRegistros, 0);
          const totalPresentes = payload.porCiudad.reduce((s, c) => s + c.presentes, 0);
          const totalRegistroEvento = payload.porCiudad.reduce((s, c) => s + c.registroEvento, 0);
          return { ...prev, porCiudad: payload.porCiudad, totalPreRegistros, totalPresentes, totalRegistroEvento };
        });
        setUltimaActualizacion(new Date());
      },
    );

    // Detectar estado inicial de conexión
    setConectado(socket.connected);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('metricas_actualizadas');
    };
  }, [socketRef.current]);

  if (!evento || !metricas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" />
      </div>
    );
  }

  const totalGeneral = {
    preRegistros: metricas.totalPreRegistros,
    presentes: metricas.totalPresentes,
    registroEvento: metricas.totalRegistroEvento,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 mt-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{evento.nombre}</h1>
            {/* Indicador LIVE */}
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                conectado
                  ? 'bg-green-100 text-green-700 animate-pulse'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {conectado ? (
                <><Wifi className="h-3 w-3" /> EN VIVO</>
              ) : (
                <><WifiOff className="h-3 w-3" /> Desconectado</>
              )}
            </span>
          </div>
          {ultimaActualizacion && (
            <p className="text-xs text-gray-400 mt-1">
              Última actualización: {ultimaActualizacion.toLocaleTimeString('es-BO')}
            </p>
          )}
        </div>
      </div>

      {/* Totales generales */}
      <div className="grid grid-cols-3 gap-4">
        <TotalCard
          icon={<Users className="h-6 w-6 text-blue-600" />}
          label="Pre-registros"
          value={totalGeneral.preRegistros}
          color="blue"
        />
        <TotalCard
          icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
          label="Presentes"
          value={totalGeneral.presentes}
          color="green"
        />
        <TotalCard
          icon={<UserPlus className="h-6 w-6 text-purple-600" />}
          label="Nuevos hoy"
          value={totalGeneral.registroEvento}
          color="purple"
        />
      </div>

      {/* Desglose por ciudad — RF-20 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-500" />
          Desglose por ciudad
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metricas.porCiudad.map((ciudad) => (
            <CiudadCard key={ciudad.ciudadEventoId} ciudad={ciudad} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Subcomponentes ────────────────────────────────────────────────

function TotalCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
  };
  const textColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
  };

  return (
    <div className={`rounded-xl border-2 p-5 text-center ${colors[color]}`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className={`text-4xl font-bold ${textColors[color]}`}>{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function CiudadCard({ ciudad }: { ciudad: MetricasCiudad }) {
  const porcentajePresentes =
    ciudad.preRegistros > 0
      ? Math.round((ciudad.presentes / ciudad.preRegistros) * 100)
      : 0;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{ciudad.nombreCiudad}</h3>
          <span className="text-xs text-gray-400 font-mono">{ciudad.iniciales}</span>
        </div>
        <span className="text-2xl font-bold text-green-600">{ciudad.presentes}</span>
      </div>

      {/* Barra de progreso */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Presentes / Pre-registros</span>
          <span>{porcentajePresentes}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(porcentajePresentes, 100)}%` }}
          />
        </div>
      </div>

      {/* Métricas individuales */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-xl font-bold text-blue-700">{ciudad.preRegistros}</p>
          <p className="text-xs text-gray-500">Pre-reg.</p>
        </div>
        <div>
          <p className="text-xl font-bold text-green-700">{ciudad.presentes}</p>
          <p className="text-xs text-gray-500">Presentes</p>
        </div>
        <div>
          <p className="text-xl font-bold text-purple-700">{ciudad.registroEvento}</p>
          <p className="text-xs text-gray-500">Nuevos</p>
        </div>
      </div>
    </div>
  );
}
