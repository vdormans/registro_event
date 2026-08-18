import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { asignacionRepository } from '../container';
import { Rol } from '../../domain/enums/Rol';

export interface WsPayloadInvitadoPresente {
  invitadoId: string;
  codigoUnico: string;
  nombreCompleto: string;
  ciudad: string;
  marcadoEn: string;
}

export interface WsPayloadNuevoInvitado {
  invitadoId: string;
  codigoUnico: string;
  nombreCompleto: string;
  ciudad: string;
  tipoRegistro: string;
  registradoEn: string;
}

export interface WsPayloadMetricas {
  porCiudad: {
    ciudadEventoId: string;
    nombreCiudad: string;
    iniciales: string;
    preRegistros: number;
    presentes: number;
    registroEvento: number;
  }[];
}

let io: SocketIOServer | null = null;

/**
 * Inicializa Socket.IO y registra la lógica de autorización y canales.
 * RNF-16: propagación máx. 2 s; RNF-19: sync entre operadores.
 */
export function initSocketGateway(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Usa WebSockets con fallback a polling
    transports: ['websocket', 'polling'],
  });

  // ── Middleware de autenticación ──────────────────────────────────
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Token no proporcionado'));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
        sub: string;
        rol: Rol;
      };

      (socket as any).userId = payload.sub;
      (socket as any).userRol = payload.rol;
      next();
    } catch {
      next(new Error('Token inválido o expirado'));
    }
  });

  // ── Manejo de conexiones ─────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId: string = (socket as any).userId;
    const userRol: Rol = (socket as any).userRol;

    // Cliente solicita suscripción al canal de un evento
    socket.on('join_event', async (data: { eventoId: string }) => {
      const { eventoId } = data;
      if (!eventoId) return;

      // Admins acceden a todo; operadores/visualizadores solo eventos asignados
      if (userRol !== Rol.ADMIN) {
        const asig = await asignacionRepository
          .findByUsuarioYEvento(userId, eventoId)
          .catch(() => null);
        if (!asig) {
          socket.emit('error', { message: 'No tienes acceso a este evento' });
          return;
        }
      }

      const room = `evento:${eventoId}`;
      socket.join(room);
      socket.emit('joined', { eventoId, room });
    });

    socket.on('leave_event', (data: { eventoId: string }) => {
      const room = `evento:${data.eventoId}`;
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      // Socket.IO limpia los rooms automáticamente al desconectar
    });
  });

  return io;
}

/**
 * Emite a todos los clientes conectados al canal de un evento.
 * Llamado desde los controllers tras marcar presente o registrar nuevo invitado.
 */
export function emitToEvent(
  eventoId: string,
  event: 'invitado_presente' | 'nuevo_invitado' | 'metricas_actualizadas',
  payload: WsPayloadInvitadoPresente | WsPayloadNuevoInvitado | WsPayloadMetricas,
): void {
  if (!io) return;
  io.to(`evento:${eventoId}`).emit(event, payload);
}

export function getIO(): SocketIOServer | null {
  return io;
}
