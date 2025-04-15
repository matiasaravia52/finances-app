/**
 * Formatea una fecha en formato ISO a un formato más legible
 * @param dateString - Fecha en formato ISO string
 * @returns Fecha formateada en formato "DD/MM/YYYY HH:MM"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return dateString; // Devolver el string original si no es una fecha válida
    }
    
    // Formatear la fecha como DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error al formatear la fecha:', error);
    return dateString; // Devolver el string original en caso de error
  }
}

/**
 * Formatea una fecha en formato ISO a un formato más detallado y legible
 * @param dateString - Fecha en formato ISO string
 * @returns Fecha formateada en formato "DD de Mes, YYYY"
 */
export function formatDateLong(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return dateString; // Devolver el string original si no es una fecha válida
    }
    
    // Opciones de formato para mostrar el nombre del mes
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    
    return date.toLocaleDateString('es-ES', options);
  } catch (error) {
    console.error('Error al formatear la fecha:', error);
    return dateString; // Devolver el string original en caso de error
  }
}

/**
 * Formatea una fecha en formato ISO a un formato relativo (ej: "hace 2 días")
 * @param dateString - Fecha en formato ISO string
 * @returns Texto que indica cuánto tiempo ha pasado desde la fecha
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return dateString; // Devolver el string original si no es una fecha válida
    }
    
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'hace un minuto' : `hace ${diffMinutes} minutos`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? 'hace una hora' : `hace ${diffHours} horas`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'ayer' : `hace ${diffDays} días`;
    } else {
      return formatDate(dateString);
    }
  } catch (error) {
    console.error('Error al calcular el tiempo relativo:', error);
    return dateString; // Devolver el string original en caso de error
  }
}
