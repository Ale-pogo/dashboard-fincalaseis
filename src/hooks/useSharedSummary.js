import { useMemo } from 'react';
import { useExcelReader } from './useExcelReader';
import { useGastosReader } from './useGastosReader';
import { useQuimicosReader } from './useQuimicosReader';

export const useSharedSummary = () => {
  const compras = useExcelReader('/data/Requerimiento - Compras.xlsx');
  const gastos = useGastosReader('/data/Gastos semanaless.xlsx');
  const quimicos = useQuimicosReader('/data/pedido quimicos campaña 2026 valorizado.xlsx');

  const summary = useMemo(() => {
    const comprasCount = compras.data?.length ?? 0;
    const deudaProveedoresUSD = gastos.summary?.deudaProveedoresUSD ?? 0;
    const deudaFrutaUSD = gastos.summary?.deudaFrutaUSD ?? 0;
    const comprasNuevasUSD = gastos.summary?.comprasNuevasUSD ?? 0;
    const quimicosTotalUSD = (quimicos.summaryTable || [])
      .filter((row) => row.isTotal)
      .reduce((sum, row) => sum + (row.pendiente ?? 0), 0);
    const globalUSD = deudaProveedoresUSD + deudaFrutaUSD + comprasNuevasUSD + quimicosTotalUSD;

    return {
      comprasCount,
      deudaProveedoresUSD,
      deudaFrutaUSD,
      comprasNuevasUSD,
      quimicosTotalUSD,
      globalUSD,
    };
  }, [compras.data, gastos.summary, quimicos.summaryTable]);

  const loading = compras.loading || gastos.loading || quimicos.loading;
  const errors = [compras.error, gastos.error, quimicos.error].filter(Boolean);

  return { summary, loading, errors };
};
