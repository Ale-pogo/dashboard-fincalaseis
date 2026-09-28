import { useMemo, useState } from 'react';
import { useSharedSummary } from '../hooks/useSharedSummary';
import { Loader2, AlertTriangle, Factory, Leaf, Banknote, FlaskConical, Globe2, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from 'recharts';

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

const getGastoCategory = (rubro) => {
  const normalized = String(rubro || '').trim().toLowerCase();

  if (normalized.includes('deuda fruta')) {
    if (/\b25\b/.test(normalized)) return 'deudaFruta25USD';
    if (/\b26\b/.test(normalized)) return 'deudaFruta26USD';
    return 'deudaFrutaUSD';
  }
  if (normalized === 'deuda' || normalized.includes('deuda proveedor')) return 'deudaProveedoresUSD';
  if (normalized.includes('nuevo') || normalized.includes('compras nueva')) return 'comprasNuevasUSD';
  return null;
};

const ExpenseDetailsTable = ({ rows }) => (
  <div className="overflow-x-auto max-h-96">
    <table className="w-full border-collapse text-left text-sm">
      <thead className="sticky top-0 bg-green-50 text-verde-bosque">
        <tr className="border-b border-green-100">
          <th className="p-3">Proveedor</th>
          <th className="p-3">Descripción</th>
          <th className="p-3 text-right">Importe U$D</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-green-50">
        {rows.length === 0 ? (
          <tr><td colSpan="3" className="p-4 text-center text-gray-500">No hay gastos para este indicador.</td></tr>
        ) : rows.map((item) => (
          <tr key={item.id} className="hover:bg-green-50/50">
            <td className="p-3 text-gray-700">{item.proveedor}</td>
            <td className="p-3 text-gray-700">{item.descripcion}</td>
            <td className="p-3 text-right font-medium text-gray-800">{currencyFormatter.format(item.importe)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ChemicalDetailsTable = ({ rows }) => (
  <div className="overflow-x-auto max-h-96">
    <table className="w-full border-collapse text-left text-sm">
      <thead className="sticky top-0 bg-green-50 text-verde-bosque">
        <tr className="border-b border-green-100">
          <th className="p-3">Sector</th>
          <th className="p-3 text-right">Cantidad</th>
          <th className="p-3">U/M</th>
          <th className="p-3">Artículo</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-green-50">
        {rows.length === 0 ? (
          <tr><td colSpan="4" className="p-4 text-center text-gray-500">No hay pedidos pendientes.</td></tr>
        ) : rows.map((item) => (
          <tr key={item.id} className="hover:bg-green-50/50">
            <td className="p-3 text-gray-700">{item.sector}</td>
            <td className="p-3 text-right text-gray-700">{item.cantidad}</td>
            <td className="p-3 text-gray-700">{item.um}</td>
            <td className="p-3 text-gray-700">{item.articulo}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SharedSummary = () => {
  const { summary, loading, errors, gastosData, quimicosData } = useSharedSummary();
  const [selectedCardKey, setSelectedCardKey] = useState(null);
  const selectedCard = summaryCards.find((card) => card.key === selectedCardKey);
  const details = useMemo(() => {
    if (!selectedCardKey) return { gastos: [], quimicos: [] };

    const gastos = selectedCardKey === 'quimicosTotalUSD'
      ? []
      : gastosData.filter((item) => {
        if (!item.esSemanaActual) return false;
        const category = getGastoCategory(item.rubro);
        if (selectedCardKey === 'globalUSD') {
          return ['deudaProveedoresUSD', 'deudaFrutaUSD', 'comprasNuevasUSD'].includes(category);
        }
        return category === selectedCardKey;
      });
    const quimicos = ['quimicosTotalUSD', 'globalUSD'].includes(selectedCardKey)
      ? quimicosData.filter((item) => String(item.estado || '').trim().toLowerCase() !== 'cumplido')
      : [];

    return { gastos, quimicos };
  }, [selectedCardKey, gastosData, quimicosData]);

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
      fill: card.border,
      border: card.border,
    }));

  const totalValue = rawData.reduce((s, c) => s + (c.value || 0), 0);
  const chartData = rawData
    .sort((a, b) => b.value - a.value)
    .map((d) => {
      const percent = totalValue ? (d.value / totalValue) * 100 : 0;
      return { ...d, percent, labelValue: `${currencyFormatter.format(d.value)} (${percent.toFixed(1)}%)` };
    });

  const donutData = chartData.map((item) => ({
    name: item.name,
    value: item.percent,
    fill: item.fill,
    border: item.border,
  }));

  const dominantBorderColor = chartData[0]?.border ?? '#c4b5fd';
  const formatTooltip = (value) => currencyFormatter.format(value);

  return (
    <div className="mb-8 rounded-3xl border border-green-100 bg-gradient-to-br from-white via-emerald-50 to-white p-6 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Resumen global</p>
          <h2 className="text-xl font-bold text-verde-bosque">Indicadores claves</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[65%_35%]">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:auto-rows-fr">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            const valueText = card.formatter(summary[card.key] ?? 0);
            const isSelected = selectedCardKey === card.key;

            return (
              <button
                key={card.key}
                type="button"
                aria-expanded={isSelected}
                aria-controls="summary-card-details"
                aria-label={`${isSelected ? 'Ocultar' : 'Ver'} detalle de ${card.label}`}
                onClick={() => setSelectedCardKey(isSelected ? null : card.key)}
                className={`flex h-full min-h-[120px] min-w-0 cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border p-3 text-left shadow-sm transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-bosque sm:p-4 ${isSelected ? 'ring-2 ring-verde-bosque ring-offset-2' : ''}`}
                style={{ backgroundColor: card.color, borderColor: card.border }}
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-[10px] uppercase tracking-[0.3em] break-words leading-tight text-slate-700 sm:text-[11px] xl:text-[10px]">
                    {card.label}
                  </p>
                  <span className="flex shrink-0 items-center gap-1 text-slate-500">
                    {Icon ? <Icon className="h-5 w-5 sm:h-6 sm:w-6" /> : null}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                  </span>
                </div>
                <p
                  className="mt-3 w-full min-w-0 overflow-hidden text-left font-bold leading-snug text-slate-900 [overflow-wrap:anywhere] break-words hyphens-auto"
                  style={{ fontSize: getValueFontSize(valueText) }}
                >
                  {valueText}
                </p>
              </button>
            );
          })}
        </div>

        <div className="min-h-[340px] overflow-hidden rounded-3xl border border-green-100 bg-white shadow-xs" style={{ borderColor: dominantBorderColor }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius="45%"
                outerRadius="70%"
                paddingAngle={4}
                labelLine={false}
                label={({ index, percent, x, y }) => {
                  const entry = donutData[index];
                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={entry?.border ?? '#000'}
                      fontSize="0.85rem"
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {donutData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={formatTooltip}
                cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }}
                contentStyle={{ borderRadius: 12, borderColor: '#d8f3dc', backgroundColor: '#ffffff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {selectedCard && (
        <section id="summary-card-details" aria-live="polite" className="mt-6 border-t border-green-100 pt-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-verde-bosque">
            Detalle: {selectedCard.label}
          </h3>
          {details.gastos.length > 0 || selectedCardKey !== 'quimicosTotalUSD' ? (
            <div className={selectedCardKey === 'globalUSD' ? 'mb-6' : ''}>
              {selectedCardKey === 'globalUSD' && <h4 className="mb-2 text-sm font-semibold text-slate-700">Gastos semanales</h4>}
              <ExpenseDetailsTable rows={details.gastos} />
            </div>
          ) : null}
          {selectedCardKey === 'globalUSD' && <h4 className="mb-2 text-sm font-semibold text-slate-700">Pedidos químicos pendientes</h4>}
          {selectedCardKey === 'quimicosTotalUSD' || selectedCardKey === 'globalUSD' ? (
            <ChemicalDetailsTable rows={details.quimicos} />
          ) : null}
        </section>
      )}
    </div>
  );
};
