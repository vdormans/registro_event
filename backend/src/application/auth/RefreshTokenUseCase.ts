import jwt from 'jsonwebtoken';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { UnauthorizedError } from '../../domain/errors/DomainError';

export class RefreshTokenUseCase {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async execute(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);
    } catch {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    const usuario = await this.usuarioRepo.findById(payload.sub);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedError('Usuario no encontrado o inactivo');
    }

    const accessToken = jwt.sign(
      { sub: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any },
    );

    return { accessToken };
  }
}
