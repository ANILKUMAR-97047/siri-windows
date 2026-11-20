-- ============================================================
-- Migration: 20261119000003_allow_admin_write_policies.sql
-- Grant full insert/update/delete access for admin management
-- ============================================================

DO $$ 
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'staff',
        'salary_records',
        'materials',
        'material_categories',
        'stock_transactions',
        'clients',
        'pricing_packages',
        'client_quotes',
        'leads',
        'lead_activities',
        'projects',
        'project_materials',
        'project_updates',
        'maintenance_logs',
        'gallery_categories',
        'gallery_images',
        'website_content'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Create a policy allowing all operations if not already present
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = tbl AND policyname = 'Public all ' || tbl
        ) THEN
            EXECUTE format('CREATE POLICY "Public all %I" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
        END IF;
    END LOOP;
END $$;
