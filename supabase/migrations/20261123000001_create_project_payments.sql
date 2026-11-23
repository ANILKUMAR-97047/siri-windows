-- Migration: Create project_payments table for tracking project milestone payments

CREATE TABLE IF NOT EXISTS public.project_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(40) NOT NULL DEFAULT 'UPI / PhonePe',
    stage VARCHAR(60) DEFAULT 'Milestone Payment',
    reference_id VARCHAR(100), -- UPI Ref ID, Cheque No, Bank UTR
    received_by VARCHAR(100),  -- Staff / Supervisor / Owner who received payment
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_payments_project_id ON public.project_payments(project_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_project_payments_client_id ON public.project_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_date ON public.project_payments(payment_date DESC);

-- Enable RLS
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;

-- Allow full access for service_role and authenticated users
CREATE POLICY "Allow public read project_payments" ON public.project_payments FOR SELECT USING (true);
CREATE POLICY "Allow service_role full access project_payments" ON public.project_payments FOR ALL USING (true);
