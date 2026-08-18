import { Router } from 'express';
import { EventoController } from '../controllers/EventoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rbacMiddleware';
import { uploadImagen } from '../middlewares/uploadMiddleware';
import { Rol } from '../../domain/enums/Rol';

const router = Router();

router.use(authMiddleware);

// Lectura — accesible por todos los roles autenticados
router.get('/', EventoController.listar);
router.get('/:id', EventoController.obtener);
router.get('/:id/metricas', EventoController.metricas);

// Invitados
router.get(
  '/:eventoId/invitados',
  requireRoles(Rol.ADMIN, Rol.OPERADOR),
  EventoController.metricas, // usa InvitadoController en la siguiente ruta
);

// Exportación — solo admin (RF-24)
router.get('/:id/exportar', requireRoles(Rol.ADMIN), EventoController.exportar);

// Escritura — solo admin
router.post(
  '/',
  requireRoles(Rol.ADMIN),
  (req, res, next) => {
    uploadImagen(req, res, (err) => {
      if (err) return next(err);
      if (req.file) (req as any).imagenUrl = `/uploads/${req.file.filename}`;
      next();
    });
  },
  EventoController.crear,
);

router.patch(
  '/:id',
  requireRoles(Rol.ADMIN),
  (req, res, next) => {
    uploadImagen(req, res, (err) => {
      if (err) return next(err);
      if (req.file) (req as any).imagenUrl = `/uploads/${req.file.filename}`;
      next();
    });
  },
  EventoController.actualizar,
);

router.patch('/:id/concluir', requireRoles(Rol.ADMIN), EventoController.concluir);
router.patch('/:id/extender-registro', requireRoles(Rol.ADMIN), EventoController.extenderRegistro);
router.delete('/:id', requireRoles(Rol.ADMIN), EventoController.eliminar);

export default router;
