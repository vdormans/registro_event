import { AsignacionOperador } from '../entities/AsignacionOperador';

export interface IAsignacionRepository {
  findByUsuarioYEvento(usuarioId: string, eventoId: string): Promise<AsignacionOperador | null>;
  findByUsuario(usuarioId: string): Promise<AsignacionOperador[]>;
  findByEvento(eventoId: string): Promise<AsignacionOperador[]>;
  crear(usuarioId: string, eventoId: string): Promise<AsignacionOperador>;
  eliminar(usuarioId: string, eventoId: string): Promise<void>;
}
