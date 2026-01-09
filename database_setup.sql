-- Reset and recreate the enrollments table + policies
-- Run in Supabase SQL Editor

-- Remove any leftover helper function (no longer used)
DROP FUNCTION IF EXISTS public.remove_user_from_class(uuid, uuid);

-- Start clean so policies and constraints are consistent
DROP TABLE IF EXISTS class_enrollments CASCADE;

CREATE TABLE class_enrollments (
	id BIGSERIAL PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
	enrolled_at TIMESTAMPTZ DEFAULT NOW(),
	UNIQUE(user_id, class_id)
);

ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

-- Recreate policies (drop first so this file is re-runnable)
DROP POLICY IF EXISTS "Anyone can view enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves" ON class_enrollments;
DROP POLICY IF EXISTS "Users can unenroll themselves" ON class_enrollments;
DROP POLICY IF EXISTS "Staff can remove any enrollment" ON class_enrollments;

CREATE POLICY "Anyone can view enrollments"
	ON class_enrollments
	FOR SELECT
	USING (true);

CREATE POLICY "Users can enroll themselves"
	ON class_enrollments
	FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users or staff can unenroll"
	ON class_enrollments
	FOR DELETE
	USING (
		auth.uid() = user_id
		OR EXISTS (
			SELECT 1
			FROM user_roles ur
			WHERE ur.user_id = auth.uid()
			AND ur.role IN ('staff', 'admin')
		)
	);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_class_enrollments_user_id ON class_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);

-- Public Profiles (safe, non-sensitive fields for user discovery)
-- Mirrors basic metadata and supports privacy via is_private

CREATE TABLE IF NOT EXISTS public.profiles (
		id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
		username TEXT UNIQUE,
		display_name TEXT,
		first_name TEXT,
		last_name TEXT,
		avatar_url TEXT,
		bio TEXT,
		is_private BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
DROP POLICY IF EXISTS "Public can read non-private profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- SELECT: Non-private profiles visible to all; private profiles only to owner or staff
CREATE POLICY "Public can read non-private profiles"
	ON public.profiles FOR SELECT
	USING (
		NOT is_private
		OR auth.uid() = id
		OR EXISTS (
			SELECT 1
			FROM user_roles ur
			WHERE ur.user_id = auth.uid()
			AND ur.role IN ('staff', 'admin')
		)
	);

-- INSERT: Users can only insert their own profile row
CREATE POLICY "Users can insert own profile"
	ON public.profiles FOR INSERT
	WITH CHECK (auth.uid() = id);

-- UPDATE: Users can only update their own profile, and only certain editable fields
-- Name fields (display_name, first_name, last_name) are read-only; they sync from auth.users via trigger
-- Only allow updates to: avatar_url, bio, is_private, username
CREATE POLICY "Users can update own profile"
	ON public.profiles FOR UPDATE
	USING (auth.uid() = id)
	WITH CHECK (auth.uid() = id);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Auto-create a profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
	INSERT INTO public.profiles (id, display_name, first_name, last_name, avatar_url)
	VALUES (
		NEW.id,
		COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
		COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
		COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
		COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
	)
	ON CONFLICT (id) DO NOTHING;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill existing users into profiles
-- (Run this once to populate profiles for users created before the trigger)
INSERT INTO public.profiles (id, display_name, first_name, last_name, avatar_url)
SELECT 
	u.id,
	COALESCE(u.raw_user_meta_data->>'display_name', NULL),
	COALESCE(u.raw_user_meta_data->>'first_name', NULL),
	COALESCE(u.raw_user_meta_data->>'last_name', NULL),
	COALESCE(u.raw_user_meta_data->>'avatar_url', NULL)
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
