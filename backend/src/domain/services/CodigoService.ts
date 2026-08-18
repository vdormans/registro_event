import { TipoRegistro } from '../enums/TipoRegistro';

/**
 * Genera el código único a partir de las iniciales de ciudad,
 * el número correlativo y el tipo de registro.
 * Formato PRE_REGISTRO:    "CB001"
 * Formato REGISTRO_EVENTO: "Evento-CB001"
 */
export function generarCodigo(
  iniciales: string,
  correlativo: number,
  tipo: TipoRegistro,
): string {
  const paddedNum = String(correlativo).padStart(3, '0');
  const base = `${iniciales.toUpperCase()}${paddedNum}`;
  return tipo === TipoRegistro.REGISTRO_EVENTO ? `Evento-${base}` : base;
}
