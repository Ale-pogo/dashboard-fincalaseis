const XLSX = require('xlsx');
const path = require('path');
const file = path.join(__dirname, 'public', 'data', 'Gastos semanaless.xlsx');

const normalizeSheetName = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '');

const findHeaderRow = (rows, matches) =>
  rows.findIndex((row) =>
    Array.isArray(row) &&
    matches.every((term) =>
      row.some((cell) => typeof cell === 'string' && cell.toLowerCase().includes(term))
    )
  );

const parseCurrencyValue = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value)
    .replace(/\$/g, '')
    .replace(/[^0-9.,-]/g, '')
    .replace(/,/g, '.')
    .trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCurrentWeekString = () => {
  const date = new Date();
  const tmpDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmpDate.getUTCDay() || 7;
  tmpDate.setUTCDate(tmpDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmpDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmpDate - yearStart) / 86400000 + 1) / 7);
  return `${tmpDate.getUTCFullYear()}-${weekNo}`;
};

const parseGastosSheetSummary = (rows) => {
  const totals = {
    deudaProveedoresUSD: 0,
    deudaFrutaUSD: 0,
    comprasNuevasUSD: 0,
  };
  const currentWeek = getCurrentWeekString();

  const headerRowIndex = findHeaderRow(rows, ['rubro', 'importe u$d', 'semana']);
  console.log('headerRowIndex', headerRowIndex);
  if (headerRowIndex === -1) return totals;

  const headerRow = rows[headerRowIndex].map((cell) => String(cell || '').toLowerCase());
  const rubroIndex = headerRow.findIndex((cell) => cell.includes('rubro'));
  const importeIndex = headerRow.findIndex(
    (cell) => cell.includes('importe') && (cell.includes('u$d') || cell.includes('usd') || cell.includes('u$s'))
  );
  const semanaIndex = headerRow.findIndex((cell) => cell.includes('semana'));
  console.log('headerRow', headerRow);
  console.log('indexes', { rubroIndex, importeIndex, semanaIndex });

  if (rubroIndex === -1 || importeIndex === -1 || semanaIndex === -1) return totals;

  let matchedRows = 0;
  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rowWeek = String(row[semanaIndex] || '').trim();
    if (!rowWeek || rowWeek !== currentWeek) continue;
    matchedRows += 1;

    const rubroRaw = String(row[rubroIndex] || '').trim().toLowerCase();
    if (!rubroRaw) continue;
    if (rubroRaw.includes('total')) continue;

    const importeValue = parseCurrencyValue(row[importeIndex]);
    if (rubroRaw.includes('deuda fruta')) {
      totals.deudaFrutaUSD += importeValue;
    } else if (
      rubroRaw === 'deuda' ||
      rubroRaw.includes('deuda proveedor') ||
      rubroRaw.includes('deuda proveedores')
    ) {
      totals.deudaProveedoresUSD += importeValue;
    } else if (rubroRaw.includes('nuevo') || rubroRaw.includes('compras nueva')) {
      totals.comprasNuevasUSD += importeValue;
    }
  }

  console.log('matchedRows', matchedRows);
  return totals;
};

const workbook = XLSX.readFile(file);
const sheetName = workbook.SheetNames.find((name) => normalizeSheetName(name).includes('semanal'));
console.log('sheetName', sheetName);
const worksheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
console.log('rows before header', rows.slice(0, 12));
console.log('current week string', getCurrentWeekString());
console.log('summary', parseGastosSheetSummary(rows));
