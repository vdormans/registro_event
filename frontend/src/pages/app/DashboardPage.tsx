import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, PlusCircle, Eye, ChevronRight, Archive } from 'lucide-react';
import { eventosApi } from '../../api/endpoints';
import type { Evento, EstadoEvento } from '../../types';
import { useAuth } from '../../context/AuthContext';

const estadoLabel: Record<EstadoEvento, string> = {
  PROXIMO: 'Próximo',
  ABIERTO: 'Abierto',
  CERRADO: 'Cerrado',
  EN_CURSO: 'En curso',
  CONCLUIDO: 'Concluido',
};

const estadoColor: Record<EstadoEvento, string> = {
  PROXIMO: 'bg-blue-100 text-blue-700',
  ABIERTO: 'bg-green-100 text-green-700',
  CERRADO: 'bg-yellow-100 text-yellow-700',
  EN_CURSO: 'bg-purple-100 text-purple-700',
  CONCLUIDO: 'bg-gray-100 text-gray-600',
};

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [concluidos, setConcluidos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [verConcluidos, setVerConcluidos] = useState(false);

  useEffect(() => {
    Promise.all([
      eventosApi.listar(false),
      usuario?.rol === 'ADMIN' ? eventosApi.listar(true) : Promise.resolve({ data: [] }),
    ])
      .then(([activos, todos]) => {
        const activosData = activos.data;
        const todosData = (todos as { data: Evento[] }).data;
        setEventos(activosData.filter((e) => e.estado !== 'CONCLUIDO'));
        setConcluidos(todosData.filter((e) => e.estado === 'CONCLUIDO'));
      })
      .finally(() => setLoading(false));
  }, [usuario]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" />
      </div>
    );
  }

  const lista = verConcluidos ? concluidos : eventos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Eventos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {usuario?.rol === 'ADMIN' ? 'Todos los eventos del sistema' : 'Eventos asignados a tu perfil'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {usuario?.rol === 'ADMIN' && (
            <>
              <button
                onClick={() => setVerConcluidos((v) => !v)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Archive className="h-4 w-4" />
                {verConcluidos ? 'Ver activos' : `Concluidos (${concluidos.length})`}
              </button>
              <Link to="/app/eventos/nuevo" className="btn-primary flex items-center gap-2 text-sm">
                <PlusCircle className="h-4 w-4" />
                Nuevo evento
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Lista de eventos */}
      {lista.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {verConcluidos ? 'No hay eventos concluidos.' : 'No hay eventos activos.'}
          </p>
          {usuario?.rol === 'ADMIN' && !verConcluidos && (
            <Link to="/app/eventos/nuevo" className="btn-primary inline-flex mt-4 text-sm">
              Crear primer evento
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((evento) => (
            <EventoCard key={evento.id} evento={evento} rol={usuario?.rol ?? ''} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventoCard({ evento, rol, navigate }: { evento: Evento; rol: string; navigate: ReturnType<typeof useNavigate> }) {
  const ciudades = evento.ciudades ?? [];

  return (
    <div className="card hover:shadow-md transition-shadow flex flex-col gap-3">
      {evento.imagenUrl && (
        <img
          src={evento.imagenUrl}
          alt={evento.nombre}
          className="w-full h-36 object-cover rounded-lg"
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-gray-900 leading-tight">{evento.nombre}</h2>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${estadoColor[evento.estado]}`}>
          {estadoLabel[evento.estado]}
        </span>
      </div>

      {evento.descripcion && (
        <p className="text-sm text-gray-500 line-clamp-2">{evento.descripcion}</p>
      )}

      <div className="flex flex-wrap gap-1">
        {ciudades.map((c) => (
          <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {c.nombreCiudad}
          </span>
        ))}
      </div>

      {evento.diasRestantesRegistro !== null && evento.diasRestantesRegistro !== undefined && evento.estado !== 'CONCLUIDO' && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          {evento.diasRestantesRegistro > 0
            ? `${evento.diasRestantesRegistro} días para cierre de registro`
            : 'Registro cerrado'}
        </div>
      )}

      {/* Acciones */}
      <div className="mt-auto pt-3 border-t border-gray-100 flex flex-wrap gap-2">
        {(rol === 'ADMIN' || rol === 'OPERADOR') && (
          <>
            <button
              onClick={() => navigate(`/app/eventos/${evento.id}/asistencia`)}
              className="btn-primary text-xs flex items-center gap-1.5 py-1.5"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Asistencia
            </button>
            <button
              onClick={() => navigate(`/app/eventos/${evento.id}/invitados`)}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              Invitados
            </button>
          </>
        )}
        <button
          onClick={() => navigate(`/app/eventos/${evento.id}/vivo`)}
          className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
        >
          <Eye className="h-3.5 w-3.5" />
          En vivo
        </button>
        {rol === 'ADMIN' && (
          <button
            onClick={() => navigate(`/app/eventos/${evento.id}`)}
            className="ml-auto text-xs text-primary-700 hover:text-primary-800 flex items-center gap-1"
          >
            Gestionar <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
