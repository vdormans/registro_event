import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { UnauthorizedError } from '../../domain/errors/DomainError';
import { UsuarioPublico } from '../../domain/entities/Usuario';

export interface LoginInput {
  correo: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioPublico;
}

export class LoginUseCase {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const usuario = await this.usuarioRepo.findByCorreo(input.correo);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedError('Correo o contraseña incorrectos');
    }

    const valido = await bcrypt.compare(input.password, usuario.passwordHash);
    if (!valido) {
      throw new UnauthorizedError('Correo o contraseña incorrectos');
    }

    const payload = { sub: usuario.id, rol: usuario.rol };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
    });

    const { passwordHash: _, ...usuarioPublico } = usuario;

    return { accessToken, refreshToken, usuario: usuarioPublico };
  }
}
