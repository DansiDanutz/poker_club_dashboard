-- Add unique constraint to prevent duplicate player names
-- This ensures each player name can only exist once in the database

-- First, make the name column case-insensitive unique by creating a unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_name_unique
ON players (UPPER(TRIM(name)));

-- Add a check constraint to ensure names are not empty
ALTER TABLE players
ADD CONSTRAINT check_player_name_not_empty
CHECK (TRIM(name) != '');

-- Optional: Add a trigger to automatically trim and uppercase names for comparison
CREATE OR REPLACE FUNCTION normalize_player_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Trim whitespace from the name
    NEW.name = TRIM(NEW.name);

    -- Ensure name is not empty
    IF LENGTH(NEW.name) = 0 THEN
        RAISE EXCEPTION 'Player name cannot be empty';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to normalize names before insert or update
DROP TRIGGER IF EXISTS normalize_player_name_trigger ON players;
CREATE TRIGGER normalize_player_name_trigger
BEFORE INSERT OR UPDATE OF name ON players
FOR EACH ROW
EXECUTE FUNCTION normalize_player_name();