-- Create a table for Rush Mode scores
CREATE TABLE IF NOT EXISTS rush_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  store_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE rush_scores ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read scores
CREATE POLICY "Allow public read access" ON rush_scores
  FOR SELECT USING (true);

-- Create a policy that allows anyone to insert scores
CREATE POLICY "Allow public insert access" ON rush_scores
  FOR INSERT WITH CHECK (true);
