const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDisplayedHours() {
  console.log('=== CHECKING CALIN LAZAR HOURS DISCREPANCY ===\n');

  try {
    // Get player data
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .ilike('name', 'CALIN LAZAR')
      .single();

    // Get all sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('player_id', player.id);

    // Get penalties
    const { data: penalties } = await supabase
      .from('penalties')
      .select('*')
      .eq('player_id', player.id);

    // Get add-ons
    const { data: addons } = await supabase
      .from('addons')
      .select('*')
      .eq('player_id', player.id);

    console.log('🔍 FOUND THE ISSUE!\n');
    console.log('DATABASE VALUES:');
    console.log(`  Stored total_hours: ${player.total_hours} hours`);
    console.log('\nCALCULATION COMPONENTS:');

    const sessionHours = sessions ? sessions.reduce((sum, s) => sum + parseFloat(s.duration || 0), 0) : 0;
    const penaltyMinutes = penalties ? penalties.reduce((sum, p) => sum + parseFloat(p.penalty_minutes || 0), 0) : 0;
    const bonusMinutes = addons ? addons.reduce((sum, a) => sum + parseFloat(a.bonus_minutes || 0), 0) : 0;

    console.log(`  Session Hours: ${sessionHours.toFixed(2)}`);
    console.log(`  Penalty Minutes: ${penaltyMinutes} (${(penaltyMinutes/60).toFixed(2)} hours)`);
    console.log(`  Bonus Minutes: ${bonusMinutes} (${(bonusMinutes/60).toFixed(2)} hours)`);

    console.log('\n❌ PROBLEM IDENTIFIED:');
    console.log('  The UI is showing 16 hours, which is approximately the bonus hours (16.33)');
    console.log('  This suggests the UI might be:');
    console.log('  1. Only showing bonus hours and ignoring penalties');
    console.log('  2. Not properly subtracting penalties from the total');
    console.log('  3. Using the wrong calculation formula\n');

    console.log('CORRECT CALCULATION:');
    const correctTotal = sessionHours - (penaltyMinutes / 60) + (bonusMinutes / 60);
    console.log(`  ${sessionHours.toFixed(2)} - ${(penaltyMinutes/60).toFixed(2)} + ${(bonusMinutes/60).toFixed(2)} = ${correctTotal.toFixed(2)} hours`);

    console.log('\nPOSSIBLE UI CALCULATION (WRONG):');
    const wrongCalculation1 = sessionHours + (bonusMinutes / 60);
    const wrongCalculation2 = (bonusMinutes / 60) - (penaltyMinutes / 60);
    console.log(`  Sessions + Bonuses only: ${sessionHours.toFixed(2)} + ${(bonusMinutes/60).toFixed(2)} = ${wrongCalculation1.toFixed(2)} hours`);
    console.log(`  Bonuses - Penalties only: ${(bonusMinutes/60).toFixed(2)} - ${(penaltyMinutes/60).toFixed(2)} = ${wrongCalculation2.toFixed(2)} hours`);

    if (Math.abs(wrongCalculation1 - 16.33) < 0.5) {
      console.log('\n✅ The UI is likely showing: Sessions + Bonuses (ignoring penalties)');
    } else if (Math.abs(wrongCalculation2 - 8.17) < 0.5) {
      console.log('\n✅ The UI calculation matches the stored value');
    }

    // Now let's check what the UI code might be doing
    console.log('\n📝 TO FIX THIS:');
    console.log('  1. The UI should calculate: Sessions - Penalties + Bonuses');
    console.log('  2. Make sure penalties are subtracted, not ignored');
    console.log('  3. Ensure the displayed value matches the stored total_hours');

  } catch (err) {
    console.error('Error:', err);
  }
}

checkDisplayedHours();