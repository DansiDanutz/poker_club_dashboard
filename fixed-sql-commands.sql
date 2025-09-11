-- Create penalties table
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

-- Create indexes for penalties
CREATE INDEX IF NOT EXISTS idx_penalties_player_id ON penalties(player_id);
CREATE INDEX IF NOT EXISTS idx_penalties_date ON penalties(date_applied DESC);

-- Enable RLS for penalties
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and create new one for penalties
DROP POLICY IF EXISTS "Enable all operations for all users" ON penalties;
CREATE POLICY "Enable all operations for all users" ON penalties FOR ALL USING (true);

-- Create addons table
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

-- Create indexes for addons
CREATE INDEX IF NOT EXISTS idx_addons_player_id ON addons(player_id);
CREATE INDEX IF NOT EXISTS idx_addons_date ON addons(date_applied DESC);

-- Enable RLS for addons
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and create new one for addons
DROP POLICY IF EXISTS "Enable all operations for all users" ON addons;
CREATE POLICY "Enable all operations for all users" ON addons FOR ALL USING (true);