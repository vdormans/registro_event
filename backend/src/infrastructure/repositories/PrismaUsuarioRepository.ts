import { PrismaClient } from '@prisma/client';
import { IUsuarioRepository, CrearUsuarioDto, ActualizarUsuarioDto } from '../../domain/repositories/IUsuarioRepository';
import { Usuario } from '../../domain/entities/Usuario';
import { Rol } from '../../domain/enums/Rol';

export class PrismaUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapRol(rol: string): Rol {
    return rol as Rol;
  }

  private toEntity(row: any): Usuario {
    return {
      id: row.id,
      nombre: row.nombre,
      correo: row.correo,
      passwordHash: row.passwordHash,
      rol: this.mapRol(row.rol),
      activo: row.activo,
      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
    };
  }

  async findById(id: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByCorreo(correo: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({ where: { correo } });
    return row ? this.toEntity(row) : null;
  }

  async findAll(): Promise<Usuario[]> {
    const rows = await this.prisma.usuario.findMany({ orderBy: { creadoEn: 'asc' } });
    return rows.map((r) => this.toEntity(r));
  }

  async create(data: CrearUsuarioDto): Promise<Usuario> {
    const row = await this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        correo: data.correo,
        passwordHash: data.passwordHash,
        rol: data.rol as any,
      },
    });
    return this.toEntity(row);
  }

  async update(id: string, data: ActualizarUsuarioDto): Promise<Usuario> {
    const row = await this.prisma.usuario.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.correo !== undefined && { correo: data.correo }),
        ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
        ...(data.rol !== undefined && { rol: data.rol as any }),
        ...(data.activo !== undefined && { activo: data.activo }),
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }
}
