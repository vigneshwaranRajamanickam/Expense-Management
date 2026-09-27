-- ====================================================================
-- PERSONAL EXPENSE MANAGEMENT APPLICATION - SUPABASE DATABASE SCHEMA
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    currency TEXT DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#4F46E5',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BUDGETS TABLE (Overall monthly budget)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2000),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_month_year UNIQUE (user_id, month, year)
);

-- 6. CATEGORY BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.category_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2000),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year)
);

-- 7. RECURRING EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'UPI',
    frequency TEXT NOT NULL CHECK (frequency IN ('Weekly', 'Monthly', 'Yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    last_processed_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year ON public.budgets(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_category_budgets_user_month_year ON public.category_budgets(user_id, category_id, month, year);
CREATE INDEX IF NOT EXISTS idx_recurring_user_active ON public.recurring_expenses(user_id, is_active);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories Policies
CREATE POLICY "Users can select own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Expenses Policies
CREATE POLICY "Users can select own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can select own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Category Budgets Policies
CREATE POLICY "Users can select own category_budgets" ON public.category_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own category_budgets" ON public.category_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own category_budgets" ON public.category_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own category_budgets" ON public.category_budgets FOR DELETE USING (auth.uid() = user_id);

-- Recurring Expenses Policies
CREATE POLICY "Users can select own recurring_expenses" ON public.recurring_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring_expenses" ON public.recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring_expenses" ON public.recurring_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring_expenses" ON public.recurring_expenses FOR DELETE USING (auth.uid() = user_id);

-- ====================================================================
-- AUTOMATIC PROFILE & SEED CATEGORIES TRIGGER UPON SIGNUP
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID := NEW.id;
BEGIN
    -- Create profile entry
    INSERT INTO public.profiles (id, full_name, email, currency)
    VALUES (new_user_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.email, 'INR');

    -- Insert Default Categories
    INSERT INTO public.categories (user_id, name, icon, color) VALUES
    (new_user_id, 'Food', 'utensils', '#EF4444'),
    (new_user_id, 'Transport', 'car', '#3B82F6'),
    (new_user_id, 'Rent', 'home', '#8B5CF6'),
    (new_user_id, 'Electricity', 'zap', '#F59E0B'),
    (new_user_id, 'Mobile & Internet', 'wifi', '#06B6D4'),
    (new_user_id, 'Shopping', 'shopping-bag', '#EC4899'),
    (new_user_id, 'Entertainment', 'film', '#10B981'),
    (new_user_id, 'Medical', 'activity', '#14B8A6'),
    (new_user_id, 'Education', 'book-open', '#6366F1'),
    (new_user_id, 'Travel', 'compass', '#84CC16'),
    (new_user_id, 'EMI / Loan', 'credit-card', '#64748B'),
    (new_user_id, 'Groceries', 'shopping-cart', '#22C55E'),
    (new_user_id, 'Other', 'more-horizontal', '#94A3B8');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- DATABASE AGGREGATION RPC FUNCTIONS
-- ====================================================================

-- 1. Monthly Expense Summary RPC
CREATE OR REPLACE FUNCTION public.get_monthly_expense_summary(
    p_user_id UUID,
    p_year INT,
    p_month INT
)
RETURNS JSON AS $$
DECLARE
    v_total_expense NUMERIC(12,2) := 0;
    v_tx_count INT := 0;
    v_days_in_month INT;
    v_daily_avg NUMERIC(12,2) := 0;
    v_highest_expense NUMERIC(12,2) := 0;
    v_lowest_expense NUMERIC(12,2) := 0;
    v_highest_category TEXT := 'None';
    v_highest_category_amount NUMERIC(12,2) := 0;
    v_monthly_budget NUMERIC(12,2) := 0;
    v_result JSON;
BEGIN
    -- Determine days in month
    v_days_in_month := EXTRACT(DAY FROM (date_trunc('month', make_date(p_year, p_month, 1)) + interval '1 month - 1 day'));

    -- Aggregates for current month
    SELECT 
        COALESCE(SUM(amount), 0),
        COUNT(id),
        COALESCE(MAX(amount), 0),
        COALESCE(MIN(amount), 0)
    INTO 
        v_total_expense,
        v_tx_count,
        v_highest_expense,
        v_lowest_expense
    FROM public.expenses
    WHERE user_id = p_user_id
      AND EXTRACT(YEAR FROM date) = p_year
      AND EXTRACT(MONTH FROM date) = p_month;

    IF v_days_in_month > 0 THEN
        v_daily_avg := ROUND((v_total_expense / v_days_in_month)::numeric, 2);
    END IF;

    -- Highest spending category
    SELECT c.name, COALESCE(SUM(e.amount), 0)
    INTO v_highest_category, v_highest_category_amount
    FROM public.expenses e
    JOIN public.categories c ON e.category_id = c.id
    WHERE e.user_id = p_user_id
      AND EXTRACT(YEAR FROM e.date) = p_year
      AND EXTRACT(MONTH FROM e.date) = p_month
    GROUP BY c.name
    ORDER BY SUM(e.amount) DESC
    LIMIT 1;

    -- Budget for month
    SELECT COALESCE(amount, 0)
    INTO v_monthly_budget
    FROM public.budgets
    WHERE user_id = p_user_id AND month = p_month AND year = p_year;

    v_result := json_build_object(
        'total_expense', v_total_expense,
        'transaction_count', v_tx_count,
        'daily_average', v_daily_avg,
        'highest_expense', v_highest_expense,
        'lowest_expense', v_lowest_expense,
        'highest_category', COALESCE(v_highest_category, 'None'),
        'highest_category_amount', v_highest_category_amount,
        'monthly_budget', v_monthly_budget,
        'remaining_budget', v_monthly_budget - v_total_expense
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Monthly Comparison RPC
CREATE OR REPLACE FUNCTION public.get_monthly_comparison(
    p_user_id UUID,
    p_year1 INT,
    p_month1 INT,
    p_year2 INT,
    p_month2 INT
)
RETURNS JSON AS $$
DECLARE
    v_total1 NUMERIC(12,2) := 0;
    v_total2 NUMERIC(12,2) := 0;
    v_diff NUMERIC(12,2) := 0;
    v_pct NUMERIC(8,2) := 0;
    v_categories JSON;
    v_result JSON;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_total1
    FROM public.expenses
    WHERE user_id = p_user_id AND EXTRACT(YEAR FROM date) = p_year1 AND EXTRACT(MONTH FROM date) = p_month1;

    SELECT COALESCE(SUM(amount), 0) INTO v_total2
    FROM public.expenses
    WHERE user_id = p_user_id AND EXTRACT(YEAR FROM date) = p_year2 AND EXTRACT(MONTH FROM date) = p_month2;

    v_diff := v_total2 - v_total1;
    IF v_total1 > 0 THEN
        v_pct := ROUND(((v_diff / v_total1) * 100)::numeric, 2);
    ELSIF v_total2 > 0 THEN
        v_pct := 100.00;
    ELSE
        v_pct := 0;
    END IF;

    -- Category Breakdown comparison
    SELECT json_agg(c_summary) INTO v_categories FROM (
        SELECT 
            cat.name AS category_name,
            COALESCE(m1.amount, 0) AS month1_amount,
            COALESCE(m2.amount, 0) AS month2_amount,
            (COALESCE(m2.amount, 0) - COALESCE(m1.amount, 0)) AS difference
        FROM public.categories cat
        LEFT JOIN (
            SELECT category_id, SUM(amount) AS amount
            FROM public.expenses
            WHERE user_id = p_user_id AND EXTRACT(YEAR FROM date) = p_year1 AND EXTRACT(MONTH FROM date) = p_month1
            GROUP BY category_id
        ) m1 ON cat.id = m1.category_id
        LEFT JOIN (
            SELECT category_id, SUM(amount) AS amount
            FROM public.expenses
            WHERE user_id = p_user_id AND EXTRACT(YEAR FROM date) = p_year2 AND EXTRACT(MONTH FROM date) = p_month2
            GROUP BY category_id
        ) m2 ON cat.id = m2.category_id
        WHERE cat.user_id = p_user_id AND (m1.amount > 0 OR m2.amount > 0)
        ORDER BY COALESCE(m2.amount, 0) DESC
    ) c_summary;

    v_result := json_build_object(
        'month1_total', v_total1,
        'month2_total', v_total2,
        'difference', v_diff,
        'percentage_change', v_pct,
        'categories', COALESCE(v_categories, '[]'::json)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Monthly Trend RPC (12 Months for a Year)
CREATE OR REPLACE FUNCTION public.get_monthly_trend(
    p_user_id UUID,
    p_year INT
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(t) INTO v_result FROM (
        SELECT 
            m.month_num AS month,
            to_char(make_date(p_year, m.month_num, 1), 'Mon') AS month_name,
            COALESCE(SUM(e.amount), 0) AS total_expense
        FROM generate_series(1, 12) AS m(month_num)
        LEFT JOIN public.expenses e ON e.user_id = p_user_id 
            AND EXTRACT(YEAR FROM e.date) = p_year 
            AND EXTRACT(MONTH FROM e.date) = m.month_num
        GROUP BY m.month_num
        ORDER BY m.month_num
    ) t;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
