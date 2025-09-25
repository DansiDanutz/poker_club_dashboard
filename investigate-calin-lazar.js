const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function investigateCalinLazar() {
  console.log('=== INVESTIGATING CALIN LAZAR\'S HOURS CALCULATION ===\n');

  try {
    // 1. Get Calin Lazar's player data
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .ilike('name', 'CALIN LAZAR')
      .single();

    if (playerError) {
      console.error('Error fetching player:', playerError);
      return;
    }

    console.log('📋 PLAYER DATA:');
    console.log('   Name:', player.name);
    console.log('   ID:', player.id);
    console.log('   Total Hours (stored):', player.total_hours);
    console.log('   Total Sessions:', player.total_sessions);
    console.log('   Join Date:', player.join_date);
    console.log('   Last Played:', player.last_played || 'Never');
    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Get all sessions for Calin Lazar
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('player_id', player.id)
      .order('date', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    console.log('🎮 SESSIONS DATA:');
    if (!sessions || sessions.length === 0) {
      console.log('   No sessions found for this player');
    } else {
      console.log(`   Total Sessions: ${sessions.length}`);
      let totalSessionHours = 0;

      sessions.forEach((session, index) => {
        console.log(`\n   Session ${index + 1}:`);
        console.log(`     Date: ${session.date_string}`);
        console.log(`     Seat In: ${new Date(session.seat_in_time).toLocaleTimeString()}`);
        console.log(`     Seat Out: ${new Date(session.seat_out_time).toLocaleTimeString()}`);
        console.log(`     Duration: ${session.duration} hours`);
        totalSessionHours += parseFloat(session.duration);
      });

      console.log('\n   📊 CALCULATED FROM SESSIONS:');
      console.log(`     Total Hours from Sessions: ${totalSessionHours.toFixed(2)}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Get penalties for Calin Lazar
    const { data: penalties, error: penaltiesError } = await supabase
      .from('penalties')
      .select('*')
      .eq('player_id', player.id)
      .order('date_applied', { ascending: true });

    console.log('⚠️  PENALTIES DATA:');
    if (!penalties || penalties.length === 0) {
      console.log('   No penalties found for this player');
    } else {
      console.log(`   Total Penalties: ${penalties.length}`);
      let totalPenaltyMinutes = 0;

      penalties.forEach((penalty, index) => {
        console.log(`\n   Penalty ${index + 1}:`);
        console.log(`     Date Applied: ${new Date(penalty.date_applied).toLocaleDateString()}`);
        console.log(`     Reason: ${penalty.reason}`);
        console.log(`     Type: ${penalty.reason_type}`);
        console.log(`     Penalty Minutes: ${penalty.penalty_minutes}`);
        console.log(`     Applied By: ${penalty.applied_by || 'System'}`);
        console.log(`     Notes: ${penalty.notes || 'None'}`);
        totalPenaltyMinutes += parseFloat(penalty.penalty_minutes);
      });

      console.log('\n   📊 TOTAL PENALTY:');
      console.log(`     Total Penalty Minutes: ${totalPenaltyMinutes}`);
      console.log(`     Total Penalty Hours: ${(totalPenaltyMinutes / 60).toFixed(2)}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 4. Get add-ons for Calin Lazar
    const { data: addons, error: addonsError } = await supabase
      .from('addons')
      .select('*')
      .eq('player_id', player.id)
      .order('date_applied', { ascending: true });

    console.log('➕ ADD-ONS DATA:');
    if (!addons || addons.length === 0) {
      console.log('   No add-ons found for this player');
    } else {
      console.log(`   Total Add-ons: ${addons.length}`);
      let totalBonusMinutes = 0;

      addons.forEach((addon, index) => {
        console.log(`\n   Add-on ${index + 1}:`);
        console.log(`     Date Applied: ${new Date(addon.date_applied).toLocaleDateString()}`);
        console.log(`     Reason: ${addon.reason}`);
        console.log(`     Type: ${addon.reason_type}`);
        console.log(`     Bonus Minutes: ${addon.bonus_minutes}`);
        console.log(`     Applied By: ${addon.applied_by || 'System'}`);
        console.log(`     Notes: ${addon.notes || 'None'}`);
        totalBonusMinutes += parseFloat(addon.bonus_minutes);
      });

      console.log('\n   📊 TOTAL ADD-ONS:');
      console.log(`     Total Bonus Minutes: ${totalBonusMinutes}`);
      console.log(`     Total Bonus Hours: ${(totalBonusMinutes / 60).toFixed(2)}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 5. Calculate the correct total
    console.log('🔢 FINAL CALCULATION:');

    const sessionHours = sessions ? sessions.reduce((sum, s) => sum + parseFloat(s.duration), 0) : 0;
    const penaltyHours = penalties ? penalties.reduce((sum, p) => sum + parseFloat(p.penalty_minutes) / 60, 0) : 0;
    const bonusHours = addons ? addons.reduce((sum, a) => sum + parseFloat(a.bonus_minutes) / 60, 0) : 0;

    console.log(`   Session Hours:    ${sessionHours.toFixed(2)}`);
    console.log(`   - Penalty Hours:  ${penaltyHours.toFixed(2)}`);
    console.log(`   + Bonus Hours:    ${bonusHours.toFixed(2)}`);
    console.log(`   ${'='.repeat(25)}`);

    const correctTotal = sessionHours - penaltyHours + bonusHours;
    console.log(`   CORRECT TOTAL:    ${correctTotal.toFixed(2)} hours`);
    console.log(`   STORED TOTAL:     ${player.total_hours} hours`);

    const difference = Math.abs(correctTotal - player.total_hours);
    if (difference > 0.01) {
      console.log(`\n   ❌ DISCREPANCY FOUND: ${difference.toFixed(2)} hours difference`);
      console.log('   The stored value does not match the calculated value!');

      // Explain the likely issue
      console.log('\n   📝 LIKELY ISSUE:');
      console.log('   The total_hours might be:');
      console.log('   1. Only counting session hours without penalties/add-ons');
      console.log('   2. Using minutes instead of hours for penalties/add-ons');
      console.log('   3. Not updating when penalties/add-ons are added');
    } else {
      console.log('\n   ✅ Values match correctly');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Check how the hours should be calculated
    console.log('📐 CALCULATION FORMULA SHOULD BE:');
    console.log('   Total Hours = Session Hours - (Penalty Minutes / 60) + (Bonus Minutes / 60)');
    console.log('\n   WHERE:');
    console.log('   - Session Hours: Sum of all session durations');
    console.log('   - Penalty Minutes: Sum of all penalties (stored as minutes)');
    console.log('   - Bonus Minutes: Sum of all add-ons (stored as minutes)');

  } catch (err) {
    console.error('Unexpected error:', err);
  }

  console.log('\n=== INVESTIGATION COMPLETE ===\n');
}

investigateCalinLazar();