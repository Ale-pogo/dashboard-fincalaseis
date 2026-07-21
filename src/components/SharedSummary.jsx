import React from 'react';
import { useSharedSummary } from '../hooks/useSharedSummary';
import { Loader2, AlertTriangle, Factory, Leaf, Banknote, FlaskConical, Globe2 } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const summaryCards = [
  {
    key: 'deudaProveedoresUSD',
    label: 'Deuda Proveedores',
    icon: Factory,
    formatter: (value) => currencyFormatter.format(value),
  },
  {
    key: 'deudaFrutaUSD',
    label: 'Deuda Fruta',
    icon: Leaf,
    formatter: (value) => currencyFormatter.format(value),
  },
  {
    key: 'comprasNuevasUSD',
    label: 'Compras nuevas',
    icon: Banknote,
    formatter: (value) => currencyFormatter.format(value),
  },
  {
    key: 'quimicosTotalUSD',
    label: 'Pedidos Químicos – Pendientes',
    icon: FlaskConical,
    formatter: (value) => currencyFormatter.format(value),
  },
  {
    key: 'globalUSD',
    label: 'Global',
    icon: Globe2,
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

  return (
    <div className="mb-8 rounded-3xl border border-green-100 bg-gradient-to-br from-white via-emerald-50 to-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Resumen global</p>
          <h2 className="text-xl font-bold text-verde-bosque">Indicadores claves</h2>
        </div>
        <p className="text-sm text-gray-500">Se actualiza desde los tres módulos Excel.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="rounded-3xl border border-green-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{card.label}</p>
                {Icon ? <Icon className="w-6 h-6 text-gray-400" /> : null}
              </div>
              <p className="mt-3 text-2xl font-bold text-verde-bosque">{card.formatter(summary[card.key] ?? 0)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
