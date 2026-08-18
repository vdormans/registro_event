import { TipoRegistro } from '../enums/TipoRegistro';

export interface CodigoCorrelativo {
  id: string;
  eventoId: string;
  ciudadEventoId: string;
  tipo: TipoRegistro;
  ultimoCorrelativo: number;
}
