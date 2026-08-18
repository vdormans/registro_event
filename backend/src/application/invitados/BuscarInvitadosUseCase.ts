import { IInvitadoRepository, BuscarInvitadoFiltros } from '../../domain/repositories/IInvitadoRepository';
import { IAsignacionRepository } from '../../domain/repositories/IAsignacionRepository';
import { Invitado } from '../../domain/entities/Invitado';
import { Rol } from '../../domain/enums/Rol';
import { ForbiddenError } from '../../domain/errors/DomainError';

export class BuscarInvitadosUseCase {
  constructor(
    private readonly invitadoRepo: IInvitadoRepository,
    private readonly asignacionRepo: IAsignacionRepository,
  ) {}

  async execute(
    filtros: BuscarInvitadoFiltros,
    usuarioId: string,
    usuarioRol: Rol,
  ): Promise<Invitado[]> {
    if (usuarioRol !== Rol.ADMIN) {
      const asignacion = await this.asignacionRepo.findByUsuarioYEvento(
        usuarioId,
        filtros.eventoId,
      );
      if (!asignacion) throw new ForbiddenError('No tienes acceso a este evento');
    }

    if (filtros.q) {
      return this.invitadoRepo.buscar(filtros);
    }
    return this.invitadoRepo.findAllByEvento(filtros.eventoId);
  }
}
