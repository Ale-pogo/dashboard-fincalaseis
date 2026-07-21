import React, { useState, useMemo } from 'react';
import { useExcelReader } from '../../hooks/useExcelReader';
import { FiltrosCompras } from './FiltrosCompras';
import { GraficoTorta } from './GraficoTorta';
import { GrillaData } from './GrillaData';
import { RefreshCw } from 'lucide-react';

export const ComprasDashboard = () => {
  const { data, loading, error } = useExcelReader('/data/Requerimiento - Compras.xlsx');

  const [filters, setFilters] = useState({
    solicita: 'Todos',
    estado: 'Todos',
    anio: 'Todos',
    semana: 'Todos'
  });

  const options = useMemo(() => {
    if (!data.length) return { solicitaOptions: [], estadoOptions: [], anioOptions: [], semanaOptionsByAnio: {} };

    const parseEntrega = (value) => {
      if (typeof value !== 'string') return null;
      const match = value.match(/(\d{4})\s*-\s*(\d{1,2})/);
      return match ? { anio: match[1], semana: match[2] } : null;
    };

    const entregas = data
      .map(item => parseEntrega(item.semana))
      .filter(Boolean);

    const semanasPorAnio = entregas.reduce((acc, item) => {
      if (!acc[item.anio]) acc[item.anio] = [];
      if (!acc[item.anio].includes(item.semana)) acc[item.anio].push(item.semana);
      return acc;
    }, {});

    Object.keys(semanasPorAnio).forEach((anio) => {
      semanasPorAnio[anio].sort((a, b) => Number(a) - Number(b));
    });

    return {
      solicitaOptions: [...new Set(data.map(item => item.solicita))].filter(Boolean),
      estadoOptions: [...new Set(data.map(item => item.estado))].filter(Boolean),
      anioOptions: [...new Set(entregas.map(item => item.anio))].filter(Boolean).sort((a, b) => Number(b) - Number(a)),
      semanaOptionsByAnio: semanasPorAnio,
    };
  }, [data]);

  const dataFiltered = useMemo(() => {
    return data.filter(item => {
      const entrega = item.semana ? item.semana.match(/(\d{4})\s*-\s*(\d{1,2})/) : null;
      const anioItem = entrega ? entrega[1] : null;
      const semanaItem = entrega ? entrega[2] : null;

      const matchSolicita = filters.solicita === 'Todos' || item.solicita === filters.solicita;
      const matchEstado = filters.estado === 'Todos' || item.estado === filters.estado;
      const matchAnio = filters.anio === 'Todos' || anioItem === filters.anio;
      const matchSemana = filters.semana === 'Todos' || semanaItem === filters.semana;
      
      return matchSolicita && matchEstado && matchAnio && matchSemana;
    });
  }, [data, filters]);

  const dataGeneralPorEstado = useMemo(() => {
    return data.filter(item => {
      const entrega = item.semana ? item.semana.match(/(\d{4})\s*-\s*(\d{1,2})/) : null;
      const anioItem = entrega ? entrega[1] : null;
      const semanaItem = entrega ? entrega[2] : null;

      const matchEstado = filters.estado === 'Todos' || item.estado === filters.estado;
      const matchAnio = filters.anio === 'Todos' || anioItem === filters.anio;
      const matchSemana = filters.semana === 'Todos' || semanaItem === filters.semana;

      return matchEstado && matchAnio && matchSemana;
    });
  }, [data, filters.estado, filters.anio, filters.semana]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-verde-esmeralda font-medium">
        <RefreshCw className="w-8 h-8 animate-spin mb-2" />
        <p>Procesando Hoja de Pedidos de Excel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
        <strong>Error en la lectura del archivo:</strong> {error}. Asegúrate de haber copiado el archivo "Requerimiento - Compras.xlsx" en la carpeta public/data/.
      </div>
    );
  }

  const segmentos = ['Planta', 'Bodega', 'Campo', 'Ventas'];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-verde-bosque">Módulo 1: Requerimientos de Compras</h1>
        <p className="text-sm text-gray-500">2025 - 2026</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6 items-stretch">
          <div className="h-full">
            <FiltrosCompras options={options} filters={filters} setFilters={setFilters} />
          </div>

          <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100 h-full">
            <GraficoTorta dataFiltered={dataGeneralPorEstado} title="Total General por Estado" chartType="bar" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100">
          <h3 className="text-sm font-bold text-verde-bosque uppercase tracking-wide mb-3">
            Distribución Porcentual (Segmento Seleccionado)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {segmentos.map(segmento => {
              const datosSegmento = dataFiltered.filter(item => item.solicita === segmento);
              return (
                <GraficoTorta
                  key={segmento}
                  dataFiltered={datosSegmento}
                  title={segmento}
                  groupBy="estado"
                  emptyMessage={`Sin datos para ${segmento}`}
                />
              );
            })}
          </div>
        </div>

        <GrillaData dataFiltered={dataFiltered} />
      </div>
    </div>
  );
};