-- Create submissions table for user-submitted Instagram reels
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name VARCHAR(255) NOT NULL,
  creator_name VARCHAR(255) NOT NULL,
  creator_type VARCHAR(20) NOT NULL CHECK (creator_type IN ('owner', 'creator')),
  instagram_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  meal_type VARCHAR(50) NOT NULL,
  location_city VARCHAR(100) NOT NULL,
  location_address VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  caption TEXT,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  submitted_by_ip VARCHAR(45)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_location ON submissions(location_city);
CREATE INDEX IF NOT EXISTS idx_submissions_meal_type ON submissions(meal_type);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

-- Enable RLS (Row Level Security) for additional safety
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (submissions)
CREATE POLICY submissions_insert_policy ON submissions
  FOR INSERT WITH CHECK (true);

-- Create policy to only show approved submissions publicly
CREATE POLICY submissions_select_policy ON submissions
  FOR SELECT USING (status = 'approved');
