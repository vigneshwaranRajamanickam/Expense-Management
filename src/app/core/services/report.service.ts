import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ExpenseService } from './expense.service';
import { CategoryService } from './category.service';
import { BudgetService } from './budget.service';
import { MonthlySummary, MonthlyComparison, CategorySummary, MonthlyTrendItem } from '../models/app-models';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private supabase = inject(SupabaseService);
  private expenseService = inject(ExpenseService);
  private categoryService = inject(CategoryService);
  private budgetService = inject(BudgetService);

  async getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    if (!this.supabase.isDemoMode()) {
      try {
        const userId = this.supabase.currentUser()?.id;
        if (userId) {
          const { data, error } = await this.supabase.client.rpc('get_monthly_expense_summary', {
            p_user_id: userId,
            p_year: year,
            p_month: month
          });

          if (!error && data) {
            return data as MonthlySummary;
          }
        }
      } catch (err) {
        console.warn('RPC call failed, using client fallback:', err);
      }
    }

    // High performance client-side aggregate fallback
    const expenses = await this.expenseService.loadExpenses({ year, month });
    const budgetObj = await this.budgetService.loadMonthlyBudget(year, month);
    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const txCount = expenses.length;
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyAvg = Number((totalExpense / (daysInMonth || 1)).toFixed(2));

    let highestExp = 0;
    let lowestExp = expenses.length > 0 ? Number(expenses[0].amount) : 0;

    const catTotals: { [key: string]: { name: string; amount: number } } = {};

    expenses.forEach(e => {
      const amt = Number(e.amount);
      if (amt > highestExp) highestExp = amt;
      if (amt < lowestExp) lowestExp = amt;

      const catName = e.categories?.name || 'Uncategorized';
      if (!catTotals[catName]) {
        catTotals[catName] = { name: catName, amount: 0 };
      }
      catTotals[catName].amount += amt;
    });

    let highestCategory = 'None';
    let highestCatAmount = 0;

    Object.values(catTotals).forEach(c => {
      if (c.amount > highestCatAmount) {
        highestCatAmount = c.amount;
        highestCategory = c.name;
      }
    });

    const monthlyBudget = budgetObj?.amount || 0;

    return {
      total_expense: totalExpense,
      transaction_count: txCount,
      daily_average: dailyAvg,
      highest_expense: highestExp,
      lowest_expense: lowestExp,
      highest_category: highestCategory,
      highest_category_amount: highestCatAmount,
      monthly_budget: monthlyBudget,
      remaining_budget: monthlyBudget - totalExpense
    };
  }

  async getMonthlyComparison(year1: number, month1: number, year2: number, month2: number): Promise<MonthlyComparison> {
    if (!this.supabase.isDemoMode()) {
      try {
        const userId = this.supabase.currentUser()?.id;
        if (userId) {
          const { data, error } = await this.supabase.client.rpc('get_monthly_comparison', {
            p_user_id: userId,
            p_year1: year1,
            p_month1: month1,
            p_year2: year2,
            p_month2: month2
          });
          if (!error && data) {
            return data as MonthlyComparison;
          }
        }
      } catch (err) {
        console.warn('RPC comparison failed, fallbacking:', err);
      }
    }

    const exps1 = await this.expenseService.loadExpenses({ year: year1, month: month1 });
    const exps2 = await this.expenseService.loadExpenses({ year: year2, month: month2 });

    const total1 = exps1.reduce((sum, e) => sum + Number(e.amount), 0);
    const total2 = exps2.reduce((sum, e) => sum + Number(e.amount), 0);

    const diff = total2 - total1;
    let pct = 0;
    if (total1 > 0) {
      pct = Number(((diff / total1) * 100).toFixed(2));
    } else if (total2 > 0) {
      pct = 100;
    }

    const categories = this.categoryService.categories();
    const catMap: { [key: string]: { name: string; m1: number; m2: number } } = {};

    categories.forEach(c => {
      catMap[c.id] = { name: c.name, m1: 0, m2: 0 };
    });

    exps1.forEach(e => {
      if (e.category_id && catMap[e.category_id]) {
        catMap[e.category_id].m1 += Number(e.amount);
      }
    });

    exps2.forEach(e => {
      if (e.category_id && catMap[e.category_id]) {
        catMap[e.category_id].m2 += Number(e.amount);
      }
    });

    const breakdown = Object.values(catMap)
      .filter(item => item.m1 > 0 || item.m2 > 0)
      .map(item => ({
        category_name: item.name,
        month1_amount: item.m1,
        month2_amount: item.m2,
        difference: item.m2 - item.m1
      }))
      .sort((a, b) => b.month2_amount - a.month2_amount);

    return {
      month1_total: total1,
      month2_total: total2,
      difference: diff,
      percentage_change: pct,
      categories: breakdown
    };
  }

  async getCategorySummary(year: number, month: number): Promise<CategorySummary[]> {
    const expenses = await this.expenseService.loadExpenses({ year, month });
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const map: { [key: string]: { id: string; name: string; icon?: string; color?: string; total: number; count: number } } = {};

    expenses.forEach(e => {
      const catId = e.category_id || 'unassigned';
      const catName = e.categories?.name || 'Uncategorized';
      const icon = e.categories?.icon || 'tag';
      const color = e.categories?.color || '#64748B';
      const amt = Number(e.amount);

      if (!map[catId]) {
        map[catId] = { id: catId, name: catName, icon, color, total: 0, count: 0 };
      }
      map[catId].total += amt;
      map[catId].count += 1;
    });

    return Object.values(map)
      .map(item => ({
        category_id: item.id,
        category_name: item.name,
        icon: item.icon,
        color: item.color,
        total_amount: item.total,
        percentage: total > 0 ? Number(((item.total / total) * 100).toFixed(1)) : 0,
        transaction_count: item.count
      }))
      .sort((a, b) => b.total_amount - a.total_amount);
  }

  async getMonthlyTrend(year: number): Promise<MonthlyTrendItem[]> {
    if (!this.supabase.isDemoMode()) {
      try {
        const userId = this.supabase.currentUser()?.id;
        if (userId) {
          const { data, error } = await this.supabase.client.rpc('get_monthly_trend', {
            p_user_id: userId,
            p_year: year
          });
          if (!error && data) {
            return data as MonthlyTrendItem[];
          }
        }
      } catch (err) {
        console.warn('RPC trend call failed:', err);
      }
    }

    const expenses = await this.expenseService.loadExpenses({ year });
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const result: MonthlyTrendItem[] = monthNames.map((name, i) => ({
      month: i + 1,
      month_name: name,
      total_expense: 0
    }));

    expenses.forEach(e => {
      const d = new Date(e.date);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        result[mIdx].total_expense += Number(e.amount);
      }
    });

    return result;
  }
}
