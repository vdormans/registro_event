import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { IInvitadoRepository, MetricasCiudad } from '../../domain/repositories/IInvitadoRepository';
import { NotFoundError } from '../../domain/errors/DomainError';
import { calcularEstadoEvento, diasRestantesRegistro } from '../../domain/services/EventoEstadoService';

export interface MetricasEvento {
  eventoId: string;
  totalPreRegistros: number;
  totalPresentes: number;
  totalRegistroEvento: number;
  diasRestantesRegistro: number | null;
  estado: string;
  porCiudad: MetricasCiudad[];
}

export class ObtenerMetricasUseCase {
  constructor(
    private readonly eventoRepo: IEventoRepository,
    private readonly invitadoRepo: IInvitadoRepository,
  ) {}

  async execute(eventoId: string): Promise<MetricasEvento> {
    const evento = await this.eventoRepo.findById(eventoId, true);
    if (!evento) throw new NotFoundError('Evento');

    const porCiudad = await this.invitadoRepo.getMetricasPorCiudad(eventoId);

    const totalPreRegistros = porCiudad.reduce((s, c) => s + c.preRegistros, 0);
    const totalPresentes = porCiudad.reduce((s, c) => s + c.presentes, 0);
    const totalRegistroEvento = porCiudad.reduce((s, c) => s + c.registroEvento, 0);

    const fechasEvento = (evento.ciudades ?? []).map((c) => c.fechaEvento);
    const estadoActual = calcularEstadoEvento(
      evento.fechaInicioRegistro,
      evento.fechaCierreRegistro,
      fechasEvento,
      evento.estado,
    );

    return {
      eventoId,
      totalPreRegistros,
      totalPresentes,
      totalRegistroEvento,
      diasRestantesRegistro: diasRestantesRegistro(evento.fechaCierreRegistro),
      estado: estadoActual,
      porCiudad,
    };
  }
}
