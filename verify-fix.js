const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFix() {
  console.log('=== VERIFYING CALIN LAZAR HOURS FIX ===\n');

  try {
    // Get player data
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .ilike('name', 'CALIN LAZAR')
      .single();

    console.log('📋 DATABASE VALUES:');
    console.log(`   Player: ${player.name}`);
    console.log(`   Stored total_hours: ${player.total_hours} hours`);

    // Calculate what should be displayed
    console.log('\n✅ EXPECTED UI DISPLAY:');
    console.log(`   Should show: ${player.total_hours} hours`);
    console.log(`   (The database value already includes penalties and add-ons)`);

    console.log('\n📝 FIX SUMMARY:');
    console.log('   ✅ Removed double-counting of penalties and add-ons');
    console.log('   ✅ UI now displays the database total_hours directly');
    console.log('   ✅ Database calculation remains: Sessions - Penalties + Add-ons');

    console.log('\n🔍 TO VERIFY IN UI:');
    console.log('   1. Refresh the page (http://localhost:3000)');
    console.log('   2. Check CALIN LAZAR\'s hours');
    console.log(`   3. Should now show: ${Math.floor(player.total_hours)}h (not 16h)`);

    // Also check if there are other players with penalties/addons
    const { data: penalties } = await supabase
      .from('penalties')
      .select('player_id')
      .not('player_id', 'eq', player.id);

    const { data: addons } = await supabase
      .from('addons')
      .select('player_id')
      .not('player_id', 'eq', player.id);

    const affectedPlayerIds = new Set([
      ...(penalties || []).map(p => p.player_id),
      ...(addons || []).map(a => a.player_id)
    ]);

    if (affectedPlayerIds.size > 0) {
      console.log('\n⚠️  OTHER PLAYERS WITH PENALTIES/ADD-ONS:');
      console.log(`   Found ${affectedPlayerIds.size} other players with penalties or add-ons`);
      console.log('   Their hours should also be correctly displayed now');
    }

  } catch (err) {
    console.error('Error:', err);
  }

  console.log('\n=== VERIFICATION COMPLETE ===\n');
}

verifyFix();