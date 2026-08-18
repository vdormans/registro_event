import { IInvitadoRepository } from '../../domain/repositories/IInvitadoRepository';
import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { Invitado } from '../../domain/entities/Invitado';
import { TipoRegistro } from '../../domain/enums/TipoRegistro';
import { EstadoInvitado } from '../../domain/enums/EstadoInvitado';
import { EstadoEvento } from '../../domain/enums/EstadoEvento';
import { generarCodigo } from '../../domain/services/CodigoService';
import { estaRegistroActivo } from '../../domain/services/EventoEstadoService';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../domain/errors/DomainError';

export interface RegistrarInvitadoInput {
  eventoId: string;
  ciudadEventoId: string;
  nombreCompleto: string;
  celular: string;
  codigoCliente: string;
  consentimientoDatos: boolean;
  registradoPor?: string | null;
  // Si viene de operador el día del evento, tipo = REGISTRO_EVENTO
  tipoRegistro?: TipoRegistro;
}

export class RegistrarInvitadoUseCase {
  constructor(
    private readonly invitadoRepo: IInvitadoRepository,
    private readonly eventoRepo: IEventoRepository,
  ) {}

  async execute(input: RegistrarInvitadoInput): Promise<Invitado> {
    // RN-07: consentimiento obligatorio
    if (!input.consentimientoDatos) {
      throw new ValidationError('Debe aceptar el uso de datos para continuar');
    }

    const evento = await this.eventoRepo.findById(input.eventoId, true);
    if (!evento) throw new NotFoundError('Evento');

    // RN-06: evento concluido no acepta registros
    if (evento.estado === EstadoEvento.CONCLUIDO) {
      throw new ValidationError('Este evento ya ha concluido y no acepta nuevos registros');
    }

    const tipo = input.tipoRegistro ?? TipoRegistro.PRE_REGISTRO;

    // RF-08: validar período de registro solo para pre-registro público
    if (tipo === TipoRegistro.PRE_REGISTRO) {
      const activo = estaRegistroActivo(
        evento.fechaInicioRegistro,
        evento.fechaCierreRegistro,
        evento.estado,
      );
      if (!activo) {
        throw new ValidationError('El período de registro para este evento no está activo');
      }
    }

    // Verificar que la ciudad pertenece al evento
    const ciudad = (evento.ciudades ?? []).find((c) => c.id === input.ciudadEventoId);
    if (!ciudad) throw new NotFoundError('Ciudad del evento');

    // RN-01: nombre y celular únicos por evento
    const [dupCelular, dupNombre] = await Promise.all([
      this.invitadoRepo.findByEventoYCelular(input.eventoId, input.celular),
      this.invitadoRepo.findByEventoYNombre(input.eventoId, input.nombreCompleto),
    ]);
    if (dupCelular) {
      throw new ConflictError('Este número de celular ya está registrado en el evento');
    }
    if (dupNombre) {
      throw new ConflictError('Este nombre ya está registrado en el evento');
    }

    // RF-13 / RN-02 / RN-03: correlativo atómico
    const correlativo = await this.invitadoRepo.siguienteCorrelativo(
      input.eventoId,
      input.ciudadEventoId,
      tipo,
    );

    const codigoUnico = generarCodigo(ciudad.iniciales, correlativo, tipo);

    // RF-18: registros del día del evento nacen con estado PRESENTE directamente
    const estado =
      tipo === TipoRegistro.REGISTRO_EVENTO ? EstadoInvitado.PRESENTE : EstadoInvitado.REGISTRADO;

    return this.invitadoRepo.create({
      eventoId: input.eventoId,
      ciudadEventoId: input.ciudadEventoId,
      nombreCompleto: input.nombreCompleto.trim(),
      celular: input.celular.trim(),
      codigoCliente: input.codigoCliente.trim(),
      codigoUnico,
      tipoRegistro: tipo,
      estado,
      consentimientoDatos: input.consentimientoDatos,
      registradoPor: input.registradoPor ?? null,
    });
  }
}
