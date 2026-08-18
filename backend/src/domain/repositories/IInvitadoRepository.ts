import { Invitado } from '../entities/Invitado';
import { TipoRegistro } from '../enums/TipoRegistro';
import { EstadoInvitado } from '../enums/EstadoInvitado';

export interface CrearInvitadoDto {
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
}

export interface BuscarInvitadoFiltros {
  eventoId: string;
  q?: string;              // búsqueda libre: código, nombre, celular
  ciudadEventoId?: string;
  tipoRegistro?: TipoRegistro;
  estado?: EstadoInvitado;
}

export interface MetricasCiudad {
  ciudadEventoId: string;
  nombreCiudad: string;
  iniciales: string;
  preRegistros: number;
  presentes: number;
  registroEvento: number;
}

export interface IInvitadoRepository {
  findById(id: string): Promise<Invitado | null>;
  findByEventoYCelular(eventoId: string, celular: string): Promise<Invitado | null>;
  findByEventoYNombre(eventoId: string, nombreCompleto: string): Promise<Invitado | null>;
  buscar(filtros: BuscarInvitadoFiltros): Promise<Invitado[]>;
  findAllByEvento(eventoId: string): Promise<Invitado[]>;
  create(data: CrearInvitadoDto): Promise<Invitado>;
  marcarPresente(id: string): Promise<Invitado>;
  getMetricasPorCiudad(eventoId: string): Promise<MetricasCiudad[]>;
  // operación atómica: obtiene siguiente correlativo con SELECT FOR UPDATE
  siguienteCorrelativo(eventoId: string, ciudadEventoId: string, tipo: TipoRegistro): Promise<number>;
}
