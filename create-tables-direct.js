const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://pewwxyyxcepvluowvaxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  try {
    console.log('🔧 Creating test penalty and addon records...');
    
    // First, let's check if we can create the tables by inserting data directly
    // This will fail if tables don't exist, confirming they need to be created manually
    
    console.log('Testing penalties table access...');
    const { data: penaltiesTest, error: penaltiesError } = await supabase
      .from('penalties')
      .select('count', { count: 'exact' });
    
    if (penaltiesError) {
      console.log('❌ Penalties table does not exist:', penaltiesError.message);
      console.log('✅ CONFIRMED: Tables need to be created manually in Supabase SQL Editor');
      console.log('\n📋 Please execute these SQL commands in your Supabase SQL Editor:');
      
      console.log('\n-- CREATE PENALTIES TABLE:');
      console.log(`
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

CREATE INDEX IF NOT EXISTS idx_penalties_player_id ON penalties(player_id);
CREATE INDEX IF NOT EXISTS idx_penalties_date ON penalties(date_applied DESC);

ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Enable all operations for all users" ON penalties FOR ALL USING (true);
      `);
      
      console.log('\n-- CREATE ADDONS TABLE:');
      console.log(`
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

CREATE INDEX IF NOT EXISTS idx_addons_player_id ON addons(player_id);
CREATE INDEX IF NOT EXISTS idx_addons_date ON addons(date_applied DESC);

ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Enable all operations for all users" ON addons FOR ALL USING (true);
      `);
      
      console.log('\n🚀 After running these SQL commands, the penalty and addon buttons will work!');
      return;
    }
    
    console.log('✅ Penalties table exists');
    
    console.log('Testing addons table access...');
    const { data: addonsTest, error: addonsError } = await supabase
      .from('addons')
      .select('count', { count: 'exact' });
    
    if (addonsError) {
      console.log('❌ Addons table does not exist:', addonsError.message);
    } else {
      console.log('✅ Addons table exists');
    }
    
    console.log('🎉 Database check completed!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createTestData();