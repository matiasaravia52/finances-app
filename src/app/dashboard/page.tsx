'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Navbar from '@/components/layout/Navbar';
import Modal from '@/components/ui/Modal';
import TransactionForm from '@/components/forms/TransactionForm';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import styles from '@/styles/Dashboard.module.css';
import { api } from '@/services/api';
import { Transaction, TransactionType } from '@/types/transaction';
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

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      console.log('[Dashboard] Loading transactions...');
      setIsLoading(true);
      setError(null);

      const data = await api.getTransactions();
      console.log('[Dashboard] Transactions loaded successfully:', data);
      setTransactions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transactions';
      console.error('[Dashboard] Error loading transactions:', {
        error: err,
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = (type: TransactionType) => {
    setSelectedTransaction(null);
    setTransactionType(type);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionType(transaction.type);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        setIsLoading(true);
        await api.deleteTransaction(transactionId);
        // Actualizar el estado local después de eliminar en el backend
        setTransactions(transactions.filter(t => t._id !== transactionId));
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction';
        console.error('[Dashboard] Error deleting transaction:', {
          error: err,
          message: errorMessage,
          transactionId,
          timestamp: new Date().toISOString()
        });
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmitTransaction = async (data: {
    amount: number
    category: string
    description: string
    type: TransactionType
  }) => {
    try {
      console.log('[Dashboard] Submitting transaction:', {
        ...data,
        isEdit: !!selectedTransaction
      });

      if (selectedTransaction) {
        // Preparar los datos para la actualización
        const updateData = {
          ...data,
          // Asegurar que el monto tenga el signo correcto según el tipo
          amount: Math.abs(data.amount)
        };
        
        // Llamar a la API para actualizar la transacción
        const updatedTransaction = await api.updateTransaction(selectedTransaction._id, updateData);
        
        // Actualizar el estado local con la transacción actualizada
        setTransactions(transactions.map(t => 
          t._id === selectedTransaction._id ? updatedTransaction : t
        ));
        
        console.log('[Dashboard] Transaction updated successfully:', updatedTransaction);
      } else {
        const transactionData = {
          ...data,
          amount: data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount)
        };
        const newTransaction = await api.createTransaction(transactionData);
        console.log('[Dashboard] Transaction created successfully:', newTransaction);
        setTransactions([newTransaction, ...transactions]);
      }

      setIsModalOpen(false);
      setSelectedTransaction(null);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save transaction';
      console.error('[Dashboard] Error handling transaction:', {
        error: err,
        message: errorMessage,
        data,
        timestamp: new Date().toISOString()
      });
      setError(errorMessage);
    }
  };

  const currentBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <main className={styles.content}>
          <div className={styles.loading}>Loading...</div>
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

        <div className={styles.grid}>
          {/* Balance Card */}
          <div className={`${styles.card} ${styles.fullWidth}`}>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Current Balance</h2>
              <p className={styles.balance}>
                ${currentBalance.toFixed(2)}
              </p>
            </div>
          </div>

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

          {/* Recent Transactions */}
          <div className={`${styles.card} ${styles.doubleWidth}`}>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Recent Transactions</h2>
              <div className={styles.transactionList}>
                {transactions.map((transaction, index) => (
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
                        <p className={styles.transactionDate}>{transaction.date}</p>
                      </div>
                      <p className={transaction.type === 'income' ? styles.amountIncome : styles.amountExpense}>
                        {transaction.amount > 0 ? '+' : ''}
                        ${transaction.amount.toFixed(2)}
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add ${transactionType === 'income' ? 'Income' : 'Expense'}`}
      >
        <TransactionForm
          type={transactionType}
          onSubmit={handleSubmitTransaction}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
