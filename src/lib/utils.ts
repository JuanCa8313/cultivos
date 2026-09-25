/**
 * Formatea un valor numérico a moneda colombiana (COP) sin decimales.
 */
export function formatCOP(val: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val || 0);
}
