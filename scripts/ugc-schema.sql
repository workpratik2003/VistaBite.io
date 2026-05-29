-- UGC (User Generated Content) Schema for Vistabite
-- This adds support for user-uploaded videos and posts

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Creator/User profiles table
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  bio TEXT,
  profile_picture_url VARCHAR(500),
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_badge VARCHAR(50),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creator_user_id ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_username ON creator_profiles(username);
CREATE INDEX IF NOT EXISTS idx_creator_verified ON creator_profiles(is_verified);

-- User-Generated Videos/Reels table
CREATE TABLE IF NOT EXISTS ugc_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER NOT NULL,
  video_type VARCHAR(50) DEFAULT 'reel', -- reel, post, story
  
  -- Location data
  cafe_name VARCHAR(255) NOT NULL,
  location_address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_point GEOMETRY(Point, 4326), -- PostGIS point for geospatial queries
  
  -- Meal and category data
  meal_types TEXT[] DEFAULT '{}', -- breakfast, lunch, dinner, cafe, dessert, etc.
  food_categories TEXT[] DEFAULT '{}', -- cuisine type: Italian, Indian, etc.
  ambiance_tags TEXT[] DEFAULT '{}', -- cozy, modern, casual, fancy, etc.
  
  -- Engagement metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  
  -- Content status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  moderation_flags TEXT[] DEFAULT '{}',
  moderation_score DECIMAL(3,2), -- 0-1 score from content moderation
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ugc_creator ON ugc_videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_ugc_city ON ugc_videos(city);
CREATE INDEX IF NOT EXISTS idx_ugc_status ON ugc_videos(status);
CREATE INDEX IF NOT EXISTS idx_ugc_created ON ugc_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ugc_location ON ugc_videos USING GIST(location_point);
CREATE INDEX IF NOT EXISTS idx_ugc_meal_types ON ugc_videos(meal_types);
CREATE INDEX IF NOT EXISTS idx_ugc_views ON ugc_videos(views DESC);

-- Geospatial index for location-based search
CREATE INDEX IF NOT EXISTS idx_ugc_geospatial ON ugc_videos USING GIST(location_point);

-- Likes/Engagement table
CREATE TABLE IF NOT EXISTS ugc_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES ugc_videos(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_video ON ugc_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON ugc_likes(user_id);

-- Comments table
CREATE TABLE IF NOT EXISTS ugc_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES ugc_videos(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_video ON ugc_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_creator ON ugc_comments(creator_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON ugc_comments(created_at DESC);

-- Saves/Favorites table
CREATE TABLE IF NOT EXISTS ugc_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES ugc_videos(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_saves_video ON ugc_saves(video_id);
CREATE INDEX IF NOT EXISTS idx_saves_user ON ugc_saves(user_id);

-- Follow/Creator relationships table
CREATE TABLE IF NOT EXISTS creator_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id VARCHAR(255) NOT NULL,
  following_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON creator_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON creator_follows(following_id);

-- Analytics and trending cache table
CREATE TABLE IF NOT EXISTS ugc_trending_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES ugc_videos(id) ON DELETE CASCADE,
  city VARCHAR(100) NOT NULL,
  meal_type VARCHAR(50),
  trending_rank INTEGER,
  engagement_score DECIMAL(8,2), -- weighted score based on likes, comments, shares
  daily_views INTEGER DEFAULT 0,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, city, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_trending_city ON ugc_trending_cache(city);
CREATE INDEX IF NOT EXISTS idx_trending_meal_type ON ugc_trending_cache(meal_type);
CREATE INDEX IF NOT EXISTS idx_trending_rank ON ugc_trending_cache(trending_rank);
CREATE INDEX IF NOT EXISTS idx_trending_engagement ON ugc_trending_cache(engagement_score DESC);

-- Content moderation queue
CREATE TABLE IF NOT EXISTS ugc_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES ugc_videos(id) ON DELETE CASCADE,
  reason_flagged TEXT,
  ai_confidence_score DECIMAL(3,2),
  manual_review_status VARCHAR(20) DEFAULT 'pending' CHECK (manual_review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moderation_status ON ugc_moderation_queue(manual_review_status);
CREATE INDEX IF NOT EXISTS idx_moderation_created ON ugc_moderation_queue(created_at);

-- Creator analytics table
CREATE TABLE IF NOT EXISTS creator_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  total_videos INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2), -- percentage
  average_video_views DECIMAL(10,2),
  top_meal_type VARCHAR(50),
  top_location VARCHAR(255),
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creator_analytics ON creator_analytics(creator_id);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON creator_analytics(period_start, period_end);

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
