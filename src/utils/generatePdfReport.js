import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const parseCurrency = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === '') return 0;

  const parsed = Number(
    String(value)
      .replace(/\$/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '')
  );
  return Number.isFinite(parsed) ? parsed : 0;
};

const fetchWorkbook = async (filePath) => {
  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`No se pudo cargar ${filePath}`);
  return XLSX.read(await response.arrayBuffer(), { type: 'array' });
};

const readGastos = (workbook) => {
  const sheetName = workbook.SheetNames.find((name) => name.toLowerCase() === 'semanal');
  if (!sheetName) throw new Error('No se encontró la pestaña Semanal en Gastos semanaless.xlsx');

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    blankrows: false,
    defval: '',
  });
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => String(cell).toLowerCase().includes('proveedor')) &&
    row.some((cell) => String(cell).toLowerCase().includes('rubro')) &&
    row.some((cell) => String(cell).toLowerCase().includes('importe'))
  );
  if (headerIndex === -1) throw new Error('No se encontraron los encabezados de Gastos semanales.');

  const headers = rows[headerIndex].map((cell) => String(cell).trim().toLowerCase());
  const index = (name) => headers.findIndex((header) => header === name.toLowerCase());

  const semanaIndex = index('Semana');
  const proveedorIndex = index('Proveedor');
  const descripcionIndex = index('Descripción');
  const rubroIndex = index('Rubro');
  const viaIndex = index('Vía');
  const formaPagoIndex = headers.findIndex((header) => header.includes('forma  de pago'));
  const importeIndex = headers.findIndex((header) => header.includes('importe u$d'));
  const estadoIndex = index('Estado');

  return rows.slice(headerIndex + 1)
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => ({
      semana: String(row[semanaIndex] ?? '').trim(),
      proveedor: String(row[proveedorIndex] ?? '').trim(),
      descripcion: String(row[descripcionIndex] ?? '').trim(),
      rubro: String(row[rubroIndex] ?? '').trim(),
      via: String(row[viaIndex] ?? '').trim(),
      formaPago: String(row[formaPagoIndex] ?? '').trim(),
      importe: parseCurrency(row[importeIndex]),
      estado: String(row[estadoIndex] ?? '').trim(),
    }))
    .filter((item) => item.proveedor || item.descripcion || item.rubro || item.importe);
};

const readQuimicos = (workbook) => {
  const preferredSheet =
    workbook.SheetNames.find((name) => name.trim().toLowerCase() === 'datos') ||
    workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[preferredSheet], {
    header: 1,
    blankrows: false,
    defval: '',
  });

  const headerIndex = rows.findIndex((row) =>
    row.map((cell) => String(cell).trim().toLowerCase()).includes('cantidad') &&
    row.map((cell) => String(cell).trim().toLowerCase()).includes('articulo') &&
    row.map((cell) => String(cell).trim().toLowerCase()).includes('sector') &&
    row.map((cell) => String(cell).trim().toLowerCase()).includes('estado')
  );
  if (headerIndex === -1) throw new Error('No se encontró el encabezado de Pedidos de Químicos.');

  const headers = rows[headerIndex].map((cell) => String(cell).trim().toLowerCase());
  const getIndex = (name) => headers.findIndex((header) => header === name);
  const cantidadIndex = getIndex('cantidad');
  const umIndex = getIndex('u/m');
  const articuloIndex = getIndex('articulo');
  const sectorIndex = getIndex('sector');
  const importeIndex = headers.findIndex((header) => header === 'importe' || header === 'total');
  const estadoIndex = getIndex('estado');

  return rows.slice(headerIndex + 1)
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => ({
      sector: String(row[sectorIndex] ?? '').trim(),
      cantidad: parseCurrency(row[cantidadIndex]),
      um: String(row[umIndex] ?? '').trim(),
      articulo: String(row[articuloIndex] ?? '').trim(),
      importe: parseCurrency(row[importeIndex]),
      estado: String(row[estadoIndex] ?? '').trim(),
    }))
    .filter((item) => item.articulo || item.sector || item.estado || item.cantidad || item.importe);
};

const addSectionTitle = (doc, title, y) => {
  doc.setFillColor(27, 67, 50);
  doc.roundedRect(14, y, 182, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, 18, y + 6.8);
  doc.setTextColor(15, 23, 32);
};

