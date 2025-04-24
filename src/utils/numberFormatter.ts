/**
 * Formatea un número como moneda con separadores de miles y decimales
 * @param value - El valor numérico a formatear
 * @param currency - El símbolo de moneda (por defecto '$')
 * @param decimals - El número de decimales a mostrar (por defecto 2)
 * @returns String formateado como moneda
 */
export const formatCurrency = (value: number, currency: string = '$', decimals: number = 2): string => {
  // Usar Intl.NumberFormat para formatear el número con separadores de miles
  const formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  // Formatear el número y agregar el símbolo de moneda
  const formattedValue = formatter.format(Math.abs(value));
  return value < 0 ? `-${currency}${formattedValue}` : `${currency}${formattedValue}`;
};

/**
 * Formatea un número con separadores de miles
 * @param value - El valor numérico a formatear
 * @param decimals - El número de decimales a mostrar (por defecto 0)
 * @returns String formateado con separadores de miles
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  const formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatter.format(value);
};
