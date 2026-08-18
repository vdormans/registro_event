import { IEventoRepository, CrearCiudadDto } from '../../domain/repositories/IEventoRepository';
import { Evento } from '../../domain/entities/Evento';
import { NotFoundError, ValidationError } from '../../domain/errors/DomainError';
import { EstadoEvento } from '../../domain/enums/EstadoEvento';

export interface ActualizarEventoInput {
  id: string;
  nombre?: string;
  descripcion?: string;
  imagenUrl?: string;
  fechaInicioRegistro?: Date;
  fechaCierreRegistro?: Date;
  permitirAcompanante?: boolean;
  ciudades?: CrearCiudadDto[];
}

export class ActualizarEventoUseCase {
  constructor(private readonly eventoRepo: IEventoRepository) {}

  async execute(input: ActualizarEventoInput): Promise<Evento> {
    const evento = await this.eventoRepo.findById(input.id, false);
    if (!evento) throw new NotFoundError('Evento');
    if (evento.estado === EstadoEvento.CONCLUIDO) {
      throw new ValidationError('No se puede editar un evento concluido');
    }

    return this.eventoRepo.update(input.id, {
      nombre: input.nombre,
      descripcion: input.descripcion,
      imagenUrl: input.imagenUrl,
      fechaInicioRegistro: input.fechaInicioRegistro,
      fechaCierreRegistro: input.fechaCierreRegistro,
      permitirAcompanante: input.permitirAcompanante,
      ciudades: input.ciudades,
    });
  }
}