export const generatePdfReport = async () => {
  const [gastosWorkbook, quimicosWorkbook] = await Promise.all([
    fetchWorkbook('/data/Gastos semanaless.xlsx'),
    fetchWorkbook('/data/pedido quimicos campaña 2026 valorizado.xlsx'),
  ]);

  const gastos = readGastos(gastosWorkbook);
  const quimicos = readQuimicos(quimicosWorkbook);

  const gastosPendientes = gastos.filter((item) => item.estado.toLowerCase() !== 'pagado');
  const gastosPagados = gastos.filter((item) => item.estado.toLowerCase() === 'pagado');
  const totalPendiente = gastosPendientes.reduce((sum, item) => sum + item.importe, 0);
  const totalPagado = gastosPagados.reduce((sum, item) => sum + item.importe, 0);

  const quimicosCumplidos = quimicos.filter((item) => item.estado.toLowerCase() === 'cumplido');
  const quimicosPendientes = quimicos.filter((item) => item.estado.toLowerCase() !== 'cumplido');
  const quimicosTotalCumplido = quimicosCumplidos.reduce((sum, item) => sum + item.importe, 0);
  const quimicosTotalPendiente = quimicosPendientes.reduce((sum, item) => sum + item.importe, 0);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setProperties({
    title: 'Reporte Agropecuario 2026',
    subject: 'Resumen de gastos semanales y pedidos de químicos',
    creator: 'Dashboard Agropecuario La Seis',
  });

  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Reporte Agropecuario 2026', 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 23);
  doc.text('Fuente: Gastos semanaless.xlsx y pedido quimicos campaña 2026 valorizado.xlsx', 14, 28);
  doc.setTextColor(15, 23, 32);

  addSectionTitle(doc, 'Gastos semanales', 42);
  autoTable(doc, {
    startY: 56,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Indicador', 'Registros', 'Importe U$D']],
    body: [
      ['Deudas / pendientes', String(gastosPendientes.length), currencyFormatter.format(totalPendiente)],
      ['Pagos registrados', String(gastosPagados.length), currencyFormatter.format(totalPagado)],
    ],
    headStyles: { fillColor: [45, 106, 79], textColor: 255 },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    head: [['Semana', 'Proveedor', 'Rubro', 'Estado', 'Importe U$D']],
    body: gastos.map((item) => [
      item.semana || '-',
      item.proveedor || '-',
      item.rubro || '-',
      item.estado || '-',
      currencyFormatter.format(item.importe),
    ]),
    headStyles: { fillColor: [27, 67, 50], textColor: 255 },
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 58 },
      2: { cellWidth: 38 },
      3: { cellWidth: 25 },
      4: { cellWidth: 29, halign: 'right' },
    },
  });

  doc.addPage();
  addSectionTitle(doc, 'Pedidos de químicos', 14);
  autoTable(doc, {
    startY: 28,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Estado', 'Registros', 'Cantidad', 'Importe U$D']],
    body: [
      [
        'Cumplido',
        String(quimicosCumplidos.length),
        String(quimicosCumplidos.reduce((sum, item) => sum + item.cantidad, 0)),
        currencyFormatter.format(quimicosTotalCumplido),
      ],
      [
        'Pendiente',
        String(quimicosPendientes.length),
        String(quimicosPendientes.reduce((sum, item) => sum + item.cantidad, 0)),
        currencyFormatter.format(quimicosTotalPendiente),
      ],
    ],
    headStyles: { fillColor: [45, 106, 79], textColor: 255 },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    head: [['Sector', 'Cantidad', 'U/M', 'Artículo', 'Estado', 'Importe U$D']],
    body: quimicos.map((item) => [
      item.sector || '-',
      String(item.cantidad || ''),
      item.um || '-',
      item.articulo || '-',
      item.estado || '-',
      currencyFormatter.format(item.importe),
    ]),
    headStyles: { fillColor: [27, 67, 50], textColor: 255 },
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 18, halign: 'right' },
      2: { cellWidth: 14 },
      3: { cellWidth: 55 },
      4: { cellWidth: 24 },
      5: { cellWidth: 33, halign: 'right' },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Agropecuaria La Seis - Página ${page} de ${pageCount}`, 14, 290);
  }

  doc.save(`Reporte_Agropecuario_2026_${new Date().toISOString().slice(0, 10)}.pdf`);
};
