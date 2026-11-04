import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const parseCurrency = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === '') return 0;

  let text = String(value).trim();
  if (!text) return 0;
  text = text.replace(/[^0-9,.-]/g, '');

  if (text.includes(',') && text.includes('.')) {
    text = text.lastIndexOf(',') > text.lastIndexOf('.')
      ? text.replace(/\./g, '').replace(',', '.')
      : text.replace(/,/g, '');
  } else if (text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.');
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
};

const fetchWorkbook = async (filePath) => {
  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`No se pudo cargar ${filePath}`);
  return XLSX.read(await response.arrayBuffer(), { type: 'array' });
};

const getCurrentIsoWeek = () => {
  const date = new Date();
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-${week}`;
};

const weekSortValue = (value) => {
  const match = String(value).match(/^(\d{4})-(\d{1,2})$/);
  return match ? (Number(match[1]) * 100) + Number(match[2]) : -1;
};

const findAvailableWeeks = (...workbooks) => {
  const weeks = new Set();
  workbooks.forEach((workbook) => {
    workbook.SheetNames.forEach((sheetName) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        blankrows: false,
        defval: '',
      });
      rows.forEach((row) => {
        String(row[0] ?? '').match(/^\d{4}-\d{1,2}$/) &&
          weeks.add(String(row[0]).trim());
      });
    });
  });
  return [...weeks].sort((a, b) => weekSortValue(a) - weekSortValue(b));
};

const selectReportWeek = (availableWeeks) => {
  const currentWeek = getCurrentIsoWeek();
  if (availableWeeks.includes(currentWeek)) return currentWeek;
  return [...availableWeeks].sort((a, b) => weekSortValue(b) - weekSortValue(a))[0] || currentWeek;
};

const readPivotRows = (workbook, sheetName, week, columns) => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`No se encontró la pestaña "${sheetName}".`);

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
  });

  let currentVia = '';
  let currentRubro = '';
  const details = [];

  rows.slice(2).forEach((row) => {
    const rowWeek = String(row[columns.week] ?? '').trim();
    if (rowWeek && rowWeek !== week) return;

    const rubro = String(row[columns.rubro] ?? '').trim();
    const via = row[columns.via];
    const provider = String(row[columns.provider] ?? '').trim();
    const amount = parseCurrency(row[columns.amount]);
    const percentage = parseCurrency(row[columns.percent]);

    if (rubro && !rubro.toLowerCase().startsWith('total')) currentRubro = rubro;
    if (via !== '' && via !== null && via !== undefined) currentVia = String(via).trim();

    const normalizedProvider = provider.toLowerCase();
    if (
      provider &&
      amount !== 0 &&
      !normalizedProvider.startsWith('total') &&
      !normalizedProvider.startsWith('gran total') &&
      !normalizedProvider.includes('total')
    ) {
      details.push({
        rubro: currentRubro,
        via: currentVia,
        provider,
        amount,
        percentage: Number.isFinite(percentage) ? percentage : 0,
      });
    }
  });

  const totals = rows
    .filter((row) => String(row[columns.provider] ?? '').trim() === '' &&
      String(row[columns.rubro] ?? '').trim() === '' &&
      String(row[columns.week] ?? '').trim() === `Total ${week}`)
    .map((row) => ({
      amount: parseCurrency(row[columns.amount]),
      percentage: parseCurrency(row[columns.percent]),
    }));

  let totalRow = totals[0] ||
    rows.find((row) =>
      String(row[columns.week] ?? '').trim().toLowerCase().startsWith('total') ||
      String(row[0] ?? '').trim().toLowerCase() === 'total general'
    );

  return {
    details,
    totalAmount: totalRow ? parseCurrency(totalRow[columns.amount]) : details.reduce((sum, item) => sum + item.amount, 0),
    totalPercentage: totalRow ? parseCurrency(totalRow[columns.percent]) : 0,
  };
};

const readDeudaFruta = (workbook, week) => {
  const sheet = workbook.Sheets['Deuda Fruta'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
  let currentVia = '';
  let currentRubro = '';
  const details = [];

  rows.slice(2).forEach((row) => {
    const rowWeek = String(row[0] ?? '').trim();
    if (rowWeek && rowWeek !== week) return;

    const rubro = String(row[1] ?? '').trim();
    const via = row[2];
    const provider = String(row[3] ?? '').trim();
    const amount = parseCurrency(row[4]);
    const percentage = parseCurrency(row[5]);

    if (rubro && !rubro.toLowerCase().startsWith('total')) currentRubro = rubro;
    if (via !== '' && via !== null && via !== undefined) currentVia = String(via).trim();

    if (provider && amount !== 0 && !provider.toLowerCase().includes('total')) {
      details.push({ rubro: currentRubro, via: currentVia, provider, amount, percentage });
    }
  });

  const totalRow = rows.find((row) =>
    String(row[0] ?? '').trim().toLowerCase() === 'total general'
  );
  const rubroTotals = rows
    .filter((row) => String(row[1] ?? '').trim().toLowerCase().startsWith('total deuda fruta'))
    .map((row) => ({
      rubro: String(row[1]).trim(),
      amount: parseCurrency(row[4]),
      percentage: parseCurrency(row[5]),
    }));

  return {
    details,
    rubroTotals,
    totalAmount: totalRow ? parseCurrency(totalRow[4]) : details.reduce((sum, item) => sum + item.amount, 0),
    totalPercentage: totalRow ? parseCurrency(totalRow[5]) : 0,
  };
};

const readDeudaProveedores = (workbook, week) => {
  const result = readPivotRows(workbook, 'Deuda Proveedores', week, {
    week: 0,
    via: 1,
    rubro: 2,
    provider: 3,
    amount: 4,
    percent: 5,
  });

  const sheet = workbook.Sheets['Deuda Proveedores'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
  const totalRow = rows.find((row) => String(row[0] ?? '').trim().toLowerCase() === 'total general');
  if (totalRow) {
    result.totalAmount = parseCurrency(totalRow[4]);
    result.totalPercentage = parseCurrency(totalRow[5]);
  }
  return result;
};

const readComprasNuevas = (workbook, week) => {
  const result = readPivotRows(workbook, 'P Nuevo', week, {
    week: 0,
    via: 1,
    rubro: 2,
    provider: 3,
    amount: 4,
    percent: 5,
  });

  const sheet = workbook.Sheets['P Nuevo'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
  const totalRow = rows.find((row) => String(row[0] ?? '').trim().toLowerCase() === 'total general');
  if (totalRow) {
    result.totalAmount = parseCurrency(totalRow[4]);
    result.totalPercentage = parseCurrency(totalRow[5]);
  }
  return result;
};

const readInsumos = (workbook) => {
  const sheet = workbook.Sheets['Datos'] || workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('No se encontró la pestaña de insumos.');
  const rows = XLSX.utils.sheet_to_json(sheet, {
    range: 'J2:M7',
    header: 1,
    blankrows: true,
    defval: '',
  });

  const dataRows = rows.slice(1).map((row) => ({
    sector: String(row[0] ?? '').trim(),
    total: parseCurrency(row[1]),
    cumplido: parseCurrency(row[2]),
    pendiente: parseCurrency(row[3]),
  })).filter((row) => row.sector);

  const totalRow = dataRows.find((row) => row.sector === '') || rows[5]
    ? dataRows[dataRows.length - 1]
    : null;

  return {
    rows: dataRows.filter((row) => row.sector !== 'Totales U$D' && row.sector !== 'Totales $'),
    total: dataRows.find((row) => row.sector === 'Totales U$D') || totalRow || {
      sector: 'Totales U$D',
      total: dataRows.reduce((sum, row) => sum + row.total, 0),
      cumplido: dataRows.reduce((sum, row) => sum + row.cumplido, 0),
      pendiente: dataRows.reduce((sum, row) => sum + row.pendiente, 0),
    },
  };
};

const addHeader = (doc, week, pageTitle) => {
  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(pageTitle, 14, 12);
  doc.setFontSize(10);
  doc.text(`Semana ${week}`, 14, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 26);
  doc.setTextColor(15, 23, 32);
};

const addSectionTitle = (doc, title, y) => {
  doc.setFillColor(45, 106, 79);
  doc.roundedRect(14, y, 182, 9, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, 18, y + 6.2);
  doc.setTextColor(15, 23, 32);
};

const addFooter = (doc) => {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(211, 221, 214);
    doc.line(14, 286, 196, 286);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Agropecuaria La Seis', 14, 291);
    doc.text(`Página ${page} de ${pageCount}`, 196, 291, { align: 'right' });
  }
};

const formatPercentage = (value) => `${percentFormatter.format((value || 0) * 100)}%`;

export const generatePdfReport = async () => {
  const [gastosWorkbook, quimicosWorkbook] = await Promise.all([
    fetchWorkbook('/data/Gastos semanaless.xlsx'),
    fetchWorkbook('/data/pedido quimicos campaña 2026 valorizado.xlsx'),
  ]);

  const availableWeeks = findAvailableWeeks(gastosWorkbook, quimicosWorkbook);
  const week = selectReportWeek(availableWeeks);

  const deudaFruta = readDeudaFruta(gastosWorkbook, week);
  const deudaProveedores = readDeudaProveedores(gastosWorkbook, week);
  const comprasNuevas = readComprasNuevas(gastosWorkbook, week);
  const insumos = readInsumos(quimicosWorkbook);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setProperties({
    title: `Informe de Compras - Semana ${week}`,
    subject: 'Informe semanal de Compras',
    creator: 'Dashboard Agropecuario La Seis',
  });

  addHeader(doc, week, 'INFORME SEMANAL DE COMPRAS');
  addSectionTitle(doc, 'Resumen General', 38);

  const globalAmount = deudaFruta.totalAmount +
    deudaProveedores.totalAmount +
    insumos.total.pendiente +
    comprasNuevas.totalAmount;
  const summaryBody = [
    ['Deuda Fruta (Cosecha 2025/2026)', currencyFormatter.format(deudaFruta.totalAmount), formatPercentage(globalAmount ? deudaFruta.totalAmount / globalAmount : 0)],
    ['Deuda Proveedores', currencyFormatter.format(deudaProveedores.totalAmount), formatPercentage(globalAmount ? deudaProveedores.totalAmount / globalAmount : 0)],
    ['Insumos Campaña / Pasta - Pendiente', currencyFormatter.format(insumos.total.pendiente), formatPercentage(globalAmount ? insumos.total.pendiente / globalAmount : 0)],
    ['Compras Nuevas - Requerimientos sin concretar', currencyFormatter.format(comprasNuevas.totalAmount), formatPercentage(globalAmount ? comprasNuevas.totalAmount / globalAmount : 0)],
    ['TOTAL GENERAL', currencyFormatter.format(globalAmount), '100.00%'],
  ];

  autoTable(doc, {
    startY: 52,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Concepto', 'Importe U$D', '% del total']],
    body: summaryBody,
    headStyles: { fillColor: [27, 67, 50], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === summaryBody.length - 1) {
        data.cell.styles.fillColor = [220, 237, 227];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  addSectionTitle(doc, 'Insumos Campaña / Pasta', doc.lastAutoTable.finalY + 12);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 25,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Sector', 'Total', 'Cumplido', 'Pendiente']],
    body: [
      ...insumos.rows.map((row) => [
        row.sector,
        currencyFormatter.format(row.total),
        currencyFormatter.format(row.cumplido),
        currencyFormatter.format(row.pendiente),
      ]),
      ['Totales U$D', currencyFormatter.format(insumos.total.total), currencyFormatter.format(insumos.total.cumplido), currencyFormatter.format(insumos.total.pendiente)],
    ],
    headStyles: { fillColor: [45, 106, 79], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });

  doc.addPage();
  addHeader(doc, week, 'INFORME SEMANAL DE COMPRAS');
  addSectionTitle(doc, '1. Deuda Fruta (Cosecha 2025/2026)', 38);
  const deudaFrutaRubroBody = deudaFruta.rubroTotals.map((row) => [
    row.rubro.replace('Total ', ''),
    currencyFormatter.format(row.amount),
    formatPercentage(row.percentage),
  ]);
  deudaFrutaRubroBody.push(['TOTAL GENERAL', currencyFormatter.format(deudaFruta.totalAmount), formatPercentage(deudaFruta.totalPercentage || (deudaFruta.totalAmount ? 1 : 0))]);
  autoTable(doc, {
    startY: 52,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Cosecha / Rubro', 'Importe U$D', '%']],
    body: deudaFrutaRubroBody,
    headStyles: { fillColor: [27, 67, 50], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    head: [['Vía', 'Rubro', 'Proveedor', 'Importe U$D', '%']],
    body: deudaFruta.details.map((item) => [
      item.via || '-',
      item.rubro || '-',
      item.provider,
      currencyFormatter.format(item.amount),
      formatPercentage(item.percentage),
    ]),
    headStyles: { fillColor: [45, 106, 79], textColor: 255 },
    styles: { fontSize: 7, cellPadding: 1.8 },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 38 },
      2: { cellWidth: 64 },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 31, halign: 'right' },
    },
  });

  doc.addPage();
  addHeader(doc, week, 'INFORME SEMANAL DE COMPRAS');
  addSectionTitle(doc, '2. Deuda Proveedores', 38);
  autoTable(doc, {
    startY: 52,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Total General', 'Importe U$D', '%']],
    body: [['Deuda Proveedores', currencyFormatter.format(deudaProveedores.totalAmount), formatPercentage(deudaProveedores.totalPercentage || (deudaProveedores.totalAmount ? 1 : 0))]],
    headStyles: { fillColor: [27, 67, 50], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    head: [['Vía', 'Rubro', 'Proveedor', 'Importe U$D', '%']],
    body: deudaProveedores.details.map((item) => [
      item.via || '-',
      item.rubro || '-',
      item.provider,
      currencyFormatter.format(item.amount),
      formatPercentage(item.percentage),
    ]),
    headStyles: { fillColor: [45, 106, 79], textColor: 255 },
    styles: { fontSize: 7, cellPadding: 1.8 },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 32 },
      2: { cellWidth: 70 },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 31, halign: 'right' },
    },
  });

  doc.addPage();
  addHeader(doc, week, 'INFORME SEMANAL DE COMPRAS');
  addSectionTitle(doc, '3. Insumos Campaña / Pasta', 38);
  autoTable(doc, {
    startY: 52,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Sector', 'Total', 'Cumplido', 'Pendiente']],
    body: [
      ...insumos.rows.map((row) => [
        row.sector,
        currencyFormatter.format(row.total),
        currencyFormatter.format(row.cumplido),
        currencyFormatter.format(row.pendiente),
      ]),
      ['Totales U$D', currencyFormatter.format(insumos.total.total), currencyFormatter.format(insumos.total.cumplido), currencyFormatter.format(insumos.total.pendiente)],
    ],
    headStyles: { fillColor: [27, 67, 50], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });

  doc.addPage();
  addHeader(doc, week, 'INFORME SEMANAL DE COMPRAS');
  addSectionTitle(doc, '4. Compras Nuevas (Requerimientos sin concretar)', 38);
  autoTable(doc, {
    startY: 52,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Total General', 'Importe U$D', '%']],
    body: [['Compras Nuevas', currencyFormatter.format(comprasNuevas.totalAmount), formatPercentage(comprasNuevas.totalPercentage || (comprasNuevas.totalAmount ? 1 : 0))]],
    headStyles: { fillColor: [27, 67, 50], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    head: [['Vía', 'Rubro', 'Proveedor', 'Importe U$D', '%']],
    body: comprasNuevas.details.map((item) => [
      item.via || '-',
      item.rubro || '-',
      item.provider,
      currencyFormatter.format(item.amount),
      formatPercentage(item.percentage),
    ]),
    headStyles: { fillColor: [45, 106, 79], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 32 },
      2: { cellWidth: 70 },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 31, halign: 'right' },
    },
  });

  addFooter(doc);
  doc.save(`Informe_Compras_Semana_${week.replace('-', '_')}.pdf`);
};
