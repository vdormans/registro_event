import bcrypt from 'bcryptjs';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ConflictError } from '../../domain/errors/DomainError';
import { Rol } from '../../domain/enums/Rol';
import { UsuarioPublico } from '../../domain/entities/Usuario';

export interface CrearUsuarioInput {
  nombre: string;
  correo: string;
  password: string;
  rol: Rol;
}

export class CrearUsuarioUseCase {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async execute(input: CrearUsuarioInput): Promise<UsuarioPublico> {
    const existente = await this.usuarioRepo.findByCorreo(input.correo);
    if (existente) {
      throw new ConflictError('Ya existe un usuario con ese correo electrónico');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const usuario = await this.usuarioRepo.create({
      nombre: input.nombre,
      correo: input.correo,
      passwordHash,
      rol: input.rol,
    });

    const { passwordHash: _, ...pub } = usuario;
    return pub;
  }
}
