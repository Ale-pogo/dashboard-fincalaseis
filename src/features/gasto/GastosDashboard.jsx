import React, { useMemo, useState } from 'react';
import { useGastosReader } from '../../hooks/useGastosReader';
import { GraficoTorta } from '../compras/GraficoTorta';
import { RefreshCw } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const ordenarSemanas = (a, b) => {
  const parse = (value) => {
    const match = String(value).match(/(\d{4})\s*-\s*(\d{1,2})/);
    return match ? [Number(match[1]), Number(match[2])] : [0, 0];
  };

  const [anioA, semanaA] = parse(a);
  const [anioB, semanaB] = parse(b);

  if (anioA !== anioB) return anioB - anioA;
  return semanaB - semanaA;
};

const agruparPor = (items, field) =>
  items.reduce((acc, item) => {
    const key = item[field] || 'Sin dato';
    acc[key] = (acc[key] || 0) + item.importe;
    return acc;
  }, {});

const mapGroupData = (group) =>
  Object.entries(group).map(([name, value]) => ({ name, value }));

export const GastosDashboard = () => {
  const { data, loading, error } = useGastosReader('/data/Gastos semanaless.xlsx');
  const [selectedSemana, setSelectedSemana] = useState('Todos');
  const [selectedView, setSelectedView] = useState('deudas');
  const [selectedChartFilter, setSelectedChartFilter] = useState(null);
  const [tableFilters, setTableFilters] = useState({
    proveedor: '',
    rubro: '',
    via: '',
    formaPago: '',
    importe: ''
  });

  const semanas = useMemo(() => {
    const lista = [...new Set(data.map(item => item.semana).filter(Boolean))];
    return lista.sort(ordenarSemanas);
  }, [data]);

  const filteredData = useMemo(() => {
    const porSemana = selectedSemana === 'Todos'
      ? data
      : data.filter(item => item.semana === selectedSemana);

    return porSemana.filter((item) => {
      const estado = String(item.estado || '').trim().toLowerCase();
      if (selectedView === 'pagos') return estado === 'pagado';
      return estado !== '' && estado !== 'pagado';
    });
  }, [data, selectedSemana, selectedView]);

  const totalGasto = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.importe, 0),
    [filteredData]
  );

  const datosPorRubro = useMemo(() => mapGroupData(agruparPor(filteredData, 'rubro')), [filteredData]);
  const datosPorVia = useMemo(() => mapGroupData(agruparPor(filteredData, 'via')), [filteredData]);

  const uniqueFilterValues = useMemo(() => ({
    proveedor: [...new Set(filteredData.map(item => String(item.proveedor || '').trim()).filter(Boolean))].sort(),
    rubro: [...new Set(filteredData.map(item => String(item.rubro || '').trim()).filter(Boolean))].sort(),
    via: [...new Set(filteredData.map(item => String(item.via || '').trim()).filter(Boolean))].sort(),
    formaPago: [...new Set(filteredData.map(item => String(item.formaPago || '').trim()).filter(Boolean))].sort(),
  }), [filteredData]);

  const detalleData = useMemo(() => {
    let items = selectedChartFilter
      ? filteredData.filter((item) => String(item[selectedChartFilter.field] ?? '') === String(selectedChartFilter.value))
      : filteredData;

    if (tableFilters.proveedor) {
      items = items.filter((item) => String(item.proveedor || '').toLowerCase().includes(tableFilters.proveedor.toLowerCase()));
    }
    if (tableFilters.rubro) {
      items = items.filter((item) => String(item.rubro || '').toLowerCase().includes(tableFilters.rubro.toLowerCase()));
    }
    if (tableFilters.via) {
      items = items.filter((item) => String(item.via || '').toLowerCase().includes(tableFilters.via.toLowerCase()));
    }
    if (tableFilters.formaPago) {
      items = items.filter((item) => String(item.formaPago || '').toLowerCase().includes(tableFilters.formaPago.toLowerCase()));
    }
    if (tableFilters.importe) {
      items = items.filter((item) => String(item.importe || '').toLowerCase().includes(tableFilters.importe.toLowerCase()));
    }

    return items;
  }, [filteredData, selectedChartFilter, tableFilters]);

  const handleTableFilterChange = (key, value) => {
    setTableFilters(prev => ({ ...prev, [key]: value }));
  };

  const tooltipFormatter = (value, name, props) => [
    `${currencyFormatter.format(value)} (${props.payload?.percentage ?? 0}%)`,
    name,
  ];

  const viewLabel = selectedView === 'pagos' ? 'Pagos' : 'Deudas';

  const handleChartSelection = (entry, field) => {
    const value = entry?.name;

    if (!value) return;

    setSelectedChartFilter((prev) => {
      if (prev?.field === field && prev?.value === value) {
        return null;
      }

      return { field, value };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-verde-esmeralda font-medium">
        <RefreshCw className="w-8 h-8 animate-spin mb-2" />
        <p>Procesando Gastos Semanales desde Excel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
        <strong>Error en la lectura del archivo:</strong> {error}. Asegúrate de haber copiado el archivo "Gastos semanaless.xlsx" en la carpeta public/data/.
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-verde-bosque">Módulo 2: Gastos Semanales</h1>
        <p className="text-sm text-gray-500">Análisis de la pestaña semana del archivo Gastos semanaless.xlsx.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6 items-start">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100 h-full">
          <h2 className="text-sm font-semibold text-verde-bosque uppercase tracking-wide mb-4">Filtros</h2>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Semana</label>
          <select
            value={selectedSemana}
            onChange={(e) => setSelectedSemana(e.target.value)}
            className="w-full p-3 bg-fondo-sitio border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-menta text-gray-700"
          >
            <option value="Todos">Todas las semanas</option>
            {semanas.map(semana => (
              <option key={semana} value={semana}>{semana}</option>
            ))}
          </select>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedView('deudas')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${selectedView === 'deudas' ? 'border-verde-bosque bg-verde-bosque text-white' : 'border-green-200 bg-white text-verde-bosque hover:bg-green-50'}`}
            >
              Deudas
            </button>
            <button
              type="button"
              onClick={() => setSelectedView('pagos')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${selectedView === 'pagos' ? 'border-verde-bosque bg-verde-bosque text-white' : 'border-green-200 bg-white text-verde-bosque hover:bg-green-50'}`}
            >
              Pagos
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-green-100 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">Total {viewLabel}</p>
              <p className="mt-2 text-3xl font-bold text-verde-bosque">{currencyFormatter.format(totalGasto)}</p>
              <p className="text-sm text-gray-500 mt-1">Total por la semana seleccionada</p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">Registros</p>
              <p className="mt-2 text-2xl font-bold text-verde-bosque">{filteredData.length}</p>
              <p className="text-sm text-gray-500 mt-1">Items cargados para la selección actual</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100">
            <h3 className="text-sm font-bold text-verde-bosque uppercase tracking-wide mb-3">Distribución de gastos</h3>
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-4">
              <GraficoTorta
                dataFiltered={datosPorRubro}
                title="Por Rubro"
                groupBy="name"
                chartType="bar"
                tooltipFormatter={tooltipFormatter}
                emptyMessage={`Sin datos de ${viewLabel.toLowerCase()} para graficar.`}
                onChartClick={(entry) => handleChartSelection(entry, 'rubro')}
              />
              <GraficoTorta
                dataFiltered={datosPorVia}
                title="Por Vía"
                groupBy="name"
                tooltipFormatter={tooltipFormatter}
                emptyMessage={`Sin datos de ${viewLabel.toLowerCase()} para graficar.`}
                onChartClick={(entry) => handleChartSelection(entry, 'via')}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-verde-bosque uppercase tracking-wide">Detalle de gastos</h3>
              {selectedChartFilter && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-verde-bosque">
                  Filtrado por {selectedChartFilter.field === 'rubro' ? 'rubro' : 'vía'}: {selectedChartFilter.value}
                </span>
              )}
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-green-50 text-verde-bosque font-bold border-b border-green-100">
                    <th className="p-3 align-top">
                      <div className="flex flex-col gap-2">
                        <span>Proveedor</span>
                        <select
                          value={tableFilters.proveedor}
                          onChange={(e) => handleTableFilterChange('proveedor', e.target.value)}
                          className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                        >
                          <option value="">Todos</option>
                          {uniqueFilterValues.proveedor.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="p-3 align-top">
                      <div className="flex flex-col gap-2">
                        <span>Rubro</span>
                        <select
                          value={tableFilters.rubro}
                          onChange={(e) => handleTableFilterChange('rubro', e.target.value)}
                          className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                        >
                          <option value="">Todos</option>
                          {uniqueFilterValues.rubro.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="p-3 align-top">
                      <div className="flex flex-col gap-2">
                        <span>Vía</span>
                        <select
                          value={tableFilters.via}
                          onChange={(e) => handleTableFilterChange('via', e.target.value)}
                          className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                        >
                          <option value="">Todos</option>
                          {uniqueFilterValues.via.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="p-3 align-top">
                      <div className="flex flex-col gap-2">
                        <span>Forma de pago</span>
                        <select
                          value={tableFilters.formaPago}
                          onChange={(e) => handleTableFilterChange('formaPago', e.target.value)}
                          className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                        >
                          <option value="">Todos</option>
                          {uniqueFilterValues.formaPago.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="p-3 align-top text-right">
                      <div className="flex flex-col gap-2 items-end">
                        <span>Importe U$D</span>
                        <input
                          type="text"
                          value={tableFilters.importe}
                          onChange={(e) => handleTableFilterChange('importe', e.target.value)}
                          placeholder="Filtrar"
                          className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700 text-right"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {detalleData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400 italic">
                        No hay registros para la vista seleccionada.
                      </td>
                    </tr>
                  ) : (
                    detalleData.map((item) => (
                      <tr key={item.id} className="hover:bg-green-50/50 transition-colors">
                        <td className="p-3 text-gray-700">{item.proveedor}</td>
                        <td className="p-3 text-gray-700">{item.rubro}</td>
                        <td className="p-3 text-gray-700">{item.via}</td>
                        <td className="p-3 text-gray-700">{item.formaPago}</td>
                        <td className="p-3 text-right font-semibold text-gray-800">{currencyFormatter.format(item.importe)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
