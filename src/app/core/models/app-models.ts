export type PaymentMethod = 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Other';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id?: string;
  date: string;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Joined category object
  categories?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  month: number;
  year: number;
  amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryBudget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
  created_at?: string;
  updated_at?: string;

  // Joined category
  categories?: Category;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  category_id?: string;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  frequency: 'Weekly' | 'Monthly' | 'Yearly';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  last_processed_date?: string;
  created_at?: string;
  updated_at?: string;

  categories?: Category;
}

export interface MonthlySummary {
  total_expense: number;
  transaction_count: number;
  daily_average: number;
  highest_expense: number;
  lowest_expense: number;
  highest_category: string;
  highest_category_amount: number;
  monthly_budget: number;
  remaining_budget: number;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  icon?: string;
  color?: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

export interface MonthlyComparison {
  month1_total: number;
  month2_total: number;
  difference: number;
  percentage_change: number;
  categories: {
    category_name: string;
    month1_amount: number;
    month2_amount: number;
    difference: number;
  }[];
}

export interface MonthlyTrendItem {
  month: number;
  month_name: string;
  total_expense: number;
}

export interface ExpenseFilter {
  search?: string;
  category_id?: string;
  payment_method?: string;
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
