-- Migration: Create staff_advances and admin_expenses tables

-- 1. Table: staff_advances (Employee Salary Advances / Expenses for month-end salary settlement)
CREATE TABLE IF NOT EXISTS staff_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    advance_date DATE NOT NULL,
    day_name VARCHAR(15) NOT NULL,
    advance_month INTEGER NOT NULL,
    advance_year INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(40) DEFAULT 'Cash',
    reason TEXT NOT NULL,
    receipt_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
    settled_salary_id UUID REFERENCES salary_records(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for staff_advances
ALTER TABLE staff_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read staff_advances" ON staff_advances FOR SELECT USING (true);
CREATE POLICY "Allow public insert staff_advances" ON staff_advances FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update staff_advances" ON staff_advances FOR UPDATE USING (true);
CREATE POLICY "Allow public delete staff_advances" ON staff_advances FOR DELETE USING (true);

-- Indexes for staff_advances
CREATE INDEX IF NOT EXISTS idx_staff_advances_staff_date ON staff_advances(staff_id, advance_date DESC);
CREATE INDEX IF NOT EXISTS idx_staff_advances_month_year ON staff_advances(advance_year DESC, advance_month DESC);
CREATE INDEX IF NOT EXISTS idx_staff_advances_status ON staff_advances(status);


-- 2. Table: admin_expenses (Admin's Own Daily Expenses & Maintenance: Company vs Personal)
CREATE TABLE IF NOT EXISTS admin_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,
    day_name VARCHAR(15) NOT NULL,
    expense_month INTEGER NOT NULL,
    expense_year INTEGER NOT NULL,
    expense_type VARCHAR(20) NOT NULL CHECK (expense_type IN ('company', 'personal')),
    category VARCHAR(60) NOT NULL,
    title VARCHAR(200) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(40) DEFAULT 'UPI / PhonePe',
    description TEXT,
    receipt_url TEXT,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for admin_expenses
ALTER TABLE admin_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read admin_expenses" ON admin_expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert admin_expenses" ON admin_expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update admin_expenses" ON admin_expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete admin_expenses" ON admin_expenses FOR DELETE USING (true);

-- Indexes for admin_expenses
CREATE INDEX IF NOT EXISTS idx_admin_expenses_month_year ON admin_expenses(expense_year DESC, expense_month DESC);
CREATE INDEX IF NOT EXISTS idx_admin_expenses_type ON admin_expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_admin_expenses_date ON admin_expenses(expense_date DESC);
