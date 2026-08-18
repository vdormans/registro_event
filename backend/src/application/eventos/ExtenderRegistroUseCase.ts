import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { Evento } from '../../domain/entities/Evento';
import { NotFoundError, ValidationError } from '../../domain/errors/DomainError';
import { EstadoEvento } from '../../domain/enums/EstadoEvento';

export class ExtenderRegistroUseCase {
  constructor(private readonly eventoRepo: IEventoRepository) {}

  // RN-05: La extensión NO toca registros existentes, solo actualiza fecha de cierre
  async execute(id: string, nuevaFechaCierre: Date): Promise<Evento> {
    const evento = await this.eventoRepo.findById(id, false);
    if (!evento) throw new NotFoundError('Evento');

    if (evento.estado === EstadoEvento.CONCLUIDO) {
      throw new ValidationError('No se puede extender el registro de un evento concluido');
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const nueva = new Date(nuevaFechaCierre);
    nueva.setHours(0, 0, 0, 0);

    if (nueva <= hoy) {
      throw new ValidationError('La nueva fecha de cierre debe ser posterior a hoy');
    }

    // Solo actualiza fechaCierreRegistro — no toca ningún invitado (RN-05)
    return this.eventoRepo.update(id, { fechaCierreRegistro: nuevaFechaCierre });
  }
}
