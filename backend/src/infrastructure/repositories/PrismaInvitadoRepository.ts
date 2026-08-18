import { PrismaClient, Prisma } from '@prisma/client';
import {
  IInvitadoRepository,
  CrearInvitadoDto,
  BuscarInvitadoFiltros,
  MetricasCiudad,
} from '../../domain/repositories/IInvitadoRepository';
import { Invitado } from '../../domain/entities/Invitado';
import { TipoRegistro } from '../../domain/enums/TipoRegistro';
import { EstadoInvitado } from '../../domain/enums/EstadoInvitado';

export class PrismaInvitadoRepository implements IInvitadoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: any): Invitado {
    return {
      id: row.id,
      eventoId: row.eventoId,
      ciudadEventoId: row.ciudadEventoId,
      nombreCompleto: row.nombreCompleto,
      celular: row.celular,
      codigoCliente: row.codigoCliente,
      codigoUnico: row.codigoUnico,
      tipoRegistro: row.tipoRegistro as TipoRegistro,
      estado: row.estado as EstadoInvitado,
      consentimientoDatos: row.consentimientoDatos,
      registradoPor: row.registradoPor ?? null,
      registradoEn: row.registradoEn,
      marcadoPresenteEn: row.marcadoPresenteEn ?? null,
      ciudadEvento: row.ciudadEvento
        ? {
            nombreCiudad: row.ciudadEvento.nombreCiudad,
            iniciales: row.ciudadEvento.iniciales,
            fechaEvento: row.ciudadEvento.fechaEvento,
          }
        : undefined,
    };
  }

  async findById(id: string): Promise<Invitado | null> {
    const row = await this.prisma.invitado.findUnique({
      where: { id },
      include: { ciudadEvento: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByEventoYCelular(eventoId: string, celular: string): Promise<Invitado | null> {
    const row = await this.prisma.invitado.findUnique({
      where: { eventoId_celular: { eventoId, celular } },
      include: { ciudadEvento: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByEventoYNombre(eventoId: string, nombreCompleto: string): Promise<Invitado | null> {
    const row = await this.prisma.invitado.findUnique({
      where: { eventoId_nombreCompleto: { eventoId, nombreCompleto } },
      include: { ciudadEvento: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async buscar(filtros: BuscarInvitadoFiltros): Promise<Invitado[]> {
    const where: Prisma.InvitadoWhereInput = { eventoId: filtros.eventoId };

    if (filtros.ciudadEventoId) where.ciudadEventoId = filtros.ciudadEventoId;
    if (filtros.tipoRegistro) where.tipoRegistro = filtros.tipoRegistro;
    if (filtros.estado) where.estado = filtros.estado;

    if (filtros.q) {
      const q = filtros.q.trim();
      where.OR = [
        { codigoUnico: { contains: q, mode: 'insensitive' } },
        { nombreCompleto: { contains: q, mode: 'insensitive' } },
        { celular: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.invitado.findMany({
      where,
      include: { ciudadEvento: true },
      orderBy: { registradoEn: 'asc' },
      take: 50,
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findAllByEvento(eventoId: string): Promise<Invitado[]> {
    const rows = await this.prisma.invitado.findMany({
      where: { eventoId },
      include: { ciudadEvento: true },
      orderBy: { registradoEn: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async create(data: CrearInvitadoDto): Promise<Invitado> {
    const row = await this.prisma.invitado.create({
      data: {
        eventoId: data.eventoId,
        ciudadEventoId: data.ciudadEventoId,
        nombreCompleto: data.nombreCompleto,
        celular: data.celular,
        codigoCliente: data.codigoCliente,
        codigoUnico: data.codigoUnico,
        tipoRegistro: data.tipoRegistro as any,
        estado: data.estado as any,
        consentimientoDatos: data.consentimientoDatos,
        registradoPor: data.registradoPor,
      },
      include: { ciudadEvento: true },
    });
    return this.toEntity(row);
  }

  async marcarPresente(id: string): Promise<Invitado> {
    const row = await this.prisma.invitado.update({
      where: { id },
      data: {
        estado: 'PRESENTE',
        marcadoPresenteEn: new Date(),
      },
      include: { ciudadEvento: true },
    });
    return this.toEntity(row);
  }

  async getMetricasPorCiudad(eventoId: string): Promise<MetricasCiudad[]> {
    const ciudades = await this.prisma.ciudadEvento.findMany({ where: { eventoId } });

    const metricas: MetricasCiudad[] = await Promise.all(
      ciudades.map(async (ciudad) => {
        const [preRegistros, presentes, registroEvento] = await Promise.all([
          this.prisma.invitado.count({
            where: { eventoId, ciudadEventoId: ciudad.id, tipoRegistro: 'PRE_REGISTRO' },
          }),
          this.prisma.invitado.count({
            where: { eventoId, ciudadEventoId: ciudad.id, estado: 'PRESENTE' },
          }),
          this.prisma.invitado.count({
            where: { eventoId, ciudadEventoId: ciudad.id, tipoRegistro: 'REGISTRO_EVENTO' },
          }),
        ]);

        return {
          ciudadEventoId: ciudad.id,
          nombreCiudad: ciudad.nombreCiudad,
          iniciales: ciudad.iniciales,
          preRegistros,
          presentes,
          registroEvento,
        };
      }),
    );

    return metricas;
  }

  /**
   * RF-13 / RN-02 / RN-03: Genera el siguiente correlativo de forma atómica
   * usando una transacción con SELECT FOR UPDATE para serializar el acceso
   * concurrente al contador por evento+ciudad+tipo.
   */
  async siguienteCorrelativo(
    eventoId: string,
    ciudadEventoId: string,
    tipo: TipoRegistro,
  ): Promise<number> {
    return await this.prisma.$transaction(async (tx) => {
      // Upsert del registro de correlativo en caso de primer uso
      await tx.$executeRaw`
        INSERT INTO codigos_correlativos (id, "eventoId", "ciudadEventoId", tipo, "ultimoCorrelativo")
        VALUES (gen_random_uuid(), ${eventoId}, ${ciudadEventoId}, ${tipo}::"TipoRegistro", 0)
        ON CONFLICT ("eventoId", "ciudadEventoId", tipo) DO NOTHING
      `;

      // SELECT FOR UPDATE — bloquea la fila para serializar escrituras concurrentes
      const result = await tx.$queryRaw<{ ultimoCorrelativo: number }[]>`
        SELECT "ultimoCorrelativo"
        FROM codigos_correlativos
        WHERE "eventoId" = ${eventoId}
          AND "ciudadEventoId" = ${ciudadEventoId}
          AND tipo = ${tipo}::"TipoRegistro"
        FOR UPDATE
      `;

      const actual = result[0].ultimoCorrelativo;
      const nuevo = actual + 1;

      await tx.$executeRaw`
        UPDATE codigos_correlativos
        SET "ultimoCorrelativo" = ${nuevo}
        WHERE "eventoId" = ${eventoId}
          AND "ciudadEventoId" = ${ciudadEventoId}
          AND tipo = ${tipo}::"TipoRegistro"
      `;

      return nuevo;
    });
  }
}
