-- Migration: Drop maintenance_logs table and clean up obsolete maintenance permission

-- 1. Drop maintenance_logs table if it exists
DROP TABLE IF EXISTS maintenance_logs CASCADE;

-- 2. Remove 'maintenance' from admin_users permissions array if present
UPDATE admin_users
SET permissions = array_remove(permissions, 'maintenance')
WHERE 'maintenance' = ANY(permissions);
