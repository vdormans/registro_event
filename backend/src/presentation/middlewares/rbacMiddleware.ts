import { Request, Response, NextFunction } from 'express';
import { Rol } from '../../domain/enums/Rol';
import { ForbiddenError, UnauthorizedError } from '../../domain/errors/DomainError';

export function requireRoles(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.rol)) {
      throw new ForbiddenError('No tienes permiso para acceder a esta sección');
    }
    next();
  };
}
