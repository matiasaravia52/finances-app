'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Navbar from '@/components/layout/Navbar';
import TransactionForm from '@/components/forms/TransactionForm';
import Modal from '@/components/ui/Modal';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import TransactionFilters from '@/components/ui/TransactionFilters';
import { api } from '@/services/api';
import { Transaction, TransactionType, PaginatedTransactions } from '@/types/transaction';
import { formatDate, formatRelativeTime } from '@/utils/dateFormatter';
import { formatCurrency } from '@/utils/numberFormatter';
import { FilterPeriod, getPeriodName } from '@/utils/transactionFilters';
import styles from '@/styles/Dashboard.module.css';
import { AuthProvider } from '@/contexts/AuthContext';

export default function Dashboard() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

function DashboardContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('income');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('current-month');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<{ total: number, currentMonth: number, currentYear: number }>({ 
    total: 0, 
    currentMonth: 0, 
    currentYear: 0 
  });
  
  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
    loadTransactionsSummary();
    loadCategories(selectedType);
  }, []);
  
  useEffect(() => {
    loadTransactions();
    
    // Recargar las categorías cuando cambia el tipo de transacción
    if (selectedType !== undefined) {
      loadCategories(selectedType);
    }
  }, [selectedPeriod, selectedType, selectedCategory, currentPage, limit]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const paginatedData = await api.getTransactions({
        period: selectedPeriod,
        type: selectedType || undefined,
        category: selectedCategory || undefined,
        page: currentPage,
        limit: limit
      });
      
      setTransactions(paginatedData.transactions);
      setTotalPages(paginatedData.totalPages);
      setTotalTransactions(paginatedData.total);
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionsSummary = async () => {
    try {
      const data = await api.getTransactionsSummary();
      setBalanceSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const loadCategories = async (type: string | null = null) => {
    try {
      const data = await api.getTransactionCategories(type || undefined);
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAddTransaction = (type: TransactionType) => {
    setTransactionType(type);
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionType(transaction.type);
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      return;
    }
    
    try {
      await api.deleteTransaction(id);
      
      // Si después de eliminar una transacción, la página actual quedaría vacía
      // (excepto para la página 1), retroceder una página
      if (transactions.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      loadTransactions();
      loadTransactionsSummary();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  const handleSubmitTransaction = async (data: {
    amount: number;
    category: string;
    description: string;
    type: TransactionType;
  }) => {
    try {
      if (selectedTransaction) {
        // Editar transacción existente
        await api.updateTransaction(selectedTransaction._id, data);
      } else {
        // Crear nueva transacción
        await api.createTransaction(data);
      }
      
      // Recargar datos
      // Si estamos editando, mantener la página actual
      // Si estamos creando, ir a la primera página para ver la nueva transacción
      if (!selectedTransaction) {
        setCurrentPage(1);
      }
      loadTransactions();
      loadTransactionsSummary();
      loadCategories();
      
      // Cerrar el modal
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error submitting transaction:', err);
      alert('Failed to save transaction. Please try again.');
    }
  };

  // Calculate period balance based on selected period
  const periodBalance = selectedPeriod === 'current-month' 
    ? balanceSummary.currentMonth 
    : selectedPeriod === 'current-year' 
      ? balanceSummary.currentYear 
      : balanceSummary.total;

  // Get period name for display
  const periodName = getPeriodName(selectedPeriod);

  if (isLoading && transactions.length === 0) {
    return (
      <div className={styles.container}>
        <Navbar />
        <main className={styles.content}>
          <div className={styles.loading}>
            Loading...
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
            <button onClick={loadTransactions} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        <div className={styles.dashboardLayout}>
          {/* Panel lateral: Quick Actions y Filtros */}
          <div className={styles.sidePanel}>
            {/* Quick Actions */}
            <div className={styles.card}>
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>Quick Actions</h2>
                <div className={styles.buttonGroup}>
                  <Button 
                    style={{ width: '100%' }} 
                    onClick={() => handleAddTransaction('income')}
                  >
                    Add Income
                  </Button>
                  <Button 
                    variant="secondary" 
                    style={{ width: '100%' }}
                    onClick={() => handleAddTransaction('expense')}
                  >
                    Add Expense
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Filtros */}
            <TransactionFilters
              selectedPeriod={selectedPeriod}
              selectedType={selectedType}
              selectedCategory={selectedCategory}
              categories={categories}
              onPeriodChange={setSelectedPeriod}
              onTypeChange={setSelectedType}
              onCategoryChange={setSelectedCategory}
              isLoading={isLoading}
            />
          </div>
          
          {/* Panel principal */}
          <div className={styles.mainPanel}>
            {/* Balance Cards */}
            <div className={styles.balanceCards}>
              <div className={styles.card}>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>Balance {selectedPeriod !== 'all' ? periodName : 'Actual'}</h2>
                  <p className={styles.balance}>
                    {formatCurrency(periodBalance)}
                  </p>
                </div>
              </div>
              
              <div className={styles.card}>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>Balance Total</h2>
                  <p className={styles.balance}>
                    {formatCurrency(balanceSummary.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabla de transacciones (ocupa la mayor parte) */}
            <div className={styles.card}>
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>Recent Transactions</h2>
                <div className={styles.transactionList}>
                  {transactions.length === 0 ? (
                    <div className={styles.emptyState}>
                      No hay transacciones en este período
                    </div>
                  ) : (
                    transactions.map((transaction, index) => (
                      <div
                        key={index}
                        className={styles.transactionItem}
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <div className={styles.transactionMain}>
                          <div>
                            <p className={styles.transactionInfo}>
                              {transaction.description}
                              <span className={styles.transactionCategory}>
                                {transaction.category}
                              </span>
                            </p>
                            <p className={styles.transactionDate} title={formatDate(transaction.date)}>
                              {formatRelativeTime(transaction.date)}
                            </p>
                          </div>
                          <p className={transaction.type === 'income' ? styles.amountIncome : styles.amountExpense}>
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                        <div className={styles.transactionActions}>
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className={styles.actionButton}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction._id)}
                            className={styles.actionButton}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Controles de paginación */}
                {totalTransactions > 0 && (
                  <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                      Mostrando {transactions.length} de {totalTransactions} transacciones
                    </div>
                    
                    {/* Selector de elementos por página */}
                    <div className={styles.limitSelector}>
                      <label htmlFor="limit-select">Elementos por página:</label>
                      <select 
                        id="limit-select"
                        value={limit}
                        onChange={(e) => {
                          const newLimit = parseInt(e.target.value);
                          setLimit(newLimit);
                          setCurrentPage(1); // Volver a la primera página al cambiar el límite
                        }}
                        className={styles.limitSelect}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                    </div>
                    
                    {totalPages > 1 && (
                      <div className={styles.paginationControls}>
                        <button 
                          className={styles.paginationButton} 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          &lt; Anterior
                        </button>
                        <span className={styles.pageIndicator}>
                          Página {currentPage} de {totalPages}
                        </span>
                        <button 
                          className={styles.paginationButton} 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente &gt;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${selectedTransaction ? 'Edit' : 'Add'} ${transactionType === 'income' ? 'Income' : 'Expense'}`}
      >
        <TransactionForm
          type={transactionType}
          transaction={selectedTransaction || undefined}
          onSubmit={handleSubmitTransaction}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
