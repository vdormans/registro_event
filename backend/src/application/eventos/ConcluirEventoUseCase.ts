import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { Evento } from '../../domain/entities/Evento';
import { NotFoundError, ValidationError } from '../../domain/errors/DomainError';
import { EstadoEvento } from '../../domain/enums/EstadoEvento';

export class ConcluirEventoUseCase {
  constructor(private readonly eventoRepo: IEventoRepository) {}

  async execute(id: string): Promise<Evento> {
    const evento = await this.eventoRepo.findById(id, false);
    if (!evento) throw new NotFoundError('Evento');
    if (evento.estado === EstadoEvento.CONCLUIDO) {
      throw new ValidationError('El evento ya está marcado como concluido');
    }
    return this.eventoRepo.update(id, { estado: EstadoEvento.CONCLUIDO });
  }
}
