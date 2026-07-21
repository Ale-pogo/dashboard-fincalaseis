import React, { useMemo, useState } from 'react';

export const GrillaData = ({ dataFiltered }) => {
  const [filters, setFilters] = useState({
    rubro: '',
    cantidad: '',
    um: '',
    articulo: '',
    estado: 'Todos'
  });

  const [activeFilter, setActiveFilter] = useState(null);

  const uniqueValues = useMemo(() => ({
    rubro: [...new Set(dataFiltered.map(item => String(item.rubro ?? '').trim()).filter(Boolean))].sort(),
    um: [...new Set(dataFiltered.map(item => String(item.um ?? '').trim()).filter(Boolean))].sort(),
    articulo: [...new Set(dataFiltered.map(item => String(item.articulo ?? '').trim()).filter(Boolean))].sort(),
    estado: [...new Set(dataFiltered.map(item => String(item.estado ?? '').trim()).filter(Boolean))].sort()
  }), [dataFiltered]);

  const filteredRows = useMemo(() => {
    return dataFiltered.filter(item => {
      const rubro = String(item.rubro ?? '').toLowerCase();
      const cantidad = String(item.cantidad ?? '').toLowerCase();
      const um = String(item.um ?? '').toLowerCase();
      const articulo = String(item.articulo ?? '').toLowerCase();
      const estado = String(item.estado ?? '').toLowerCase();

      const matchesRubro = !filters.rubro || rubro.includes(filters.rubro.toLowerCase());
      const matchesCantidad = !filters.cantidad || cantidad.includes(filters.cantidad.toLowerCase());
      const matchesUm = !filters.um || um.includes(filters.um.toLowerCase());
      const matchesArticulo = !filters.articulo || articulo.includes(filters.articulo.toLowerCase());
      const matchesEstado = filters.estado === 'Todos' || estado === filters.estado.toLowerCase();

      return matchesRubro && matchesCantidad && matchesUm && matchesArticulo && matchesEstado;
    });
  }, [dataFiltered, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-green-100 overflow-hidden">
      <div className="bg-verde-esmeralda px-5 py-3 flex justify-between items-center text-white">
        <h3 className="font-semibold text-sm uppercase tracking-wider">Registros Encontrados</h3>
        <span className="bg-verde-bosque px-3 py-1 rounded-full text-xs font-bold">
          {filteredRows.length} Filas
        </span>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-green-50 text-verde-bosque font-bold border-b border-green-100 sticky top-0">
              <th className="p-3 align-top">
                <div className="flex flex-col gap-1">
                  <span>Rubro</span>
                  <select
                    value={filters.rubro}
                    onChange={(e) => handleFilterChange('rubro', e.target.value)}
                    className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                  >
                    <option value="">Todos</option>
                    {uniqueValues.rubro.map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="p-3 align-top">
                <div className="flex flex-col gap-1">
                  <span>Cantidad</span>
                  <input
                    type="text"
                    value={filters.cantidad}
                    onChange={(e) => handleFilterChange('cantidad', e.target.value)}
                    placeholder="Filtrar"
                    className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                  />
                </div>
              </th>
              <th className="p-3 align-top">
                <div className="flex flex-col gap-1">
                  <span>U/M</span>
                  <select
                    value={filters.um}
                    onChange={(e) => handleFilterChange('um', e.target.value)}
                    className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                  >
                    <option value="">Todos</option>
                    {uniqueValues.um.map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="p-3 align-top">
                <div className="flex flex-col gap-1">
                  <span>Artículo</span>
                  <select
                    value={filters.articulo}
                    onChange={(e) => handleFilterChange('articulo', e.target.value)}
                    className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                  >
                    <option value="">Todos</option>
                    {uniqueValues.articulo.map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="p-3 align-top">
                <div className="flex flex-col gap-1">
                  <span>Estado</span>
                  <select
                    value={filters.estado}
                    onChange={(e) => handleFilterChange('estado', e.target.value)}
                    className="w-full rounded border border-green-200 bg-white px-2 py-1 text-xs text-gray-700"
                  >
                    <option value="Todos">Todos</option>
                    {uniqueValues.estado.map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-50">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400 italic">
                  Ningún registro coincide con los filtros seleccionados. Prueba cambiar los criterios.
                </td>
              </tr>
            ) : (
              filteredRows.map((item) => (
                <tr key={item.id} className="hover:bg-green-50/50 transition-colors">
                  <td className="p-3 text-gray-700">{item.rubro}</td>
                  <td className="p-3 text-gray-700 font-medium">{item.cantidad}</td>
                  <td className="p-3 text-gray-700">{item.um}</td>
                  <td className="p-3 font-medium text-gray-800 break-words">{item.articulo}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      item.estado === 'Cumplido' ? 'bg-green-100 text-green-700' :
                      item.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                      item.estado === 'En Proceso' ? 'bg-blue-100 text-blue-700' :
                      item.estado === 'Anulado' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};