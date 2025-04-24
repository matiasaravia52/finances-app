export enum InstallmentStatus {
  PENDING = 'pending',
  PAID = 'paid'
}

export interface Installment {
  _id?: string;
  number: number;
  amount: number;
  dueDate: Date | string;
  status: InstallmentStatus;
}

export interface CreditCardExpense {
  _id: string;
  amount: number;
  description: string;
  purchaseDate: Date | string;
  totalInstallments: number;
  installments: Installment[];
  userId: string;
  isSimulation: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreditCardExpenseCreate {
  amount: number;
  description: string;
  purchaseDate?: Date | string;
  totalInstallments: number;
  isSimulation?: boolean;
}

export interface CreditCardFund {
  _id: string;
  monthlyContribution: number;
  maxMonthlyContribution: number;
  accumulatedAmount: number;
  userId: string;
  lastUpdateDate: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreditCardFundCreate {
  monthlyContribution: number;
  maxMonthlyContribution?: number;
  accumulatedAmount?: number;
}

export interface CreditCardFundUpdate {
  monthlyContribution?: number;
  maxMonthlyContribution?: number;
  accumulatedAmount?: number;
}

export interface SimulationResult {
  canAfford: boolean;
  availableFunds: number; // Fondos disponibles actuales (acumulado + contribución mensual)
  projectedAvailableFunds: number; // Fondos disponibles proyectados (considerando contribuciones futuras)
  requiredFunds: number;
  totalRequiredFunds: number; // Fondo total requerido para toda la duración de las cuotas
  projectedBalance: number; // Balance proyectado mensual
  totalProjectedBalance: number; // Balance proyectado total
  pendingInstallments: number;
  pendingAmount: number;
  suggestedMonthlyContribution?: number;
  suggestedDurationMonths?: number;
}
