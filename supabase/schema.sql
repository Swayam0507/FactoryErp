-- ============================================================
-- Factory ERP System — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: admins (maps auth.users → role)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'viewer')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: employees
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code        TEXT UNIQUE NOT NULL,
  full_name            TEXT NOT NULL,
  mobile_number        TEXT,
  address              TEXT,
  joining_date         DATE,
  rate_per_attendance  NUMERIC(10,2) NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_date   DATE NOT NULL,
  attendance_count  NUMERIC(3,1) NOT NULL DEFAULT 1 CHECK (attendance_count >= 0 AND attendance_count <= 4),
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

-- ============================================================
-- TABLE: advance_payments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.advance_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_mode  TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'RTGS')),
  reason        TEXT,
  payment_date  DATE NOT NULL,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: salary_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.salary_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month             SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year              SMALLINT NOT NULL CHECK (year >= 2020),
  total_attendance  NUMERIC(5,1) NOT NULL DEFAULT 0,
  rate              NUMERIC(10,2) NOT NULL DEFAULT 0,
  gross_salary      NUMERIC(10,2) NOT NULL DEFAULT 0,
  advance_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  advance_cash      NUMERIC(10,2) NOT NULL DEFAULT 0,
  advance_rtgs      NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_salary      NUMERIC(10,2) NOT NULL DEFAULT 0,
  generated_by      UUID REFERENCES auth.users(id),
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- ============================================================
-- TABLE: factory_settings (singleton, id always = 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.factory_settings (
  id                  INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  factory_name        TEXT NOT NULL DEFAULT 'VivekBhai Industries',
  factory_address     TEXT DEFAULT '',
  logo_url            TEXT DEFAULT '',
  whatsapp_phone_id   TEXT DEFAULT '',
  whatsapp_token      TEXT DEFAULT '',
  whatsapp_enabled    BOOLEAN DEFAULT FALSE,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO public.factory_settings (id, factory_name)
VALUES (1, 'VivekBhai Industries')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_advance_employee_id ON public.advance_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_payment_date ON public.advance_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_salary_employee_id ON public.salary_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_month_year ON public.salary_reports(month, year);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_code ON public.employees(employee_code);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_settings ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.admins WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ---- admins table policies ----
CREATE POLICY "admins_select_own" ON public.admins
  FOR SELECT USING (id = auth.uid() OR public.get_my_role() = 'super_admin');

CREATE POLICY "admins_insert_super" ON public.admins
  FOR INSERT WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY "admins_update_super" ON public.admins
  FOR UPDATE USING (public.get_my_role() = 'super_admin');

CREATE POLICY "admins_delete_super" ON public.admins
  FOR DELETE USING (public.get_my_role() = 'super_admin');

-- ---- employees table policies ----
CREATE POLICY "employees_select_all_auth" ON public.employees
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "employees_insert_admin" ON public.employees
  FOR INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "employees_update_admin" ON public.employees
  FOR UPDATE USING (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "employees_delete_super" ON public.employees
  FOR DELETE USING (public.get_my_role() = 'super_admin');

-- ---- attendance table policies ----
CREATE POLICY "attendance_select_all_auth" ON public.attendance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "attendance_insert_admin" ON public.attendance
  FOR INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "attendance_update_admin" ON public.attendance
  FOR UPDATE USING (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "attendance_delete_admin" ON public.attendance
  FOR DELETE USING (public.get_my_role() IN ('super_admin', 'admin'));

-- ---- advance_payments table policies ----
CREATE POLICY "advances_select_all_auth" ON public.advance_payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "advances_insert_admin" ON public.advance_payments
  FOR INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "advances_update_admin" ON public.advance_payments
  FOR UPDATE USING (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "advances_delete_admin" ON public.advance_payments
  FOR DELETE USING (public.get_my_role() IN ('super_admin', 'admin'));

-- ---- salary_reports table policies ----
CREATE POLICY "salary_select_all_auth" ON public.salary_reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "salary_insert_admin" ON public.salary_reports
  FOR INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "salary_update_admin" ON public.salary_reports
  FOR UPDATE USING (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "salary_delete_super" ON public.salary_reports
  FOR DELETE USING (public.get_my_role() = 'super_admin');

-- ---- factory_settings table policies ----
CREATE POLICY "settings_select_all_auth" ON public.factory_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "settings_update_super" ON public.factory_settings
  FOR UPDATE USING (public.get_my_role() = 'super_admin');

CREATE POLICY "settings_insert_super" ON public.factory_settings
  FOR INSERT WITH CHECK (public.get_my_role() = 'super_admin');

-- ============================================================
-- STORAGE BUCKET for logos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('factory-assets', 'factory-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "factory_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'factory-assets');

CREATE POLICY "factory_assets_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'factory-assets'
    AND auth.role() = 'authenticated'
    AND public.get_my_role() = 'super_admin'
  );

CREATE POLICY "factory_assets_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'factory-assets'
    AND public.get_my_role() = 'super_admin'
  );
