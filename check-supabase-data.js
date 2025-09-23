const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://pewwxyyxcepvluowvaxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllData() {
  console.log('========================================');
  console.log('🔍 COMPLETE SUPABASE DATABASE REPORT');
  console.log('========================================\n');

  try {
    // 1. Check Players
    console.log('📋 PLAYERS TABLE:');
    console.log('------------------');
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .order('total_hours', { ascending: false });

    if (playersError) {
      console.error('❌ Error fetching players:', playersError);
    } else if (!players || players.length === 0) {
      console.log('⚠️  No players found in database');
    } else {
      console.log(`Found ${players.length} player(s):\n`);
      players.forEach((player, index) => {
        console.log(`Player ${index + 1}:`);
        console.log(`  - ID: ${player.id}`);
        console.log(`  - Name: ${player.name}`);
        console.log(`  - Email: ${player.email || 'Not set'}`);
        console.log(`  - Phone: ${player.phone || 'Not set'}`);
        console.log(`  - Total Hours: ${player.total_hours}`);
        console.log(`  - Total Sessions: ${player.total_sessions}`);
        console.log(`  - Join Date: ${player.join_date}`);
        console.log(`  - Last Played: ${player.last_played || 'Never'}`);
        console.log(`  - Created: ${player.created_at}`);
        console.log('');
      });
    }

    // 2. Check Sessions
    console.log('\n📊 SESSIONS TABLE:');
    console.log('------------------');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
    } else if (!sessions || sessions.length === 0) {
      console.log('⚠️  No sessions found in database');
    } else {
      console.log(`Found ${sessions.length} session(s):\n`);
      sessions.forEach((session, index) => {
        console.log(`Session ${index + 1}:`);
        console.log(`  - Player: ${session.player_name} (ID: ${session.player_id})`);
        console.log(`  - Date: ${session.date_string}`);
        console.log(`  - Seat In: ${session.seat_in_time}`);
        console.log(`  - Seat Out: ${session.seat_out_time}`);
        console.log(`  - Duration: ${session.duration} hours`);
        console.log('');
      });
    }

    // 3. Check Promotions
    console.log('\n🏆 PROMOTIONS TABLE:');
    console.log('--------------------');
    const { data: promotions, error: promotionsError } = await supabase
      .from('promotions')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (promotionsError) {
      console.error('❌ Error fetching promotions:', promotionsError);
    } else if (!promotions || promotions.length === 0) {
      console.log('⚠️  No promotions found in database');
    } else {
      console.log(`Found ${promotions.length} promotion(s):\n`);
      promotions.forEach((promo, index) => {
        console.log(`Promotion ${index + 1}:`);
        console.log(`  - Name: ${promo.name}`);
        console.log(`  - Start: ${promo.start_date}`);
        console.log(`  - End: ${promo.end_date}`);
        console.log(`  - Active: ${promo.active ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    // 4. Check Penalties
    console.log('\n⚠️ PENALTIES TABLE:');
    console.log('-------------------');
    const { data: penalties, error: penaltiesError } = await supabase
      .from('penalties')
      .select('*')
      .order('date_applied', { ascending: false });

    if (penaltiesError) {
      console.error('❌ Error fetching penalties:', penaltiesError);
    } else if (!penalties || penalties.length === 0) {
      console.log('✅ No penalties in database');
    } else {
      console.log(`Found ${penalties.length} penalty(ies):\n`);
      penalties.forEach((penalty, index) => {
        console.log(`Penalty ${index + 1}:`);
        console.log(`  - Player: ${penalty.player_name}`);
        console.log(`  - Minutes: ${penalty.penalty_minutes}`);
        console.log(`  - Reason: ${penalty.reason}`);
        console.log(`  - Date: ${penalty.date_applied}`);
        console.log('');
      });
    }

    // 5. Check Addons
    console.log('\n➕ ADDONS TABLE:');
    console.log('----------------');
    const { data: addons, error: addonsError } = await supabase
      .from('addons')
      .select('*')
      .order('date_applied', { ascending: false });

    if (addonsError) {
      console.error('❌ Error fetching addons:', addonsError);
    } else if (!addons || addons.length === 0) {
      console.log('⚠️  No addons in database');
    } else {
      console.log(`Found ${addons.length} addon(s):\n`);
      addons.forEach((addon, index) => {
        console.log(`Addon ${index + 1}:`);
        console.log(`  - Player: ${addon.player_name}`);
        console.log(`  - Bonus Minutes: ${addon.bonus_minutes}`);
        console.log(`  - Reason: ${addon.reason}`);
        console.log(`  - Date: ${addon.date_applied}`);
        console.log('');
      });
    }

    // 6. Summary
    console.log('\n========================================');
    console.log('📈 SUMMARY:');
    console.log('========================================');
    console.log(`Total Players: ${players?.length || 0}`);
    console.log(`Total Sessions: ${sessions?.length || 0}`);
    console.log(`Total Promotions: ${promotions?.length || 0}`);
    console.log(`Total Penalties: ${penalties?.length || 0}`);
    console.log(`Total Addons: ${addons?.length || 0}`);

    if (players && players.length > 0) {
      const totalHours = players.reduce((sum, p) => sum + (p.total_hours || 0), 0);
      console.log(`\nTotal Hours Played (All Players): ${totalHours.toFixed(2)} hours`);
    }

    console.log('\n✅ Database check complete!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAllData();