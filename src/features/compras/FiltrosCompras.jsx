import React from 'react';
import { Calendar, Filter } from 'lucide-react';

export const FiltrosCompras = ({ 
  options, 
  filters, 
  setFilters 
}) => {
  const { solicitaOptions, estadoOptions, anioOptions, semanaOptionsByAnio } = options;
  const semanaOptions = filters.anio && filters.anio !== 'Todos'
    ? (semanaOptionsByAnio[filters.anio] || [])
    : [];

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'anio') {
        next.semana = 'Todos';
      }
      return next;
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100 mb-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 text-verde-bosque font-semibold">
        <Filter className="w-4 h-4 text-verde-esmeralda" />
        <h2 className="text-sm">Panel de Filtros Exploratorios</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Filtro Solicita */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">¿Quién Solicita?</label>
          <select 
            className="w-full p-2.5 bg-fondo-sitio border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-menta text-gray-700"
            value={filters.solicita}
            onChange={(e) => handleFilterChange('solicita', e.target.value)}
          >
            <option value="Todos">Todos</option>
            {solicitaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Filtro Estado */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Estado del Pedido</label>
          <select 
            className="w-full p-2.5 bg-fondo-sitio border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-menta text-gray-700"
            value={filters.estado}
            onChange={(e) => handleFilterChange('estado', e.target.value)}
          >
            <option value="Todos">Todos los Estados</option>
            {estadoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Calendario / Selector de Entrega */}
      <div>
        <label className="flex items-center gap-1 text-xs font-bold uppercase text-gray-500 mb-2">
          <Calendar className="w-4 h-4 text-verde-esmeralda" />
          Calendario de Semanal
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Año</label>
            <select
              className="w-full p-2.5 bg-fondo-sitio border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-menta text-gray-700"
              value={filters.anio}
              onChange={(e) => handleFilterChange('anio', e.target.value)}
            >
              <option value="Todos">Todos los años</option>
              {anioOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Semana</label>
            <select
              className="w-full p-2.5 bg-fondo-sitio border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-menta text-gray-700"
              value={filters.semana}
              onChange={(e) => handleFilterChange('semana', e.target.value)}
              disabled={filters.anio === 'Todos'}
            >
              <option value="Todos">{filters.anio === 'Todos' ? 'Seleccione un año primero' : 'Todas las semanas'}</option>
              {semanaOptions.map(opt => <option key={opt} value={opt}>Semana {opt}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};