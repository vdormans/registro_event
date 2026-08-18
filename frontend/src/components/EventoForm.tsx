import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Evento } from '../types';

const ciudadSchema = z.object({
  nombreCiudad: z.string().min(1, 'Nombre de ciudad obligatorio'),
  iniciales: z.string().min(1).max(5, 'Máximo 5 caracteres'),
  fechaEvento: z.string().min(1, 'Fecha del evento obligatoria'),
});

export const eventoFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre del evento es obligatorio'),
  descripcion: z.string().optional(),
  fechaInicioRegistro: z.string().min(1, 'Fecha de inicio obligatoria'),
  fechaCierreRegistro: z.string().min(1, 'Fecha de cierre obligatoria'),
  permitirAcompanante: z.boolean().default(false),
  ciudades: z.array(ciudadSchema).min(1, 'Debe agregar al menos una ciudad'),
});

export type EventoFormData = z.infer<typeof eventoFormSchema>;

interface Props {
  defaultValues?: Partial<EventoFormData>;
  evento?: Evento;
  onSubmit: (data: EventoFormData, imagen?: File) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export default function EventoForm({ defaultValues, onSubmit, isSubmitting, submitLabel = 'Guardar' }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EventoFormData>({
    resolver: zodResolver(eventoFormSchema),
    defaultValues: {
      permitirAcompanante: false,
      ciudades: [{ nombreCiudad: '', iniciales: '', fechaEvento: '' }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'ciudades' });
  let imagenFile: File | undefined;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    imagenFile = e.target.files?.[0];
  };

  const submitHandler = async (data: EventoFormData) => {
    await onSubmit(data, imagenFile);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
      {/* Datos básicos */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-800">Datos del evento</h3>

        <div>
          <label className="label">Nombre del evento *</label>
          <input className="input" {...register('nombre')} placeholder="Ej. Feria de Innovación 2026" />
          {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
        </div>

        <div>
          <label className="label">Descripción breve</label>
          <textarea className="input resize-none" rows={3} {...register('descripcion')} placeholder="Descripción del evento..." />
        </div>

        <div>
          <label className="label">Imagen referencial</label>
          <input type="file" accept="image/*" className="input" onChange={handleFileChange} />
          <p className="mt-1 text-xs text-gray-400">Opcional. Máx. 5 MB (jpg, png, webp)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Inicio de registro *</label>
            <input type="date" className="input" {...register('fechaInicioRegistro')} />
            {errors.fechaInicioRegistro && <p className="mt-1 text-xs text-red-600">{errors.fechaInicioRegistro.message}</p>}
          </div>
          <div>
            <label className="label">Cierre de registro *</label>
            <input type="date" className="input" {...register('fechaCierreRegistro')} />
            {errors.fechaCierreRegistro && <p className="mt-1 text-xs text-red-600">{errors.fechaCierreRegistro.message}</p>}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 text-primary-600 rounded" {...register('permitirAcompanante')} />
          <span className="text-sm text-gray-700">Permitir registro de acompañante (botón opcional en confirmación)</span>
        </label>
      </div>

      {/* Ciudades */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Ciudades sede *</h3>
          <button
            type="button"
            onClick={() => append({ nombreCiudad: '', iniciales: '', fechaEvento: '' })}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
          >
            <PlusCircle className="h-3.5 w-3.5" /> Agregar ciudad
          </button>
        </div>

        {errors.ciudades?.root && (
          <p className="text-xs text-red-600">{errors.ciudades.root.message}</p>
        )}

        {fields.map((field, idx) => (
          <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Ciudad {idx + 1}</span>
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(idx)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="label text-xs">Nombre</label>
                <input className="input" placeholder="Cochabamba" {...register(`ciudades.${idx}.nombreCiudad`)} />
                {errors.ciudades?.[idx]?.nombreCiudad && (
                  <p className="mt-1 text-xs text-red-600">{errors.ciudades[idx]?.nombreCiudad?.message}</p>
                )}
              </div>
              <div>
                <label className="label text-xs">Iniciales</label>
                <input className="input uppercase" maxLength={5} placeholder="CB" {...register(`ciudades.${idx}.iniciales`)} />
                {errors.ciudades?.[idx]?.iniciales && (
                  <p className="mt-1 text-xs text-red-600">{errors.ciudades[idx]?.iniciales?.message}</p>
                )}
              </div>
              <div>
                <label className="label text-xs">Fecha del evento</label>
                <input type="date" className="input" {...register(`ciudades.${idx}.fechaEvento`)} />
                {errors.ciudades?.[idx]?.fechaEvento && (
                  <p className="mt-1 text-xs text-red-600">{errors.ciudades[idx]?.fechaEvento?.message}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-primary px-8">
          {isSubmitting ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
