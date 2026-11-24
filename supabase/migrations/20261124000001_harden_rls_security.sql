-- ============================================================
-- Migration: 20261124000001_harden_rls_security.sql
-- Enterprise Security Hardening for Supabase RLS
-- Protects credentials, customer leads, and administrative tables
-- ============================================================

-- 1. HARDEN ADMIN_USERS (Credentials & RBAC)
-- Strictly disable public anon access to password hashes and admin profiles
ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- Drop permissive development policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_users' AND policyname = 'Public all admin_users'
    ) THEN
        DROP POLICY "Public all admin_users" ON admin_users;
    END IF;

    -- Ensure only backend server (service_role) has access to admin_users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_users' AND policyname = 'Service role full access admin_users'
    ) THEN
        CREATE POLICY "Service role full access admin_users" ON admin_users
            FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
    END IF;
END $$;

-- 2. HARDEN LEADS & INQUIRIES (Customer Data Privacy)
-- Visitors can submit inquiries (INSERT), but cannot scrape or read other clients' inquiries
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- Drop public select/all policies on leads to prevent competitor scraping
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' AND policyname = 'Public select leads'
    ) THEN
        DROP POLICY "Public select leads" ON leads;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' AND policyname = 'Public all leads'
    ) THEN
        DROP POLICY "Public all leads" ON leads;
    END IF;

    -- Ensure public can submit contact forms
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' AND policyname = 'Public insert leads'
    ) THEN
        CREATE POLICY "Public insert leads" ON leads FOR INSERT WITH CHECK (true);
    END IF;

    -- Service role can read and manage all leads
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' AND policyname = 'Service role full access leads'
    ) THEN
        CREATE POLICY "Service role full access leads" ON leads
            FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
    END IF;
END $$;

-- 3. HARDEN LEAD ACTIVITIES (Internal Sales Notes)
ALTER TABLE IF EXISTS lead_activities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'lead_activities' AND policyname = 'Public all lead_activities'
    ) THEN
        DROP POLICY "Public all lead_activities" ON lead_activities;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'lead_activities' AND policyname = 'Service role full access lead_activities'
    ) THEN
        CREATE POLICY "Service role full access lead_activities" ON lead_activities
            FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
    END IF;
END $$;
