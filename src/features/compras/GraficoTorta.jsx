import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from 'recharts';

const COLORES_VERDES = ['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'];

export const GraficoTorta = ({
  dataFiltered,
  title,
  groupBy = 'estado',
  emptyMessage = 'Sin datos suficientes para graficar.',
  chartType = 'pie',
  tooltipFormatter,
  onChartClick,
}) => {
  const formatTooltip = tooltipFormatter || ((value, name, props) => [`${value} (${props.payload?.percentage ?? 0}%)`, name]);

  const procesarDatosGrafico = () => {
    const conteo = {};

    dataFiltered.forEach(item => {
      const clave = item[groupBy] || 'No especificado';
      const cantidad = typeof item.value === 'number' ? item.value : 1;
      conteo[clave] = (conteo[clave] || 0) + cantidad;
    });

    const total = Object.values(conteo).reduce((sum, value) => sum + value, 0);

    return Object.keys(conteo).map(key => ({
      name: key,
      value: conteo[key],
      percentage: total > 0 ? Number(((conteo[key] / total) * 100).toFixed(1)) : 0,
    }));
  };

  const chartData = procesarDatosGrafico();

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-green-100 flex items-center justify-center h-64 text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  if (chartType === 'bar') {
    return (
      <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100 h-full">
        {title && (
          <h3 className="text-sm font-bold text-verde-bosque uppercase tracking-wide mb-4">
            {title}
          </h3>
        )}
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={formatTooltip}
                contentStyle={{ backgroundColor: '#f7f9f6', borderColor: '#d8f3dc', borderRadius: '8px' }}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                onClick={(entry) => onChartClick?.(entry)}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES_VERDES[index % COLORES_VERDES.length]} />
                ))}
                <LabelList dataKey="percentage" position="top" formatter={(value) => `${value}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-xs border border-green-100">
      {title && (
        <h3 className="text-sm font-bold text-verde-bosque uppercase tracking-wide mb-2">
          {title}
        </h3>
      )}
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius="45%"
              outerRadius="70%"
              paddingAngle={12}
              dataKey="value"
              labelLine={false}
              label={false}
              onClick={(entry) => onChartClick?.(entry)}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORES_VERDES[index % COLORES_VERDES.length]} />
              ))}
              <LabelList
                dataKey="percentage"
                position="outside"
                offset={10}
                formatter={(value) => `${value}%`}
                style={{ fill: '#166534', fontSize: 11, fontWeight: 600 }}
              />
            </Pie>
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ backgroundColor: '#f7f9f6', borderColor: '#d8f3dc', borderRadius: '8px' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};