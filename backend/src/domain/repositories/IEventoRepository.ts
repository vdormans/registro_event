import { Evento, CiudadEvento } from '../entities/Evento';
import { EstadoEvento } from '../enums/EstadoEvento';

export interface CrearCiudadDto {
  nombreCiudad: string;
  iniciales: string;
  fechaEvento: Date;
}

export interface CrearEventoDto {
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  fechaInicioRegistro: Date;
  fechaCierreRegistro: Date;
  permitirAcompanante: boolean;
  creadoPor: string;
  ciudades: CrearCiudadDto[];
}

export interface ActualizarEventoDto {
  nombre?: string;
  descripcion?: string;
  imagenUrl?: string;
  fechaInicioRegistro?: Date;
  fechaCierreRegistro?: Date;
  permitirAcompanante?: boolean;
  estado?: EstadoEvento;
  ciudades?: CrearCiudadDto[];
}

export interface IEventoRepository {
  findById(id: string, incluirCiudades?: boolean): Promise<Evento | null>;
  findAll(incluirConcluidos?: boolean): Promise<Evento[]>;
  findByUsuario(usuarioId: string): Promise<Evento[]>;
  create(data: CrearEventoDto): Promise<Evento>;
  update(id: string, data: ActualizarEventoDto): Promise<Evento>;
  delete(id: string): Promise<void>;
  findCiudadById(ciudadId: string): Promise<CiudadEvento | null>;
  findCiudadesByEvento(eventoId: string): Promise<CiudadEvento[]>;
}
