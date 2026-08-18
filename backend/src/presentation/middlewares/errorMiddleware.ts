import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../domain/errors/DomainError';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Errores de Prisma conocidos
  if ((err as any).code === 'P2002') {
    res.status(409).json({ error: 'Ya existe un registro con esos datos únicos' });
    return;
  }
  if ((err as any).code === 'P2025') {
    res.status(404).json({ error: 'Registro no encontrado' });
    return;
  }

  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
