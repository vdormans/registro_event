import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { IAsignacionRepository } from '../../domain/repositories/IAsignacionRepository';
import { NotFoundError, ConflictError } from '../../domain/errors/DomainError';
import { Rol } from '../../domain/enums/Rol';

export class AsignarEventoUseCase {
  constructor(
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly eventoRepo: IEventoRepository,
    private readonly asignacionRepo: IAsignacionRepository,
  ) {}

  async asignar(usuarioId: string, eventoId: string): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario');
    if (usuario.rol === Rol.ADMIN) return; // Los admins tienen acceso a todo

    const evento = await this.eventoRepo.findById(eventoId, false);
    if (!evento) throw new NotFoundError('Evento');

    const existente = await this.asignacionRepo.findByUsuarioYEvento(usuarioId, eventoId);
    if (existente) throw new ConflictError('El usuario ya tiene este evento asignado');

    await this.asignacionRepo.crear(usuarioId, eventoId);
  }

  async quitar(usuarioId: string, eventoId: string): Promise<void> {
    const asignacion = await this.asignacionRepo.findByUsuarioYEvento(usuarioId, eventoId);
    if (!asignacion) throw new NotFoundError('Asignación');
    await this.asignacionRepo.eliminar(usuarioId, eventoId);
  }
}
