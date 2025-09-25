const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixDuplicatePlayers() {
  try {
    console.log('=== FIXING DUPLICATE PLAYERS ===\n');

    // Step 1: Find all duplicates
    const { data: allPlayers, error: fetchError } = await supabase
      .from('players')
      .select('*')
      .order('name');

    if (fetchError) {
      console.error('Error fetching players:', fetchError);
      return;
    }

    // Group players by name
    const playersByName = {};
    allPlayers.forEach(player => {
      if (!playersByName[player.name]) {
        playersByName[player.name] = [];
      }
      playersByName[player.name].push(player);
    });

    // Find duplicates
    const duplicates = Object.entries(playersByName).filter(([name, players]) => players.length > 1);

    if (duplicates.length === 0) {
      console.log('No duplicate players found.');
      return;
    }

    console.log(`Found ${duplicates.length} duplicate name(s):\n`);

    // Step 2: Handle each duplicate
    for (const [name, players] of duplicates) {
      console.log(`Processing duplicate: "${name}" (${players.length} entries)`);

      // Sort by ID to keep the first entry (oldest)
      players.sort((a, b) => a.id - b.id);

      const keepPlayer = players[0];
      const removePlayerIds = players.slice(1).map(p => p.id);

      console.log(`  Keeping: ID ${keepPlayer.id} (original entry)`);
      console.log(`  Removing: IDs ${removePlayerIds.join(', ')}`);

      // Check if any of the duplicate entries have sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('sessions')
        .select('player_id, COUNT(*)')
        .in('player_id', removePlayerIds);

      if (sessions && sessions.length > 0) {
        console.log(`  ⚠️  Warning: Some duplicate entries have sessions. Migrating them to the original entry...`);

        // Migrate sessions to the kept player
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ player_id: keepPlayer.id })
          .in('player_id', removePlayerIds);

        if (updateError) {
          console.error(`  Error migrating sessions:`, updateError);
          continue;
        }
      }

      // Delete duplicate entries
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .in('id', removePlayerIds);

      if (deleteError) {
        console.error(`  Error deleting duplicates:`, deleteError);
      } else {
        console.log(`  ✅ Successfully removed ${removePlayerIds.length} duplicate(s)\n`);
      }
    }

    console.log('=== DUPLICATE REMOVAL COMPLETE ===\n');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

fixDuplicatePlayers();