export const GASTO_INDICATOR_COLORS = {
  deudaProveedoresUSD: '#c4b5fd',
  deudaFruta25USD: '#93c5fd',
  deudaFruta26USD: '#6ee7b7',
  comprasNuevasUSD: '#fde68a',
  quimicosTotalUSD: '#fecaca',
};

export const getGastoCategory = (rubro) => {
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
