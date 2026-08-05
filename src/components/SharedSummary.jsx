import React from 'react';
import { useSharedSummary } from '../hooks/useSharedSummary';
import { Loader2, AlertTriangle, Factory, Leaf, Banknote, FlaskConical, Globe2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList, Cell } from 'recharts';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const getValueFontSize = (value) => {
  const length = String(value).replace(/\s+/g, '').length;

  if (length > 24) return '0.82rem';
  if (length > 18) return '0.95rem';
  if (length > 12) return '1.05rem';
  return '1.2rem';
};

const summaryCards = [
  {
    key: 'deudaProveedoresUSD',
    label: 'Deuda Proveedores',
    icon: Factory,
    color: '#ede9fe',
    border: '#c4b5fd',
    formatter: (value) => currencyFormatter.format(value),
  },
  {
    key: 'deudaFruta25USD',
    label: 'Deuda Fruta 25',
    icon: Leaf,
    color: '#dbeafe',
    border: '#93c5fd',
    formatter: (value) => currencyFormatter.format(value),
  },
  {
    key: 'deudaFruta26USD',
    label: 'Deuda Fruta 26',
    icon: Leaf,
    color: '#d1fae5',
    border: '#6ee7b7',
    formatter: (value) => currencyFormatter.format(value),
  },
  {
    key: 'comprasNuevasUSD',
    label: 'Compras nuevas',
    icon: Banknote,
    color: '#fef3c7',
    border: '#fde68a',
    formatter: (value) => currencyFormatter.format(value),
  },
  {
    key: 'quimicosTotalUSD',
    label: 'Pedidos Químicos – Pendientes',
    icon: FlaskConical,
    color: '#fee2e2',
    border: '#fecaca',
    formatter: (value) => currencyFormatter.format(value),
  },
  {
    key: 'globalUSD',
    label: 'Global',
    icon: Globe2,
    color: '#e0f2fe',
    border: '#bae6fd',
    formatter: (value) => currencyFormatter.format(value),
  },
];

export const SharedSummary = () => {
  const { summary, loading, errors } = useSharedSummary();

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-verde-bosque">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm font-medium">Actualizando resumen global...</p>
        </div>
      </div>
    );
  }

  if (errors.length > 0) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-semibold">No se pudo cargar todos los resúmenes.</p>
        </div>
        <p className="mt-2 text-sm text-amber-900/80">Revisa los archivos Excel en public/data y vuelve a cargar la página.</p>
      </div>
    );
  }

  const rawData = summaryCards
    .filter((card) => card.key !== 'globalUSD')
    .map((card) => ({
      name: card.label,
      value: summary[card.key] ?? 0,
      fill: card.color,
    }));

  const totalValue = rawData.reduce((s, c) => s + (c.value || 0), 0);
  const chartData = rawData
    .sort((a, b) => b.value - a.value)
    .map((d) => {
      const percent = totalValue ? (d.value / totalValue) * 100 : 0;
      return { ...d, percent, labelValue: `${currencyFormatter.format(d.value)} (${percent.toFixed(1)}%)` };
    });

  const formatTooltip = (value) => currencyFormatter.format(value);

  return (
    <div className="mb-8 rounded-3xl border border-green-100 bg-gradient-to-br from-white via-emerald-50 to-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Resumen global</p>
          <h2 className="text-xl font-bold text-verde-bosque">Indicadores claves</h2>
        </div>
        <p className="text-sm text-gray-500">Se actualiza desde los tres módulos Excel.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[65%_35%]">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:auto-rows-fr">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            const valueText = card.formatter(summary[card.key] ?? 0);

            return (
              <div
                key={card.key}
                className="flex h-full min-h-[120px] min-w-0 flex-col justify-between overflow-hidden rounded-3xl border p-3 shadow-sm sm:p-4"
                style={{ backgroundColor: card.color, borderColor: card.border }}
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-[10px] uppercase tracking-[0.3em] break-words leading-tight text-slate-700 sm:text-[11px] xl:text-[10px]">
                    {card.label}
                  </p>
                  {Icon ? <Icon className="h-5 w-5 shrink-0 text-slate-500 sm:h-6 sm:w-6" /> : null}
                </div>
                <p
                  className="mt-3 w-full min-w-0 overflow-hidden text-left font-bold leading-snug text-slate-900 [overflow-wrap:anywhere] break-words hyphens-auto"
                  style={{ fontSize: getValueFontSize(valueText) }}
                >
                  {valueText}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex min-h-[340px] flex-col overflow-hidden rounded-3xl border border-green-100 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Vista rápida</p>
              <h3 className="text-lg font-semibold text-verde-bosque">Comparación de indicadores</h3>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={Math.min(400, 80 * chartData.length)}>
              <BarChart layout="vertical" data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1faf6" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => currencyFormatter.format(value)}
                  tick={{ fontSize: 11, fill: '#4b5563' }}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  tick={{ fontSize: 12, fill: '#0f172a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={formatTooltip}
                  cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }}
                  contentStyle={{ borderRadius: 12, borderColor: '#d8f3dc', backgroundColor: '#ffffff' }}
                />
                <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={18} isAnimationActive={false}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="labelValue"
                    position="right"
                    offset={8}
                    style={{ fill: '#064e3b', fontSize: 12, fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
