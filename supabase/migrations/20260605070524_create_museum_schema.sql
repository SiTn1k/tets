-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  photo_url TEXT,
  language_code TEXT DEFAULT 'en',
  is_premium BOOLEAN DEFAULT FALSE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_visit TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Activity sessions table
CREATE TABLE IF NOT EXISTS activity_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  session_end TIMESTAMP WITH TIME ZONE,
  minutes_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Artifact views table
CREATE TABLE IF NOT EXISTS artifact_views (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artifact_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UAH',
  payment_method TEXT NOT NULL, -- 'telegram_stars', 'cryptobot', etc.
  transaction_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_user_id ON activity_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_artifact_views_user_id ON artifact_views(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read (no auth required for Telegram Mini App)
CREATE POLICY "public_read_users" ON users FOR SELECT
  USING (TRUE);

CREATE POLICY "public_read_activity" ON activity_sessions FOR SELECT
  USING (TRUE);

CREATE POLICY "public_read_artifacts" ON artifact_views FOR SELECT
  USING (TRUE);

CREATE POLICY "public_read_donations" ON donations FOR SELECT
  USING (TRUE);

CREATE POLICY "public_read_achievements" ON achievements FOR SELECT
  USING (TRUE);

-- Allow inserts for telegram mini app users (we'll validate telegram_id server-side)
CREATE POLICY "public_insert_users" ON users FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "public_insert_activity" ON activity_sessions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "public_insert_artifacts" ON artifact_views FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "public_insert_donations" ON donations FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "public_insert_achievements" ON achievements FOR INSERT
  WITH CHECK (TRUE);

-- Allow updates
CREATE POLICY "public_update_users" ON users FOR UPDATE
  USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "public_update_activity" ON activity_sessions FOR UPDATE
  USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "public_update_donations" ON donations FOR UPDATE
  USING (TRUE) WITH CHECK (TRUE);
