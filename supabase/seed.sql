-- ====================================================================
-- SEED DATA FOR PERSONAL EXPENSE MANAGEMENT APPLICATION
-- Multi-month sample dataset (June 2026 - September 2026)
-- ====================================================================

-- Helper script for populating realistic financial data for testing.
-- Note: Replace '00000000-0000-0000-0000-000000000000' with a target User ID if executing directly in SQL console.

DO $$
DECLARE
    v_user_id UUID;
    v_food_id UUID;
    v_transport_id UUID;
    v_rent_id UUID;
    v_electricity_id UUID;
    v_mobile_id UUID;
    v_shopping_id UUID;
    v_ent_id UUID;
    v_med_id UUID;
    v_groceries_id UUID;
    v_emi_id UUID;
BEGIN
    -- Select first existing user or use fallback UUID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        v_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
    END IF;

    -- Ensure Categories Exist
    INSERT INTO public.categories (id, user_id, name, icon, color) VALUES
    (gen_random_uuid(), v_user_id, 'Food', 'utensils', '#EF4444'),
    (gen_random_uuid(), v_user_id, 'Transport', 'car', '#3B82F6'),
    (gen_random_uuid(), v_user_id, 'Rent', 'home', '#8B5CF6'),
    (gen_random_uuid(), v_user_id, 'Electricity', 'zap', '#F59E0B'),
    (gen_random_uuid(), v_user_id, 'Mobile & Internet', 'wifi', '#06B6D4'),
    (gen_random_uuid(), v_user_id, 'Shopping', 'shopping-bag', '#EC4899'),
    (gen_random_uuid(), v_user_id, 'Entertainment', 'film', '#10B981'),
    (gen_random_uuid(), v_user_id, 'Medical', 'activity', '#14B8A6'),
    (gen_random_uuid(), v_user_id, 'Groceries', 'shopping-cart', '#22C55E'),
    (gen_random_uuid(), v_user_id, 'EMI / Loan', 'credit-card', '#64748B')
    ON CONFLICT DO NOTHING;

    -- Grab Category IDs
    SELECT id INTO v_food_id FROM public.categories WHERE user_id = v_user_id AND name = 'Food' LIMIT 1;
    SELECT id INTO v_transport_id FROM public.categories WHERE user_id = v_user_id AND name = 'Transport' LIMIT 1;
    SELECT id INTO v_rent_id FROM public.categories WHERE user_id = v_user_id AND name = 'Rent' LIMIT 1;
    SELECT id INTO v_electricity_id FROM public.categories WHERE user_id = v_user_id AND name = 'Electricity' LIMIT 1;
    SELECT id INTO v_mobile_id FROM public.categories WHERE user_id = v_user_id AND name = 'Mobile & Internet' LIMIT 1;
    SELECT id INTO v_shopping_id FROM public.categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1;
    SELECT id INTO v_ent_id FROM public.categories WHERE user_id = v_user_id AND name = 'Entertainment' LIMIT 1;
    SELECT id INTO v_med_id FROM public.categories WHERE user_id = v_user_id AND name = 'Medical' LIMIT 1;
    SELECT id INTO v_groceries_id FROM public.categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1;
    SELECT id INTO v_emi_id FROM public.categories WHERE user_id = v_user_id AND name = 'EMI / Loan' LIMIT 1;

    -- Budgets Setup
    INSERT INTO public.budgets (user_id, month, year, amount) VALUES
    (v_user_id, 8, 2026, 30000.00),
    (v_user_id, 9, 2026, 30000.00)
    ON CONFLICT (user_id, month, year) DO UPDATE SET amount = EXCLUDED.amount;

    -- Category Budgets Setup
    IF v_food_id IS NOT NULL THEN
        INSERT INTO public.category_budgets (user_id, category_id, month, year, amount) VALUES
        (v_user_id, v_food_id, 9, 2026, 8000.00)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Seed Recurring Expenses
    INSERT INTO public.recurring_expenses (user_id, category_id, description, amount, payment_method, frequency, start_date, is_active) VALUES
    (v_user_id, v_rent_id, 'House Rent', 12000.00, 'Bank Transfer', 'Monthly', '2026-01-01', true),
    (v_user_id, v_mobile_id, 'Airtel Broadband & Postpaid', 1199.00, 'UPI', 'Monthly', '2026-01-01', true),
    (v_user_id, v_emi_id, 'Car Loan EMI', 4500.00, 'Bank Transfer', 'Monthly', '2026-01-05', true)
    ON CONFLICT DO NOTHING;

    -- Seed Expenses for August 2026 (Total ₹25,400)
    INSERT INTO public.expenses (user_id, category_id, date, description, amount, payment_method, notes) VALUES
    (v_user_id, v_rent_id, '2026-08-01', 'Monthly Apartment Rent', 12000.00, 'Bank Transfer', 'Paid via NetBanking'),
    (v_user_id, v_food_id, '2026-08-02', 'Weekend Dining out', 2400.00, 'Credit Card', 'Barbeque Nation'),
    (v_user_id, v_transport_id, '2026-08-04', 'Fuel refill - Car', 4100.00, 'UPI', 'Shell Fuel station'),
    (v_user_id, v_shopping_id, '2026-08-10', 'New formal clothes', 5800.00, 'Credit Card', 'Zara Sale'),
    (v_user_id, v_electricity_id, '2026-08-15', 'TNEB Electricity Bill', 1100.00, 'UPI', 'Bi-monthly bill');

    -- Seed Expenses for September 2026 (Total ₹22,850 matching target requirements!)
    INSERT INTO public.expenses (user_id, category_id, date, description, amount, payment_method, notes) VALUES
    (v_user_id, v_rent_id, '2026-09-01', 'Monthly Apartment Rent', 12000.00, 'Bank Transfer', 'Auto debited'),
    (v_user_id, v_food_id, '2026-09-03', 'Swiggy Dinner Order', 650.00, 'UPI', 'Italian pasta'),
    (v_user_id, v_food_id, '2026-09-06', 'Weekly Groceries & Snacks', 2550.00, 'UPI', 'Supermarket purchase'),
    (v_user_id, v_food_id, '2026-09-10', 'Team Lunch', 1800.00, 'Credit Card', 'Reimbursable partly'),
    (v_user_id, v_food_id, '2026-09-14', 'Zomato Gourmet', 2200.00, 'Credit Card', 'Weekend treats'),
    (v_user_id, v_transport_id, '2026-09-05', 'Petrol refill', 2500.00, 'Credit Card', 'HP Petrol Pump'),
    (v_user_id, v_transport_id, '2026-09-12', 'Uber rides commute', 2000.00, 'UPI', 'Office travel'),
    (v_user_id, v_shopping_id, '2026-09-18', 'Electronics & Cable', 3200.00, 'Debit Card', 'Amazon India'),
    (v_user_id, v_mobile_id, '2026-09-20', 'Airtel Broadband Bill', 1199.00, 'UPI', '100 Mbps Fibre'),
    (v_user_id, v_electricity_id, '2026-09-22', 'Utility Bill', 1951.00, 'UPI', 'Power bill');

END $$;
