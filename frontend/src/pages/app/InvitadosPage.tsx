import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download } from 'lucide-react';
import { invitadosApi, eventosApi } from '../../api/endpoints';
import type { Invitado, Evento } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function InvitadosPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [ev, inv] = await Promise.all([
      eventosApi.obtener(id),
      invitadosApi.buscar(id, q || undefined),
    ]);
    setEvento(ev.data);
    setInvitados(inv.data);
    setLoading(false);
  }, [id, q]);

  useEffect(() => { cargar(); }, [cargar]);

  const exportar = async (formato: 'csv' | 'xlsx') => {
    if (!id) return;
    const { data } = await eventosApi.exportar(id, formato);
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitados.${formato}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Invitados</h1>
          <p className="text-sm text-gray-500">{evento?.nombre}</p>
        </div>
        {usuario?.rol === 'ADMIN' && (
          <div className="flex gap-2">
            <button onClick={() => exportar('xlsx')} className="btn-primary text-sm flex items-center gap-1.5">
              <Download className="h-4 w-4" /> XLSX
            </button>
            <button onClick={() => exportar('csv')} className="btn-secondary text-sm flex items-center gap-1.5">
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por código, nombre o celular…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Código', 'Nombre', 'Celular', 'Cód. cliente', 'Ciudad', 'Tipo', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invitados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      No se encontraron invitados
                    </td>
                  </tr>
                ) : (
                  invitados.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-primary-700">{inv.codigoUnico}</td>
                      <td className="px-4 py-3 font-medium">{inv.nombreCompleto}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.celular}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.codigoCliente}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.ciudadEvento?.nombreCiudad ?? '—'}</td>
                      <td className="px-4 py-3">
                        {inv.tipoRegistro === 'PRE_REGISTRO'
                          ? <span className="badge-pre">Pre-registrado</span>
                          : <span className="badge-evento">Reg. evento</span>}
                      </td>
                      <td className="px-4 py-3">
                        {inv.estado === 'PRESENTE'
                          ? <span className="badge-presente">Presente</span>
                          : <span className="badge-registrado">Registrado</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-400">
            {invitados.length} resultado{invitados.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
