-- Create Add-ons table
CREATE TABLE IF NOT EXISTS addons (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    bonus_minutes DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reason_type VARCHAR(50) NOT NULL CHECK (reason_type IN ('late_registration', 'high_stakes_bonus', 'compensation', 'promotional', 'other')),
    applied_by VARCHAR(255),
    date_applied TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addons_player_id ON addons(player_id);
CREATE INDEX IF NOT EXISTS idx_addons_date ON addons(date_applied DESC);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_addons_updated_at 
    BEFORE UPDATE ON addons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Enable all operations for all users" ON addons FOR ALL USING (true);