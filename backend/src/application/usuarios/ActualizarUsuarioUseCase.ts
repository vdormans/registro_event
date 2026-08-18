import bcrypt from 'bcryptjs';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { NotFoundError, ConflictError } from '../../domain/errors/DomainError';
import { Rol } from '../../domain/enums/Rol';
import { UsuarioPublico } from '../../domain/entities/Usuario';

export interface ActualizarUsuarioInput {
  id: string;
  nombre?: string;
  correo?: string;
  password?: string;
  rol?: Rol;
  activo?: boolean;
}

export class ActualizarUsuarioUseCase {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async execute(input: ActualizarUsuarioInput): Promise<UsuarioPublico> {
    const existente = await this.usuarioRepo.findById(input.id);
    if (!existente) throw new NotFoundError('Usuario');

    if (input.correo && input.correo !== existente.correo) {
      const otro = await this.usuarioRepo.findByCorreo(input.correo);
      if (otro) throw new ConflictError('Ya existe un usuario con ese correo electrónico');
    }

    let passwordHash: string | undefined;
    if (input.password) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
      passwordHash = await bcrypt.hash(input.password, saltRounds);
    }

    const actualizado = await this.usuarioRepo.update(input.id, {
      nombre: input.nombre,
      correo: input.correo,
      passwordHash,
      rol: input.rol,
      activo: input.activo,
    });

    const { passwordHash: _, ...pub } = actualizado;
    return pub;
  }
}
