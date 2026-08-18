import { Request, Response } from 'express';
import { z } from 'zod';
import { RegistrarInvitadoUseCase } from '../../application/invitados/RegistrarInvitadoUseCase';
import { MarcarPresenteUseCase } from '../../application/invitados/MarcarPresenteUseCase';
import { BuscarInvitadosUseCase } from '../../application/invitados/BuscarInvitadosUseCase';
import { ObtenerMetricasUseCase } from '../../application/eventos/ObtenerMetricasUseCase';
import {
  eventoRepository,
  invitadoRepository,
  asignacionRepository,
} from '../../infrastructure/container';
import { TipoRegistro } from '../../domain/enums/TipoRegistro';
import { ValidationError, ForbiddenError, NotFoundError } from '../../domain/errors/DomainError';
import { Rol } from '../../domain/enums/Rol';
import { emitToEvent } from '../../infrastructure/websocket/SocketGateway';

const registrarSchema = z.object({
  ciudadEventoId: z.string().uuid('Ciudad inválida'),
  nombreCompleto: z.string().min(1, 'El nombre completo es obligatorio'),
  celular: z.string().min(1, 'El número de celular es obligatorio'),
  codigoCliente: z.string().min(1, 'El código de cliente es obligatorio'),
  consentimientoDatos: z.literal(true, {
    errorMap: () => ({ message: 'Debe aceptar el uso de datos para continuar' }),
  }),
});

export class InvitadoController {
  /** RF-06, RF-07, RF-08: Registro público sin autenticación */
  static async registrarPublico(req: Request, res: Response): Promise<void> {
    const parsed = registrarSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }
    const uc = new RegistrarInvitadoUseCase(invitadoRepository, eventoRepository);
    const invitado = await uc.execute({
      eventoId: req.params.eventoId,
      tipoRegistro: TipoRegistro.PRE_REGISTRO,
      registradoPor: null,
      ...parsed.data,
    });
    res.status(201).json({
      codigoUnico: invitado.codigoUnico,
      nombreCompleto: invitado.nombreCompleto,
      ciudad: invitado.ciudadEvento?.nombreCiudad,
      fechaEvento: invitado.ciudadEvento?.fechaEvento,
      tipoRegistro: invitado.tipoRegistro,
    });
  }

  /** RF-18: Registro de nuevo invitado el día del evento por operador */
  static async registrarEnEvento(req: Request, res: Response): Promise<void> {
    const parsed = registrarSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    // Verificar acceso
    if (req.user!.rol !== Rol.ADMIN) {
      const asig = await asignacionRepository.findByUsuarioYEvento(
        req.user!.sub,
        req.params.eventoId,
      );
      if (!asig) throw new ForbiddenError('No tienes acceso a este evento');
    }

    const uc = new RegistrarInvitadoUseCase(invitadoRepository, eventoRepository);
    const invitado = await uc.execute({
      eventoId: req.params.eventoId,
      tipoRegistro: TipoRegistro.REGISTRO_EVENTO,
      registradoPor: req.user!.sub,
      ...parsed.data,
    });

    // RF-19 / RNF-16: emitir a todos los conectados al evento
    emitToEvent(req.params.eventoId, 'nuevo_invitado', {
      invitadoId: invitado.id,
      codigoUnico: invitado.codigoUnico,
      nombreCompleto: invitado.nombreCompleto,
      ciudad: invitado.ciudadEvento?.nombreCiudad ?? '',
      tipoRegistro: invitado.tipoRegistro,
      registradoEn: invitado.registradoEn.toISOString(),
    });

    // Emitir métricas actualizadas
    const metricasUC = new ObtenerMetricasUseCase(eventoRepository, invitadoRepository);
    const metricas = await metricasUC.execute(req.params.eventoId);
    emitToEvent(req.params.eventoId, 'metricas_actualizadas', { porCiudad: metricas.porCiudad });

    res.status(201).json(invitado);
  }

  /** RF-16: Búsqueda y listado de invitados */
  static async buscar(req: Request, res: Response): Promise<void> {
    const uc = new BuscarInvitadosUseCase(invitadoRepository, asignacionRepository);
    const invitados = await uc.execute(
      { eventoId: req.params.eventoId, q: req.query.q as string | undefined },
      req.user!.sub,
      req.user!.rol,
    );
    res.json(invitados);
  }

  /** RF-17: Marcar invitado como presente */
  static async marcarPresente(req: Request, res: Response): Promise<void> {
    const uc = new MarcarPresenteUseCase(invitadoRepository, eventoRepository, asignacionRepository);
    const invitado = await uc.execute(req.params.invitadoId, req.user!.sub, req.user!.rol);

    // RF-19 / RNF-16: emitir a todos los conectados
    emitToEvent(req.params.eventoId, 'invitado_presente', {
      invitadoId: invitado.id,
      codigoUnico: invitado.codigoUnico,
      nombreCompleto: invitado.nombreCompleto,
      ciudad: invitado.ciudadEvento?.nombreCiudad ?? '',
      marcadoEn: (invitado.marcadoPresenteEn ?? new Date()).toISOString(),
    });

    // Emitir métricas actualizadas
    const metricasUC = new ObtenerMetricasUseCase(eventoRepository, invitadoRepository);
    const metricas = await metricasUC.execute(req.params.eventoId);
    emitToEvent(req.params.eventoId, 'metricas_actualizadas', { porCiudad: metricas.porCiudad });

    res.json(invitado);
  }

  /** Detalle individual de invitado */
  static async obtener(req: Request, res: Response): Promise<void> {
    if (req.user!.rol !== Rol.ADMIN) {
      const asig = await asignacionRepository.findByUsuarioYEvento(
        req.user!.sub,
        req.params.eventoId,
      );
      if (!asig) throw new ForbiddenError('No tienes acceso a este evento');
    }
    const invitado = await invitadoRepository.findById(req.params.invitadoId);
    if (!invitado) throw new NotFoundError('Invitado');
    if (invitado.eventoId !== req.params.eventoId) throw new NotFoundError('Invitado');
    res.json(invitado);
  }
}
