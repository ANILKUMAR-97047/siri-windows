-- ============================================================
-- Siri Windows - Complete Schema Migration
-- Migration: 20261119000001_initial_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WEBSITE DYNAMIC CONTENT
CREATE TABLE IF NOT EXISTS website_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section VARCHAR(50) NOT NULL UNIQUE, -- 'hero', 'about', 'contact', 'stats', etc.
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STAFF & SALARIES
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'Fabricator', 'Installer', 'Site Supervisor', 'Sales Executive', 'Accountant', etc.
    department VARCHAR(50) NOT NULL DEFAULT 'Operations',
    photo_url TEXT,
    base_salary NUMERIC(10, 2) NOT NULL DEFAULT 0,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'on_leave', 'terminated'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    base_salary NUMERIC(10, 2) NOT NULL DEFAULT 0,
    allowances NUMERIC(10, 2) NOT NULL DEFAULT 0,
    deductions NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_salary NUMERIC(10, 2) GENERATED ALWAYS AS (base_salary + allowances - deductions) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'partially_paid'
    paid_at TIMESTAMPTZ,
    payment_mode VARCHAR(30) DEFAULT 'Bank Transfer', -- 'Cash', 'Bank Transfer', 'UPI', 'Cheque'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_staff_month_year UNIQUE (staff_id, month, year)
);

-- 3. STOCK & MATERIALS
CREATE TABLE IF NOT EXISTS material_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(50) UNIQUE, -- SKU / Material Code
    unit VARCHAR(20) NOT NULL DEFAULT 'pieces', -- 'pieces', 'meters', 'sqft', 'kg', 'boxes'
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(10, 2) NOT NULL DEFAULT 10,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    supplier_name VARCHAR(100),
    supplier_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    reference_type VARCHAR(50), -- 'purchase', 'project_usage', 'damage', 'audit'
    reference_id UUID,          -- project_id or purchase order id
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CLIENTS & PRICING
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50) DEFAULT 'Tanuku',
    state VARCHAR(50) DEFAULT 'Andhra Pradesh',
    pincode VARCHAR(10),
    company_name VARCHAR(100),
    source VARCHAR(50) DEFAULT 'Website', -- 'Website', 'Referral', 'Walk-in', 'Phone', 'Social Media'
    status VARCHAR(30) DEFAULT 'active',   -- 'prospect', 'active', 'completed', 'inactive'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    material_type VARCHAR(50) NOT NULL, -- 'UPVC', 'Aluminium'
    profile_series VARCHAR(50),         -- '60 Series', '70 Series', 'Slim Profile'
    glass_type VARCHAR(50),             -- '5mm Clear', 'Double Glazed 24mm', 'Toughened'
    price_per_sqft NUMERIC(10, 2) NOT NULL,
    features TEXT[],                    -- Array of feature bullet points
    warranty_years INTEGER DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(30) UNIQUE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    package_id UUID REFERENCES pricing_packages(id) ON DELETE SET NULL,
    total_sqft NUMERIC(10, 2) NOT NULL DEFAULT 0,
    rate_per_sqft NUMERIC(10, 2) NOT NULL DEFAULT 0,
    materials_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    labor_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'approved', 'rejected'
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. LEADS MANAGEMENT & LEAD GENERATION
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50) DEFAULT 'Tanuku',
    product_interest VARCHAR(100), -- 'UPVC Sliding Windows', 'Aluminium Casement', 'French Doors', etc.
    estimated_sqft NUMERIC(10, 2),
    estimated_budget NUMERIC(10, 2),
    source VARCHAR(50) NOT NULL DEFAULT 'Website', -- 'Website', 'Referral', 'Walk-in', 'Campaign', 'Call'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(30) NOT NULL DEFAULT 'new',      -- 'new', 'contacted', 'site_visit_scheduled', 'quote_sent', 'won', 'lost'
    assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
    converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    notes TEXT,
    next_follow_up TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(30) NOT NULL, -- 'call', 'whatsapp', 'site_visit', 'quote_sent', 'note'
    notes TEXT NOT NULL,
    performed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PROJECTS MANAGEMENT
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    site_location TEXT NOT NULL,
    project_type VARCHAR(50) DEFAULT 'Residential', -- 'Residential', 'Commercial', 'Villa', 'Apartment'
    status VARCHAR(30) NOT NULL DEFAULT 'planning', -- 'planning', 'fabrication', 'installation', 'completed', 'on_hold', 'cancelled'
    start_date DATE DEFAULT CURRENT_DATE,
    expected_completion DATE,
    actual_completion DATE,
    contract_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount_received NUMERIC(12, 2) NOT NULL DEFAULT 0,
    supervisor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity_allocated NUMERIC(10, 2) NOT NULL DEFAULT 0,
    quantity_used NUMERIC(10, 2) NOT NULL DEFAULT 0,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_project_material UNIQUE (project_id, material_id)
);

CREATE TABLE IF NOT EXISTS project_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL, -- 'Measurement', 'Fabrication', 'Glass Cutting', 'Delivery', 'Installation', 'Final Handover'
    progress_percentage INTEGER CHECK (progress_percentage BETWEEN 0 AND 100),
    notes TEXT,
    image_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DAILY MAINTENANCE & SERVICE LOGS
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    location VARCHAR(120) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General', -- 'Factory Machinery', 'Site Installation', 'Window Repair', 'Vehicle/Transport', 'Showroom'
    task_description TEXT NOT NULL,
    assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'emergency'
    status VARCHAR(30) NOT NULL DEFAULT 'pending',   -- 'pending', 'in_progress', 'completed'
    cost NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. GALLERY & MEDIA
