-- Drop all existing restrictive policies that only allow authenticated users
DROP POLICY IF EXISTS insert_own_achievements ON achievements;
DROP POLICY IF EXISTS select_own_achievements ON achievements;
DROP POLICY IF EXISTS insert_own_sessions ON activity_sessions;
DROP POLICY IF EXISTS select_own_sessions ON activity_sessions;
DROP POLICY IF EXISTS update_own_sessions ON activity_sessions;
DROP POLICY IF EXISTS insert_own_views ON artifact_views;
DROP POLICY IF EXISTS select_own_views ON artifact_views;
DROP POLICY IF EXISTS insert_own_donations ON donations;
DROP POLICY IF EXISTS select_own_donations ON donations;
DROP POLICY IF EXISTS insert_own_users ON users;
DROP POLICY IF EXISTS select_own_users ON users;
DROP POLICY IF EXISTS update_own_users ON users;

-- Also drop any legacy policies from earlier migrations
DROP POLICY IF EXISTS public_read_users ON users;
DROP POLICY IF EXISTS public_read_activity ON activity_sessions;
DROP POLICY IF EXISTS public_read_artifacts ON artifact_views;
DROP POLICY IF EXISTS public_read_donations ON donations;
DROP POLICY IF EXISTS public_read_achievements ON achievements;
DROP POLICY IF EXISTS public_insert_users ON users;
DROP POLICY IF EXISTS public_insert_activity ON activity_sessions;
DROP POLICY IF EXISTS public_insert_artifacts ON artifact_views;
DROP POLICY IF EXISTS public_insert_donations ON donations;
DROP POLICY IF EXISTS public_insert_achievements ON achievements;
DROP POLICY IF EXISTS public_update_users ON users;
DROP POLICY IF EXISTS public_update_activity ON activity_sessions;
DROP POLICY IF EXISTS public_update_donations ON donations;
DROP POLICY IF EXISTS allow_all_users ON users;
DROP POLICY IF EXISTS allow_all_sessions ON activity_sessions;
DROP POLICY IF EXISTS allow_all_views ON artifact_views;
DROP POLICY IF EXISTS allow_all_donations ON donations;
DROP POLICY IF EXISTS allow_all_achievements ON achievements;

-- Create per-verb policies for anon + authenticated (Telegram Mini App uses anon key)
-- Users
CREATE POLICY "select_users" ON users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Activity sessions
CREATE POLICY "select_sessions" ON activity_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_sessions" ON activity_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_sessions" ON activity_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Artifact views
CREATE POLICY "select_views" ON artifact_views FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_views" ON artifact_views FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Donations
CREATE POLICY "select_donations" ON donations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_donations" ON donations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_donations" ON donations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Achievements
CREATE POLICY "select_achievements" ON achievements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_achievements" ON achievements FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Add unique constraint on achievements if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'achievements_user_id_achievement_key_key'
  ) THEN
    ALTER TABLE achievements ADD CONSTRAINT achievements_user_id_achievement_key UNIQUE (user_id, achievement_key);
  END IF;
END $$;
