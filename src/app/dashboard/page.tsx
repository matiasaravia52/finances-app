'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Navbar from '@/components/layout/Navbar';
import Modal from '@/components/ui/Modal';
import TransactionForm from '@/components/forms/TransactionForm';
import styles from '@/styles/Dashboard.module.css';

type TransactionType = 'income' | 'expense';

type Transaction = {
  id: string
  type: TransactionType
  amount: number
  category: string
  description: string
  date: string
}

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('income');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [selectedTransaction, setSelectedTransaction] = useState<typeof transactions[0] | null>(null);

  const handleAddTransaction = (type: TransactionType) => {
    setSelectedTransaction(null);
    setTransactionType(type);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: typeof transactions[0]) => {
    setSelectedTransaction(transaction);
    setTransactionType(transaction.type as TransactionType);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(transactions.filter(t => t.id !== transactionId));
    }
  };

  const handleSubmitTransaction = (data: {
    amount: number
    category: string
    description: string
    type: TransactionType
  }) => {
    if (selectedTransaction) {
      // Editar transacción existente
      setTransactions(transactions.map(t => 
        t.id === selectedTransaction.id 
          ? {
              ...selectedTransaction,
              ...data,
              amount: data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount)
            }
          : t
      ));
    } else {
      // Crear nueva transacción
      const newTransaction = {
        id: Date.now().toString(),
        ...data,
        amount: data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount),
        date: new Date().toISOString().split('T')[0]
      };
      setTransactions([newTransaction, ...transactions]);
    }
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const currentBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className={styles.container}>
      <Navbar />
      
      <main className={styles.content}>
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
                        onClick={() => handleDeleteTransaction(transaction.id!)}
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
