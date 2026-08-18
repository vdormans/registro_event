export type Rol = 'ADMIN' | 'OPERADOR' | 'VISUALIZACION';
export type EstadoEvento = 'PROXIMO' | 'ABIERTO' | 'CERRADO' | 'EN_CURSO' | 'CONCLUIDO';
export type TipoRegistro = 'PRE_REGISTRO' | 'REGISTRO_EVENTO';
export type EstadoInvitado = 'REGISTRADO' | 'PRESENTE';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CiudadEvento {
  id: string;
  eventoId: string;
  nombreCiudad: string;
  iniciales: string;
  fechaEvento: string;
}

export interface Evento {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  fechaInicioRegistro: string;
  fechaCierreRegistro: string;
  estado: EstadoEvento;
  permitirAcompanante: boolean;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  ciudades?: CiudadEvento[];
  diasRestantesRegistro?: number | null;
}

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
  registradoEn: string;
  marcadoPresenteEn: string | null;
  ciudadEvento?: {
    nombreCiudad: string;
    iniciales: string;
    fechaEvento: string;
  };
}

export interface MetricasCiudad {
  ciudadEventoId: string;
  nombreCiudad: string;
  iniciales: string;
  preRegistros: number;
  presentes: number;
  registroEvento: number;
}

export interface MetricasEvento {
  eventoId: string;
  totalPreRegistros: number;
  totalPresentes: number;
  totalRegistroEvento: number;
  diasRestantesRegistro: number | null;
  estado: EstadoEvento;
  porCiudad: MetricasCiudad[];
}

export interface AsignacionOperador {
  id: string;
  usuarioId: string;
  eventoId: string;
  asignadoEn: string;
}

export interface RegistroPublicoResult {
  codigoUnico: string;
  nombreCompleto: string;
  ciudad: string;
  fechaEvento: string;
  tipoRegistro: TipoRegistro;
}

export interface EventoPublico {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  fechaInicioRegistro: string;
  fechaCierreRegistro: string;
  estado: EstadoEvento;
  registroActivo: boolean;
  permitirAcompanante: boolean;
  ciudades: CiudadEvento[];
}
