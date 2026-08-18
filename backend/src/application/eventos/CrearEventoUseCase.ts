import { IEventoRepository, CrearCiudadDto } from '../../domain/repositories/IEventoRepository';
import { Evento } from '../../domain/entities/Evento';
import { ValidationError } from '../../domain/errors/DomainError';

export interface CrearEventoInput {
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  fechaInicioRegistro: Date;
  fechaCierreRegistro: Date;
  permitirAcompanante: boolean;
  creadoPor: string;
  ciudades: CrearCiudadDto[];
}

export class CrearEventoUseCase {
  constructor(private readonly eventoRepo: IEventoRepository) {}

  async execute(input: CrearEventoInput): Promise<Evento> {
    if (!input.ciudades || input.ciudades.length === 0) {
      throw new ValidationError('El evento debe tener al menos una ciudad');
    }
    if (input.fechaCierreRegistro <= input.fechaInicioRegistro) {
      throw new ValidationError(
        'La fecha de cierre de registro debe ser posterior al inicio',
      );
    }
    // Validar iniciales únicas por evento
    const iniciales = input.ciudades.map((c) => c.iniciales.toUpperCase());
    if (new Set(iniciales).size !== iniciales.length) {
      throw new ValidationError('Las iniciales de ciudad deben ser únicas dentro del evento');
    }

    return this.eventoRepo.create(input);
  }
}
