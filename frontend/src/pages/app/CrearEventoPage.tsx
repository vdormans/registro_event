import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import EventoForm, { EventoFormData } from '../../components/EventoForm';
import { eventosApi } from '../../api/endpoints';

export default function CrearEventoPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: EventoFormData, imagen?: File) => {
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

      await eventosApi.crear(formData);
      toast.success('Evento creado correctamente');
      navigate('/app');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo evento</h1>
          <p className="text-sm text-gray-500">Completa los datos para crear un evento</p>
        </div>
      </div>
      <EventoForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="Crear evento" />
    </div>
  );
}
