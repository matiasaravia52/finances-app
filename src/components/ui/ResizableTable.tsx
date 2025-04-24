import React, { useState, useRef, useEffect } from 'react';
import styles from '@/styles/ResizableTable.module.css';
import { CreditCardExpense } from '@/types/credit-card';
import { formatCurrency } from '@/utils/numberFormatter';

interface ResizableColumnProps {
  children: React.ReactNode;
  width: number;
  minWidth?: number;
  onResize: (width: number) => void;
}

export const ResizableColumn: React.FC<ResizableColumnProps> = ({
  children,
  width,
  minWidth = 50,
  onResize
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = columnRef.current?.offsetWidth || width;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(minWidth, startWidthRef.current + deltaX);
      
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, onResize]);

  return (
    <div 
      ref={columnRef} 
      className={styles.resizableColumn} 
      style={{ width: `${width}px` }}
    >
      {children}
      <div 
        className={styles.resizeHandle} 
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

interface ResizableTableProps {
  children: React.ReactNode;
  className?: string;
}

export const ResizableTable: React.FC<ResizableTableProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={`${styles.resizableTable} ${className || ''}`}>
      {children}
    </div>
  );
};

interface ResizableTableContainerProps {
  monthKey: string;
  items: {
    expense: CreditCardExpense;
    installment: number;
    amount: number;
  }[];
  onPayClick: (expenseId: string, installmentNumber: number) => void;
}

export const ResizableTableContainer: React.FC<ResizableTableContainerProps> = ({
  monthKey,
  items,
  onPayClick
}) => {
  // Estado para almacenar los anchos de las columnas
  const [columnWidths, setColumnWidths] = useState({
    description: 250,
    installment: 150,
    amount: 120,
    actions: 80
  });
  
  // Detectar si estamos en una pantalla móvil
  const [isMobile, setIsMobile] = useState(false);
  
  // Efecto para detectar cambios en el tamaño de la ventana
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Comprobar al inicio
    checkIfMobile();
    
    // Agregar listener para cambios de tamaño
    window.addEventListener('resize', checkIfMobile);
    
    // Limpiar listener al desmontar
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Función para actualizar el ancho de una columna específica
  const handleColumnResize = (column: keyof typeof columnWidths, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: width
    }));
  };

  // Calcular anchos de columna basados en si es móvil o no
  const getColumnWidth = (column: keyof typeof columnWidths) => {
    if (isMobile) {
      // Anchos para móvil
      const mobileWidths = {
        description: 180,
        installment: 120,
        amount: 100,
        actions: 60
      };
      return mobileWidths[column];
    }
    return columnWidths[column];
  };

  // Ancho mínimo total para la tabla en móvil
  const minTableWidth = isMobile ? 460 : 600;

  return (
    <div className={styles.resizableTableWrapper}>
      <div 
        className={styles.resizableTableHeader}
        style={{ minWidth: `${minTableWidth}px` }}
      >
        <ResizableColumn 
          width={getColumnWidth('description')} 
          onResize={(width) => handleColumnResize('description', width)}
          minWidth={isMobile ? 120 : 150}
        >
          <div className={styles.headerCell}>Descripción</div>
        </ResizableColumn>
        <ResizableColumn 
          width={getColumnWidth('installment')} 
          onResize={(width) => handleColumnResize('installment', width)}
          minWidth={isMobile ? 80 : 100}
        >
          <div className={styles.headerCell}>Cuota</div>
        </ResizableColumn>
        <ResizableColumn 
          width={getColumnWidth('amount')} 
          onResize={(width) => handleColumnResize('amount', width)}
          minWidth={isMobile ? 80 : 100}
        >
          <div className={`${styles.headerCell} ${styles.amountColumn}`}>Monto</div>
        </ResizableColumn>
        <ResizableColumn 
          width={getColumnWidth('actions')} 
          onResize={(width) => handleColumnResize('actions', width)}
          minWidth={50}
        >
          <div className={styles.headerCell}>Acciones</div>
        </ResizableColumn>
      </div>

      <div 
        className={styles.resizableTableBody}
        style={{ minWidth: `${minTableWidth}px` }}
      >
        {items.map((item, index) => (
          <div key={index} className={styles.resizableTableRow}>
            <div 
              className={styles.resizableCell} 
              style={{ width: `${getColumnWidth('description')}px` }}
            >
              {item.expense.description}
            </div>
            <div 
              className={styles.resizableCell} 
              style={{ width: `${getColumnWidth('installment')}px` }}
            >
              <span className={isMobile ? styles.mobileInstallment : ''}>
                {isMobile ? `${item.installment}/${item.expense.totalInstallments}` : `Cuota ${item.installment} de ${item.expense.totalInstallments}`}
              </span>
            </div>
            <div 
              className={`${styles.resizableCell} ${styles.amountColumn}`} 
              style={{ width: `${getColumnWidth('amount')}px` }}
            >
              {formatCurrency(item.amount)}
            </div>
            <div 
              className={styles.resizableCell} 
              style={{ width: `${getColumnWidth('actions')}px` }}
            >
              <button 
                className={styles.payButton}
                onClick={() => onPayClick(item.expense._id, item.installment)}
                title="Marcar como pagada"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
