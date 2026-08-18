import { prisma } from './database/prismaClient';
import { PrismaUsuarioRepository } from './repositories/PrismaUsuarioRepository';
import { PrismaEventoRepository } from './repositories/PrismaEventoRepository';
import { PrismaInvitadoRepository } from './repositories/PrismaInvitadoRepository';
import { PrismaAsignacionRepository } from './repositories/PrismaAsignacionRepository';
import { LocalStorageService } from './storage/LocalStorageService';

// Repositorios
export const usuarioRepository = new PrismaUsuarioRepository(prisma);
export const eventoRepository = new PrismaEventoRepository(prisma);
export const invitadoRepository = new PrismaInvitadoRepository(prisma);
export const asignacionRepository = new PrismaAsignacionRepository(prisma);

// Servicios de infraestructura
export const storageService = new LocalStorageService();
