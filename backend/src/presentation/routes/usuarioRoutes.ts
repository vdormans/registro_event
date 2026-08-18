import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rbacMiddleware';
import { Rol } from '../../domain/enums/Rol';

const router = Router();

router.use(authMiddleware, requireRoles(Rol.ADMIN));

router.get('/', UsuarioController.listar);
router.get('/:id', UsuarioController.obtener);
router.post('/', UsuarioController.crear);
router.patch('/:id', UsuarioController.actualizar);
router.delete('/:id', UsuarioController.eliminar);
router.get('/:id/asignaciones', UsuarioController.listarAsignaciones);
router.post('/:id/asignaciones', UsuarioController.asignarEvento);
router.delete('/:id/asignaciones/:eventoId', UsuarioController.quitarEvento);

export default router;
