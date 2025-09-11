-- Create Players table
CREATE TABLE IF NOT EXISTS players (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_hours DECIMAL(10, 2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    last_played DATE,
    last_session_duration DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Sessions table (History)
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    date_string DATE NOT NULL,
    seat_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    seat_out_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration DECIMAL(10, 2) NOT NULL,
    day_of_week INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Promotions table
CREATE TABLE IF NOT EXISTS promotions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN DEFAULT true,
    deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Club Settings table
CREATE TABLE IF NOT EXISTS club_settings (
    id BIGSERIAL PRIMARY KEY,
    club_name VARCHAR(255) DEFAULT 'Poker Club',
    location VARCHAR(255),
    stakes VARCHAR(100),
    table_limit VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
CREATE INDEX IF NOT EXISTS idx_players_total_hours ON players(total_hours DESC);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_sessions_player_id ON sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_date_string ON sessions(date_string);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_penalties_player_id ON penalties(player_id);
CREATE INDEX IF NOT EXISTS idx_penalties_date ON penalties(date_applied DESC);
CREATE INDEX IF NOT EXISTS idx_addons_player_id ON addons(player_id);
CREATE INDEX IF NOT EXISTS idx_addons_date ON addons(date_applied DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at 
    BEFORE UPDATE ON promotions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_settings_updated_at 
    BEFORE UPDATE ON club_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_penalties_updated_at 
    BEFORE UPDATE ON penalties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addons_updated_at 
    BEFORE UPDATE ON addons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default club settings
INSERT INTO club_settings (club_name, location) 
VALUES ('Poker Club', 'Premium Cash Game Manager') 
ON CONFLICT DO NOTHING;

-- Insert sample data for testing (optional)
INSERT INTO players (name, email, phone, total_hours, total_sessions) VALUES
('John Doe', 'john@example.com', '555-0101', 45.5, 12),
('Jane Smith', 'jane@example.com', '555-0102', 38.2, 10),
('Mike Johnson', 'mike@example.com', '555-0103', 52.1, 15)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your authentication needs)
CREATE POLICY "Enable all operations for all users" ON players FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON sessions FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON promotions FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON club_settings FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON penalties FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON addons FOR ALL USING (true);