import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, MapPin, Clock, AlertCircle } from 'lucide-react';
import { publicoApi } from '../../api/endpoints';
import type { EventoPublico } from '../../types';

const schema = z.object({
  ciudadEventoId: z.string().min(1, 'Selecciona una ciudad'),
  nombreCompleto: z.string().min(1, 'El nombre completo es obligatorio'),
  celular: z.string().min(1, 'El número de celular es obligatorio'),
  codigoCliente: z.string().min(1, 'El código de cliente es obligatorio'),
  consentimientoDatos: z.literal(true, {
    errorMap: () => ({ message: 'Debe aceptar el uso de datos para continuar' }),
  }),
});
type FormData = z.infer<typeof schema>;

type PageState = 'loading' | 'closed-before' | 'closed-after' | 'concluded' | 'open';

export default function RegistroPublicoPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<EventoPublico | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [ciudadUnica, setCiudadUnica] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // ── Carga y valida período de registro (RF-06, RF-08) ─────────────
  useEffect(() => {
    if (!eventoId) return;
    publicoApi.obtenerEvento(eventoId).then(({ data }) => {
      setEvento(data);

      if (data.estado === 'CONCLUIDO') { setPageState('concluded'); return; }

      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const inicio = new Date(data.fechaInicioRegistro); inicio.setHours(0, 0, 0, 0);
      const cierre = new Date(data.fechaCierreRegistro); cierre.setHours(23, 59, 59, 999);

      if (hoy < inicio) { setPageState('closed-before'); return; }
      if (hoy > cierre) { setPageState('closed-after'); return; }

      setPageState('open');

      // Si hay una sola ciudad, preseleccionar
      if (data.ciudades.length === 1) setCiudadUnica(data.ciudades[0].id);
    }).catch(() => setPageState('closed-after'));
  }, [eventoId]);

  const onSubmit = async (data: FormData) => {
    if (!eventoId) return;
    const ciudadId = ciudadUnica ?? data.ciudadEventoId;
    const { data: result } = await publicoApi.registrar(eventoId, {
      ...data,
      ciudadEventoId: ciudadId,
    });
    // RF-09: navegar a pantalla de confirmación
    navigate(`/registro/${eventoId}/confirmacion`, {
      state: { result, permitirAcompanante: evento?.permitirAcompanante, eventoId },
    });
  };

  // ── Estados de pantalla ──────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" />
      </div>
    );
  }

  if (pageState === 'concluded' || !evento) {
    return <PantallaFueraDeRango titulo="Evento concluido" mensaje="Este evento ya ha finalizado." />;
  }

  if (pageState === 'closed-before') {
    return (
      <PantallaFueraDeRango
        titulo="Registro no disponible aún"
        mensaje={`El período de registro para este evento comienza el ${new Date(evento.fechaInicioRegistro).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
      />
    );
  }

  if (pageState === 'closed-after') {
    return (
      <PantallaFueraDeRango
        titulo="Período de registro cerrado"
        mensaje="El período de registro para este evento ha concluido."
      />
    );
  }

  const multipleCiudades = evento.ciudades.length > 1;

  return (
    // RNF-12: diseño mobile-first, viewport completo
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 pb-12">

        {/* Cabecera del evento */}
        <div className="mb-6">
          {evento.imagenUrl && (
            <img
              src={evento.imagenUrl}
              alt={evento.nombre}
              className="w-full h-44 object-cover rounded-2xl mb-4 shadow"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{evento.nombre}</h1>
          {evento.descripcion && (
            <p className="text-gray-500 text-sm mt-1">{evento.descripcion}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {evento.ciudades.map((c) => new Date(c.fechaEvento).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })).join(' / ')}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {evento.ciudades.map((c) => c.nombreCiudad).join(', ')}
            </span>
          </div>
        </div>

        {/* Formulario (RF-07) */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Formulario de registro</h2>

          {/* Nombre */}
          <div>
            <label className="label" htmlFor="nombreCompleto">Nombre completo *</label>
            <input
              id="nombreCompleto"
              className="input text-base"
              placeholder="Tu nombre completo"
              autoComplete="name"
              {...register('nombreCompleto')}
            />
            {errors.nombreCompleto && <p className="mt-1.5 text-sm text-red-600">{errors.nombreCompleto.message}</p>}
          </div>

          {/* Celular */}
          <div>
            <label className="label" htmlFor="celular">Número de celular *</label>
            <input
              id="celular"
              type="tel"
              className="input text-base"
              placeholder="Ej. 70012345"
              autoComplete="tel"
              inputMode="numeric"
              {...register('celular')}
            />
            {errors.celular && <p className="mt-1.5 text-sm text-red-600">{errors.celular.message}</p>}
          </div>

          {/* Código de cliente */}
          <div>
            <label className="label" htmlFor="codigoCliente">Código de cliente *</label>
            <input
              id="codigoCliente"
              className="input text-base"
              placeholder="Ej. CLI-9981"
              {...register('codigoCliente')}
            />
            {errors.codigoCliente && <p className="mt-1.5 text-sm text-red-600">{errors.codigoCliente.message}</p>}
          </div>

          {/* Ciudad — solo si múltiples (RF-07) */}
          {multipleCiudades && (
            <div>
              <label className="label" htmlFor="ciudadEventoId">Ciudad del evento *</label>
              <select id="ciudadEventoId" className="input text-base" {...register('ciudadEventoId')}>
                <option value="">Selecciona tu ciudad</option>
                {evento.ciudades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreCiudad} — {new Date(c.fechaEvento).toLocaleDateString('es-BO', { day: 'numeric', month: 'long' })}
                  </option>
                ))}
              </select>
              {errors.ciudadEventoId && <p className="mt-1.5 text-sm text-red-600">{errors.ciudadEventoId.message}</p>}
            </div>
          )}

          {/* Si es ciudad única pero múltiples fechas (improbable pero cubierto) */}
          {!multipleCiudades && ciudadUnica && (
            <input type="hidden" {...register('ciudadEventoId')} value={ciudadUnica} />
          )}

          {/* Consentimiento (RN-07 / RNF-10) */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
                {...register('consentimientoDatos')}
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                Acepto que mis datos personales (nombre, celular y código de cliente) sean utilizados exclusivamente para la gestión y control de asistencia al evento.
              </span>
            </label>
            {errors.consentimientoDatos && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errors.consentimientoDatos.message}
              </p>
            )}
          </div>

          {/* Botón enviar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-4 text-base font-semibold rounded-xl"
          >
            {isSubmitting ? 'Registrando…' : 'Registrarme'}
          </button>
        </form>

        {/* Cierre de registro */}
        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Registro disponible hasta el {new Date(evento.fechaCierreRegistro).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

function PantallaFueraDeRango({ titulo, mensaje }: { titulo: string; mensaje: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mx-auto">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
        <p className="text-gray-500 text-sm">{mensaje}</p>
      </div>
    </div>
  );
}
