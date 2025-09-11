-- Create Penalties table
CREATE TABLE IF NOT EXISTS penalties (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    penalty_minutes DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reason_type VARCHAR(50) NOT NULL CHECK (reason_type IN ('floor_mistake', 'dinner_break', 'short_pause', 'other')),
    applied_by VARCHAR(255),
    date_applied TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_penalties_player_id ON penalties(player_id);
CREATE INDEX IF NOT EXISTS idx_penalties_date ON penalties(date_applied DESC);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_penalties_updated_at 
    BEFORE UPDATE ON penalties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Enable all operations for all users" ON penalties FOR ALL USING (true);