import React from 'react';
import { FilterPeriod, getPeriodName } from '@/utils/transactionFilters';
import styles from '@/styles/PeriodSelector.module.css';

interface PeriodSelectorProps {
  selectedPeriod: FilterPeriod;
  onChange: (period: FilterPeriod) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ selectedPeriod, onChange }) => {
  return (
    <div className={styles.periodSelector}>
      <label className={styles.label}>Período:</label>
      <div className={styles.buttonGroup}>
        <button
          className={`${styles.periodButton} ${selectedPeriod === 'current-month' ? styles.active : ''}`}
          onClick={() => onChange('current-month')}
          title={`Ver transacciones de ${getPeriodName('current-month')}`}
        >
          Este mes
        </button>
        <button
          className={`${styles.periodButton} ${selectedPeriod === 'last-month' ? styles.active : ''}`}
          onClick={() => onChange('last-month')}
          title={`Ver transacciones de ${getPeriodName('last-month')}`}
        >
          Mes anterior
        </button>
        <button
          className={`${styles.periodButton} ${selectedPeriod === 'current-year' ? styles.active : ''}`}
          onClick={() => onChange('current-year')}
          title={`Ver transacciones de ${getPeriodName('current-year')}`}
        >
          Este año
        </button>
        <button
          className={`${styles.periodButton} ${selectedPeriod === 'all' ? styles.active : ''}`}
          onClick={() => onChange('all')}
          title="Ver todas las transacciones"
        >
          Todo
        </button>
      </div>
    </div>
  );
};

export default PeriodSelector;
