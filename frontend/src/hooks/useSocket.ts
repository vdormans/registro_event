import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = window.location.origin.replace('5173', '3001');

export function useSocket(eventoId: string | null, token: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!eventoId || !token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_event', { eventoId });
    });

    socket.on('connect_error', (err) => {
      console.warn('WebSocket error:', err.message);
    });

    return () => {
      socket.emit('leave_event', { eventoId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventoId, token]);

  return socketRef;
}
