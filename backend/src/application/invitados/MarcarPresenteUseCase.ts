import { IInvitadoRepository } from '../../domain/repositories/IInvitadoRepository';
import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { IAsignacionRepository } from '../../domain/repositories/IAsignacionRepository';
import { Invitado } from '../../domain/entities/Invitado';
import { EstadoInvitado } from '../../domain/enums/EstadoInvitado';
import { EstadoEvento } from '../../domain/enums/EstadoEvento';
import { Rol } from '../../domain/enums/Rol';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../../domain/errors/DomainError';

export class MarcarPresenteUseCase {
  constructor(
    private readonly invitadoRepo: IInvitadoRepository,
    private readonly eventoRepo: IEventoRepository,
    private readonly asignacionRepo: IAsignacionRepository,
  ) {}

  async execute(invitadoId: string, operadorId: string, operadorRol: Rol): Promise<Invitado> {
    const invitado = await this.invitadoRepo.findById(invitadoId);
    if (!invitado) throw new NotFoundError('Invitado');

    // Verificar acceso al evento
    if (operadorRol !== Rol.ADMIN) {
      const asignacion = await this.asignacionRepo.findByUsuarioYEvento(
        operadorId,
        invitado.eventoId,
      );
      if (!asignacion) {
        throw new ForbiddenError('No tienes acceso a este evento');
      }
    }

    const evento = await this.eventoRepo.findById(invitado.eventoId, false);
    if (!evento) throw new NotFoundError('Evento');

    // RN-06: evento concluido no acepta cambios de estado
    if (evento.estado === EstadoEvento.CONCLUIDO) {
      throw new ValidationError('Este evento ya ha concluido');
    }

    // RN-04: cambio de estado unidireccional
    if (invitado.estado === EstadoInvitado.PRESENTE) {
      throw new ValidationError('Este invitado ya está marcado como presente');
    }

    return this.invitadoRepo.marcarPresente(invitadoId);
  }
}
