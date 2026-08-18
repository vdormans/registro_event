import { Router } from 'express';
import { InvitadoController } from '../controllers/InvitadoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rbacMiddleware';
import { Rol } from '../../domain/enums/Rol';

const router = Router({ mergeParams: true });

router.use(authMiddleware, requireRoles(Rol.ADMIN, Rol.OPERADOR));

router.get('/', InvitadoController.buscar);
router.get('/:invitadoId', InvitadoController.obtener);
router.post('/', InvitadoController.registrarEnEvento);
router.patch('/:invitadoId/presente', InvitadoController.marcarPresente);

export default router;
