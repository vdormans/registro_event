import { EstadoEvento } from '../enums/EstadoEvento';

/**
 * Calcula el estado derivado de un evento a partir de las fechas.
 * El estado CONCLUIDO solo puede ser asignado manualmente por el administrador
 * y no se recalcula aquí.
 */
export function calcularEstadoEvento(
  fechaInicioRegistro: Date,
  fechaCierreRegistro: Date,
  fechasEvento: Date[],
  estadoActual: EstadoEvento,
): EstadoEvento {
  // Si ya está concluido (manual), no recalcular
  if (estadoActual === EstadoEvento.CONCLUIDO) {
    return EstadoEvento.CONCLUIDO;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicio = new Date(fechaInicioRegistro);
  inicio.setHours(0, 0, 0, 0);

  const cierre = new Date(fechaCierreRegistro);
  cierre.setHours(0, 0, 0, 0);

  // Verifica si hoy es alguna de las fechas del evento
  const esHoyEvento = fechasEvento.some((fe) => {
    const d = new Date(fe);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === hoy.getTime();
  });

  if (esHoyEvento) return EstadoEvento.EN_CURSO;
  if (hoy < inicio) return EstadoEvento.PROXIMO;
  if (hoy >= inicio && hoy <= cierre) return EstadoEvento.ABIERTO;
  return EstadoEvento.CERRADO;
}

export function estaRegistroActivo(
  fechaInicioRegistro: Date,
  fechaCierreRegistro: Date,
  estadoActual: EstadoEvento,
): boolean {
  if (estadoActual === EstadoEvento.CONCLUIDO) return false;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicio = new Date(fechaInicioRegistro);
  inicio.setHours(0, 0, 0, 0);

  const cierre = new Date(fechaCierreRegistro);
  cierre.setHours(23, 59, 59, 999);

  return hoy >= inicio && hoy <= cierre;
}

export function diasRestantesRegistro(fechaCierreRegistro: Date): number | null {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const cierre = new Date(fechaCierreRegistro);
  cierre.setHours(0, 0, 0, 0);
  const diff = cierre.getTime() - hoy.getTime();
  if (diff < 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
