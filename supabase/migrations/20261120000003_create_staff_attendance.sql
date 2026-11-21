-- Migration: Create staff_attendance table for daily attendance and leave tracking

CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'half_day', 'absent', 'on_leave', 'holiday')),
  check_in_time TIME,
  check_out_time TIME,
  overtime_hours NUMERIC(4, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (staff_id, date)
);

-- Enable Row Level Security
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

-- Allow policies for read and admin operations
CREATE POLICY "Allow public read staff_attendance" ON staff_attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert staff_attendance" ON staff_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update staff_attendance" ON staff_attendance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete staff_attendance" ON staff_attendance FOR DELETE USING (true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON staff_attendance(date);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_date ON staff_attendance(staff_id, date);
