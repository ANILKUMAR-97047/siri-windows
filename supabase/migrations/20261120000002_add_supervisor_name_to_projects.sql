-- Add supervisor_name text column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supervisor_name TEXT;
