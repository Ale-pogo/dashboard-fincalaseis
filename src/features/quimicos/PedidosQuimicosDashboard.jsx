import React, { useMemo, useState } from 'react';
import { RefreshCw, FlaskConical, CheckCircle2, Clock3 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useQuimicosReader } from '../../hooks/useQuimicosReader';

const COLORES = ['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d'];

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const getChartData = (items, field) => {
  const grouped = items.reduce((acc, item) => {
    const key = String(item[field] || 'Sin dato').trim() || 'Sin dato';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const PedidosQuimicosDashboard = () => {
  const { data, summaryTable, loading, error } = useQuimicosReader('/data/pedido quimicos campaña 2026 valorizado.xlsx');

  const resumen = useMemo(() => {
    const cumplido = data.filter((item) => String(item.estado || '').trim().toLowerCase() === 'cumplido');
    const pendiente = data.filter((item) => String(item.estado || '').trim().toLowerCase() !== 'cumplido');

    const totalGeneral = data.reduce((sum, item) => sum + (Number(item.importe) || 0), 0);
    const totalCumplido = cumplido.reduce((sum, item) => sum + (Number(item.importe) || 0), 0);
    const totalPendiente = pendiente.reduce((sum, item) => sum + (Number(item.importe) || 0), 0);
    const cantidadCumplida = cumplido.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
    const cantidadPendiente = pendiente.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);

    return {
      totalGeneral,
      totalCumplido,
      totalPendiente,
      cantidadCumplida,
      cantidadPendiente,
      registros: data.length,
      cumplidoCount: cumplido.length,
      pendienteCount: pendiente.length,
    };
  }, [data]);

  const porSector = useMemo(() => getChartData(data, 'sector'), [data]);
  const [tableFilters, setTableFilters] = useState({
    sector: '',
    articulo: '',
    estado: ''
  });

  const datosDetalle = useMemo(
    () => data.map((item) => ({
      sector: item.sector,
      cantidad: item.cantidad,
      um: item.um,
      articulo: item.articulo,
      total: Number(item.importe) || 0,
      estado: item.estado,
    })),
    [data]
  );

  const uniqueFilterValues = useMemo(() => ({
    sector: [...new Set(datosDetalle.map(item => String(item.sector || '').trim()).filter(Boolean))].sort(),
    articulo: [...new Set(datosDetalle.map(item => String(item.articulo || '').trim()).filter(Boolean))].sort(),
    estado: [...new Set(datosDetalle.map(item => String(item.estado || '').trim()).filter(Boolean))].sort(),
  }), [datosDetalle]);

  const datosDetalleFiltrados = useMemo(() => {
    return datosDetalle.filter((item) => {
      const sectorMatches = !tableFilters.sector || String(item.sector || '').toLowerCase().includes(tableFilters.sector.toLowerCase());
      const articuloMatches = !tableFilters.articulo || String(item.articulo || '').toLowerCase().includes(tableFilters.articulo.toLowerCase());
      const estadoMatches = !tableFilters.estado || String(item.estado || '').toLowerCase().includes(tableFilters.estado.toLowerCase());
      return sectorMatches && articuloMatches && estadoMatches;
    });
  }, [datosDetalle, tableFilters]);

  const handleTableFilterChange = (key, value) => {
    setTableFilters(prev => ({ ...prev, [key]: value }));
  };

  const chartTooltip = (value, name, props) => [`${value} (${props.payload?.percentage ?? 0}%)`, name];

  const makePieChartData = (items, label) => {
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return items.map((item) => ({
      ...item,
      percentage: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0,
      label,
      displayLabel: `${item.name} (${item.value})`,
    }));
  };

  const pieData = useMemo(() => {
    const insumos = data.filter((item) => String(item.sector || '').trim().toLowerCase() === 'insumos de campaña');
    const produccion = data.filter((item) => String(item.sector || '').trim().toLowerCase() === 'produccion de pasta');

    return [
      {
        title: 'INSUMOS DE CAMPAÑA',
        data: makePieChartData(getChartData(insumos, 'estado'), 'INSUMOS DE CAMPAÑA'),
      },
      {
        title: 'PRODUCCION DE PASTA',
        data: makePieChartData(getChartData(produccion, 'estado'), 'PRODUCCION DE PASTA'),
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-verde-esmeralda font-medium">
        <RefreshCw className="w-8 h-8 animate-spin mb-2" />
        <p>Procesando pedidos de químicos desde la planilla Excel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
        <strong>Error en la lectura del archivo:</strong> {error}. Asegúrate de haber copiado el archivo "pedido quimicos campaña 2026 valorizado.xlsx" en la carpeta public/data/.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-verde-bosque">Módulo 3: Pedidos Químicos</h1>
        <p className="text-sm text-gray-500">Análisis de cumplimiento desde la pestaña Datos del archivo pedido quimicos campaña 2026 valorizado.xlsx.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6 items-start">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100 h-full">
          <h2 className="text-sm font-semibold text-verde-bosque uppercase tracking-wide mb-4">Resumen</h2>

          <div className="space-y-3">
            <div className="rounded-2xl border border-green-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-verde-bosque">
                <CheckCircle2 className="w-5 h-5" />
                <p className="text-xs uppercase tracking-wider">Cumplido</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-verde-bosque">{currencyFormatter.format(resumen.totalCumplido)}</p>
              <p className="text-sm text-gray-500">{resumen.cantidadCumplida} unidades · {resumen.cumplidoCount} registros</p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock3 className="w-5 h-5" />
                <p className="text-xs uppercase tracking-wider">Pendiente</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-700">{currencyFormatter.format(resumen.totalPendiente)}</p>
              <p className="text-sm text-gray-500">{resumen.cantidadPendiente} unidades · {resumen.pendienteCount} registros</p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-4">
              <div className="flex items-center gap-2 text-verde-bosque">
                <FlaskConical className="w-5 h-5" />
                <p className="text-xs uppercase tracking-wider">Total general</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-verde-bosque">{currencyFormatter.format(resumen.totalGeneral)}</p>
              <p className="text-sm text-gray-500">{resumen.registros} registros cargados</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100">
            <h3 className="text-sm font-bold text-verde-bosque uppercase tracking-wide mb-3">Resumen de la tabla</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-green-50 text-verde-bosque font-bold border-b border-green-100">
                    <th className="p-3">Sector</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Cumplido</th>
                    <th className="p-3 text-right">Pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {summaryTable.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-gray-400 italic">No se encontró la tabla de resumen en la hoja Datos.</td>
                    </tr>
                  ) : (
                    summaryTable.map((item) => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${item.isTotal ? 'bg-green-50 font-semibold text-verde-bosque' : 'hover:bg-green-50/50'}`}
                      >
                        <td className="p-3 text-gray-700">{item.label}</td>
                        <td className="p-3 text-right font-semibold text-gray-800">{currencyFormatter.format(item.total)}</td>
                        <td className="p-3 text-right font-semibold text-gray-800">{currencyFormatter.format(item.cumplido)}</td>
                        <td className="p-3 text-right font-semibold text-gray-800">{currencyFormatter.format(item.pendiente)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100">
            <h3 className="text-sm font-bold text-verde-bosque uppercase tracking-wide mb-3">Distribución de pedidos</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {pieData.map((chart) => (
                <div key={chart.title} className="border border-green-100 rounded-xl p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-verde-bosque mb-3">{chart.title}</h4>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chart.data}
                          cx="50%"
                          cy="45%"
                          innerRadius={46}
                          outerRadius={72}
                          paddingAngle={4}
                          dataKey="value"
                          labelLine={false}
                        >
                          {chart.data.map((entry, index) => (
                            <Cell key={`${entry.name}-${index}`} fill={COLORES[index % COLORES.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={chartTooltip} contentStyle={{ backgroundColor: '#f7f9f6', borderColor: '#d8f3dc', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => value} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100">
            <h3 className="text-sm font-bold text-verde-bosque uppercase tracking-wide mb-3">Detalle de gastos</h3>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-green-50 text-verde-bosque font-bold border-b border-green-100">
                    <th className="p-3 align-top">
                      <div className="flex flex-col gap-2">
                        <span>Sector</span>
                        <select
                          value={tableFilters.sector}
                          onChange={(e) => handleTableFilterChange('sector', e.target.value)}
                          className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                        >
                          <option value="">Todos</option>
                          {uniqueFilterValues.sector.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="p-3">Cantidad</th>
                    <th className="p-3">U/M</th>
                    <th className="p-3 align-top">
                      <div className="flex flex-col gap-2">
                        <span>Articulo</span>
                        <select
                          value={tableFilters.articulo}
                          onChange={(e) => handleTableFilterChange('articulo', e.target.value)}
                          className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                        >
                          <option value="">Todos</option>
                          {uniqueFilterValues.articulo.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 align-top">
                      <div className="flex flex-col gap-2">
                        <span>Estado</span>
                        <select
                          value={tableFilters.estado}
                          onChange={(e) => handleTableFilterChange('estado', e.target.value)}
                          className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                        >
                          <option value="">Todos</option>
                          {uniqueFilterValues.estado.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {datosDetalleFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400 italic">No hay registros para mostrar.</td>
                    </tr>
                  ) : (
                    datosDetalleFiltrados.map((item, index) => (
                      <tr key={`${item.articulo}-${index}`} className="hover:bg-green-50/50 transition-colors">
                        <td className="p-3 text-gray-700">{item.sector}</td>
                        <td className="p-3 text-gray-700">{item.cantidad}</td>
                        <td className="p-3 text-gray-700">{item.um}</td>
                        <td className="p-3 text-gray-700">{item.articulo}</td>
                        <td className="p-3 text-right font-semibold text-gray-800">{currencyFormatter.format(item.total)}</td>
                        <td className="p-3 text-gray-700">{item.estado}</td>
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
