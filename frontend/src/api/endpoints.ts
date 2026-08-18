import { apiClient, publicClient } from './client';
import type {
  Usuario, Evento, Invitado, MetricasEvento,
  AsignacionOperador, EventoPublico, RegistroPublicoResult,
} from '../types';

// ── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  login: (correo: string, password: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string; usuario: Usuario }>(
      '/auth/login', { correo, password },
    ),
  me: () => apiClient.get<{ sub: string; rol: string }>('/auth/me'),
};

// ── Usuarios ─────────────────────────────────────────────────────
export const usuariosApi = {
  listar: () => apiClient.get<Usuario[]>('/usuarios'),
  obtener: (id: string) => apiClient.get<Usuario>(`/usuarios/${id}`),
  crear: (data: { nombre: string; correo: string; password: string; rol: string }) =>
    apiClient.post<Usuario>('/usuarios', data),
  actualizar: (id: string, data: Partial<{ nombre: string; correo: string; password: string; rol: string; activo: boolean }>) =>
    apiClient.patch<Usuario>(`/usuarios/${id}`, data),
  eliminar: (id: string) => apiClient.delete(`/usuarios/${id}`),
  listarAsignaciones: (id: string) =>
    apiClient.get<AsignacionOperador[]>(`/usuarios/${id}/asignaciones`),
  asignarEvento: (id: string, eventoId: string) =>
    apiClient.post(`/usuarios/${id}/asignaciones`, { eventoId }),
  quitarEvento: (id: string, eventoId: string) =>
    apiClient.delete(`/usuarios/${id}/asignaciones/${eventoId}`),
};

// ── Eventos ──────────────────────────────────────────────────────
export const eventosApi = {
  listar: (concluidos = false) =>
    apiClient.get<Evento[]>(`/eventos?concluidos=${concluidos}`),
  obtener: (id: string) => apiClient.get<Evento>(`/eventos/${id}`),
  crear: (formData: FormData) =>
    apiClient.post<Evento>('/eventos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  actualizar: (id: string, formData: FormData) =>
    apiClient.patch<Evento>(`/eventos/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  concluir: (id: string) => apiClient.patch<Evento>(`/eventos/${id}/concluir`),
  extenderRegistro: (id: string, nuevaFechaCierre: string) =>
    apiClient.patch<Evento>(`/eventos/${id}/extender-registro`, { nuevaFechaCierre }),
  metricas: (id: string) => apiClient.get<MetricasEvento>(`/eventos/${id}/metricas`),
  eliminar: (id: string) => apiClient.delete(`/eventos/${id}`),
  exportar: (id: string, formato: 'csv' | 'xlsx') =>
    apiClient.get(`/eventos/${id}/exportar?formato=${formato}`, { responseType: 'blob' }),
};

// ── Invitados (panel admin/operador) ─────────────────────────────
export const invitadosApi = {
  buscar: (eventoId: string, q?: string) =>
    apiClient.get<Invitado[]>(`/eventos/${eventoId}/invitados${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  registrar: (eventoId: string, data: {
    ciudadEventoId: string; nombreCompleto: string;
    celular: string; codigoCliente: string; consentimientoDatos: boolean;
  }) => apiClient.post<Invitado>(`/eventos/${eventoId}/invitados`, data),
  marcarPresente: (eventoId: string, invitadoId: string) =>
    apiClient.patch<Invitado>(`/eventos/${eventoId}/invitados/${invitadoId}/presente`),
};

// ── Registro Público (sin auth) ──────────────────────────────────
export const publicoApi = {
  obtenerEvento: (eventoId: string) =>
    publicClient.get<EventoPublico>(`/publico/eventos/${eventoId}`),
  registrar: (eventoId: string, data: {
    ciudadEventoId: string; nombreCompleto: string;
    celular: string; codigoCliente: string; consentimientoDatos: boolean;
  }) => publicClient.post<RegistroPublicoResult>(`/publico/eventos/${eventoId}/registrar`, data),
};
