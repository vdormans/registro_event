import { PrismaClient } from '@prisma/client';
import {
  IEventoRepository,
  CrearEventoDto,
  ActualizarEventoDto,
} from '../../domain/repositories/IEventoRepository';
import { Evento, CiudadEvento } from '../../domain/entities/Evento';
import { EstadoEvento } from '../../domain/enums/EstadoEvento';

export class PrismaEventoRepository implements IEventoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: any): Evento {
    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion ?? null,
      imagenUrl: row.imagenUrl ?? null,
      fechaInicioRegistro: row.fechaInicioRegistro,
      fechaCierreRegistro: row.fechaCierreRegistro,
      estado: row.estado as EstadoEvento,
      permitirAcompanante: row.permitirAcompanante,
      creadoPor: row.creadoPor,
      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
      ciudades: row.ciudades?.map(this.toCiudad),
    };
  }

  private toCiudad(c: any): CiudadEvento {
    return {
      id: c.id,
      eventoId: c.eventoId,
      nombreCiudad: c.nombreCiudad,
      iniciales: c.iniciales,
      fechaEvento: c.fechaEvento,
    };
  }

  async findById(id: string, incluirCiudades = true): Promise<Evento | null> {
    const row = await this.prisma.evento.findUnique({
      where: { id },
      include: { ciudades: incluirCiudades },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(incluirConcluidos = false): Promise<Evento[]> {
    const rows = await this.prisma.evento.findMany({
      where: incluirConcluidos ? undefined : { estado: { not: 'CONCLUIDO' } },
      include: { ciudades: true },
      orderBy: { creadoEn: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findByUsuario(usuarioId: string): Promise<Evento[]> {
    const asignaciones = await this.prisma.asignacionOperador.findMany({
      where: { usuarioId },
      include: { evento: { include: { ciudades: true } } },
    });
    return asignaciones.map((a) => this.toEntity(a.evento));
  }

  async create(data: CrearEventoDto): Promise<Evento> {
    const row = await this.prisma.evento.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        imagenUrl: data.imagenUrl,
        fechaInicioRegistro: data.fechaInicioRegistro,
        fechaCierreRegistro: data.fechaCierreRegistro,
        permitirAcompanante: data.permitirAcompanante,
        creadoPor: data.creadoPor,
        ciudades: {
          create: data.ciudades.map((c) => ({
            nombreCiudad: c.nombreCiudad,
            iniciales: c.iniciales.toUpperCase(),
            fechaEvento: c.fechaEvento,
          })),
        },
      },
      include: { ciudades: true },
    });
    return this.toEntity(row);
  }

  async update(id: string, data: ActualizarEventoDto): Promise<Evento> {
    // Si se actualizan ciudades, reemplazar completamente
    if (data.ciudades) {
      await this.prisma.ciudadEvento.deleteMany({ where: { eventoId: id } });
    }

    const row = await this.prisma.evento.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.imagenUrl !== undefined && { imagenUrl: data.imagenUrl }),
        ...(data.fechaInicioRegistro !== undefined && {
          fechaInicioRegistro: data.fechaInicioRegistro,
        }),
        ...(data.fechaCierreRegistro !== undefined && {
          fechaCierreRegistro: data.fechaCierreRegistro,
        }),
        ...(data.permitirAcompanante !== undefined && {
          permitirAcompanante: data.permitirAcompanante,
        }),
        ...(data.estado !== undefined && { estado: data.estado as any }),
        ...(data.ciudades && {
          ciudades: {
            create: data.ciudades.map((c) => ({
              nombreCiudad: c.nombreCiudad,
              iniciales: c.iniciales.toUpperCase(),
              fechaEvento: c.fechaEvento,
            })),
          },
        }),
      },
      include: { ciudades: true },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.evento.delete({ where: { id } });
  }

  async findCiudadById(ciudadId: string): Promise<CiudadEvento | null> {
    const row = await this.prisma.ciudadEvento.findUnique({ where: { id: ciudadId } });
    return row ? this.toCiudad(row) : null;
  }

  async findCiudadesByEvento(eventoId: string): Promise<CiudadEvento[]> {
    const rows = await this.prisma.ciudadEvento.findMany({ where: { eventoId } });
    return rows.map(this.toCiudad);
  }
}
