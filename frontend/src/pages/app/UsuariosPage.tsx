import { useEffect, useState } from 'react';
import { PlusCircle, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { usuariosApi, eventosApi } from '../../api/endpoints';
import type { Usuario, Evento, Rol } from '../../types';
import { useAuth } from '../../context/AuthContext';

const rolLabel: Record<Rol, string> = {
  ADMIN: 'Administrador', OPERADOR: 'Control de Asistencia', VISUALIZACION: 'Visualización en Vivo',
};

const crearSchema = z.object({
  nombre: z.string().min(1, 'Obligatorio'),
  correo: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum(['ADMIN', 'OPERADOR', 'VISUALIZACION']),
});
type CrearForm = z.infer<typeof crearSchema>;

export default function UsuariosPage() {
  const { usuario: me } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [asignacionAbierta, setAsignacionAbierta] = useState<string | null>(null);
  const [asignaciones, setAsignaciones] = useState<Record<string, string[]>>({});

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CrearForm>({
    resolver: zodResolver(crearSchema),
    defaultValues: { rol: 'OPERADOR' },
  });

  const cargar = async () => {
    const [us, ev] = await Promise.all([usuariosApi.listar(), eventosApi.listar(false)]);
    setUsuarios(us.data);
    setEventos(ev.data);
  };

  useEffect(() => { cargar(); }, []);

  const onSubmit = async (data: CrearForm) => {
    if (editando) {
      await usuariosApi.actualizar(editando.id, data);
      toast.success('Usuario actualizado');
    } else {
      await usuariosApi.crear(data);
      toast.success('Usuario creado');
    }
    reset();
    setShowForm(false);
    setEditando(null);
    cargar();
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await usuariosApi.eliminar(id);
    toast.success('Usuario eliminado');
    cargar();
  };

  const editarUsuario = (u: Usuario) => {
    setEditando(u);
    reset({ nombre: u.nombre, correo: u.correo, rol: u.rol, password: '' });
    setShowForm(true);
  };

  const toggleAsignaciones = async (userId: string) => {
    if (asignacionAbierta === userId) { setAsignacionAbierta(null); return; }
    setAsignacionAbierta(userId);
    const { data } = await usuariosApi.listarAsignaciones(userId);
    setAsignaciones((prev) => ({ ...prev, [userId]: data.map((a) => a.eventoId) }));
  };

  const toggleEvento = async (userId: string, eventoId: string) => {
    const actual = asignaciones[userId] ?? [];
    if (actual.includes(eventoId)) {
      await usuariosApi.quitarEvento(userId, eventoId);
      setAsignaciones((prev) => ({ ...prev, [userId]: prev[userId].filter((e) => e !== eventoId) }));
      toast.success('Evento quitado');
    } else {
      await usuariosApi.asignarEvento(userId, eventoId);
      setAsignaciones((prev) => ({ ...prev, [userId]: [...(prev[userId] ?? []), eventoId] }));
      toast.success('Evento asignado');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de usuarios</h1>
        <button onClick={() => { setShowForm((v) => !v); setEditando(null); reset(); }} className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-semibold">{editando ? 'Editar usuario' : 'Crear usuario'}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre</label>
              <input className="input" {...register('nombre')} />
              {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="label">Correo</label>
              <input type="email" className="input" {...register('correo')} />
              {errors.correo && <p className="mt-1 text-xs text-red-600">{errors.correo.message}</p>}
            </div>
            <div>
              <label className="label">Contraseña {editando && <span className="text-gray-400">(dejar en blanco para no cambiar)</span>}</label>
              <input type="password" className="input" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Rol</label>
              <select className="input" {...register('rol')}>
                <option value="ADMIN">Administrador</option>
                <option value="OPERADOR">Control de Asistencia</option>
                <option value="VISUALIZACION">Visualización en Vivo</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="btn-secondary text-sm">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
                {isSubmitting ? 'Guardando…' : editando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nombre', 'Correo', 'Rol', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <>
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{u.correo}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{rolLabel[u.rol]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.rol !== 'ADMIN' && (
                        <button onClick={() => toggleAsignaciones(u.id)} className="text-xs text-primary-700 hover:underline flex items-center gap-1">
                          Eventos {asignacionAbierta === u.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      )}
                      <button onClick={() => editarUsuario(u)} className="text-gray-500 hover:text-primary-700"><Pencil className="h-4 w-4" /></button>
                      {u.id !== me?.id && (
                        <button onClick={() => eliminar(u.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
                {/* Asignaciones */}
                {asignacionAbierta === u.id && u.rol !== 'ADMIN' && (
                  <tr key={`asig-${u.id}`}>
                    <td colSpan={5} className="px-6 py-3 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Asignar eventos:</p>
                      <div className="flex flex-wrap gap-2">
                        {eventos.map((ev) => {
                          const activo = (asignaciones[u.id] ?? []).includes(ev.id);
                          return (
                            <button key={ev.id} onClick={() => toggleEvento(u.id, ev.id)}
                              className={`text-xs px-3 py-1 rounded-full border transition-colors ${activo ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-500'}`}>
                              {ev.nombre}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
