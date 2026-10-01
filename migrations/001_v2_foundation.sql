-- 001_v2_foundation.sql
-- VistaBite V2 Foundation Migration
-- Creates users, saved_spots, saved_reels, processing_jobs tables
-- Does NOT modify or drop existing V1 tables (submissions, etc.)

BEGIN;

-- Enable PostGIS for geographic queries
-- Requires PostGIS extension on Neon (available as add-on)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- A. USERS
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  password_hash TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==========================================
-- B. SESSIONS (for authentication)
-- ==========================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ==========================================
-- C. SAVED_SPOTS
-- ==========================================
CREATE TABLE IF NOT EXISTS saved_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  cuisine VARCHAR(255),
  address TEXT,
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location geography(POINT, 4326),
  location_source VARCHAR(50) NOT NULL DEFAULT 'manual',
  location_confidence DECIMAL(5, 4),
  user_confirmed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_spots_user_id ON saved_spots(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_spots_location ON saved_spots USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_saved_spots_created_at ON saved_spots(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_spots_user_created ON saved_spots(user_id, created_at DESC);

CREATE TRIGGER saved_spots_updated_at
  BEFORE UPDATE ON saved_spots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Automatically sync PostGIS location from latitude/longitude
CREATE OR REPLACE FUNCTION sync_saved_spot_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_saved_spot_location_trigger
  BEFORE INSERT OR UPDATE OF latitude, longitude ON saved_spots
  FOR EACH ROW EXECUTE FUNCTION sync_saved_spot_location();

-- ==========================================
-- D. SAVED_REELS
-- ==========================================
CREATE TABLE IF NOT EXISTS saved_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_spot_id UUID NOT NULL REFERENCES saved_spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_url VARCHAR(500) NOT NULL,
  instagram_shortcode VARCHAR(100),
  creator_name VARCHAR(255),
  creator_handle VARCHAR(255),
  caption TEXT,
  thumbnail_url VARCHAR(1000),
  extracted_text TEXT,
  transcript TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, instagram_url)
);

CREATE INDEX IF NOT EXISTS idx_saved_reels_saved_spot_id ON saved_reels(saved_spot_id);
CREATE INDEX IF NOT EXISTS idx_saved_reels_user_id ON saved_reels(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_reels_instagram_url ON saved_reels(instagram_url);
CREATE INDEX IF NOT EXISTS idx_saved_reels_created_at ON saved_reels(created_at);

CREATE TRIGGER saved_reels_updated_at
  BEFORE UPDATE ON saved_reels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==========================================
-- E. PROCESSING_JOBS
-- ==========================================
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  saved_reel_id UUID NOT NULL REFERENCES saved_reels(id) ON DELETE CASCADE,
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_processing_jobs_status CHECK (status IN ('queued', 'processing', 'needs_review', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_saved_reel_id ON processing_jobs(saved_reel_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at);

CREATE TRIGGER processing_jobs_updated_at
  BEFORE UPDATE ON processing_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;