-- Create submissions table for storing user-submitted reels
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  restaurant_name VARCHAR(255) NOT NULL,
  restaurant_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  instagram_url VARCHAR(500) NOT NULL,
  reel_description TEXT,
  meal_types TEXT[] NOT NULL DEFAULT '{}',
  creator_name VARCHAR(255) NOT NULL,
  creator_email VARCHAR(255) NOT NULL,
  creator_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT instagram_url_format CHECK (instagram_url LIKE 'https://instagram.com/%' OR instagram_url LIKE 'https://www.instagram.com/%')
);

-- Create index on city and status for faster filtering
CREATE INDEX IF NOT EXISTS idx_submissions_city ON submissions(city);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_meal_types ON submissions(meal_types);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

-- Create table for tracking submission analytics
CREATE TABLE IF NOT EXISTS submission_analytics (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_submission ON submission_analytics(submission_id);