CREATE TABLE IF NOT EXISTS gallery_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES gallery_categories(id) ON DELETE SET NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SEED DEFAULT DATA
-- Default Categories
INSERT INTO material_categories (name, description) VALUES
    ('UPVC Profiles', 'UPVC main frame, sash, mullion, and bead profiles'),
    ('Aluminium Profiles', 'Aluminium architectural window and door frames'),
    ('Glass Panes', 'Clear float, tinted, frosted, and toughened glass sheets'),
    ('Hardware & Fittings', 'Handles, multi-point locks, friction stays, rollers, hinges'),
    ('Reinforcements', 'Galvanized iron/steel reinforcements for UPVC chambers'),
    ('Consumables', 'Silicone sealants, EPDM gaskets, fasteners, screws, wool pile')
ON CONFLICT (name) DO NOTHING;

-- Default Gallery Categories
INSERT INTO gallery_categories (name, slug, display_order) VALUES
    ('Windows', 'windows', 1),
    ('Doors', 'doors', 2),
    ('Residential', 'residential', 3),
    ('Commercial', 'commercial', 4)
ON CONFLICT (name) DO NOTHING;

-- Default Pricing Packages
INSERT INTO pricing_packages (name, material_type, profile_series, glass_type, price_per_sqft, features, warranty_years, display_order) VALUES
    ('Standard UPVC Sliding', 'UPVC', '60 Series', '5mm Clear Float', 380.00, ARRAY['Double Track System', 'Smooth Nylon Rollers', 'Bug Mesh Provision', '5-Year Hardware Warranty'], 10, 1),
    ('Premium UPVC Casement', 'UPVC', '70 Series', '5mm Toughened', 520.00, ARRAY['Multi-Point Locking', 'EPDM Weather Seal', 'Sound Insulation 30dB', '10-Year Frame Warranty'], 10, 2),
    ('Ultra-Slim Aluminium Sliding', 'Aluminium', 'Slim Profile', '6mm Toughened Clear', 650.00, ARRAY['Minimal Sightlines', 'Anodized / Powder Coated', 'Concealed Drainage', 'High Wind Load Resistance'], 15, 3),
    ('Thermal-Break Aluminium', 'Aluminium', 'Thermal Barrier', '24mm Double Glazed (DGU)', 950.00, ARRAY['Ultimate Thermal Insulation', 'Acoustic Barrier 40dB', 'Heavy-Duty German Hardware', 'Luxury Architecture Finish'], 20, 4)
ON CONFLICT DO NOTHING;

-- Default Website Content Seeds
INSERT INTO website_content (section, content) VALUES
('hero', '{
    "heading": "Engineered for Silence. Crafted for Luxury.",
    "subheading": "Premium UPVC & Aluminium Windows & Doors custom-manufactured in Tanuku for Andhra Pradesh homes and commercial spaces.",
    "ctaText": "Request a Free Quote",
    "ctaLink": "#contact",
    "secondaryText": "View Our Portfolio",
    "secondaryLink": "#gallery",
    "badgeText": "Tanuku''s Trusted Architectural Partner"
}'::jsonb),
('contact', '{
    "phonePrimary": "+91 98491 23456",
    "phoneSecondary": "+91 94401 23456",
    "email": "contact@siriwindows.in",
    "address": "Near RTC Bus Stand, Main Road, Tanuku, West Godavari Dist, Andhra Pradesh - 534211",
    "businessHours": "Mon - Sat: 9:00 AM - 8:00 PM, Sunday: By Appointment",
    "whatsappNumber": "919849123456"
}'::jsonb),
('stats', '{
    "yearsExperience": 12,
    "projectsCompleted": 1500,
    "happyClients": 1200,
    "districtsCovered": 8
}'::jsonb)
ON CONFLICT (section) DO NOTHING;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to public-facing data
CREATE POLICY "Public read website_content" ON website_content FOR SELECT USING (true);
CREATE POLICY "Public read pricing_packages" ON pricing_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Public read gallery_categories" ON gallery_categories FOR SELECT USING (true);
CREATE POLICY "Public read gallery_images" ON gallery_images FOR SELECT USING (true);

-- Allow public leads insertion from website contact form
CREATE POLICY "Public insert leads" ON leads FOR INSERT WITH CHECK (true);

-- Full access for service_role / authenticated admin
CREATE POLICY "Service role full access website_content" ON website_content USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access staff" ON staff USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access salary_records" ON salary_records USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access material_categories" ON material_categories USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access materials" ON materials USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access stock_transactions" ON stock_transactions USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access clients" ON clients USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access pricing_packages" ON pricing_packages USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access client_quotes" ON client_quotes USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access leads" ON leads USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access lead_activities" ON lead_activities USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access projects" ON projects USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access project_materials" ON project_materials USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access project_updates" ON project_updates USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access maintenance_logs" ON maintenance_logs USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access gallery_categories" ON gallery_categories USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Service role full access gallery_images" ON gallery_images USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
