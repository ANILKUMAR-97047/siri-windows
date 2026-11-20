-- ============================================================
-- Migration: 20261119000002_allow_read_policies.sql
-- Grant read policies for admin and operational tables
-- ============================================================

-- Allow read on leads
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' AND policyname = 'Public select leads'
    ) THEN
        CREATE POLICY "Public select leads" ON leads FOR SELECT USING (true);
    END IF;
END $$;

-- Allow read on staff
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff' AND policyname = 'Public select staff'
    ) THEN
        CREATE POLICY "Public select staff" ON staff FOR SELECT USING (true);
    END IF;
END $$;

-- Allow read on salary_records
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'salary_records' AND policyname = 'Public select salary_records'
    ) THEN
        CREATE POLICY "Public select salary_records" ON salary_records FOR SELECT USING (true);
    END IF;
END $$;

-- Allow read on materials
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'materials' AND policyname = 'Public select materials'
    ) THEN
        CREATE POLICY "Public select materials" ON materials FOR SELECT USING (true);
    END IF;
END $$;

-- Allow read on clients
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clients' AND policyname = 'Public select clients'
    ) THEN
        CREATE POLICY "Public select clients" ON clients FOR SELECT USING (true);
    END IF;
END $$;

-- Allow read on projects
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' AND policyname = 'Public select projects'
    ) THEN
        CREATE POLICY "Public select projects" ON projects FOR SELECT USING (true);
    END IF;
END $$;

-- Allow read on maintenance_logs
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'maintenance_logs' AND policyname = 'Public select maintenance_logs'
    ) THEN
        CREATE POLICY "Public select maintenance_logs" ON maintenance_logs FOR SELECT USING (true);
    END IF;
END $$;

-- Allow read on gallery_images
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gallery_images' AND policyname = 'Public select gallery_images'
    ) THEN
        CREATE POLICY "Public select gallery_images" ON gallery_images FOR SELECT USING (true);
    END IF;
END $$;
