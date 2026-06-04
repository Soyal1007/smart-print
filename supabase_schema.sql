-- Drop existing tables to avoid conflicts and start fresh
DROP TABLE IF EXISTS job_files CASCADE;
DROP TABLE IF EXISTS print_jobs CASCADE;
DROP TABLE IF EXISTS print_history CASCADE;
DROP TABLE IF EXISTS order_files CASCADE;
DROP TABLE IF EXISTS print_orders CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (for Students and Owners)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'owner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shops table
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id),
  bw_price_paise INTEGER NOT NULL DEFAULT 200, -- e.g., 200 paise = 2.00 INR
  color_price_paise INTEGER NOT NULL DEFAULT 1000,
  single_sided_price_paise INTEGER NOT NULL DEFAULT 0, -- Extra cost for single sided if any
  double_sided_price_paise INTEGER NOT NULL DEFAULT 0,
  paper_status TEXT NOT NULL DEFAULT 'ok',
  ink_status TEXT NOT NULL DEFAULT 'ok',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default shop for the MVP
INSERT INTO shops (name, bw_price_paise, color_price_paise) VALUES ('Main Print Shop', 200, 1000);

-- Create print_jobs table (replaces print_orders)
CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  shop_id UUID REFERENCES shops(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('uploaded', 'awaiting_payment', 'paid', 'queued', 'printing', 'printed', 'collected', 'failed')),
  total_pages INTEGER NOT NULL DEFAULT 0,
  total_price_paise INTEGER NOT NULL DEFAULT 0,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_files table (replaces order_files)
CREATE TABLE job_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES print_jobs(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  converted_pdf_path TEXT, -- if different from storage_path
  page_count INTEGER NOT NULL,
  color_mode TEXT NOT NULL CHECK (color_mode IN ('bw', 'color')),
  sides TEXT NOT NULL CHECK (sides IN ('single', 'double')),
  copies INTEGER NOT NULL DEFAULT 1,
  page_range TEXT, -- e.g., "1-5", "all"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage bucket setup and policies
-- Note: It is assumed that you have created a public bucket named 'orders' in the Supabase Storage dashboard.

-- Allow public uploads to 'orders' bucket
DROP POLICY IF EXISTS "Public Uploads" ON storage.objects;
CREATE POLICY "Public Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'orders' );

-- Allow public reading from 'orders' bucket
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
CREATE POLICY "Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'orders' );

-- Allow public deletes from 'orders' bucket
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'orders' );

-- RLS setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shops" ON shops FOR SELECT USING (true);
CREATE POLICY "Owners can update their shop" ON shops FOR UPDATE USING (auth.uid() = owner_id);

ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their jobs" ON print_jobs FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'owner'));
CREATE POLICY "Users can insert jobs" ON print_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users/Owners can update jobs" ON print_jobs FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'owner'));
CREATE POLICY "Users/Owners can delete jobs" ON print_jobs FOR DELETE USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'owner'));

ALTER TABLE job_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their job files" ON job_files FOR SELECT USING (true);
CREATE POLICY "Users can insert job files" ON job_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update job files" ON job_files FOR UPDATE USING (true);
CREATE POLICY "Users can delete job files" ON job_files FOR DELETE USING (true);
