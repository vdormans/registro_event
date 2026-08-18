import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import EventoForm, { EventoFormData } from '../../components/EventoForm';
import { eventosApi } from '../../api/endpoints';
import type { Evento } from '../../types';

export default function EditarEventoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) eventosApi.obtener(id).then((r) => setEvento(r.data));
  }, [id]);

  const handleSubmit = async (data: EventoFormData, imagen?: File) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      if (data.descripcion) formData.append('descripcion', data.descripcion);
      formData.append('fechaInicioRegistro', data.fechaInicioRegistro);
      formData.append('fechaCierreRegistro', data.fechaCierreRegistro);
      formData.append('permitirAcompanante', String(data.permitirAcompanante));
      formData.append('ciudades', JSON.stringify(data.ciudades));
      if (imagen) formData.append('imagen', imagen);

      await eventosApi.actualizar(id, formData);
      toast.success('Evento actualizado');
      navigate(`/app/eventos/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!evento) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" /></div>;
  }

  const defaultValues: Partial<EventoFormData> = {
    nombre: evento.nombre,
    descripcion: evento.descripcion ?? '',
    fechaInicioRegistro: evento.fechaInicioRegistro.slice(0, 10),
    fechaCierreRegistro: evento.fechaCierreRegistro.slice(0, 10),
    permitirAcompanante: evento.permitirAcompanante,
    ciudades: evento.ciudades?.map((c) => ({
      nombreCiudad: c.nombreCiudad,
      iniciales: c.iniciales,
      fechaEvento: c.fechaEvento.slice(0, 10),
    })) ?? [],
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar evento</h1>
          <p className="text-sm text-gray-500">{evento.nombre}</p>
        </div>
      </div>
      <EventoForm defaultValues={defaultValues} evento={evento} onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="Guardar cambios" />
    </div>
  );
}
