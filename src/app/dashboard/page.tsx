'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Navbar from '@/components/layout/Navbar';
import Modal from '@/components/ui/Modal';
import TransactionForm from '@/components/forms/TransactionForm';
import styles from '@/styles/Dashboard.module.css';
import { api } from '@/services/api';
import { Transaction, TransactionType } from '@/types/transaction';

export default function Dashboard() {
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
      const data = await api.getTransactions();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load transactions');
      console.error('Error loading transactions:', err);
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

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(transactions.filter(t => t._id !== transactionId));
    }
  };

  const handleSubmitTransaction = async (data: {
    amount: number
    category: string
    description: string
    type: TransactionType
  }) => {
    try {
      if (selectedTransaction) {
        // TODO: Implementar actualización de transacción
        setTransactions(transactions.map(t => 
          t._id === selectedTransaction._id 
            ? {
                ...selectedTransaction,
                ...data,
                amount: data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount)
              }
            : t
        ));
      } else {
        const newTransaction = await api.createTransaction({
          ...data,
          amount: data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount)
        });
        setTransactions([newTransaction, ...transactions]);
      }
      setIsModalOpen(false);
      setSelectedTransaction(null);
      setError(null);
    } catch (err) {
      setError('Failed to save transaction');
      console.error('Error saving transaction:', err);
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
