import { Router } from 'express';
import { PublicoController } from '../controllers/PublicoController';
import { InvitadoController } from '../controllers/InvitadoController';

const router = Router();

// RF-06: info pública del evento
router.get('/eventos/:eventoId', PublicoController.obtenerEvento);

// RF-07, RF-08, RF-09: pre-registro público (sin autenticación)
router.post('/eventos/:eventoId/registrar', InvitadoController.registrarPublico);

export default router;
