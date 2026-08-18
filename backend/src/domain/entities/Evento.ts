import { EstadoEvento } from '../enums/EstadoEvento';

export interface CiudadEvento {
  id: string;
  eventoId: string;
  nombreCiudad: string;
  iniciales: string;
  fechaEvento: Date;
}

export interface Evento {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  fechaInicioRegistro: Date;
  fechaCierreRegistro: Date;
  estado: EstadoEvento;
  permitirAcompanante: boolean;
  creadoPor: string;
  creadoEn: Date;
  actualizadoEn: Date;
  ciudades?: CiudadEvento[];
}
