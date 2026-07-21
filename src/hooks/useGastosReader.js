import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

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

const findSheetName = (workbook, preferredNames) => {
  const normalizedPreferences = preferredNames.map(normalizeSheetName);
  return workbook.SheetNames.find((name) =>
    normalizedPreferences.includes(normalizeSheetName(name))
  );
};

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

const getCurrentWeekStrings = () => {
  const date = new Date();
  const tmpDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmpDate.getUTCDay() || 7;
  tmpDate.setUTCDate(tmpDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmpDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmpDate - yearStart) / 86400000 + 1) / 7);
  return {
    full: `${tmpDate.getUTCFullYear()}-${weekNo}`,
    year: String(tmpDate.getUTCFullYear()),
    number: String(weekNo),
    fullWeek: String(weekNo),
  };
};

const normalizeWeekValue = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const raw = String(value).trim().toLowerCase().replace(/\s+/g, '');
  if (!raw) return '';

  const match = raw.match(/(\d{4})[^\d]*(\d{1,2})/);
  if (match) {
    return { year: match[1], week: match[2] };
  }

  const simpleWeekMatch = raw.match(/^(\d{1,2})$/);
  if (simpleWeekMatch) {
    return { year: null, week: simpleWeekMatch[1] };
  }

  return { year: null, week: raw };
};

const matchesCurrentWeek = (value, currentWeek) => {
  const normalizedValue = normalizeWeekValue(value);
  if (!normalizedValue || !normalizedValue.week) return false;

  const sameYear = !normalizedValue.year || normalizedValue.year === currentWeek.year;
  const sameWeek = normalizedValue.week === currentWeek.number || normalizedValue.week === currentWeek.fullWeek;

  return sameYear && sameWeek;
};

const parseGastosSheetSummary = (rows) => {
  const totals = {
    deudaProveedoresUSD: 0,
    deudaFrutaUSD: 0,
    comprasNuevasUSD: 0,
  };
  const currentWeek = getCurrentWeekStrings();

  const headerRowIndex = findHeaderRow(rows, ['rubro', 'importe', 'semana']);
  if (headerRowIndex === -1) return totals;

  const headerRow = rows[headerRowIndex].map((cell) => String(cell || '').toLowerCase());
  const rubroIndex = headerRow.findIndex((cell) => cell.includes('rubro'));
  const importeIndex = headerRow.findIndex(
    (cell) => cell.includes('importe') && (cell.includes('u$d') || cell.includes('usd') || cell.includes('u$s'))
  );
  const semanaIndex = headerRow.findIndex((cell) => cell.includes('semana'));
  const semanaChIndex = headerRow.findIndex((cell) => cell.includes('semanach') || cell.includes('semana ch'));
  if (rubroIndex === -1 || importeIndex === -1 || (semanaIndex === -1 && semanaChIndex === -1)) return totals;

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rowWeekRaw = String(row[semanaIndex] || row[semanaChIndex] || '').trim();
    if (!rowWeekRaw) continue;
    const matchesWeek = matchesCurrentWeek(rowWeekRaw, currentWeek);
    if (!matchesWeek) continue;

    const rubroRaw = String(row[rubroIndex] || '').trim().toLowerCase();
    if (!rubroRaw || rubroRaw.includes('total') || rubroRaw.includes('subtotal')) continue;

    const importeValue = parseCurrencyValue(row[importeIndex]);
    if (rubroRaw.includes('deuda fruta')) {
      totals.deudaFrutaUSD += importeValue;
    } else if (rubroRaw === 'deuda' || rubroRaw.includes('deuda proveedor') || rubroRaw.includes('deuda proveedores')) {
      totals.deudaProveedoresUSD += importeValue;
    } else if (rubroRaw.includes('nuevo') || rubroRaw.includes('compras nueva')) {
      totals.comprasNuevasUSD += importeValue;
    }
  }

  return totals;
};

const findHeaderRow = (rows, matches) => {
  return rows.findIndex((row) =>
    Array.isArray(row) && matches.every((term) =>
      row.some((cell) => typeof cell === 'string' && cell.toLowerCase().includes(term))
    )
  );
};

const parseSummarySheetTotal = (rows, totalColumnLabel) => {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  const headerRowIndex = findHeaderRow(rows, ['suma de importe', 'u$d']);
  if (headerRowIndex === -1) return 0;

  const headerRow = rows[headerRowIndex];
  const totalColumnIndex = headerRow.findIndex(
    (cell) => typeof cell === 'string' && cell.toLowerCase().includes(totalColumnLabel)
  );

  if (totalColumnIndex === -1) return 0;

  return rows.slice(headerRowIndex + 1).reduce((sum, row) => {
    if (!Array.isArray(row)) return sum;
    const label = String(row[0] || row[1] || '').toLowerCase();
    if (label.includes('total')) return sum;
    return sum + parseCurrencyValue(row[totalColumnIndex]);
  }, 0);
};

const parsePagosSemanalSummary = (rows) => {
  const totals = {
    deudaProveedoresUSD: 0,
    deudaFrutaUSD: 0,
    comprasNuevasUSD: 0,
  };

  const headerRowIndex = findHeaderRow(rows, ['estado', 'rubro', 'u$d']);
  if (headerRowIndex === -1) return totals;

  let currentGroup = '';
  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    const estado = String(row[0] || '').toLowerCase();
    const rubroCell = String(row[1] || '').toLowerCase();
    const totalValue = parseCurrencyValue(row[5]);

    if (estado.includes('total') || rubroCell.includes('total')) break;
    if (rubroCell) currentGroup = rubroCell;
    if (!currentGroup) continue;

    if (currentGroup === 'deuda fruta') {
      totals.deudaFrutaUSD += totalValue;
    }

    if (currentGroup === 'nuevo') {
      totals.comprasNuevasUSD += totalValue;
    }

    if (currentGroup === 'deuda') {
      totals.deudaProveedoresUSD += totalValue;
    }
  }

  return totals;
};

export const useGastosReader = (filePath) => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    deudaProveedoresUSD: 0,
    deudaFrutaUSD: 0,
    comprasNuevasUSD: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('No se pudo cargar el archivo Excel');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const sheetName = findSheetName(workbook, ['semanal', 'semana', 'semana ']);

        if (!sheetName) {
          throw new Error(
            `No se encontró la hoja "Semanal". Hojas disponibles: ${workbook.SheetNames.join(', ')}`
          );
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length <= 7) {
          setData([]);
          setSummary({ deudaProveedoresUSD: 0, deudaFrutaUSD: 0, comprasNuevasUSD: 0 });
          return;
        }

        const rows = jsonData.slice(8);
        const formattedData = rows
          .filter(row => row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''))
          .map((row, index) => {
            const importeRaw = row[10];
            const importe = typeof importeRaw === 'number'
              ? importeRaw
              : parseFloat(String(importeRaw || '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;

            return {
              id: index,
              semana: String(row[0] || '').trim() || 'Sin semana',
              proveedor: String(row[1] || '').trim() || 'Sin proveedor',
              rubro: String(row[4] || '').trim() || 'Sin rubro',
              via: String(row[5] || '').trim() || 'Sin via',
              formaPago: String(row[6] || '').trim() || 'Sin forma de pago',
              importe,
              estado: String(row[15] || '').trim() || 'Sin estado',
            };
          });

        const gastosRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
        const gastosSummary = parseGastosSheetSummary(gastosRows);

        setData(formattedData);
        setSummary(gastosSummary);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filePath]);

  return { data, loading, error, summary };
};
