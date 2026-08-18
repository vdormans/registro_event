import { Request, Response } from 'express';
import { z } from 'zod';
import { CrearEventoUseCase } from '../../application/eventos/CrearEventoUseCase';
import { ActualizarEventoUseCase } from '../../application/eventos/ActualizarEventoUseCase';
import { ConcluirEventoUseCase } from '../../application/eventos/ConcluirEventoUseCase';
import { ExtenderRegistroUseCase } from '../../application/eventos/ExtenderRegistroUseCase';
import { ObtenerMetricasUseCase } from '../../application/eventos/ObtenerMetricasUseCase';
import { ExportarInvitadosUseCase } from '../../application/exportacion/ExportarInvitadosUseCase';
import {
  eventoRepository,
  invitadoRepository,
  asignacionRepository,
} from '../../infrastructure/container';
import { Rol } from '../../domain/enums/Rol';
import { EstadoEvento } from '../../domain/enums/EstadoEvento';
import { calcularEstadoEvento, diasRestantesRegistro } from '../../domain/services/EventoEstadoService';
import { ValidationError, NotFoundError, ForbiddenError } from '../../domain/errors/DomainError';

const ciudadSchema = z.object({
  nombreCiudad: z.string().min(1),
  iniciales: z.string().min(1).max(5),
  fechaEvento: z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida'),
});

const crearEventoSchema = z.object({
  nombre: z.string().min(1, 'El nombre del evento es obligatorio'),
  descripcion: z.string().optional(),
  fechaInicioRegistro: z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida'),
  fechaCierreRegistro: z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida'),
  permitirAcompanante: z.boolean().default(false),
  ciudades: z.array(ciudadSchema).min(1, 'Debe incluir al menos una ciudad'),
});

const actualizarEventoSchema = crearEventoSchema.partial();

export class EventoController {
  static async listar(req: Request, res: Response): Promise<void> {
    const incluirConcluidos = req.query.concluidos === 'true';
    let eventos;

    if (req.user!.rol === Rol.ADMIN) {
      eventos = await eventoRepository.findAll(incluirConcluidos);
    } else {
      eventos = await eventoRepository.findByUsuario(req.user!.sub);
    }

    // Enriquecer estado calculado
    const result = eventos.map((e) => {
      const fechasEvento = (e.ciudades ?? []).map((c) => c.fechaEvento);
      const estado = calcularEstadoEvento(
        e.fechaInicioRegistro,
        e.fechaCierreRegistro,
        fechasEvento,
        e.estado,
      );
      return { ...e, estado, diasRestantesRegistro: diasRestantesRegistro(e.fechaCierreRegistro) };
    });

    res.json(result);
  }

  static async obtener(req: Request, res: Response): Promise<void> {
    const evento = await eventoRepository.findById(req.params.id, true);
    if (!evento) throw new NotFoundError('Evento');

    // Verificar acceso para no-admins
    if (req.user!.rol !== Rol.ADMIN) {
      const asig = await asignacionRepository.findByUsuarioYEvento(req.user!.sub, req.params.id);
      if (!asig) throw new ForbiddenError('No tienes acceso a este evento');
    }

    const fechasEvento = (evento.ciudades ?? []).map((c) => c.fechaEvento);
    const estado = calcularEstadoEvento(
      evento.fechaInicioRegistro,
      evento.fechaCierreRegistro,
      fechasEvento,
      evento.estado,
    );

    res.json({ ...evento, estado, diasRestantesRegistro: diasRestantesRegistro(evento.fechaCierreRegistro) });
  }

  static async crear(req: Request, res: Response): Promise<void> {
    const parsed = crearEventoSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }
    const uc = new CrearEventoUseCase(eventoRepository);
    const evento = await uc.execute({
      ...parsed.data,
      fechaInicioRegistro: new Date(parsed.data.fechaInicioRegistro),
      fechaCierreRegistro: new Date(parsed.data.fechaCierreRegistro),
      ciudades: parsed.data.ciudades.map((c) => ({
        ...c,
        fechaEvento: new Date(c.fechaEvento),
      })),
      imagenUrl: (req as any).imagenUrl,
      creadoPor: req.user!.sub,
    });
    res.status(201).json(evento);
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    const parsed = actualizarEventoSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }
    const uc = new ActualizarEventoUseCase(eventoRepository);
    const evento = await uc.execute({
      id: req.params.id,
      ...parsed.data,
      fechaInicioRegistro: parsed.data.fechaInicioRegistro
        ? new Date(parsed.data.fechaInicioRegistro)
        : undefined,
      fechaCierreRegistro: parsed.data.fechaCierreRegistro
        ? new Date(parsed.data.fechaCierreRegistro)
        : undefined,
      ciudades: parsed.data.ciudades?.map((c) => ({ ...c, fechaEvento: new Date(c.fechaEvento) })),
      imagenUrl: (req as any).imagenUrl,
    });
    res.json(evento);
  }

  static async concluir(req: Request, res: Response): Promise<void> {
    const uc = new ConcluirEventoUseCase(eventoRepository);
    const evento = await uc.execute(req.params.id);
    res.json(evento);
  }

  static async extenderRegistro(req: Request, res: Response): Promise<void> {
    const { nuevaFechaCierre } = req.body;
    if (!nuevaFechaCierre) throw new ValidationError('nuevaFechaCierre es obligatorio');
    const uc = new ExtenderRegistroUseCase(eventoRepository);
    const evento = await uc.execute(req.params.id, new Date(nuevaFechaCierre));
    res.json(evento);
  }

  static async metricas(req: Request, res: Response): Promise<void> {
    if (req.user!.rol !== Rol.ADMIN) {
      const asig = await asignacionRepository.findByUsuarioYEvento(req.user!.sub, req.params.id);
      if (!asig) throw new ForbiddenError('No tienes acceso a este evento');
    }
    const uc = new ObtenerMetricasUseCase(eventoRepository, invitadoRepository);
    const metricas = await uc.execute(req.params.id);
    res.json(metricas);
  }

  static async exportar(req: Request, res: Response): Promise<void> {
    const formato = (req.query.formato as string) ?? 'xlsx';
    if (formato !== 'csv' && formato !== 'xlsx') {
      throw new ValidationError('Formato inválido. Use csv o xlsx');
    }
    const uc = new ExportarInvitadosUseCase(invitadoRepository, eventoRepository);
    const result = await uc.execute(req.params.id, formato);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    const evento = await eventoRepository.findById(req.params.id, false);
    if (!evento) throw new NotFoundError('Evento');
    await eventoRepository.delete(req.params.id);
    res.status(204).send();
  }
}
