import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const cleaned = String(value)
    .trim()
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const useQuimicosReader = (filePath) => {
  const [data, setData] = useState([]);
  const [summaryTable, setSummaryTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(filePath);
        if (!response.ok) throw new Error('No se pudo cargar el archivo Excel');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const preferredSheet =
          workbook.SheetNames.find((name) => normalizeText(name) === 'tabla 1') ||
          workbook.SheetNames.find((name) => normalizeText(name) === 'datos') ||
          workbook.SheetNames[0];
        const worksheet = workbook.Sheets[preferredSheet];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });

        const headerRowIndex = rows.findIndex((row) => {
          const values = row.map((cell) => normalizeText(cell));
          return (
            values.includes('cantidad') &&
            values.includes('articulo') &&
            values.includes('sector') &&
            values.includes('estado')
          );
        });

        if (headerRowIndex === -1) {
          throw new Error('No se encontró el encabezado esperado en la pestaña Datos.');
        }

        const headers = rows[headerRowIndex].map((cell) => normalizeText(cell));
        const getColumnIndex = (headerName) => headers.findIndex((value) => value === normalizeText(headerName));

        const cantidadIndex = getColumnIndex('Cantidad');
        const umIndex = getColumnIndex('U/M');
        const articuloIndex = getColumnIndex('Articulo');
        const sectorIndex = getColumnIndex('Sector');
        const totalIndex = ['Total', 'Importe']
          .map((headerName) => getColumnIndex(headerName))
          .find((index) => index !== -1);
        const estadoIndex = getColumnIndex('Estado');

        const parseSummaryRows = (rows) => {
          const startIndex = rows.findIndex((row) => {
            if (!Array.isArray(row)) return false;
            return normalizeText(row[9]) === 'sector' && normalizeText(row[10]) === 'total';
          });

          if (startIndex === -1) return [];

          const summaryRows = [];
          const headerRow = rows[startIndex].map((cell) => normalizeText(cell));
          const sectorIndex = headerRow.findIndex((value) => value === 'sector');
          const totalIndex = headerRow.findIndex((value) => value === 'total');
          const cumplidoIndex = headerRow.findIndex((value) => value === 'cumplido');
          const pendienteIndex = headerRow.findIndex((value) => value === 'pendiente');

          if (sectorIndex === -1 || totalIndex === -1 || pendienteIndex === -1) return [];

          for (let i = startIndex + 1; i < rows.length; i += 1) {
            const row = rows[i];
            if (!Array.isArray(row)) break;

            const label = String(row[sectorIndex] ?? '').trim();
            if (!label) break;
            const labelNormalized = normalizeText(label);

            // Stop if we reached the data header or a new section
            if (['solicita', 'cantidad', 'sector'].includes(labelNormalized)) break;

            // Skip rows that are just currency symbols or pure numbers (e.g. '$' or '1.6')
            if (labelNormalized === '$' || /^\d+(?:[.,]\d+)?$/.test(labelNormalized)) continue;

            const rowTotal = parseNumber(row[totalIndex]);
            const rowCumplido = cumplidoIndex !== -1 ? parseNumber(row[cumplidoIndex]) : 0;
            const rowPendiente = parseNumber(row[pendienteIndex]);

            if (labelNormalized.startsWith('totales')) {
              const isUSD = /u\$?d|usd|u\$/.test(labelNormalized);
              if (isUSD) {
                summaryRows.push({
                  id: summaryRows.length,
                  label,
                  total: rowTotal,
                  cumplido: rowCumplido,
                  pendiente: rowPendiente,
                  isTotal: true,
                });
              }
              break;
            }

            summaryRows.push({
              id: summaryRows.length,
              label,
              total: rowTotal,
              cumplido: rowCumplido,
              pendiente: rowPendiente,
              isTotal: false,
            });
          }

          return summaryRows;
        };

        const summaryTable = parseSummaryRows(rows);
        const dataRows = rows.slice(headerRowIndex + 1);
        const formattedData = dataRows
          .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''))
          .map((row, index) => {
            const values = Array.isArray(row) ? row : [];

            return {
              id: index,
              cantidad: parseNumber(values[cantidadIndex]),
              um: String(values[umIndex] ?? '').trim() || 'S/I',
              articulo: String(values[articuloIndex] ?? '').trim() || 'Sin artículo',
              sector: String(values[sectorIndex] ?? '').trim() || 'Sin sector',
              total: parseNumber(values[totalIndex]),
              importe: parseNumber(values[totalIndex]),
              estado: String(values[estadoIndex] ?? '').trim() || 'Sin estado',
            };
          })
          .filter((item) => item.articulo || item.sector || item.estado || item.cantidad || item.importe);

        if (!cancelled) {
          setData(formattedData);
          setSummaryTable(summaryTable);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  return { data, summaryTable, loading, error };
};
