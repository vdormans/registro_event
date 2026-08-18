import { PrismaClient } from '@prisma/client';
import { IAsignacionRepository } from '../../domain/repositories/IAsignacionRepository';
import { AsignacionOperador } from '../../domain/entities/AsignacionOperador';

export class PrismaAsignacionRepository implements IAsignacionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: any): AsignacionOperador {
    return {
      id: row.id,
      usuarioId: row.usuarioId,
      eventoId: row.eventoId,
      asignadoEn: row.asignadoEn,
    };
  }

  async findByUsuarioYEvento(
    usuarioId: string,
    eventoId: string,
  ): Promise<AsignacionOperador | null> {
    const row = await this.prisma.asignacionOperador.findUnique({
      where: { usuarioId_eventoId: { usuarioId, eventoId } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByUsuario(usuarioId: string): Promise<AsignacionOperador[]> {
    const rows = await this.prisma.asignacionOperador.findMany({ where: { usuarioId } });
    return rows.map((r) => this.toEntity(r));
  }

  async findByEvento(eventoId: string): Promise<AsignacionOperador[]> {
    const rows = await this.prisma.asignacionOperador.findMany({ where: { eventoId } });
    return rows.map((r) => this.toEntity(r));
  }

  async crear(usuarioId: string, eventoId: string): Promise<AsignacionOperador> {
    const row = await this.prisma.asignacionOperador.create({
      data: { usuarioId, eventoId },
    });
    return this.toEntity(row);
  }

  async eliminar(usuarioId: string, eventoId: string): Promise<void> {
    await this.prisma.asignacionOperador.delete({
      where: { usuarioId_eventoId: { usuarioId, eventoId } },
    });
  }
}
