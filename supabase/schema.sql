-- ============================================================
-- Advanced Packaging Explorer — Supabase Schema
-- ============================================================
-- Run this ENTIRE file in Supabase Dashboard → SQL Editor → New query.
-- It creates two tables (papers, notes) and Row Level Security rules
-- so that ONLY the owner (you) can INSERT / UPDATE / DELETE,
-- but ANYONE can SELECT (read).
--
-- Replace <YOUR_EMAIL> below with the email you used when creating
-- the Supabase Auth user for yourself. Case-insensitive match.
-- ============================================================

-- Which email is allowed to edit? Change this once.
-- (You can also change it later via SQL Editor with UPDATE.)
CREATE TABLE IF NOT EXISTS public.app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

INSERT INTO public.app_config (key, value)
VALUES ('owner_email', '<YOUR_EMAIL>')   -- <<< CHANGE THIS to your email
ON CONFLICT (key) DO NOTHING;

-- Helper: returns TRUE if the caller is the owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_config cfg, auth.users u
    WHERE cfg.key = 'owner_email'
      AND u.id = auth.uid()
      AND lower(u.email) = lower(cfg.value)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_owner() TO anon, authenticated;


-- ============================================================
-- Table: papers  (user-added papers, per element)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.papers (
  id           bigserial PRIMARY KEY,
  package_id   text NOT NULL,          -- e.g. 'cowos'
  element_id   text NOT NULL,          -- e.g. 'cowos-interposer'
  title        text NOT NULL,
  url          text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS papers_element_idx
  ON public.papers (package_id, element_id, created_at DESC);

-- ============================================================
-- Table: notes  (freeform notes per element — ONE row per element)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notes (
  package_id   text NOT NULL,
  element_id   text NOT NULL,
  body         text NOT NULL DEFAULT '',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (package_id, element_id)
);


-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Clean up any prior policies (safe re-run)
DROP POLICY IF EXISTS papers_read_all      ON public.papers;
DROP POLICY IF EXISTS papers_insert_owner  ON public.papers;
DROP POLICY IF EXISTS papers_update_owner  ON public.papers;
DROP POLICY IF EXISTS papers_delete_owner  ON public.papers;
DROP POLICY IF EXISTS notes_read_all       ON public.notes;
DROP POLICY IF EXISTS notes_insert_owner   ON public.notes;
DROP POLICY IF EXISTS notes_update_owner   ON public.notes;
DROP POLICY IF EXISTS notes_delete_owner   ON public.notes;
DROP POLICY IF EXISTS config_read_all      ON public.app_config;

-- Anyone can READ papers + notes (public site behavior)
CREATE POLICY papers_read_all ON public.papers
  FOR SELECT USING (true);

CREATE POLICY notes_read_all ON public.notes
  FOR SELECT USING (true);

CREATE POLICY config_read_all ON public.app_config
  FOR SELECT USING (true);

-- Only the owner can WRITE
CREATE POLICY papers_insert_owner ON public.papers
  FOR INSERT WITH CHECK (public.is_owner());

CREATE POLICY papers_update_owner ON public.papers
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY papers_delete_owner ON public.papers
  FOR DELETE USING (public.is_owner());

CREATE POLICY notes_insert_owner ON public.notes
  FOR INSERT WITH CHECK (public.is_owner());

CREATE POLICY notes_update_owner ON public.notes
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY notes_delete_owner ON public.notes
  FOR DELETE USING (public.is_owner());


-- ============================================================
-- Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS papers_touch ON public.papers;
CREATE TRIGGER papers_touch
  BEFORE UPDATE ON public.papers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS notes_touch ON public.notes;
CREATE TRIGGER notes_touch
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================
-- DONE
-- ============================================================
-- To sanity-check:  SELECT public.is_owner();
--   → returns false when not logged in
--   → returns true  after you sign in as the owner_email user
-- ============================================================
