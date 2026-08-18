import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IAsignacionRepository } from '../../domain/repositories/IAsignacionRepository';
import { NotFoundError } from '../../domain/errors/DomainError';

export class EliminarUsuarioUseCase {
  constructor(
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly asignacionRepo: IAsignacionRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existente = await this.usuarioRepo.findById(id);
    if (!existente) throw new NotFoundError('Usuario');
    // Las asignaciones se eliminan en cascada por la BD
    await this.usuarioRepo.delete(id);
  }
}
