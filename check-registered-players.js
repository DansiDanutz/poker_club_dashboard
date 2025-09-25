const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRegisteredPlayers() {
  try {
    // Get all players
    const { data: players, error } = await supabase
      .from('players')
      .select('id, name, email, total_hours, total_sessions, join_date')
      .order('name');

    if (error) {
      console.error('Error fetching players:', error);
      return;
    }

    console.log('\n=== REGISTERED PLAYERS IN DATABASE ===\n');

    if (!players || players.length === 0) {
      console.log('No players registered yet.');
    } else {
      console.log(`Total registered players: ${players.length}\n`);

      // Check for duplicate names
      const nameCount = {};
      players.forEach(player => {
        nameCount[player.name] = (nameCount[player.name] || 0) + 1;
      });

      // Display duplicate names if any
      const duplicates = Object.entries(nameCount).filter(([name, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log('⚠️  WARNING: Duplicate names found:');
        duplicates.forEach(([name, count]) => {
          console.log(`   - "${name}" appears ${count} times`);
        });
        console.log('\n');
      }

      // List all players
      console.log('Player List:');
      console.log('-'.repeat(80));
      players.forEach((player, index) => {
        console.log(`${index + 1}. ${player.name}`);
        console.log(`   ID: ${player.id}`);
        console.log(`   Email: ${player.email || 'N/A'}`);
        console.log(`   Join Date: ${player.join_date}`);
        console.log(`   Total Hours: ${player.total_hours}`);
        console.log(`   Total Sessions: ${player.total_sessions}`);
        console.log('-'.repeat(80));
      });
    }

    console.log('\n=== UNIQUE NAME CHECK COMPLETE ===');
    console.log('Remember: Each player name must be unique - one account per name only!\n');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkRegisteredPlayers();