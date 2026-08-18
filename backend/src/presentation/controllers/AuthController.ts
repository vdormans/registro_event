import { Request, Response } from 'express';
import { z } from 'zod';
import { LoginUseCase } from '../../application/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/auth/RefreshTokenUseCase';
import { usuarioRepository } from '../../infrastructure/container';
import { ValidationError } from '../../domain/errors/DomainError';

const loginSchema = z.object({
  correo: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }
    const uc = new LoginUseCase(usuarioRepository);
    const result = await uc.execute(parsed.data);
    res.json(result);
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ValidationError('refreshToken es obligatorio');
    const uc = new RefreshTokenUseCase(usuarioRepository);
    const result = await uc.execute(refreshToken);
    res.json(result);
  }

  static me(req: Request, res: Response): void {
    res.json(req.user);
  }
}
