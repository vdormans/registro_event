import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle2, UserPlus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { invitadosApi, eventosApi } from '../../api/endpoints';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import type { Invitado, Evento } from '../../types';

// ── Formulario de nuevo invitado ──────────────────────────────────
const registrarSchema = z.object({
  ciudadEventoId: z.string().min(1, 'Selecciona una ciudad'),
  nombreCompleto: z.string().min(1, 'Nombre obligatorio'),
  celular: z.string().min(1, 'Celular obligatorio'),
  codigoCliente: z.string().min(1, 'Código de cliente obligatorio'),
  consentimientoDatos: z.literal(true, {
    errorMap: () => ({ message: 'Debe aceptar el uso de datos' }),
  }),
});
type RegistrarForm = z.infer<typeof registrarSchema>;

export default function AsistenciaPage() {
  const { id: eventoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<Invitado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [showRegistrar, setShowRegistrar] = useState(false);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── WebSocket: escucha actualizaciones en tiempo real (RF-19) ────
  const socketRef = useSocket(eventoId ?? null, accessToken);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onPresente = (payload: { invitadoId: string }) => {
      setResultados((prev) =>
        prev.map((inv) =>
          inv.id === payload.invitadoId ? { ...inv, estado: 'PRESENTE' as const } : inv,
        ),
      );
    };

    const onNuevo = (payload: { invitadoId: string; codigoUnico: string; nombreCompleto: string; ciudad: string; tipoRegistro: string }) => {
      toast(`Nuevo registro: ${payload.nombreCompleto} (${payload.codigoUnico})`, { icon: '🆕' });
    };

    socket.on('invitado_presente', onPresente);
    socket.on('nuevo_invitado', onNuevo);
    return () => {
      socket.off('invitado_presente', onPresente);
      socket.off('nuevo_invitado', onNuevo);
    };
  }, [socketRef.current]);

  // ── Carga inicial del evento ──────────────────────────────────────
  useEffect(() => {
    if (eventoId) eventosApi.obtener(eventoId).then((r) => setEvento(r.data));
  }, [eventoId]);

  // ── Búsqueda con debounce (RF-16) ─────────────────────────────────
  const buscar = useCallback(
    (q: string) => {
      if (!eventoId) return;
      setBuscando(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await invitadosApi.buscar(eventoId, q || undefined);
          setResultados(data);
        } finally {
          setBuscando(false);
        }
      }, 300);
    },
    [eventoId],
  );

  useEffect(() => {
    buscar(query);
  }, [query, buscar]);

  // ── Marcar presente (RF-17) ───────────────────────────────────────
  const marcarPresente = async (invitadoId: string) => {
    if (!eventoId) return;
    setConfirmando(invitadoId);
    try {
      await invitadosApi.marcarPresente(eventoId, invitadoId);
      toast.success('Invitado marcado como presente');
      setResultados((prev) =>
        prev.map((inv) => (inv.id === invitadoId ? { ...inv, estado: 'PRESENTE' as const } : inv)),
      );
    } finally {
      setConfirmando(null);
    }
  };

  // ── Formulario de registro nuevo ──────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegistrarForm>({ resolver: zodResolver(registrarSchema) });

  const onRegistrar = async (data: RegistrarForm) => {
    if (!eventoId) return;
    await invitadosApi.registrar(eventoId, { ...data });
    toast.success('Invitado registrado y marcado como presente');
    reset();
    setShowRegistrar(false);
    buscar(query);
  };

  const ciudades = evento?.ciudades ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Control de Asistencia</h1>
          <p className="text-sm text-gray-500">{evento?.nombre}</p>
        </div>
        <button
          onClick={() => setShowRegistrar((v) => !v)}
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          Registrar nuevo
        </button>
      </div>

      {/* Buscador (RF-16) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className="input pl-9 text-base"
          placeholder="Buscar por código, nombre o número de celular…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Formulario registro nuevo (RF-18) */}
      {showRegistrar && (
        <div className="card space-y-4 border-2 border-primary-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Registrar nuevo invitado</h3>
            <button onClick={() => setShowRegistrar(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onRegistrar)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre completo *</label>
                <input className="input" {...register('nombreCompleto')} />
                {errors.nombreCompleto && <p className="mt-1 text-xs text-red-600">{errors.nombreCompleto.message}</p>}
              </div>
              <div>
                <label className="label">Número de celular *</label>
                <input className="input" type="tel" {...register('celular')} />
                {errors.celular && <p className="mt-1 text-xs text-red-600">{errors.celular.message}</p>}
              </div>
              <div>
                <label className="label">Código de cliente *</label>
                <input className="input" {...register('codigoCliente')} />
                {errors.codigoCliente && <p className="mt-1 text-xs text-red-600">{errors.codigoCliente.message}</p>}
              </div>
              <div>
                <label className="label">Ciudad *</label>
                <select className="input" {...register('ciudadEventoId')}>
                  <option value="">Seleccionar ciudad</option>
                  {ciudades.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombreCiudad}</option>
                  ))}
                </select>
                {errors.ciudadEventoId && <p className="mt-1 text-xs text-red-600">{errors.ciudadEventoId.message}</p>}
              </div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="mt-0.5 h-4 w-4 text-primary-600 rounded" {...register('consentimientoDatos')} />
              <span className="text-sm text-gray-700">
                El invitado acepta el uso de sus datos personales para la gestión del evento.
              </span>
            </label>
            {errors.consentimientoDatos && (
              <p className="text-xs text-red-600">{errors.consentimientoDatos.message}</p>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => { setShowRegistrar(false); reset(); }} className="btn-secondary text-sm">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
                {isSubmitting ? 'Registrando…' : 'Registrar y marcar presente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resultados */}
      <div className="space-y-2">
        {buscando && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" />
          </div>
        )}

        {!buscando && resultados.length === 0 && (
          <div className="card text-center py-10 text-gray-400">
            <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>{query ? 'No se encontraron invitados con ese criterio.' : 'Escribe para buscar un invitado.'}</p>
          </div>
        )}

        {!buscando && resultados.map((inv) => (
          <div
            key={inv.id}
            className={`card flex items-center gap-4 py-4 transition-colors ${
              inv.estado === 'PRESENTE' ? 'border-green-200 bg-green-50' : ''
            }`}
          >
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-primary-700">{inv.codigoUnico}</span>
                {inv.tipoRegistro === 'PRE_REGISTRO'
                  ? <span className="badge-pre">Pre-registrado</span>
                  : <span className="badge-evento">Reg. evento</span>}
                {inv.estado === 'PRESENTE'
                  ? <span className="badge-presente">Presente</span>
                  : <span className="badge-registrado">Registrado</span>}
              </div>
              <p className="font-semibold text-gray-900 mt-0.5">{inv.nombreCompleto}</p>
              <p className="text-sm text-gray-500">
                {inv.celular} · {inv.ciudadEvento?.nombreCiudad ?? '—'}
              </p>
            </div>

            {/* Acción */}
            {inv.estado === 'REGISTRADO' ? (
              <button
                onClick={() => marcarPresente(inv.id)}
                disabled={confirmando === inv.id}
                className="btn-primary shrink-0 flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                {confirmando === inv.id ? 'Marcando…' : 'Marcar presente'}
              </button>
            ) : (
              <div className="shrink-0 flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle2 className="h-5 w-5" />
                Presente
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
