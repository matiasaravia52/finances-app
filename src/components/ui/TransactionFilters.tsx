import React, { useState, useEffect, useRef } from 'react';
import { FilterPeriod } from '@/utils/transactionFilters';
import PeriodSelector from './PeriodSelector';
import styles from '@/styles/TransactionFilters.module.css';

export interface TransactionFiltersProps {
  selectedPeriod: FilterPeriod;
  selectedType: string | null;
  selectedCategory: string | null;
  categories: string[];
  onPeriodChange: (period: FilterPeriod) => void;
  onTypeChange: (type: string | null) => void;
  onCategoryChange: (category: string | null) => void;
  isLoading?: boolean;
}

// Componente para seleccionar categoría con dropdown
interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ categories, selectedCategory, onCategoryChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Agrupar categorías por la primera letra para mejor organización
  const groupedCategories = categories.reduce<Record<string, string[]>>((acc, category) => {
    const firstLetter = category.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(category);
    return acc;
  }, {});
  
  // Ordenar las letras alfabéticamente
  const sortedLetters = Object.keys(groupedCategories).sort();
  
  return (
    <div className={styles.categorySelector} ref={dropdownRef}>
      <button 
        className={`${styles.categoryButton} ${selectedCategory ? styles.hasSelection : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{selectedCategory || 'Todas las categorías'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={isOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
        </svg>
      </button>
      
      {isOpen ? (
        <div className={styles.dropdownMenu} role="listbox">
          <div 
            className={styles.dropdownItem} 
            onClick={() => { onCategoryChange(null); setIsOpen(false); }}
          >
            <span className={selectedCategory === null ? styles.selected : ''}>Todas las categorías</span>
          </div>
          
          {sortedLetters.map(letter => {
            return (
              <div key={letter} className={styles.categoryGroup}>
                {groupedCategories[letter].map(category => (
                  <div 
                    key={category} 
                    className={styles.dropdownItem}
                    onClick={() => { onCategoryChange(category); setIsOpen(false); }}
                  >
                    <span className={selectedCategory === category ? styles.selected : ''}>{category}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  selectedPeriod,
  selectedType,
  selectedCategory,
  categories,
  onPeriodChange,
  onTypeChange,
  onCategoryChange,
  isLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Cerrar los filtros expandidos cuando se cambia a móvil
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsExpanded(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <h2 className={styles.filtersTitle}>Filtros</h2>
        <button 
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Colapsar filtros" : "Expandir filtros"}
        >
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </button>
      </div>
      
      <div className={`${styles.filtersContent} ${isExpanded ? styles.expanded : ''}`}>
        <div className={styles.periodFilterSection}>
          <PeriodSelector selectedPeriod={selectedPeriod} onChange={onPeriodChange} />
        </div>
        
        <div className={styles.filterSection}>
          <h3 className={styles.filterSectionTitle}>Tipo</h3>
          <div className={styles.filterOptions}>
            <button
              className={`${styles.filterOption} ${selectedType === null ? styles.active : ''}`}
              onClick={() => onTypeChange(null)}
            >
              Todos
            </button>
            <button
              className={`${styles.filterOption} ${selectedType === 'income' ? styles.active : ''}`}
              onClick={() => onTypeChange('income')}
            >
              Ingresos
            </button>
            <button
              className={`${styles.filterOption} ${selectedType === 'expense' ? styles.active : ''}`}
              onClick={() => onTypeChange('expense')}
            >
              Gastos
            </button>
          </div>
        </div>
        
        {categories.length > 0 && (
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Categoría</h3>
            <CategorySelector 
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
            />
          </div>
        )}
        
        {isLoading && (
          <div className={styles.loadingIndicator}>
            Cargando...
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;
