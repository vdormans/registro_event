import { Request, Response } from 'express';
import { z } from 'zod';
import { CrearUsuarioUseCase } from '../../application/usuarios/CrearUsuarioUseCase';
import { ActualizarUsuarioUseCase } from '../../application/usuarios/ActualizarUsuarioUseCase';
import { EliminarUsuarioUseCase } from '../../application/usuarios/EliminarUsuarioUseCase';
import { AsignarEventoUseCase } from '../../application/usuarios/AsignarEventoUseCase';
import {
  usuarioRepository,
  eventoRepository,
  asignacionRepository,
} from '../../infrastructure/container';
import { Rol } from '../../domain/enums/Rol';
import { ValidationError, NotFoundError } from '../../domain/errors/DomainError';

const crearSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  correo: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  rol: z.nativeEnum(Rol),
});

const actualizarSchema = z.object({
  nombre: z.string().min(1).optional(),
  correo: z.string().email().optional(),
  password: z.string().min(8).optional(),
  rol: z.nativeEnum(Rol).optional(),
  activo: z.boolean().optional(),
});

export class UsuarioController {
  static async listar(req: Request, res: Response): Promise<void> {
    const usuarios = await usuarioRepository.findAll();
    res.json(usuarios.map(({ passwordHash: _, ...u }) => u));
  }

  static async obtener(req: Request, res: Response): Promise<void> {
    const usuario = await usuarioRepository.findById(req.params.id);
    if (!usuario) throw new NotFoundError('Usuario');
    const { passwordHash: _, ...pub } = usuario;
    res.json(pub);
  }

  static async crear(req: Request, res: Response): Promise<void> {
    const parsed = crearSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }
    const uc = new CrearUsuarioUseCase(usuarioRepository);
    const usuario = await uc.execute(parsed.data);
    res.status(201).json(usuario);
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    const parsed = actualizarSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }
    const uc = new ActualizarUsuarioUseCase(usuarioRepository);
    const usuario = await uc.execute({ id: req.params.id, ...parsed.data });
    res.json(usuario);
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    const uc = new EliminarUsuarioUseCase(usuarioRepository, asignacionRepository);
    await uc.execute(req.params.id);
    res.status(204).send();
  }

  static async asignarEvento(req: Request, res: Response): Promise<void> {
    const { eventoId } = req.body;
    if (!eventoId) throw new ValidationError('eventoId es obligatorio');
    const uc = new AsignarEventoUseCase(usuarioRepository, eventoRepository, asignacionRepository);
    await uc.asignar(req.params.id, eventoId);
    res.status(201).json({ message: 'Evento asignado correctamente' });
  }

  static async quitarEvento(req: Request, res: Response): Promise<void> {
    const uc = new AsignarEventoUseCase(usuarioRepository, eventoRepository, asignacionRepository);
    await uc.quitar(req.params.id, req.params.eventoId);
    res.status(204).send();
  }

  static async listarAsignaciones(req: Request, res: Response): Promise<void> {
    const asignaciones = await asignacionRepository.findByUsuario(req.params.id);
    res.json(asignaciones);
  }
}
