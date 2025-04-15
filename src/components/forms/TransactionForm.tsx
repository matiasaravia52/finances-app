import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import styles from '@/styles/TransactionForm.module.css'
import { formatCurrency } from '@/utils/numberFormatter'

type TransactionType = 'income' | 'expense'

type Transaction = {
  id?: string
  type: TransactionType
  amount: number
  category: string
  description?: string
  date: string
}

type TransactionFormProps = {
  type: TransactionType
  transaction?: Transaction
  onSubmit: (data: {
    amount: number
    category: string
    description: string
    type: TransactionType
  }) => void
  onCancel: () => void
}

const categories = {
  income: ['Salary', 'Freelance', 'Investments', 'Other'],
  expense: ['Food', 'Transport', 'Bills', 'Entertainment', 'Shopping', 'Other']
}

const TransactionForm = ({ type, transaction, onSubmit, onCancel }: TransactionFormProps) => {
  const [amount, setAmount] = useState(transaction ? Math.abs(transaction.amount).toString() : '')
  const [formattedAmount, setFormattedAmount] = useState('')
  const [category, setCategory] = useState(transaction?.category || '')
  const [description, setDescription] = useState(transaction?.description || '')
  
  // Actualizar el valor formateado cuando cambia el monto
  useEffect(() => {
    if (amount) {
      const numericValue = parseFloat(amount);
      if (!isNaN(numericValue)) {
        setFormattedAmount(formatCurrency(numericValue, '$', 2).replace('+', ''));
      } else {
        setFormattedAmount('');
      }
    } else {
      setFormattedAmount('');
    }
  }, [amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category) return

    // Convertir el monto a número y aplicar signo negativo si es un gasto
    const numericAmount = Number(amount)
    const finalAmount = type === 'expense' ? -Math.abs(numericAmount) : Math.abs(numericAmount)

    onSubmit({
      amount: finalAmount,
      category,
      description,
      type
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="amount" className={styles.label}>
          Amount
        </label>
        <div className={styles.inputGroup}>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.input}
            placeholder="0.00"
            required
          />
          <div className={styles.formattedAmount}>
            {formattedAmount || '$0,00'}
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="category" className={styles.label}>
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={styles.select}
          required
        >
          <option value="">Select a category</option>
          {categories[type].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="description" className={styles.label}>
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
          placeholder="Add a note..."
          rows={3}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add {type === 'income' ? 'Income' : 'Expense'}
        </Button>
      </div>
    </form>
  )
}

export default TransactionForm
