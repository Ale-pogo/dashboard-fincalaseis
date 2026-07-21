import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export const useExcelReader = (filePath) => {
  const [data, setData] = useState([]);
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
        
        // Detectamos la hoja con nombre similar, para evitar errores por mayúsculas o espacios
        const preferredNames = [
          'Hoja de pedido',
          'Hoja de Pedidos',
          'Hoja De Pedidos',
          'Hoja1',
          'Hoja2'
        ];

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

        const sheetName = workbook.SheetNames.find((name) =>
          preferredNames
            .map(normalizeSheetName)
            .includes(normalizeSheetName(name))
        );

        if (!sheetName) {
          throw new Error(
            `No se encontró la hoja esperada. Hojas disponibles: ${workbook.SheetNames.join(', ')}`
          );
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convertimos a JSON indicando que los encabezados están en la fila 8 (index 7)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 8) {
          setData([]);
          return;
        }

        // Fila 8 contiene los títulos de las columnas
        const headers = jsonData[7]; 
        const rows = jsonData.slice(8); // Datos reales desde la fila 9 en adelante

        const formattedData = rows
          .filter(row => row.length > 0) // Ignorar filas completamente vacías
          .map((row, index) => {
            // Mapeamos dinámicamente las columnas usando la estructura que especificaste
            return {
              id: index,
              solicita: row[0] || 'No especificado', // Columna A
              rubro: row[2] || 'Sin rubro',           // Columna C
              cantidad: row[3] ?? 'N/A',              // Columna D
              um: row[4] || 'N/A',                    // Columna E
              articulo: row[5] || 'Sin artículo',     // Columna F
              estado: row[11] || 'Pendiente',         // Columna L
              semana: row[14] || 'Sin Semana',        // Columna O (Entrega)
              fechaEntrega: row[10] || '',            // Columna K (Fecha por si acaso)
            };
          });

        setData(formattedData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filePath]);

  return { data, loading, error };
};