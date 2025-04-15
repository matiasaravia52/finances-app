import { Transaction } from '@/types/transaction';

export type FilterPeriod = 'all' | 'current-month' | 'last-month' | 'current-year';

/**
 * Filtra transacciones por período de tiempo
 * @param transactions - Lista de transacciones a filtrar
 * @param period - Período de tiempo para filtrar
 * @returns Transacciones filtradas según el período especificado
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: FilterPeriod
): Transaction[] {
  if (!transactions.length || period === 'all') {
    return transactions;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    
    switch (period) {
      case 'current-month':
        return (
          transactionDate.getFullYear() === currentYear &&
          transactionDate.getMonth() === currentMonth
        );
      
      case 'last-month':
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return (
          transactionDate.getFullYear() === lastMonthYear &&
          transactionDate.getMonth() === lastMonth
        );
      
      case 'current-year':
        return transactionDate.getFullYear() === currentYear;
      
      default:
        return true;
    }
  });
}

/**
 * Calcula el balance total de un conjunto de transacciones
 * @param transactions - Lista de transacciones
 * @returns Balance total
 */
export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Obtiene el nombre del período actual
 * @param period - Período seleccionado
 * @returns Nombre formateado del período
 */
export function getPeriodName(period: FilterPeriod): string {
  const now = new Date();
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  switch (period) {
    case 'current-month':
      return `${months[now.getMonth()]} ${now.getFullYear()}`;
    
    case 'last-month':
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return `${months[lastMonth]} ${lastMonthYear}`;
    
    case 'current-year':
      return `${now.getFullYear()}`;
    
    default:
      return 'Todo el tiempo';
  }
}
