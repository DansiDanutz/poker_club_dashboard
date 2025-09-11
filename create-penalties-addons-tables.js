const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://pewwxyyxcepvluowvaxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('🔧 Creating penalties and addons tables...');
    
    // Check if tables exist first
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['penalties', 'addons']);

    if (tablesError) {
      console.log('Cannot check existing tables, proceeding with creation...');
    } else {
      console.log('Existing tables:', tables?.map(t => t.table_name) || []);
    }

    // Create penalties table
    console.log('Creating penalties table...');
    const penaltiesSQL = `
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
    `;

    const { error: penaltiesError } = await supabase.rpc('exec_sql', { sql: penaltiesSQL });
    
    if (penaltiesError) {
      console.error('❌ Error creating penalties table:', penaltiesError);
    } else {
      console.log('✅ Penalties table created successfully!');
    }

    // Create addons table
    console.log('Creating addons table...');
    const addonsSQL = `
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
    `;

    const { error: addonsError } = await supabase.rpc('exec_sql', { sql: addonsSQL });
    
    if (addonsError) {
      console.error('❌ Error creating addons table:', addonsError);
    } else {
      console.log('✅ Addons table created successfully!');
    }

    // Test table access
    console.log('Testing table access...');
    
    const { data: penaltiesTest, error: penaltiesTestError } = await supabase
      .from('penalties')
      .select('count', { count: 'exact' });
    
    if (penaltiesTestError) {
      console.error('❌ Cannot access penalties table:', penaltiesTestError);
    } else {
      console.log('✅ Penalties table accessible');
    }

    const { data: addonsTest, error: addonsTestError } = await supabase
      .from('addons')
      .select('count', { count: 'exact' });
    
    if (addonsTestError) {
      console.error('❌ Cannot access addons table:', addonsTestError);
    } else {
      console.log('✅ Addons table accessible');
    }

    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createTables();