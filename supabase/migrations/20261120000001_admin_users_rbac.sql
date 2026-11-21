-- ============================================================
-- Migration: 20261120000001_admin_users_rbac.sql
-- Siri Windows: Admin Users Table & RBAC System
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin', -- 'super_admin' | 'admin'
    permissions TEXT[] NOT NULL DEFAULT '{}',  -- array of module keys, e.g. ['leads', 'clients']
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'inactive'
    last_login_at TIMESTAMPTZ,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow policy for operations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_users' AND policyname = 'Public all admin_users'
    ) THEN
        CREATE POLICY "Public all admin_users" ON admin_users FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Seed Initial Super Admin
INSERT INTO admin_users (name, email, password_hash, password_salt, role, permissions, status)
VALUES (
    'Rajesh',
    'sirienterprises8003@gmail.com',
    '4c785b4f5d8a41724fa8c4bb81fb38cbb8b5c00a68dbff449234cc259d0428355d96c5fa8df38a27d0c3deddbe8cdad96544df02c4824cf22df1fbdead8be3e6',
    '89eb9fae9ba4c9b25d391ca55fed0373',
    'super_admin',
    ARRAY['*'],
    'active'
)
ON CONFLICT (email) DO NOTHING;
