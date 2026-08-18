import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, CalendarClock, Download, Archive, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventosApi } from '../../api/endpoints';
import type { Evento, MetricasEvento } from '../../types';

const estadoColor: Record<string, string> = {
  PROXIMO: 'bg-blue-100 text-blue-700',
  ABIERTO: 'bg-green-100 text-green-700',
  CERRADO: 'bg-yellow-100 text-yellow-700',
  EN_CURSO: 'bg-purple-100 text-purple-700',
  CONCLUIDO: 'bg-gray-100 text-gray-600',
};
const estadoLabel: Record<string, string> = {
  PROXIMO: 'Próximo', ABIERTO: 'Abierto', CERRADO: 'Cerrado', EN_CURSO: 'En curso', CONCLUIDO: 'Concluido',
};

export default function EventoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [metricas, setMetricas] = useState<MetricasEvento | null>(null);
  const [extendiendo, setExtendiendo] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState('');

  const cargar = () => {
    if (!id) return;
    Promise.all([eventosApi.obtener(id), eventosApi.metricas(id)]).then(([ev, mt]) => {
      setEvento(ev.data);
      setMetricas(mt.data);
    });
  };

  useEffect(() => { cargar(); }, [id]);

  const concluir = async () => {
    if (!id || !confirm('¿Marcar este evento como concluido? Esta acción no se puede deshacer.')) return;
    await eventosApi.concluir(id);
    toast.success('Evento marcado como concluido');
    cargar();
  };

  const extender = async () => {
    if (!id || !nuevaFecha) return;
    await eventosApi.extenderRegistro(id, nuevaFecha);
    toast.success('Fecha de registro extendida');
    setExtendiendo(false);
    setNuevaFecha('');
    cargar();
  };

  const exportar = async (formato: 'csv' | 'xlsx') => {
    if (!id) return;
    const { data } = await eventosApi.exportar(id, formato);
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitados_${evento?.nombre ?? id}.${formato}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copiarEnlace = () => {
    const url = `${window.location.origin}/registro/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace de registro copiado');
  };

  if (!evento) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 mt-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{evento.nombre}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColor[evento.estado]}`}>
              {estadoLabel[evento.estado]}
            </span>
          </div>
          {evento.descripcion && <p className="text-gray-500 text-sm mt-1">{evento.descripcion}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {evento.estado !== 'CONCLUIDO' && (
            <Link to={`/app/eventos/${id}/editar`} className="btn-secondary text-sm flex items-center gap-1.5">
              <Edit className="h-4 w-4" /> Editar
            </Link>
          )}
          {evento.estado !== 'CONCLUIDO' && (
            <button onClick={concluir} className="btn-danger text-sm flex items-center gap-1.5">
              <Archive className="h-4 w-4" /> Concluir
            </button>
          )}
        </div>
      </div>

      {/* Métricas */}
      {metricas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pre-registros', value: metricas.totalPreRegistros, color: 'text-blue-700' },
            { label: 'Presentes', value: metricas.totalPresentes, color: 'text-green-700' },
            { label: 'Reg. en evento', value: metricas.totalRegistroEvento, color: 'text-purple-700' },
            { label: 'Días p/ cierre', value: metricas.diasRestantesRegistro ?? '—', color: 'text-yellow-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ciudades */}
      {metricas && metricas.porCiudad.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800">Desglose por ciudad</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Ciudad</th>
                  <th className="pb-2 font-medium text-right">Pre-registros</th>
                  <th className="pb-2 font-medium text-right">Presentes</th>
                  <th className="pb-2 font-medium text-right">Reg. evento</th>
                </tr>
              </thead>
              <tbody>
                {metricas.porCiudad.map((c) => (
                  <tr key={c.ciudadEventoId} className="border-b last:border-0">
                    <td className="py-2 font-medium">{c.nombreCiudad} <span className="text-gray-400 text-xs">({c.iniciales})</span></td>
                    <td className="py-2 text-right text-blue-700">{c.preRegistros}</td>
                    <td className="py-2 text-right text-green-700">{c.presentes}</td>
                    <td className="py-2 text-right text-purple-700">{c.registroEvento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Extender registro */}
        {evento.estado !== 'CONCLUIDO' && (
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> Extender registro
            </h3>
            {extendiendo ? (
              <div className="flex gap-2">
                <input type="date" className="input flex-1" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
                <button onClick={extender} className="btn-primary text-sm px-3">Guardar</button>
                <button onClick={() => setExtendiendo(false)} className="btn-secondary text-sm px-3">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setExtendiendo(true)} className="btn-secondary text-sm">
                Nueva fecha de cierre
              </button>
            )}
            <p className="text-xs text-gray-400">Cierre actual: {new Date(evento.fechaCierreRegistro).toLocaleDateString('es-BO')}</p>
          </div>
        )}

        {/* Exportar */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Download className="h-4 w-4" /> Exportar invitados
          </h3>
          <div className="flex gap-2">
            <button onClick={() => exportar('xlsx')} className="btn-primary text-sm flex-1">XLSX</button>
            <button onClick={() => exportar('csv')} className="btn-secondary text-sm flex-1">CSV</button>
          </div>
        </div>

        {/* Enlace de registro */}
        <div className="card space-y-3 sm:col-span-2">
          <h3 className="font-semibold text-gray-800">Enlace de registro público</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-100 rounded px-3 py-2 text-gray-600 truncate">
              {window.location.origin}/registro/{id}
            </code>
            <button onClick={copiarEnlace} className="btn-secondary text-sm flex items-center gap-1.5">
              <Copy className="h-4 w-4" /> Copiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
