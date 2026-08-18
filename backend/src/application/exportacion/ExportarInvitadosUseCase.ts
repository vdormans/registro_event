import ExcelJS from 'exceljs';
import { IInvitadoRepository } from '../../domain/repositories/IInvitadoRepository';
import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { NotFoundError, ValidationError } from '../../domain/errors/DomainError';
import { TipoRegistro } from '../../domain/enums/TipoRegistro';
import { EstadoInvitado } from '../../domain/enums/EstadoInvitado';

export type FormatoExport = 'csv' | 'xlsx';

export interface ExportarResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

const COLUMNAS = [
  { header: 'Código único', key: 'codigoUnico' },
  { header: 'Nombre completo', key: 'nombreCompleto' },
  { header: 'Número de celular', key: 'celular' },
  { header: 'Código de cliente', key: 'codigoCliente' },
  { header: 'Ciudad', key: 'ciudad' },
  { header: 'Fecha del evento', key: 'fechaEvento' },
  { header: 'Tipo de registro', key: 'tipoRegistro' },
  { header: 'Estado', key: 'estado' },
  { header: 'Fecha y hora de registro', key: 'registradoEn' },
];

export class ExportarInvitadosUseCase {
  constructor(
    private readonly invitadoRepo: IInvitadoRepository,
    private readonly eventoRepo: IEventoRepository,
  ) {}

  async execute(eventoId: string, formato: FormatoExport): Promise<ExportarResult> {
    if (formato !== 'csv' && formato !== 'xlsx') {
      throw new ValidationError('Formato inválido. Use csv o xlsx');
    }

    const evento = await this.eventoRepo.findById(eventoId, false);
    if (!evento) throw new NotFoundError('Evento');

    const invitados = await this.invitadoRepo.findAllByEvento(eventoId);

    const rows = invitados.map((inv) => ({
      codigoUnico: inv.codigoUnico,
      nombreCompleto: inv.nombreCompleto,
      celular: inv.celular,
      codigoCliente: inv.codigoCliente,
      ciudad: inv.ciudadEvento?.nombreCiudad ?? '',
      fechaEvento: inv.ciudadEvento?.fechaEvento
        ? new Date(inv.ciudadEvento.fechaEvento).toLocaleDateString('es-BO')
        : '',
      tipoRegistro:
        inv.tipoRegistro === TipoRegistro.PRE_REGISTRO ? 'Pre-registrado' : 'Registrado en evento',
      estado: inv.estado === EstadoInvitado.PRESENTE ? 'Presente' : 'Registrado',
      registradoEn: new Date(inv.registradoEn).toLocaleString('es-BO'),
    }));

    const nombreEvento = evento.nombre.replace(/[^a-zA-Z0-9]/g, '_');
    const fecha = new Date().toISOString().slice(0, 10);

    if (formato === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Invitados');
      sheet.columns = COLUMNAS.map((col) => ({ ...col, width: 25 }));

      // Encabezado con estilo
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' },
      };
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

      sheet.addRows(rows);

      const buffer = await workbook.xlsx.writeBuffer();
      return {
        buffer: Buffer.from(buffer),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `invitados_${nombreEvento}_${fecha}.xlsx`,
      };
    }

    // CSV
    const csvLines = [
      COLUMNAS.map((c) => `"${c.header}"`).join(','),
      ...rows.map((r) =>
        COLUMNAS.map((c) => `"${String((r as any)[c.key]).replace(/"/g, '""')}"`).join(','),
      ),
    ];
    const buffer = Buffer.from('\uFEFF' + csvLines.join('\n'), 'utf-8'); // BOM para Excel

    return {
      buffer,
      contentType: 'text/csv; charset=utf-8',
      filename: `invitados_${nombreEvento}_${fecha}.csv`,
    };
  }
}
