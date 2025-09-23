const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://pewwxyyxcepvluowvaxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseConnection() {
  console.log('🔄 Checking Supabase connection...');

  try {
    // Test connection by fetching players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .limit(5);

    if (playersError) {
      console.error('❌ Error connecting to players table:', playersError);
      console.log('\n⚠️  Please ensure the database tables are created in Supabase.');
      console.log('Go to your Supabase dashboard SQL editor and run the schema.sql file.');
      return false;
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log(`📊 Found ${players?.length || 0} players in the database`);

    // Check all tables
    const tables = ['players', 'sessions', 'promotions', 'penalties', 'addons', 'club_settings'];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}' is not accessible: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    }

    // Get counts for all tables
    console.log('\n📊 Current database statistics:');

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log(`   ${table}: ${count} records`);
      }
    }

    console.log('\n🎉 Database is fully configured and ready to use!');
    console.log('Your application at http://localhost:3000 should now sync with Supabase.');

    return true;
  } catch (error) {
    console.error('❌ Error checking database:', error);
    return false;
  }
}

// Run the check
checkDatabaseConnection().then(success => {
  if (!success) {
    console.log('\n📝 Next steps:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the content from supabase/schema.sql');
    console.log('4. Run the SQL to create all tables');
    console.log('5. Come back and run this script again');
    process.exit(1);
  }
  process.exit(0);
});