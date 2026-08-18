import { Usuario } from '../entities/Usuario';
import { Rol } from '../enums/Rol';

export interface CrearUsuarioDto {
  nombre: string;
  correo: string;
  passwordHash: string;
  rol: Rol;
}

export interface ActualizarUsuarioDto {
  nombre?: string;
  correo?: string;
  passwordHash?: string;
  rol?: Rol;
  activo?: boolean;
}

export interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>;
  findByCorreo(correo: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  create(data: CrearUsuarioDto): Promise<Usuario>;
  update(id: string, data: ActualizarUsuarioDto): Promise<Usuario>;
  delete(id: string): Promise<void>;
}
