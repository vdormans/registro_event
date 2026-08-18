import { TipoRegistro } from '../enums/TipoRegistro';
import { EstadoInvitado } from '../enums/EstadoInvitado';

export interface Invitado {
  id: string;
  eventoId: string;
  ciudadEventoId: string;
  nombreCompleto: string;
  celular: string;
  codigoCliente: string;
  codigoUnico: string;
  tipoRegistro: TipoRegistro;
  estado: EstadoInvitado;
  consentimientoDatos: boolean;
  registradoPor: string | null;
  registradoEn: Date;
  marcadoPresenteEn: Date | null;
  // relaciones opcionales
  ciudadEvento?: {
    nombreCiudad: string;
    iniciales: string;
    fechaEvento: Date;
  };
}
