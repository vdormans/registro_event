import { Rol } from '../enums/Rol';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  passwordHash: string;
  rol: Rol;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export type UsuarioPublico = Omit<Usuario, 'passwordHash'>;
