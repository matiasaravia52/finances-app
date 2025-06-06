'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Navbar from '@/components/layout/Navbar';
import Modal from '@/components/ui/Modal';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { ResizableTableContainer } from '@/components/ui/ResizableTable';
import { api } from '@/services/api';
import { formatDate } from '@/utils/dateFormatter';
import styles from '@/styles/CreditCard.module.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CreditCardExpense, CreditCardFund, Installment, InstallmentStatus, MonthlyProjection, SimulationResult } from '@/types/credit-card';

export default function CreditCardPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <CreditCardContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

function CreditCardContent() {
  // Estados para el fondo de tarjeta de crédito
  const [fund, setFund] = useState<CreditCardFund | null>(null);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);
  const [maxMonthlyContribution, setMaxMonthlyContribution] = useState<number>(0);
  const [accumulatedAmount, setAccumulatedAmount] = useState<number>(0);
  
  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Función para formatear moneda en la tabla (más compacta)
  const formatTableCurrency = (amount: number) => {
    // Para valores grandes, usar formato abreviado
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (Math.abs(amount) >= 10000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else if (Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${Math.round(amount)}`;
    }
  };
  
  // Función para calcular el monto acumulado correctamente
  const calculateUpdatedAccumulatedAmount = (currentAmount: number, monthlyContribution: number, totalPayments: number) => {
    console.log('--- Cálculo de monto acumulado ---');
    console.log('Monto actual:', currentAmount);
    console.log('Contribución mensual:', monthlyContribution);
    console.log('Total pagos:', totalPayments);
    
    // Si el monto actual es 0, usamos la contribución mensual
    let baseAmount = currentAmount;
    if (baseAmount === 0) {
      baseAmount = monthlyContribution;
      console.log('Usando contribución mensual como base');
    }
    
    // Calcular el monto restante después de los pagos
    const remainingAfterPayments = baseAmount - totalPayments;
    
    // El monto final no puede ser negativo
    const finalAmount = remainingAfterPayments >= 0 ? remainingAfterPayments : 0;
    
    console.log('Cálculo: ' + baseAmount + ' - ' + totalPayments + ' = ' + finalAmount);
    return finalAmount;
  };
  
  // Estados para los gastos de tarjeta de crédito
  const [expenses, setExpenses] = useState<CreditCardExpense[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<CreditCardExpense | null>(null);
  
  // Estado para el resumen mensual
  const [monthlyPayments, setMonthlyPayments] = useState<{[key: string]: {total: number, items: {expense: CreditCardExpense, installment: number, amount: number}[], monthName: string}}>({});
  const [showMonthlyView, setShowMonthlyView] = useState(false);
  const [showMatrixView, setShowMatrixView] = useState(false);
  
  // Estados para la simulación
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [simulationAmount, setSimulationAmount] = useState<number>(0);
  const [simulationAmountInput, setSimulationAmountInput] = useState<string>('');
  const [simulationInstallments, setSimulationInstallments] = useState<number>(1);
  const [simulationDescription, setSimulationDescription] = useState<string>('');
  const [simulationStartDate, setSimulationStartDate] = useState<Date>(new Date());
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Estados para editar fecha de compra
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);
  const [newPurchaseDate, setNewPurchaseDate] = useState<Date>(new Date());
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  
  // Estados para confirmación de pago
  const [isPaymentConfirmModalOpen, setIsPaymentConfirmModalOpen] = useState(false);
  const [paymentToConfirm, setPaymentToConfirm] = useState<{expenseId: string, installmentNumber: number} | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Estado general
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);
  
  // Calcular los pagos mensuales cuando cambian los gastos
  useEffect(() => {
    calculateMonthlyPayments();
  }, [expenses]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Ejecutar las funciones de carga de manera independiente para que un error en una no afecte a la otra
      try {
        await loadFund();
      } catch (fundErr) {
        console.error('Error loading fund:', fundErr);
      }
      
      try {
        await loadExpenses();
      } catch (expensesErr) {
        console.error('Error loading expenses:', expensesErr);
        setError('Error al cargar los gastos. Por favor, intenta de nuevo.');
      }
    } catch (err) {
      console.error('Unexpected error loading data:', err);
      setError('Error inesperado al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFund = async () => {
    try {
      // Primero intentamos actualizar el monto acumulado
      try {
        const updatedFund = await api.updateCreditCardAccumulatedAmount();
        if (updatedFund) {
          setFund(updatedFund);
          setMonthlyContribution(updatedFund.monthlyContribution);
          return; // Si la actualización fue exitosa, no necesitamos cargar el fondo nuevamente
        }
      } catch (updateErr) {
        console.log('No se pudo actualizar el monto acumulado:', updateErr);
        // Si hay un error al actualizar, intentamos cargar el fondo normalmente
      }
      
      // Si no se pudo actualizar, cargamos el fondo normalmente
      const fundData = await api.getCreditCardFund();
      if (fundData) {
        setFund(fundData);
        setMonthlyContribution(fundData.monthlyContribution);
      }
    } catch (err) {
      // No necesitamos hacer throw del error, simplemente lo manejamos aquí
      console.log('No se pudo cargar el fondo de tarjeta de crédito:', err);
      // Si es un 404, es porque el usuario aún no ha configurado un fondo
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        console.log('No existe un fondo configurado todavía');
      }
      // No establecemos el fondo, dejándolo como null
    }
  };

  const loadExpenses = async () => {
    try {
      const expensesData = await api.getCreditCardExpenses(true);
      
      // Filtrar los gastos que tienen todas las cuotas pagadas
      const filteredExpenses = expensesData.filter(expense => {
        // Si alguna cuota está pendiente, mantener el gasto
        return expense.installments.some(installment => installment.status === InstallmentStatus.PENDING);
      });
      
      console.log(`Filtered out ${expensesData.length - filteredExpenses.length} fully paid expenses`);
      setExpenses(filteredExpenses);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      throw err;
    }
  };
  
  // Función para calcular los pagos mensuales
  const calculateMonthlyPayments = () => {
    const payments: {[key: string]: {total: number, items: {expense: CreditCardExpense, installment: number, amount: number}[], monthName: string}} = {};
    
    expenses.forEach(expense => {
      if (expense.isSimulation) return; // Ignorar simulaciones
      
      // Procesar cada cuota del gasto
      expense.installments.forEach(installment => {
        if (installment.status === InstallmentStatus.PAID) return; // Ignorar cuotas ya pagadas
        
        // Obtener la fecha de vencimiento de la cuota
        const dueDate = new Date(installment.dueDate);
        
        // Crear la clave para el mes (YYYY-MM)
        const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Obtener el nombre del mes
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const monthName = `${monthNames[dueDate.getMonth()]} ${dueDate.getFullYear()}`;
        
        // Inicializar el objeto para este mes si no existe
        if (!payments[monthKey]) {
          payments[monthKey] = {
            total: 0,
            items: [],
            monthName
          };
        }
        
        // Añadir esta cuota al mes correspondiente
        payments[monthKey].items.push({
          expense,
          installment: installment.number,
          amount: installment.amount
        });
        
        // Actualizar el total del mes
        payments[monthKey].total += installment.amount;
      });
    });
    
    // Ordenar por mes
    const sortedPayments = Object.keys(payments)
      .sort()
      .reduce((acc, key) => {
        acc[key] = payments[key];
        return acc;
      }, {} as typeof payments);
    
    setMonthlyPayments(sortedPayments);
  };

  const handleCreateOrUpdateFund = async () => {
    try {
      if (monthlyContribution <= 0) {
        alert('La contribución mensual debe ser mayor que cero');
        return;
      }
      
      // Validar que el monto acumulado sea un número válido
      const validAccumulated = accumulatedAmount >= 0 ? accumulatedAmount : (fund?.accumulatedAmount || 0);
      
      // Crear o actualizar el fondo con todos los valores
      await api.createOrUpdateCreditCardFund({ 
        monthlyContribution,
        maxMonthlyContribution,
        accumulatedAmount: validAccumulated
      });
      
      await loadFund();
      setIsFundModalOpen(false);
    } catch (err) {
      console.error('Error creating/updating fund:', err);
      alert('Error al guardar el fondo. Por favor, intenta de nuevo.');
    }
  };

  const handleCreateExpense = async (data: { amount: number; description: string; totalInstallments: number; purchaseDate?: Date }) => {
    try {
      // Verificar si existe un fondo configurado
      if (!fund) {
        alert('Debes configurar el fondo de tarjeta de crédito antes de agregar gastos.');
        setIsExpenseModalOpen(false);
        return;
      }
      
      await api.createCreditCardExpense({
        ...data,
        isSimulation: true // Siempre crear como simulación primero
      });
      await loadExpenses();
      setIsExpenseModalOpen(false);
    } catch (err) {
      console.error('Error creating expense:', err);
      alert('Error al crear el gasto. Por favor, intenta de nuevo.');
    }
  };

  // Función para abrir el modal de edición de fecha
  const handleOpenEditDateModal = (expense: CreditCardExpense) => {
    setSelectedExpense(expense);
    setNewPurchaseDate(new Date(expense.purchaseDate));
    setIsEditDateModalOpen(true);
  };

  // Función para actualizar la fecha de compra
  const handleUpdatePurchaseDate = async () => {
    if (!selectedExpense) return;
    
    try {
      setIsUpdatingDate(true);
      await api.updateExpensePurchaseDate(selectedExpense._id, newPurchaseDate);
      await loadExpenses();
      setIsEditDateModalOpen(false);
      setSelectedExpense(null);
    } catch (err) {
      console.error('Error updating purchase date:', err);
      alert('Error al actualizar la fecha de compra. Por favor, intenta de nuevo.');
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      return;
    }
    
    try {
      await api.deleteCreditCardExpense(id);
      await loadExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Error al eliminar el gasto. Por favor, intenta de nuevo.');
    }
  };

  const handleExecuteExpense = async (id: string) => {
    try {
      await api.executeCreditCardExpense(id);
      await Promise.all([loadExpenses(), loadFund()]);
    } catch (err) {
      console.error('Error executing expense:', err);
      alert('Error al ejecutar el gasto. Por favor, intenta de nuevo.');
    }
  };

  // Función para verificar si una cuota pertenece al mes actual
  const isCurrentMonthInstallment = (installmentDueDate: string | Date): boolean => {
    const dueDate = new Date(installmentDueDate);
    const currentDate = new Date();
    
    return dueDate.getMonth() === currentDate.getMonth() && 
           dueDate.getFullYear() === currentDate.getFullYear();
  };

  // Función para mostrar el modal de confirmación de pago
  const handleConfirmPayment = (expenseId: string, installmentNumber: number) => {
    // Buscar la cuota para verificar si pertenece al mes actual
    const expense = expenses.find(e => e._id === expenseId);
    if (!expense) return;
    
    const installment = expense.installments.find(i => i.number === installmentNumber);
    if (!installment) return;
    
    // Verificar si la cuota pertenece al mes actual
    if (!isCurrentMonthInstallment(installment.dueDate)) {
      alert('Solo puedes pagar cuotas del mes actual.');
      return;
    }
    
    setPaymentToConfirm({ expenseId, installmentNumber });
    setIsPaymentConfirmModalOpen(true);
  };

  // Función para actualizar el estado de una cuota
  const handleUpdateInstallmentStatus = async (expenseId: string, installmentNumber: number, status: InstallmentStatus) => {
    // Si estamos marcando como pagada, mostrar confirmación
    if (status === InstallmentStatus.PAID) {
      handleConfirmPayment(expenseId, installmentNumber);
      return;
    }
    
    // Si estamos marcando como pendiente, proceder directamente
    try {
      await api.updateInstallmentStatus(expenseId, installmentNumber, status);
      await loadExpenses();
      calculateMonthlyPayments();
    } catch (err) {
      console.error('Error updating installment status:', err);
      alert('Error al actualizar el estado de la cuota. Por favor, intenta de nuevo.');
    }
  };

  // Función para procesar el pago después de la confirmación
  const processPaymentAfterConfirmation = async () => {
    if (!paymentToConfirm) return;
    
    try {
      setIsProcessingPayment(true);
      
      // Obtener la información de la cuota que se está pagando
      const expense = expenses.find(e => e._id === paymentToConfirm.expenseId);
      if (!expense) return;
      
      const installment = expense.installments.find(i => i.number === paymentToConfirm.installmentNumber);
      if (!installment) return;
      
      // Guardar el monto de la cuota que se va a pagar
      const paymentAmount = installment.amount;
      console.log('Monto de la cuota a pagar:', paymentAmount);
      
      // Obtener la fecha de vencimiento de la cuota para determinar el mes
      const dueDate = new Date(installment.dueDate);
      const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Verificar si es el mes actual
      const currentDate = new Date();
      const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Verificar si el mes de la cuota es el mes actual (doble verificación)
      if (monthKey !== currentMonthKey) {
        setIsProcessingPayment(false);
        setIsPaymentConfirmModalOpen(false);
        setPaymentToConfirm(null);
        alert('Solo puedes pagar cuotas del mes actual.');
        return;
      }
      
      // Verificar si esta será la última cuota pendiente del gasto
      const pendingInstallmentsCount = expense.installments.filter(i => i.status === InstallmentStatus.PENDING).length;
      const isLastPendingInstallment = pendingInstallmentsCount === 1 && 
                                     installment.status === InstallmentStatus.PENDING;
      
      // Recopilar todas las cuotas pendientes del mes actual antes de marcar como pagada
      const pendingInstallmentsBeforePayment: {expenseId: string, installmentNumber: number, amount: number}[] = [];
      
      expenses.forEach(exp => {
        exp.installments.forEach(inst => {
          if (inst.status === InstallmentStatus.PENDING) {
            const instDueDate = new Date(inst.dueDate);
            const instMonthKey = `${instDueDate.getFullYear()}-${String(instDueDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (instMonthKey === monthKey) {
              pendingInstallmentsBeforePayment.push({
                expenseId: exp._id,
                installmentNumber: inst.number,
                amount: inst.amount
              });
            }
          }
        });
      });
      
      // Verificar si esta es la única o la última cuota pendiente del mes
      const isLastInstallment = pendingInstallmentsBeforePayment.length === 1 && 
                               pendingInstallmentsBeforePayment[0].expenseId === paymentToConfirm.expenseId && 
                               pendingInstallmentsBeforePayment[0].installmentNumber === paymentToConfirm.installmentNumber;
      
      // Calcular el total de pagos del mes actual (incluyendo la cuota que se va a pagar)
      const totalMonthlyPayments = pendingInstallmentsBeforePayment.reduce((sum, item) => sum + item.amount, 0);
      console.log('Total de pagos del mes:', totalMonthlyPayments);
      console.log('Es la última cuota del mes:', isLastInstallment);
      
      // Marcar la cuota como pagada en el backend
      await api.updateInstallmentStatus(
        paymentToConfirm.expenseId, 
        paymentToConfirm.installmentNumber, 
        InstallmentStatus.PAID
      );
      
      // Registrar el pago como una transacción de egreso (monto negativo)
      try {
        const transactionDescription = `Pago de cuota ${installment.number}/${expense.totalInstallments} - ${expense.description}`;
        await api.createTransaction({
          type: 'expense',
          amount: -paymentAmount, // Usar valor negativo para indicar que es un egreso
          category: 'Tarjeta de Crédito',
          description: transactionDescription
        });
        console.log('Pago de tarjeta registrado como transacción de egreso con monto negativo:', -paymentAmount);
      } catch (transactionErr) {
        console.error('Error al registrar el pago como transacción:', transactionErr);
        // No interrumpimos el flujo si falla la creación de la transacción
      }
      
      // Si era la última cuota pendiente, actualizamos directamente el estado local
      if (isLastPendingInstallment) {
        // Eliminar el gasto de la lista local sin necesidad de recargar
        setExpenses(prevExpenses => prevExpenses.filter(e => e._id !== paymentToConfirm.expenseId));
        console.log('Era la última cuota pendiente, eliminando el gasto del listado');
      } else {
        // Actualizar el estado de la cuota en el estado local
        setExpenses(prevExpenses => {
          return prevExpenses.map(e => {
            if (e._id === paymentToConfirm.expenseId) {
              return {
                ...e,
                installments: e.installments.map(i => {
                  if (i.number === paymentToConfirm.installmentNumber) {
                    return { ...i, status: InstallmentStatus.PAID };
                  }
                  return i;
                })
              };
            }
            return e;
          });
        });
      }
      
      // Recalcular los pagos mensuales para actualizar la UI
      calculateMonthlyPayments();
      
      // Mensaje de confirmación básico
      let message = `La cuota ${installment.number} de ${expense.description} ha sido marcada como pagada por ${formatCurrency(paymentAmount)}.\n\nEl pago ha sido registrado como un egreso en la sección de transacciones.`;
      
      // Si era la última cuota del mes, actualizar el monto acumulado
      if (isLastInstallment && fund) {
        try {
          // Obtener el fondo actual
          const currentFund = await api.getCreditCardFund();
          
          if (currentFund) {
            // Calcular el monto acumulado usando la nueva función
            const finalAmount = calculateUpdatedAccumulatedAmount(
              currentFund.accumulatedAmount,
              currentFund.monthlyContribution,
              totalMonthlyPayments
            );
            
            // Actualizar el monto acumulado en el backend
            await api.createOrUpdateCreditCardFund({
              accumulatedAmount: finalAmount
            });
            
            // Recargar el fondo para mostrar el nuevo monto acumulado
            await loadFund();
            
            // Actualizar el mensaje de confirmación
            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const monthName = `${monthNames[dueDate.getMonth()]} ${dueDate.getFullYear()}`;
            message = `¡Has pagado la última cuota de ${monthName}!\n\nTotal pagado este mes: ${formatCurrency(totalMonthlyPayments)}\n\nEl monto acumulado ha sido actualizado: ${formatCurrency(finalAmount)}\n\nEl pago ha sido registrado como un egreso en la sección de transacciones.`;
          }
        } catch (updateErr) {
          console.error('Error actualizando el monto acumulado:', updateErr);
          message += '\n\nHubo un error al actualizar el monto acumulado.';
        }
      }
      
      setIsPaymentConfirmModalOpen(false);
      setPaymentToConfirm(null);
      
      // Mostrar el mensaje de confirmación
      alert(message);
    } catch (err) {
      console.error('Error processing payment confirmation:', err);
      alert('Error al procesar el pago. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

// ...
  const handlePayAllInstallmentsForMonth = async (monthKey: string) => {
    // Verificar si es el mes actual
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthKey !== currentMonthKey) {
      alert('Solo puedes pagar masivamente las cuotas del mes actual.');
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de que quieres marcar como pagadas todas las cuotas de ${monthlyPayments[monthKey].monthName}?`)) {
      return;
    }
    
    try {
      // Guardar las cuotas que se van a pagar y su monto total
      const itemsToPay = [...monthlyPayments[monthKey].items]; // Copia para evitar problemas de referencia
      const totalPaidAmount = itemsToPay.reduce((sum, item) => sum + item.amount, 0);
      
      console.log('Monto total a pagar:', totalPaidAmount);
      console.log('Cuotas a pagar:', itemsToPay.length);
      
      if (totalPaidAmount <= 0 || itemsToPay.length === 0) {
        alert('No hay cuotas pendientes para pagar en este mes.');
        return;
      }
      
      // Marcar todas las cuotas como pagadas
      const promises = itemsToPay.map(item => {
        return api.updateInstallmentStatus(item.expense._id, item.installment, InstallmentStatus.PAID);
      });
      
      await Promise.all(promises);
      
      // Registrar el pago total como una transacción de egreso
      try {
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const [year, month] = monthKey.split('-');
        const monthName = `${monthNames[parseInt(month) - 1]} ${year}`;
        
        await api.createTransaction({
          type: 'expense',
          amount: totalPaidAmount,
          category: 'Tarjeta de Crédito',
          description: `Pago de cuotas de tarjeta de crédito - ${monthName} (${itemsToPay.length} cuotas)`
        });
        console.log('Pago masivo de tarjeta registrado como transacción de egreso');
      } catch (transactionErr) {
        console.error('Error al registrar el pago masivo como transacción:', transactionErr);
        // No interrumpimos el flujo si falla la creación de la transacción
      }
      
      await loadExpenses(); // Recargar los gastos para reflejar los cambios
      
      // Actualizar el monto acumulado considerando la contribución mensual como constante
      if (fund) {
        try {
          // Obtener el fondo actual
          const currentFund = await api.getCreditCardFund();
          
          if (currentFund) {
            // Calcular el monto acumulado usando la nueva función
            const finalAmount = calculateUpdatedAccumulatedAmount(
              currentFund.accumulatedAmount,
              currentFund.monthlyContribution,
              totalPaidAmount
            );
            
            // Actualizar el monto acumulado en el backend
            await api.createOrUpdateCreditCardFund({
              accumulatedAmount: finalAmount
            });
            
            // Recargar el fondo para mostrar el nuevo monto acumulado
            await loadFund();
            
            // Mostrar un mensaje de confirmación con el cierre
            alert(`Se han marcado como pagadas ${itemsToPay.length} cuotas de ${monthlyPayments[monthKey].monthName} por un total de ${formatCurrency(totalPaidAmount)}. \n\nEl monto acumulado ha sido actualizado: ${formatCurrency(finalAmount)}\n\nEl pago ha sido registrado como un egreso en la sección de transacciones.`);
          } else {
            alert(`Se han marcado como pagadas las cuotas de ${monthlyPayments[monthKey].monthName}, pero no se pudo actualizar el monto acumulado.\n\nEl pago ha sido registrado como un egreso en la sección de transacciones.`);
          }
        } catch (updateErr) {
          console.error('Error actualizando el monto acumulado:', updateErr);
          alert(`Se han marcado como pagadas las cuotas de ${monthlyPayments[monthKey].monthName}, pero hubo un error al actualizar el monto acumulado.\n\nEl pago ha sido registrado como un egreso en la sección de transacciones.`);
        }
      } else {
        alert(`Se han marcado como pagadas las cuotas de ${monthlyPayments[monthKey].monthName}.\n\nEl pago ha sido registrado como un egreso en la sección de transacciones.`);
      }
      
      // Recalcular los pagos mensuales
      calculateMonthlyPayments();
    } catch (err) {
      console.error('Error pagando todas las cuotas del mes:', err);
      alert('Error al marcar las cuotas como pagadas. Por favor, intenta de nuevo.');
    }
  };

  const handleSimulateExpense = async () => {
    // Validar que los valores sean correctos
    if (simulationAmount <= 0 || simulationInstallments <= 0) {
      alert('El monto y el número de cuotas deben ser mayores que cero');
      return;
    }
    
    // Verificar si existe un fondo configurado
    if (!fund) {
      alert('Debes configurar el fondo de tarjeta de crédito antes de simular gastos.');
      setIsSimulationModalOpen(false);
      return;
    }
    
    try {
      setIsSimulating(true);
      // Pasar la fecha de inicio seleccionada al backend
      const result = await api.simulateCreditCardExpense(simulationAmount, simulationInstallments, simulationStartDate);
      setSimulationResult(result);
    } catch (err) {
      console.error('Error simulating expense:', err);
      alert('Error al simular el gasto. Por favor, intenta de nuevo.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAmountInputChange = (value: string) => {
    setSimulationAmountInput(value);
    
    // Convertir el valor a número eliminando caracteres no numéricos
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue) {
      setSimulationAmount(parseInt(numericValue, 10));
    } else {
      setSimulationAmount(0);
    }
  };
  
  const resetSimulationForm = () => {
    setSimulationAmount(0);
    setSimulationAmountInput('');
    setSimulationInstallments(1);
    setSimulationDescription('');
    setSimulationStartDate(new Date());
    setSimulationResult(null);
  };

  const handleAddExpense = () => {
    // Verificar si existe un fondo configurado
    if (!fund) {
      alert('Debes configurar el fondo de tarjeta de crédito antes de agregar gastos.');
      return;
    }
    
    setSelectedExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenFundModal = () => {
    if (fund) {
      setMonthlyContribution(fund.monthlyContribution);
      setMaxMonthlyContribution(fund.maxMonthlyContribution || fund.monthlyContribution * 1.5);
      setAccumulatedAmount(fund.accumulatedAmount);
    } else {
      setMonthlyContribution(0);
      setMaxMonthlyContribution(0);
      setAccumulatedAmount(0);
    }
    setIsFundModalOpen(true);
  };

  const handleOpenSimulationModal = () => {
    // Verificar si existe un fondo configurado
    if (!fund) {
      alert('Debes configurar el fondo de tarjeta de crédito antes de simular gastos.');
      return;
    }
    
    setSimulationAmount(0);
    setSimulationInstallments(1);
    setSimulationResult(null);
    setIsSimulationModalOpen(true);
  };

  if (isLoading && !fund && expenses.length === 0) {
    return (
      <div className={styles.container}>
        <Navbar />
        <main className={styles.content}>
          <div className={styles.loading}>
            Cargando...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.content}>
        {error && (
          <div className={styles.error}>
            {error}
            <button onClick={loadData} className={styles.retryButton}>
              Reintentar
            </button>
          </div>
        )}

        <div className={styles.header}>
          <h1 className={styles.title}>Tarjeta de Crédito</h1>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewToggleButton} ${!showMonthlyView && !showMatrixView ? styles.viewToggleActive : ''}`}
              onClick={() => {
                setShowMonthlyView(false);
                setShowMatrixView(false);
              }}
            >
              Lista de Gastos
            </button>
            <button 
              className={`${styles.viewToggleButton} ${showMonthlyView && !showMatrixView ? styles.viewToggleActive : ''}`}
              onClick={() => {
                setShowMonthlyView(true);
                setShowMatrixView(false);
              }}
            >
              Vista Mensual
            </button>
            <button 
              className={`${styles.viewToggleButton} ${showMatrixView ? styles.viewToggleActive : ''}`}
              onClick={() => {
                setShowMonthlyView(false);
                setShowMatrixView(true);
              }}
            >
              Matriz de Pagos
            </button>
          </div>
          <div className={styles.actions}>
            <Button onClick={handleOpenFundModal}>
              {fund ? 'Actualizar Fondo' : 'Configurar Fondo'}
            </Button>
            <div className={styles.tooltipContainer}>
              <Button 
                onClick={handleAddExpense} 
                variant="secondary" 
                disabled={!fund}
              >
                Agregar Gasto
              </Button>
              {!fund && (
                <div className={styles.tooltip}>
                  Debes configurar el fondo primero
                </div>
              )}
            </div>
            <div className={styles.tooltipContainer}>
              <Button 
                onClick={handleOpenSimulationModal} 
                variant="outline"
                disabled={!fund}
              >
                Simular Gasto
              </Button>
              {!fund && (
                <div className={styles.tooltip}>
                  Debes configurar el fondo primero
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información del Fondo */}
        <div className={styles.fundInfo}>
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Fondo de Tarjeta de Crédito</h2>
              {fund ? (
                <div className={styles.fundDetails}>
                  <div className={styles.fundItem}>
                    <span className={styles.fundLabel}>Contribución Mensual:</span>
                    <span className={styles.fundValue}>{formatCurrency(fund.monthlyContribution)}</span>
                  </div>
                  <div className={styles.fundItem}>
                    <span className={styles.fundLabel}>Monto Acumulado:</span>
                    <span className={styles.fundValue}>{formatCurrency(fund.accumulatedAmount)}</span>
                  </div>
                  <div className={styles.fundItem}>
                    <span className={styles.fundLabel}>Última Actualización:</span>
                    <span className={styles.fundValue}>{typeof fund.lastUpdateDate === 'string' ? formatDate(fund.lastUpdateDate) : formatDate(fund.lastUpdateDate.toISOString())}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No has configurado un fondo de tarjeta de crédito aún.</p>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <Button onClick={handleOpenFundModal}>
                      Configurar Ahora
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vista de Gastos */}
        {!showMonthlyView && !showMatrixView && (
          <div className={styles.expensesSection}>
            <h2 className={styles.sectionTitle}>Gastos de Tarjeta de Crédito</h2>
            
            {expenses.length === 0 ? (
              <div className={styles.emptyState}>
                No tienes gastos de tarjeta de crédito registrados.
              </div>
            ) : (
              <div className={styles.expensesList}>
                {expenses.map((expense) => (
                  <div key={expense._id} className={`${styles.expenseCard} ${expense.isSimulation ? styles.simulationCard : ''}`}>
                    <div className={styles.expenseHeader}>
                      <h3 className={styles.expenseTitle}>{expense.description}</h3>
                      {expense.isSimulation && (
                        <span className={styles.simulationBadge}>Simulación</span>
                      )}
                    </div>
                    
                    <div className={styles.expenseDetails}>
                      <div className={styles.expenseInfo}>
                        <div className={styles.expenseItem}>
                          <span className={styles.expenseLabel}>Monto Total:</span>
                          <span className={styles.expenseValue}>{formatCurrency(expense.amount)}</span>
                        </div>
                        <div className={styles.expenseItem}>
                          <span className={styles.expenseLabel}>Fecha de Compra:</span>
                          <span className={styles.expenseValue}>{typeof expense.purchaseDate === 'string' ? formatDate(expense.purchaseDate) : formatDate(expense.purchaseDate.toISOString())}</span>
                        </div>
                        <div className={styles.expenseItem}>
                          <span className={styles.expenseLabel}>Cuotas:</span>
                          <span className={styles.expenseValue}>{expense.totalInstallments}</span>
                        </div>
                      </div>
                      
                      <div className={styles.expenseActions}>
                        {expense.isSimulation && (
                          <Button 
                            onClick={() => handleExecuteExpense(expense._id)}
                            variant="primary"
                            size="small"
                          >
                            Ejecutar Gasto
                          </Button>
                        )}
                        <Button 
                          onClick={() => handleOpenEditDateModal(expense)}
                          variant="secondary"
                          size="small"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                        </Button>
                        <Button 
                          onClick={() => handleDeleteExpense(expense._id)}
                          variant="secondary"
                          size="small"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Lista de cuotas */}
                    <div className={styles.installmentsSection}>
                      <h4 className={styles.installmentsTitle}>Cuotas</h4>
                      <div className={styles.installmentsList}>
                        {expense.installments.map((installment) => (
                          <div 
                            key={`${expense._id}-${installment.number}`} 
                            className={`${styles.installmentItem} ${installment.status === InstallmentStatus.PAID ? styles.paidInstallment : ''}`}
                          >
                            <div className={styles.installmentInfo}>
                              <span className={styles.installmentNumber}>Cuota {installment.number}</span>
                              <span className={styles.installmentAmount}>{formatCurrency(installment.amount)}</span>
                              <span className={styles.installmentDate}>{typeof installment.dueDate === 'string' ? formatDate(installment.dueDate) : formatDate(installment.dueDate.toISOString())}</span>
                              {!expense.isSimulation && (
                              <div className={styles.installmentActions}>
                                {installment.status === InstallmentStatus.PENDING ? (
                                  <button 
                                    className={styles.markPaidButton}
                                    onClick={() => handleUpdateInstallmentStatus(expense._id, installment.number, InstallmentStatus.PAID)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    Pagar
                                  </button>
                                ) : (
                                  <button 
                                    className={styles.markPendingButton}
                                    onClick={() => handleUpdateInstallmentStatus(expense._id, installment.number, InstallmentStatus.PENDING)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="12" y1="8" x2="12" y2="16"></line>
                                    </svg>
                                    Pendiente
                                  </button>
                                )}
                              </div>
                            )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista Mensual */}
        {showMonthlyView && !showMatrixView && (
          <div className={styles.monthlyView}>
            <h2 className={styles.sectionTitle}>Pagos Mensuales por Vencer</h2>
            
            {Object.keys(monthlyPayments).length === 0 ? (
              <div className={styles.emptyState}>
                No hay pagos mensuales por vencer. ¡Todo al día!
              </div>
            ) : (
              <div className={styles.monthsGrid}>
                {Object.keys(monthlyPayments).map((monthKey) => (
                  <div key={monthKey} className={styles.monthCard}>
                    <div className={styles.monthHeader}>
                      <h3 className={styles.monthTitle}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {monthlyPayments[monthKey].monthName}
                      </h3>
                      <div className={styles.monthTotal}>
                        <span className={styles.monthTotalLabel}>Total del mes:</span>
                        <span className={styles.monthTotalValue}>{formatCurrency(monthlyPayments[monthKey].total)}</span>
                      </div>
                      <button 
                        className={styles.payAllButton}
                        onClick={() => handlePayAllInstallmentsForMonth(monthKey)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Pagar Todo
                      </button>
                    </div>
                    
                    <div className={styles.monthInstallments}>
                      <ResizableTableContainer monthKey={monthKey} items={monthlyPayments[monthKey].items} onPayClick={handleConfirmPayment} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista de Matriz */}
        {showMatrixView && (
          <div className={styles.matrixView}>
            <h2 className={styles.sectionTitle}>Matriz de Pagos Futuros</h2>
            
            {Object.keys(monthlyPayments).length === 0 ? (
              <div className={styles.emptyState}>
                No hay pagos futuros programados.
              </div>
            ) : (
              <div className={styles.matrixContainer}>
                <div className={styles.matrixHeader}>
                  <div className={styles.matrixCorner}>Gastos / Meses</div>
                  {Object.keys(monthlyPayments).map((monthKey) => (
                    <div key={monthKey} className={styles.matrixMonth}>
                      <div className={styles.matrixMonthName}>{monthlyPayments[monthKey].monthName}</div>
                      <div className={styles.matrixMonthTotal}>{formatCurrency(monthlyPayments[monthKey].total)}</div>
                    </div>
                  ))}
                </div>
                
                <div className={styles.matrixBody}>
                  {expenses.filter(e => !e.isSimulation).map((expense) => {
                    // Solo mostrar gastos activos (no simulaciones)
                    const pendingInstallments = expense.installments.filter(i => i.status === InstallmentStatus.PENDING);
                    if (pendingInstallments.length === 0) return null;
                    
                    return (
                      <div key={expense._id} className={styles.matrixRow}>
                        <div className={styles.matrixExpense}>
                          <div className={styles.matrixExpenseName}>{expense.description}</div>
                          <div className={styles.matrixExpenseTotal}>{formatCurrency(expense.amount)}</div>
                        </div>
                        
                        {Object.keys(monthlyPayments).map((monthKey) => {
                          const installmentsInMonth = monthlyPayments[monthKey].items.filter(item => 
                            item.expense._id === expense._id
                          );
                          
                          return (
                            <div key={`${expense._id}-${monthKey}`} className={styles.matrixCell}>
                              {installmentsInMonth.length > 0 ? (
                                <div className={styles.matrixPayment}>
                                  <div className={styles.matrixPaymentAmount}>
                                    {formatCurrency(installmentsInMonth.reduce((sum, item) => sum + item.amount, 0))}
                                  </div>
                                  <div className={styles.matrixPaymentInstallment}>
                                    {installmentsInMonth.map(item => `Cuota ${item.installment}`).join(', ')}
                                  </div>
                                  {/* Verificar si el mes de la celda es el mes actual */}
                                  {(() => {
                                    // Obtener la fecha del mes de esta celda de la matriz
                                    const [year, month] = monthKey.split('-').map(Number);
                                    const cellDate = new Date(year, month - 1);
                                    const currentDate = new Date();
                                    const isCurrentMonth = cellDate.getMonth() === currentDate.getMonth() && 
                                                          cellDate.getFullYear() === currentDate.getFullYear();
                                    
                                    return (
                                      <button 
                                        className={styles.matrixPayButton}
                                        onClick={() => {
                                          if (isCurrentMonth) {
                                            installmentsInMonth.forEach(item => {
                                              handleUpdateInstallmentStatus(item.expense._id, item.installment, InstallmentStatus.PAID);
                                            });
                                          } else {
                                            alert('Solo puedes pagar cuotas del mes actual.');
                                          }
                                        }}
                                        disabled={!isCurrentMonth}
                                        title={isCurrentMonth ? 'Pagar cuotas' : 'Solo puedes pagar cuotas del mes actual'}
                                      >
                                        Pagar
                                      </button>
                                    );
                                  })()}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal para configurar el fondo */}
        <Modal
          isOpen={isFundModalOpen}
          onClose={() => setIsFundModalOpen(false)}
          title="Configurar Fondo de Tarjeta de Crédito"
        >
          <div className={styles.modalContent}>
            <div className={styles.formGroup}>
              <label htmlFor="monthlyContribution" className={styles.label}>
                Contribución Mensual:
              </label>
              <div className={styles.inputWithPrefix}>
                <span className={styles.inputPrefix}>$</span>
                <input
                  id="monthlyContribution"
                  type="text"
                  className={styles.input}
                  value={monthlyContribution}
                  onChange={(e) => {
                    // Eliminar caracteres no numéricos excepto el punto decimal
                    const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                    // Convertir a número
                    const numValue = parseFloat(numericValue);
                    // Actualizar el estado solo si es un número válido
                    if (!isNaN(numValue)) {
                      setMonthlyContribution(numValue);
                    } else {
                      setMonthlyContribution(0);
                    }
                  }}
                  placeholder="0"
                />
              </div>
              {monthlyContribution > 0 && (
                <div className={styles.inputHelperText}>
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(monthlyContribution)}
                </div>
              )}
              <div className={styles.inputHelperText} style={{ marginTop: '1rem' }}>
                Este monto se agregará a tu fondo cada mes para pagar tus gastos de tarjeta de crédito.
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="maxMonthlyContribution" className={styles.label}>
                Aporte Mensual Máximo:
              </label>
              <div className={styles.inputWithPrefix}>
                <span className={styles.inputPrefix}>$</span>
                <input
                  id="maxMonthlyContribution"
                  type="text"
                  className={styles.input}
                  value={maxMonthlyContribution}
                  onChange={(e) => {
                    // Eliminar caracteres no numéricos excepto el punto decimal
                    const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                    // Convertir a número
                    const numValue = parseFloat(numericValue);
                    // Actualizar el estado solo si es un número válido
                    if (!isNaN(numValue)) {
                      setMaxMonthlyContribution(numValue);
                    } else {
                      setMaxMonthlyContribution(0);
                    }
                  }}
                  placeholder="0"
                />
              </div>
              {maxMonthlyContribution > 0 && (
                <div className={styles.inputHelperText}>
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(maxMonthlyContribution)}
                </div>
              )}
              <div className={styles.inputHelperText} style={{ marginTop: '1rem' }}>
                Este es el monto máximo que estarías dispuesto a aportar en casos excepcionales cuando el aporte normal no alcance.
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="accumulatedAmount" className={styles.label}>
                Monto Acumulado Actual:
              </label>
              <div className={styles.inputWithPrefix}>
                <span className={styles.inputPrefix}>$</span>
                <input
                  id="accumulatedAmount"
                  type="text"
                  className={styles.input}
                  value={accumulatedAmount}
                  onChange={(e) => {
                    // Eliminar caracteres no numéricos excepto el punto decimal
                    const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                    // Convertir a número
                    const numValue = parseFloat(numericValue);
                    // Actualizar el estado solo si es un número válido
                    if (!isNaN(numValue)) {
                      setAccumulatedAmount(numValue);
                    } else {
                      setAccumulatedAmount(0);
                    }
                  }}
                  placeholder="0"
                />
              </div>
              {accumulatedAmount > 0 && (
                <div className={styles.inputHelperText}>
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(accumulatedAmount)}
                </div>
              )}
              <div className={styles.inputHelperText} style={{ marginTop: '1rem' }}>
                Este es el monto actualmente disponible para pagar tus gastos de tarjeta de crédito. Puedes ajustarlo manualmente si es necesario.
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <Button 
                onClick={handleCreateOrUpdateFund}
                disabled={monthlyContribution <= 0}
              >
                Guardar
              </Button>
              <Button onClick={() => setIsFundModalOpen(false)} variant="outline">
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal para agregar gasto */}
        <Modal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title="Agregar Gasto de Tarjeta de Crédito"
        >
          <div className={styles.modalContent}>
            <ExpenseForm onSubmit={handleCreateExpense} onCancel={() => setIsExpenseModalOpen(false)} />
          </div>
        </Modal>

        {/* Modal para editar fecha de compra */}
        <Modal
          isOpen={isEditDateModalOpen}
          onClose={() => {
            setIsEditDateModalOpen(false);
            setSelectedExpense(null);
          }}
          title="Editar Fecha de Inicio de Pago"
        >
          {selectedExpense && (
            <div className={styles.modalContent}>
              <p>Gasto: {selectedExpense.description}</p>
              <p>Fecha actual: {new Date(selectedExpense.purchaseDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              
              <div className={styles.formGroup}>
                <label htmlFor="newPurchaseDate" className={styles.label}>
                  Nueva fecha de inicio de pago:
                </label>
                <div className={styles.dateSelector}>
                  <select
                    id="newPurchaseMonth"
                    className={styles.selectInput}
                    value={newPurchaseDate.getMonth()}
                    onChange={(e) => {
                      const newDate = new Date(newPurchaseDate);
                      newDate.setMonth(parseInt(e.target.value));
                      setNewPurchaseDate(newDate);
                    }}
                  >
                    {[
                      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                    ].map((month, index) => (
                      <option key={month} value={index}>{month}</option>
                    ))}
                  </select>
                  <select
                    id="newPurchaseYear"
                    className={styles.selectInput}
                    value={newPurchaseDate.getFullYear()}
                    onChange={(e) => {
                      const newDate = new Date(newPurchaseDate);
                      newDate.setFullYear(parseInt(e.target.value));
                      setNewPurchaseDate(newDate);
                    }}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputHelperText}>
                  Primera cuota a pagar en {new Date(newPurchaseDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <Button
                  onClick={() => {
                    setIsEditDateModalOpen(false);
                    setSelectedExpense(null);
                  }}
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdatePurchaseDate}
                  disabled={isUpdatingDate}
                >
                  {isUpdatingDate ? 'Actualizando...' : 'Actualizar Fecha'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal para simular gasto */}
        <Modal
          isOpen={isSimulationModalOpen}
          onClose={() => setIsSimulationModalOpen(false)}
          title="Simular Gasto de Tarjeta de Crédito"
        >
          <div className={styles.modalContent}>
            {!simulationResult ? (
              // Formulario de simulación
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="simulationDescription" className={styles.label}>
                    Descripción del gasto:
                  </label>
                  <input
                    id="simulationDescription"
                    type="text"
                    className={styles.input}
                    value={simulationDescription}
                    onChange={(e) => setSimulationDescription(e.target.value)}
                    placeholder="Ej: Compra en tienda, Electrodoméstico, etc."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="simulationStartDate" className={styles.label}>
                    Mes de inicio de pago:
                  </label>
                  <div className={styles.dateSelector}>
                    <select
                      id="simulationStartMonth"
                      className={styles.selectInput}
                      value={simulationStartDate.getMonth()}
                      onChange={(e) => {
                        const newDate = new Date(simulationStartDate);
                        newDate.setMonth(parseInt(e.target.value));
                        setSimulationStartDate(newDate);
                      }}
                    >
                      {[
                        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                      ].map((month, index) => (
                        <option key={month} value={index}>{month}</option>
                      ))}
                    </select>
                    <select
                      id="simulationStartYear"
                      className={styles.selectInput}
                      value={simulationStartDate.getFullYear()}
                      onChange={(e) => {
                        const newDate = new Date(simulationStartDate);
                        newDate.setFullYear(parseInt(e.target.value));
                        setSimulationStartDate(newDate);
                      }}
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputHelperText}>
                    Primera cuota a pagar en {new Date(simulationStartDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="simulationAmount" className={styles.label}>
                    Monto:
                  </label>
                  <div className={styles.inputWithPrefix}>
                    <span className={styles.inputPrefix}>$</span>
                    <input
                      id="simulationAmount"
                      type="text"
                      className={styles.input}
                      value={simulationAmountInput}
                      onChange={(e) => handleAmountInputChange(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  {simulationAmount > 0 && (
                    <div className={styles.inputHelperText}>
                      {formatCurrency(simulationAmount)}
                    </div>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="simulationInstallments" className={styles.label}>
                    Número de Cuotas:
                  </label>
                  <div className={styles.installmentsSelector}>
                    <button 
                      type="button"
                      className={styles.installmentButton}
                      onClick={() => simulationInstallments > 1 && setSimulationInstallments(simulationInstallments - 1)}
                      disabled={simulationInstallments <= 1}
                    >
                      -
                    </button>
                    <input
                      id="simulationInstallments"
                      type="number"
                      className={`${styles.input} ${styles.installmentsInput}`}
                      value={simulationInstallments}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 1 && value <= 36) {
                          setSimulationInstallments(value);
                        }
                      }}
                      min="1"
                      max="36"
                    />
                    <button 
                      type="button"
                      className={styles.installmentButton}
                      onClick={() => simulationInstallments < 36 && setSimulationInstallments(simulationInstallments + 1)}
                      disabled={simulationInstallments >= 36}
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.inputHelperText}>
                    {simulationInstallments === 1 ? 'Pago único' : `${simulationInstallments} cuotas`}
                  </div>
                </div>
                
                <div className={styles.modalActions}>
                  <Button 
                    onClick={handleSimulateExpense}
                    disabled={isSimulating || simulationAmount <= 0}
                  >
                    {isSimulating ? 'Simulando...' : 'Simular'}
                  </Button>
                  <Button onClick={() => {
                    resetSimulationForm();
                    setIsSimulationModalOpen(false);
                  }} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              simulationResult && (
                <>
                  <div className={`${styles.simulationResult} ${simulationResult.canAfford ? styles.canAfford : styles.cannotAfford}`}>
                    <div className={styles.simulationResultHeader}>
                      <h3 className={styles.simulationResultTitle}>
                        {simulationResult.canAfford ? "✅ Puedes realizar esta compra" : "❌ No puedes realizar esta compra"}
                      </h3>
                    </div>
                    
                    <div className={styles.simulationSummary}>
                      <div className={styles.simulationSummaryItem}>
                        <div className={styles.simulationSummaryIcon}>
                          {simulationAmount > 0 && simulationInstallments > 0 && (
                            <span>💰</span>
                          )}
                        </div>
                        <div className={styles.simulationSummaryContent}>
                          <h4 className={styles.simulationSummaryTitle}>Gasto Simulado</h4>
                          <p className={styles.simulationSummaryValue}>
                            {formatCurrency(simulationAmount)} en {simulationInstallments} {simulationInstallments === 1 ? 'cuota' : 'cuotas'} 
                            de {formatCurrency(simulationAmount / simulationInstallments)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.simulationSection}>
                      <h4 className={styles.simulationSectionTitle}>SITUACIÓN ACTUAL</h4>
                      <div className={styles.simulationResultDetails}>
                        <div className={styles.simulationResultItem}>
                          <span className={styles.simulationResultLabel}>Fondos disponibles:</span>
                          <span className={styles.simulationResultValue}>{formatCurrency(simulationResult.availableFunds)}</span>
                        </div>
                        {fund && (
                          <div className={styles.simulationResultSubitem}>
                            <span className={styles.simulationResultSubLabel}>Acumulado: {formatCurrency(fund.accumulatedAmount)}</span>
                            <span className={styles.simulationResultSubLabel}>Mensual: {formatCurrency(fund.monthlyContribution)}</span>
                          </div>
                        )}
                        <div className={styles.simulationResultItem}>
                          <span className={styles.simulationResultLabel}>Pagos mensuales existentes:</span>
                          <span className={styles.simulationResultValue}>
                            {formatCurrency(simulationResult.requiredFunds - (simulationAmount / simulationInstallments))}
                          </span>
                        </div>
                        <div className={styles.simulationResultItem}>
                          <span className={styles.simulationResultLabel}>Fondos disponibles para nuevo gasto:</span>
                          <span className={styles.simulationResultValue}>
                            {formatCurrency(simulationResult.availableFunds - (simulationResult.requiredFunds - (simulationAmount / simulationInstallments)))}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.simulationSection}>
                      <h4 className={styles.simulationSectionTitle}>REQUERIMIENTOS DEL GASTO</h4>
                      <div className={styles.simulationResultDetails}>
                        <div className={styles.simulationResultItem}>
                          <span className={styles.simulationResultLabel}>Pago mensual del nuevo gasto:</span>
                          <span className={styles.simulationResultValue}>{formatCurrency(simulationAmount / simulationInstallments)}</span>
                        </div>
                        <div className={styles.simulationResultItem}>
                          <span className={styles.simulationResultLabel}>Pago mensual total (existente + nuevo):</span>
                          <span className={styles.simulationResultValue}>{formatCurrency(simulationResult.requiredFunds)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.simulationSection}>
                      <h4 className={styles.simulationSectionTitle}>RESULTADO</h4>
                      <div className={styles.simulationResultDetails}>
                        {/* Mostrar información sobre los meses hasta el inicio de pago */}
                        {simulationStartDate && (
                          <div className={styles.simulationResultItem}>
                            <span className={styles.simulationResultLabel}>Fecha de inicio de pago:</span>
                            <span className={styles.simulationResultValue}>
                              {simulationStartDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                            </span>
                          </div>
                        )}
                        
                        <div className={styles.simulationResultItem}>
                          <span className={styles.simulationResultLabel}>¿Puede pagar el primer mes cuando llegue la fecha?</span>
                          <span className={`${styles.simulationResultValue} ${simulationResult.canAfford ? styles.positive : styles.negative}`}>
                            {simulationResult.canAfford ? 'SÍ' : 'NO'}
                          </span>
                        </div>
                        
                        {/* Explicación detallada de la viabilidad */}
                        <div className={styles.simulationResultExplanation}>
                          <h5 className={styles.simulationResultSubtitle}>Análisis de Fondos</h5>
                          <div className={styles.simulationResultDetail}>
                            <div className={styles.simulationResultDetailItem}>
                              <span>Fondos proyectados para {simulationStartDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}:</span>
                              <span>{formatCurrency(simulationResult.projectedAvailableFundsAtStart)}</span>
                              <span className={styles.simulationResultDetailExplanation}>
                                (Saldo disponible después de pagar gastos anteriores)
                              </span>
                            </div>
                            <div className={styles.simulationResultDetailItem}>
                              <span>Pagos existentes en ese mes:</span>
                              <span>{formatCurrency(simulationResult.monthlyRequiredFunds - simulationResult.installmentAmount)}</span>
                              <span className={styles.simulationResultDetailExplanation}>
                                (Ya restados del saldo disponible)
                              </span>
                            </div>
                            <div className={styles.simulationResultDetailItem}>
                              <span>Pago de la nueva cuota:</span>
                              <span>{formatCurrency(simulationResult.installmentAmount)}</span>
                            </div>
                            <div className={styles.simulationResultDetailItem + ' ' + styles.simulationResultDetailTotal}>
                              <span>Total requerido:</span>
                              <span>{formatCurrency(simulationResult.monthlyRequiredFunds)}</span>
                            </div>
                          </div>
                          
                          <div className={styles.simulationResultFlowExplanation}>
                            <h5 className={styles.simulationResultSubtitle}>Flujo de Fondos</h5>
                            <p className={styles.simulationResultNote}>
                              <strong>Importante:</strong> El análisis considera el flujo de fondos a lo largo del tiempo, 
                              teniendo en cuenta los gastos acumulados y los aportes mensuales.
                            </p>
                            
                            <div className={styles.simulationResultFlowStatus}>
                              <div className={styles.simulationResultFlowStatusItem + ' ' + (simulationResult.canAfford ? styles.positive : styles.negative)}>
                                <span>Estado del flujo:</span>
                                <span>{simulationResult.canAfford ? 'VIABLE' : 'NO VIABLE'}</span>
                              </div>
                              {!simulationResult.canAfford && (
                                <p className={styles.simulationResultFlowWarning}>
                                  El análisis muestra que {!simulationResult.canPayFirstMonth ? 
                                    'no tendrás fondos suficientes para el primer pago' : 
                                    'no podrás mantener los pagos a lo largo del tiempo'}, 
                                  considerando tus gastos existentes y aportes mensuales actuales.
                                </p>
                              )}
                            </div>
                            
                            {/* Resumen financiero detallado (visible en todos los dispositivos) */}
                            <div className={styles.financialSummary}>
                              {simulationResult.monthlyProjections.length > 0 && (
                                <>
                                  <h6 className={styles.financialSummaryTitle}>Resumen Financiero</h6>
                                  
                                  {/* Primer mes de pago */}
                                  {(() => {
                                    // Encontrar el primer mes con un pago simulado
                                    const firstPaymentMonth = simulationResult.monthlyProjections.find(p => p.newPayment > 0);
                                    
                                    if (!firstPaymentMonth) {
                                      return (
                                        <div className={styles.financialSummaryMonth}>
                                          <h6>No hay pagos simulados en los próximos meses</h6>
                                        </div>
                                      );
                                    }
                                    
                                    const monthIndex = simulationResult.monthlyProjections.findIndex(p => p.month === firstPaymentMonth.month);
                                    const initialValue = monthIndex === 0 
                                      ? fund?.accumulatedAmount || 0 
                                      : simulationResult.monthlyProjections[monthIndex - 1].balanceAfterPayments;
                                    
                                    const disponible = initialValue + monthlyContribution;
                                    const existente = firstPaymentMonth.totalBefore;
                                    const simulado = firstPaymentMonth.newPayment;
                                    const acumulado = disponible - existente - simulado;
                                    
                                    return (
                                      <div className={styles.financialSummaryMonth}>
                                        <h6>{firstPaymentMonth.monthLabel} (Primer mes de pago)</h6>
                                        <div className={styles.financialSummaryGrid}>
                                          <div className={styles.financialSummaryItem}>
                                            <span>Fondos iniciales:</span>
                                            <span>{formatCurrency(initialValue)}</span>
                                          </div>
                                          <div className={styles.financialSummaryItem}>
                                            <span>Aporte mensual:</span>
                                            <span>{formatCurrency(monthlyContribution)}</span>
                                          </div>
                                          <div className={styles.financialSummaryItem}>
                                            <span>Disponible:</span>
                                            <span>{formatCurrency(disponible)}</span>
                                          </div>
                                          <div className={styles.financialSummaryItem}>
                                            <span>Pagos existentes:</span>
                                            <span>{formatCurrency(existente)}</span>
                                          </div>
                                          <div className={styles.financialSummaryItem}>
                                            <span>Nueva cuota:</span>
                                            <span>{formatCurrency(simulado)}</span>
                                          </div>
                                          <div className={`${styles.financialSummaryItem} ${acumulado >= 0 ? styles.positive : styles.negative}`}>
                                            <span>Saldo final:</span>
                                            <span>{formatCurrency(acumulado)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  
                                  {/* Mes crítico (primer mes en rojo si existe) */}
                                  {simulationResult.monthlyProjections.some(p => p.status === 'Rojo') && (
                                    <div className={styles.financialSummaryMonth}>
                                      <h6>
                                        {simulationResult.monthlyProjections.find(p => p.status === 'Rojo')?.monthLabel} 
                                        (Primer mes crítico)
                                      </h6>
                                      <div className={styles.financialSummaryGrid}>
                                        {(() => {
                                          const criticalMonth = simulationResult.monthlyProjections.find(p => p.status === 'Rojo');
                                          if (!criticalMonth) return null;
                                          
                                          const criticalIndex = simulationResult.monthlyProjections.findIndex(p => p.status === 'Rojo');
                                          const initialValue = criticalIndex === 0 
                                            ? fund?.accumulatedAmount || 0 
                                            : simulationResult.monthlyProjections[criticalIndex - 1].balanceAfterPayments;
                                          
                                          // Verificar si es el mes actual y no hay pagos existentes
                                          const currentDate = new Date();
                                          const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
                                          const isCurrentMonth = criticalMonth.month === currentMonthKey;
                                          const hasExistingPayments = criticalMonth.totalBefore > 0;
                                          
                                          // Si es el mes actual y no hay pagos, no agregar el aporte (ya está en el acumulado)
                                          const shouldAddContribution = !(criticalIndex === 0 && isCurrentMonth && !hasExistingPayments);
                                          const disponible = initialValue + (shouldAddContribution ? monthlyContribution : 0);
                                          const existente = criticalMonth.totalBefore;
                                          const simulado = criticalMonth.newPayment;
                                          const acumulado = disponible - existente - simulado;
                                          
                                          return (
                                            <>
                                              <div className={styles.financialSummaryItem}>
                                                <span>Fondos iniciales:</span>
                                                <span>{formatCurrency(initialValue)}</span>
                                              </div>
                                              <div className={styles.financialSummaryItem}>
                                                <span>Aporte mensual:</span>
                                                <span>{formatCurrency(monthlyContribution)}</span>
                                              </div>
                                              <div className={styles.financialSummaryItem}>
                                                <span>Disponible:</span>
                                                <span>{formatCurrency(disponible)}</span>
                                              </div>
                                              <div className={styles.financialSummaryItem}>
                                                <span>Pagos existentes:</span>
                                                <span>{formatCurrency(existente)}</span>
                                              </div>
                                              <div className={styles.financialSummaryItem}>
                                                <span>Nueva cuota:</span>
                                                <span>{formatCurrency(simulado)}</span>
                                              </div>
                                              <div className={`${styles.financialSummaryItem} ${styles.negative}`}>
                                                <span>Saldo final:</span>
                                                <span>{formatCurrency(acumulado)}</span>
                                              </div>
                                              <div className={styles.financialSummaryDeficit}>
                                                <span>Déficit:</span>
                                                <span>{formatCurrency(Math.abs(acumulado))}</span>
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className={styles.simulationResultItem}>
                          <span className={styles.simulationResultLabel}>¿Puede pagar el total a largo plazo?</span>
                          <span className={`${styles.simulationResultValue} ${simulationResult.canPayTotal ? styles.positive : styles.negative}`}>
                            {simulationResult.canPayTotal ? 'SÍ' : 'NO'}
                          </span>
                          {!simulationResult.canPayTotal && simulationResult.canAfford && (
                            <span className={styles.simulationResultDetailExplanation}>
                              (No relevante para gastos de una sola cuota)
                            </span>
                          )}
                        </div>
                        
                        <div className={styles.simulationResultItem}>
                          <span className={styles.simulationResultLabel}>CONCLUSIÓN:</span>
                          <span className={`${styles.simulationResultValue} ${simulationResult.canAfford ? styles.positive : styles.negative}`}>
                            {simulationResult.canAfford ? 'PUEDE REALIZAR EL GASTO' : 'NO PUEDE REALIZAR EL GASTO'}
                          </span>
                          {simulationResult.canAfford && !simulationResult.canPayTotal && (
                            <div className={styles.simulationResultDetailExplanation}>
                              Para gastos de una sola cuota, solo es necesario tener fondos suficientes para el mes de inicio.
                            </div>
                          )}
                        </div>
                        
                        <div className={styles.monthlyProjectionContainer}>
                          <h4 className={styles.monthlyProjectionTitle}>Proyección Mensual Detallada</h4>
                          <div className={styles.tableExplanation}>
                            <p><strong>Inicial:</strong> Saldo acumulado del mes anterior</p>
                            <p><strong>Aporte:</strong> Contribución mensual fija ({formatCurrency(monthlyContribution)})</p>
                            <p><strong>Disponible:</strong> Inicial + Aporte (fondos disponibles para el mes)</p>
                            <p><strong>Existente:</strong> Pagos ya comprometidos de meses anteriores</p>
                            <p><strong>Simulado:</strong> Pago de la nueva cuota que estás simulando</p>
                            <p><strong>Acumulado:</strong> Disponible - Existente - Simulado (saldo que pasa al siguiente mes) <span className={styles.flowIndicator}>→</span></p>
                          </div>
                          <div className={styles.tableFlowExplanation}>
                            <p>El <strong>Acumulado</strong> de cada mes se convierte en el <strong>Inicial</strong> del mes siguiente.</p>
                          </div>
                          <div className={styles.monthlyProjectionTableWrapper}>
                            <table className={styles.monthlyProjectionTable}>
                              <thead>
                                <tr>
                                  <th>Mes</th>
                                  <th>Inicial</th>
                                  <th>Disponible</th>
                                  <th>Gasto Existente</th>
                                  <th>Gasto Simulado</th>
                                  <th>Acumulado</th>
                                  <th>Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {simulationResult.monthlyProjections.slice(0, 24).map((projection, index) => {
                                  // Usar directamente los valores calculados por el backend
                                  return (
                                    <tr key={projection.month} className={projection.status === 'Rojo' ? styles.negativeRow : ''}>
                                      <td>{projection.monthLabel}</td>
                                      <td>{formatTableCurrency(projection.initialAmount)}</td>
                                      <td>{formatTableCurrency(projection.accumulatedFunds)}</td>
                                      <td>{formatTableCurrency(projection.totalBefore)}</td>
                                      <td>{formatTableCurrency(projection.newPayment)}</td>
                                      <td className={styles.accumulatedColumn}>{formatTableCurrency(projection.balanceAfterPayments)}</td>
                                      <td>
                                        <span className={`${styles.statusIndicator} ${projection.status === 'Verde' ? styles.statusGreen : styles.statusRed}`}>
                                          {projection.status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className={styles.monthlyProjectionExplanation}>
                            <p><span className={styles.statusRed}>Rojo</span>: Sin fondos suficientes. <span className={styles.statusGreen}>Verde</span>: Con fondos suficientes.</p>
                            <p>Para gastos de una sola cuota, solo el primer mes debe estar en verde.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  {!simulationResult.canAfford && simulationResult.suggestedMonthlyContribution && (
                    <div className={styles.simulationSuggestion}>
                      <h4 className={styles.simulationSuggestionTitle}>
                        ¿Cómo hacer viable este gasto?
                      </h4>
                      
                      <div className={styles.simulationSuggestionContent}>
                        <div className={styles.simulationResultItem}>
                          <span className={styles.simulationResultLabel}>Aporte mensual actual:</span>
                          <span className={styles.simulationResultValue}>{formatCurrency(fund?.monthlyContribution || 0)}</span>
                        </div>
                        
                        <div className={styles.simulationResultItem}>
                          <span className={styles.simulationResultLabel}>Aporte mensual sugerido:</span>
                          <span className={styles.simulationResultValue}>{formatCurrency(simulationResult.suggestedMonthlyContribution)}</span>
                        </div>
                        
                        <div className={styles.simulationSuggestionExplanation}>
                          <div className={styles.simulationSuggestionDeficit}>
                            <div className={styles.simulationSuggestionDeficitHeader}>
                              <strong>Déficit a cubrir:</strong> {formatCurrency(Math.abs(simulationResult.projectedBalance))}
                            </div>
                            <div className={styles.simulationSuggestionDeficitExplanation}>
                              Este es el monto adicional que necesitas acumular para poder realizar este gasto.
                              Con tu aporte mensual actual de {formatCurrency(fund?.monthlyContribution || 0)}, 
                              necesitarías aproximadamente {Math.ceil(Math.abs(simulationResult.projectedBalance) / (fund?.monthlyContribution || 1))} {Math.ceil(Math.abs(simulationResult.projectedBalance) / (fund?.monthlyContribution || 1)) === 1 ? 'mes' : 'meses'} para cubrir este déficit.
                            </div>
                          </div>
                          
                          <p>
                            <strong>Opción 1:</strong> Aumenta tu aporte mensual de {formatCurrency(fund?.monthlyContribution || 0)} a {formatCurrency(simulationResult.suggestedMonthlyContribution)}
                            <span className={styles.simulationSuggestionHighlight}> 
                              (un incremento de {formatCurrency(simulationResult.suggestedMonthlyContribution - (fund?.monthlyContribution || 0))} por mes)
                            </span> 
                            durante {simulationResult.suggestedDurationMonths} {simulationResult.suggestedDurationMonths === 1 ? 'mes' : 'meses'} 
                            antes de la fecha de inicio ({simulationStartDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}).
                          </p>
                          
                          <p>
                            <strong>Opción 2:</strong> Posponer la compra por {simulationResult.suggestedDurationMonths} {simulationResult.suggestedDurationMonths === 1 ? 'mes' : 'meses'} 
                            manteniendo tu aporte mensual actual de {formatCurrency(fund?.monthlyContribution || 0)}.
                          </p>
                          
                          <p className={styles.simulationSuggestionNote}>
                            Nota: Con la opción 1, acumularás aproximadamente {formatCurrency((simulationResult.suggestedMonthlyContribution - (fund?.monthlyContribution || 0)) * (simulationResult.suggestedDurationMonths || 1))} adicionales 
                            en {simulationResult.suggestedDurationMonths || 1} {(simulationResult.suggestedDurationMonths || 1) === 1 ? 'mes' : 'meses'}, suficiente para cubrir el déficit.
                          </p>
                        </div>
                      </div>
                      
                      <div className={styles.simulationSuggestionActions}>
                        <Button 
                          onClick={() => {
                            if (simulationResult.suggestedMonthlyContribution) {
                              setMonthlyContribution(simulationResult.suggestedMonthlyContribution);
                              handleCreateOrUpdateFund();
                              setSimulationResult(null);
                              setTimeout(() => {
                                handleSimulateExpense();
                              }, 500); // Pequeño retraso para asegurar que el fondo se actualice
                            }
                          }}
                          variant="secondary"
                        >
                          Actualizar Aporte Mensual
                        </Button>
                        
                        {/* Botón para simular con fecha postergada */}
                        <Button 
                          onClick={() => {
                            // Calcular la nueva fecha postergada
                            const newDate = new Date(simulationStartDate);
                            newDate.setMonth(newDate.getMonth() + (simulationResult.suggestedDurationMonths || 0));
                            
                            // Actualizar la fecha y limpiar el resultado anterior
                            setSimulationStartDate(newDate);
                            setSimulationResult(null);
                            
                            // Volver a simular con la nueva fecha después de un pequeño retraso
                            // para asegurar que el estado se ha actualizado
                            setTimeout(() => {
                              // Llamar directamente a la API en lugar de usar handleSimulateExpense
                              // para evitar problemas con el estado
                              if (simulationAmount && simulationInstallments) {
                                api.simulateCreditCardExpense(simulationAmount, simulationInstallments, newDate)
                                  .then(result => {
                                    setSimulationResult(result);
                                  })
                                  .catch(error => {
                                    console.error('Error al simular con fecha postergada:', error);
                                    alert('Error al simular con fecha postergada. Intente nuevamente.');
                                  });
                              }
                            }, 100);
                          }}
                          variant="outline"
                        >
                          Simular con Fecha Postergada
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                  
                  <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
                    {simulationResult.canAfford && (
                      <Button 
                        onClick={() => {
                          handleCreateExpense({
                            amount: simulationAmount,
                            description: simulationDescription || 'Nuevo gasto simulado',
                            totalInstallments: simulationInstallments,
                            purchaseDate: simulationStartDate
                          });
                          setIsSimulationModalOpen(false);
                          resetSimulationForm();
                        }}
                      >
                        Crear Gasto
                      </Button>
                    )}
                    <Button 
                      onClick={() => {
                        setSimulationResult(null); // Volver al formulario
                      }} 
                      variant="outline"
                    >
                      Nueva Simulación
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsSimulationModalOpen(false);
                        setSimulationResult(null);
                      }} 
                      variant="outline"
                    >
                      Cerrar
                    </Button>
                  </div>
                </>
            ))}
          </div>
        </Modal>

        {/* Modal para confirmar pago */}
        <Modal
          isOpen={isPaymentConfirmModalOpen}
          onClose={() => {
            setIsPaymentConfirmModalOpen(false);
            setPaymentToConfirm(null);
          }}
          title="Confirmar Pago"
        >
          <div className={styles.modalContent}>
            {paymentToConfirm && (
              <>
                <p>
                  ¿Estás seguro de que deseas marcar como pagada esta cuota?
                </p>
                
                {/* Detalles del pago a confirmar */}
                {expenses.map(expense => {
                  if (expense._id === paymentToConfirm.expenseId) {
                    const installment = expense.installments.find(
                      i => i.number === paymentToConfirm.installmentNumber
                    );
                    
                    if (installment) {
                      return (
                        <div key={expense._id} style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                          <p><strong>Gasto:</strong> {expense.description}</p>
                          <p><strong>Cuota:</strong> {installment.number} de {expense.totalInstallments}</p>
                          <p><strong>Monto:</strong> {formatCurrency(installment.amount)}</p>
                          <p><strong>Fecha de vencimiento:</strong> {new Date(installment.dueDate).toLocaleDateString()}</p>
                        </div>
                      );
                    }
                  }
                  return null;
                }).filter(Boolean)}
                
                <div className={styles.modalActions}>
                  <Button 
                    onClick={processPaymentAfterConfirmation}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? 'Procesando...' : 'Confirmar Pago'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsPaymentConfirmModalOpen(false);
                      setPaymentToConfirm(null);
                    }} 
                    variant="outline"
                    disabled={isProcessingPayment}
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </main>
    </div>
  );
}

// Componente de formulario para gastos
function ExpenseForm({ onSubmit, onCancel, submitLabel = 'Guardar' }: { 
  onSubmit: (data: { amount: number; description: string; totalInstallments: number; purchaseDate?: Date }) => void; 
  onCancel: () => void;
  submitLabel?: string;
}) {
  // Función para formatear moneda en el formulario
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  const [amount, setAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [totalInstallments, setTotalInstallments] = useState<number>(1);
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Función para manejar cambios en el campo de monto
  const handleAmountInputChange = (value: string) => {
    setAmountInput(value);
    // Eliminar caracteres no numéricos excepto el punto decimal
    const numericValue = value.replace(/[^0-9.]/g, '');
    // Convertir a número
    const numValue = parseFloat(numericValue);
    // Actualizar el estado solo si es un número válido
    if (!isNaN(numValue)) {
      setAmount(numValue);
    } else {
      setAmount(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount <= 0 || description.trim() === '' || totalInstallments <= 0) {
      alert('Por favor, completa todos los campos correctamente');
      return;
    }
    
    setIsSubmitting(true);
    
    onSubmit({
      amount,
      description,
      totalInstallments,
      purchaseDate
    });
  };


  
  // Función para calcular el monto acumulado correctamente
  const calculateUpdatedAccumulatedAmount = (currentAmount: number, monthlyContribution: number, totalPayments: number) => {
    console.log('--- Cálculo de monto acumulado ---');
    console.log('Monto actual:', currentAmount);
    console.log('Contribución mensual:', monthlyContribution);
    console.log('Total pagos:', totalPayments);
    
    // Si el monto actual es 0, usamos la contribución mensual
    let baseAmount = currentAmount;
    if (baseAmount === 0) {
      baseAmount = monthlyContribution;
      console.log('Usando contribución mensual como base');
    }
    
    // Calcular el monto restante después de los pagos
    const remainingAfterPayments = baseAmount - totalPayments;
    
    // El monto final no puede ser negativo
    const finalAmount = remainingAfterPayments >= 0 ? remainingAfterPayments : 0;
    
    console.log('Cálculo: ' + baseAmount + ' - ' + totalPayments + ' = ' + finalAmount);
    return finalAmount;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Descripción del gasto:
        </label>
        <input
          id="description"
          type="text"
          className={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Compra en tienda, Electrodoméstico, etc."
          required
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="purchaseDate" className={styles.label}>
          Mes de inicio de pago:
        </label>
        <div className={styles.dateSelector}>
          <select
            id="purchaseMonth"
            className={styles.selectInput}
            value={purchaseDate.getMonth()}
            onChange={(e) => {
              const newDate = new Date(purchaseDate);
              newDate.setMonth(parseInt(e.target.value));
              setPurchaseDate(newDate);
            }}
          >
            {[
              'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ].map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
          <select
            id="purchaseYear"
            className={styles.selectInput}
            value={purchaseDate.getFullYear()}
            onChange={(e) => {
              const newDate = new Date(purchaseDate);
              newDate.setFullYear(parseInt(e.target.value));
              setPurchaseDate(newDate);
            }}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className={styles.inputHelperText}>
          Primera cuota a pagar en {new Date(purchaseDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="amount" className={styles.label}>
          Monto:
        </label>
        <div className={styles.inputWithPrefix}>
          <span className={styles.inputPrefix}>$</span>
          <input
            id="amount"
            type="text"
            className={styles.input}
            value={amountInput}
            onChange={(e) => handleAmountInputChange(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        {amount > 0 && (
          <div className={styles.inputHelperText}>
            {formatCurrency(amount)}
          </div>
        )}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="totalInstallments" className={styles.label}>
          Número de Cuotas:
        </label>
        <div className={styles.installmentsSelector}>
          <button 
            type="button"
            className={styles.installmentButton}
            onClick={() => totalInstallments > 1 && setTotalInstallments(totalInstallments - 1)}
            disabled={totalInstallments <= 1}
          >
            -
          </button>
          <input
            id="totalInstallments"
            type="number"
            className={`${styles.input} ${styles.installmentsInput}`}
            value={totalInstallments}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 1 && value <= 36) {
                setTotalInstallments(value);
              }
            }}
            min="1"
            max="36"
            required
          />
          <button 
            type="button"
            className={styles.installmentButton}
            onClick={() => totalInstallments < 36 && setTotalInstallments(totalInstallments + 1)}
            disabled={totalInstallments >= 36}
          >
            +
          </button>
        </div>
        <div className={styles.inputHelperText}>
          {totalInstallments === 1 ? 'Pago único' : `${totalInstallments} cuotas`}
        </div>
      </div>
      
      <div className={styles.modalActions}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Procesando...' : submitLabel}
        </Button>
        <Button type="button" onClick={onCancel} variant="outline" disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
