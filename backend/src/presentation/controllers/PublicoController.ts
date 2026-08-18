import { Request, Response } from 'express';
import { eventoRepository } from '../../infrastructure/container';
import { NotFoundError } from '../../domain/errors/DomainError';
import { calcularEstadoEvento, estaRegistroActivo } from '../../domain/services/EventoEstadoService';
import { EstadoEvento } from '../../domain/enums/EstadoEvento';

export class PublicoController {
  /** RF-06: Devuelve info pública del evento (sin datos personales) */
  static async obtenerEvento(req: Request, res: Response): Promise<void> {
    const evento = await eventoRepository.findById(req.params.eventoId, true);
    if (!evento) throw new NotFoundError('Evento');

    const fechasEvento = (evento.ciudades ?? []).map((c) => c.fechaEvento);
    const estado = calcularEstadoEvento(
      evento.fechaInicioRegistro,
      evento.fechaCierreRegistro,
      fechasEvento,
      evento.estado,
    );

    const registroActivo = estaRegistroActivo(
      evento.fechaInicioRegistro,
      evento.fechaCierreRegistro,
      estado,
    );

    res.json({
      id: evento.id,
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      imagenUrl: evento.imagenUrl,
      fechaInicioRegistro: evento.fechaInicioRegistro,
      fechaCierreRegistro: evento.fechaCierreRegistro,
      estado,
      registroActivo,
      permitirAcompanante: evento.permitirAcompanante,
      ciudades: (evento.ciudades ?? []).map((c) => ({
        id: c.id,
        nombreCiudad: c.nombreCiudad,
        iniciales: c.iniciales,
        fechaEvento: c.fechaEvento,
      })),
    });
  }
}
