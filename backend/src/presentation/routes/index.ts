import { Router } from 'express';
import authRoutes from './authRoutes';
import usuarioRoutes from './usuarioRoutes';
import eventoRoutes from './eventoRoutes';
import invitadoRoutes from './invitadoRoutes';
import publicoRoutes from './publicoRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/eventos', eventoRoutes);
router.use('/eventos/:eventoId/invitados', invitadoRoutes);
router.use('/publico', publicoRoutes);

export default router;
