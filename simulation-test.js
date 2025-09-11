const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://pewwxyyxcepvluowvaxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSimulation() {
  try {
    console.log('🧪 Starting comprehensive penalty/addon simulation...\n');
    
    // Get initial state
    console.log('📊 INITIAL STATE:');
    const { data: initialPlayers, error: playersError } = await supabase
      .from('players')
      .select('*')
      .order('total_hours', { ascending: false });
    
    if (playersError) {
      console.error('❌ Error fetching players:', playersError);
      return;
    }
    
    initialPlayers.forEach(player => {
      console.log(`   ${player.name}: ${player.total_hours}h (${player.total_sessions} sessions)`);
    });
    
    // Choose two test players
    const player1 = initialPlayers.find(p => p.name.includes('Dan Semenescu'));
    const player2 = initialPlayers.find(p => p.name.includes('Avram'));
    
    if (!player1 || !player2) {
      console.error('❌ Could not find test players');
      return;
    }
    
    console.log(`\n🎯 Test subjects: ${player1.name} (ID: ${player1.id}) and ${player2.name} (ID: ${player2.id})`);
    
    // Simulation 1: Add penalty to player1
    console.log('\n🔴 SIMULATION 1: Adding 5-minute penalty to', player1.name);
    const penalty1 = await supabase
      .from('penalties')
      .insert([{
        player_id: player1.id,
        player_name: player1.name,
        penalty_minutes: 5,
        reason: 'Test penalty for simulation',
        reason_type: 'floor_mistake',
        applied_by: 'Test Script',
        date_applied: new Date().toISOString(),
        notes: 'Simulation test penalty'
      }])
      .select()
      .single();
    
    if (penalty1.error) {
      console.error('❌ Error adding penalty:', penalty1.error);
      return;
    }
    
    console.log('✅ Penalty added:', penalty1.data);
    
    // Recalculate player1 stats
    const { data: player1Sessions } = await supabase
      .from('sessions')
      .select('duration')
      .eq('player_id', player1.id);
    
    const { data: player1Penalties } = await supabase
      .from('penalties')
      .select('penalty_minutes')
      .eq('player_id', player1.id);
    
    const { data: player1Addons } = await supabase
      .from('addons')
      .select('bonus_minutes')
      .eq('player_id', player1.id);
    
    const sessionHours1 = (player1Sessions || []).reduce((sum, session) => sum + session.duration, 0);
    const penaltyMinutes1 = (player1Penalties || []).reduce((sum, penalty) => sum + penalty.penalty_minutes, 0);
    const addonMinutes1 = (player1Addons || []).reduce((sum, addon) => sum + addon.bonus_minutes, 0);
    const calculatedHours1 = Math.max(0, sessionHours1 - (penaltyMinutes1 / 60) + (addonMinutes1 / 60));
    
    console.log(`   Session hours: ${sessionHours1}h`);
    console.log(`   Penalty minutes: ${penaltyMinutes1} (${penaltyMinutes1/60}h)`);
    console.log(`   Addon minutes: ${addonMinutes1} (${addonMinutes1/60}h)`);
    console.log(`   Calculated total: ${calculatedHours1}h`);
    
    // Update player1 stats
    await supabase
      .from('players')
      .update({ 
        total_hours: calculatedHours1,
        updated_at: new Date().toISOString()
      })
      .eq('id', player1.id);
    
    console.log(`✅ ${player1.name} updated to ${calculatedHours1}h`);
    
    // Simulation 2: Add addon to player2
    console.log('\n🟢 SIMULATION 2: Adding 10-minute bonus to', player2.name);
    const addon1 = await supabase
      .from('addons')
      .insert([{
        player_id: player2.id,
        player_name: player2.name,
        bonus_minutes: 10,
        reason: 'Test bonus for simulation',
        reason_type: 'compensation',
        applied_by: 'Test Script',
        date_applied: new Date().toISOString(),
        notes: 'Simulation test bonus'
      }])
      .select()
      .single();
    
    if (addon1.error) {
      console.error('❌ Error adding addon:', addon1.error);
      return;
    }
    
    console.log('✅ Addon added:', addon1.data);
    
    // Recalculate player2 stats
    const { data: player2Sessions } = await supabase
      .from('sessions')
      .select('duration')
      .eq('player_id', player2.id);
    
    const { data: player2Penalties } = await supabase
      .from('penalties')
      .select('penalty_minutes')
      .eq('player_id', player2.id);
    
    const { data: player2Addons } = await supabase
      .from('addons')
      .select('bonus_minutes')
      .eq('player_id', player2.id);
    
    const sessionHours2 = (player2Sessions || []).reduce((sum, session) => sum + session.duration, 0);
    const penaltyMinutes2 = (player2Penalties || []).reduce((sum, penalty) => sum + penalty.penalty_minutes, 0);
    const addonMinutes2 = (player2Addons || []).reduce((sum, addon) => sum + addon.bonus_minutes, 0);
    const calculatedHours2 = Math.max(0, sessionHours2 - (penaltyMinutes2 / 60) + (addonMinutes2 / 60));
    
    console.log(`   Session hours: ${sessionHours2}h`);
    console.log(`   Penalty minutes: ${penaltyMinutes2} (${penaltyMinutes2/60}h)`);
    console.log(`   Addon minutes: ${addonMinutes2} (${addonMinutes2/60}h)`);
    console.log(`   Calculated total: ${calculatedHours2}h`);
    
    // Update player2 stats
    await supabase
      .from('players')
      .update({ 
        total_hours: calculatedHours2,
        updated_at: new Date().toISOString()
      })
      .eq('id', player2.id);
    
    console.log(`✅ ${player2.name} updated to ${calculatedHours2}h`);
    
    // Simulation 3: Add penalty to player2
    console.log('\n🔴 SIMULATION 3: Adding 3-minute penalty to', player2.name);
    const penalty2 = await supabase
      .from('penalties')
      .insert([{
        player_id: player2.id,
        player_name: player2.name,
        penalty_minutes: 3,
        reason: 'Second test penalty',
        reason_type: 'dinner_break',
        applied_by: 'Test Script',
        date_applied: new Date().toISOString(),
        notes: 'Second simulation test penalty'
      }])
      .select()
      .single();
    
    if (penalty2.error) {
      console.error('❌ Error adding penalty:', penalty2.error);
      return;
    }
    
    console.log('✅ Second penalty added:', penalty2.data);
    
    // Recalculate player2 stats again
    const { data: player2Sessions2 } = await supabase
      .from('sessions')
      .select('duration')
      .eq('player_id', player2.id);
    
    const { data: player2Penalties2 } = await supabase
      .from('penalties')
      .select('penalty_minutes')
      .eq('player_id', player2.id);
    
    const { data: player2Addons2 } = await supabase
      .from('addons')
      .select('bonus_minutes')
      .eq('player_id', player2.id);
    
    const sessionHours2_2 = (player2Sessions2 || []).reduce((sum, session) => sum + session.duration, 0);
    const penaltyMinutes2_2 = (player2Penalties2 || []).reduce((sum, penalty) => sum + penalty.penalty_minutes, 0);
    const addonMinutes2_2 = (player2Addons2 || []).reduce((sum, addon) => sum + addon.bonus_minutes, 0);
    const calculatedHours2_2 = Math.max(0, sessionHours2_2 - (penaltyMinutes2_2 / 60) + (addonMinutes2_2 / 60));
    
    console.log(`   Session hours: ${sessionHours2_2}h`);
    console.log(`   Penalty minutes: ${penaltyMinutes2_2} (${penaltyMinutes2_2/60}h)`);
    console.log(`   Addon minutes: ${addonMinutes2_2} (${addonMinutes2_2/60}h)`);
    console.log(`   Calculated total: ${calculatedHours2_2}h`);
    
    // Update player2 stats
    await supabase
      .from('players')
      .update({ 
        total_hours: calculatedHours2_2,
        updated_at: new Date().toISOString()
      })
      .eq('id', player2.id);
    
    console.log(`✅ ${player2.name} updated to ${calculatedHours2_2}h`);
    
    // Final state verification
    console.log('\n📊 FINAL STATE:');
    const { data: finalPlayers } = await supabase
      .from('players')
      .select('*')
      .order('total_hours', { ascending: false });
    
    finalPlayers.forEach(player => {
      console.log(`   ${player.name}: ${player.total_hours}h (${player.total_sessions} sessions)`);
    });
    
    // Show penalty history
    console.log('\n📋 PENALTY HISTORY:');
    const { data: allPenalties } = await supabase
      .from('penalties')
      .select('*')
      .order('date_applied', { ascending: false });
    
    allPenalties.forEach(penalty => {
      console.log(`   ${penalty.player_name}: -${penalty.penalty_minutes}min (${penalty.reason}) [${penalty.date_applied.split('T')[0]}]`);
    });
    
    // Show addon history
    console.log('\n📋 ADDON HISTORY:');
    const { data: allAddons } = await supabase
      .from('addons')
      .select('*')
      .order('date_applied', { ascending: false });
    
    if (allAddons.length > 0) {
      allAddons.forEach(addon => {
        console.log(`   ${addon.player_name}: +${addon.bonus_minutes}min (${addon.reason}) [${addon.date_applied.split('T')[0]}]`);
      });
    } else {
      console.log('   No addons found');
    }
    
    console.log('\n🎉 Simulation completed successfully!');
    console.log('\n📝 SUMMARY OF CHANGES:');
    console.log(`   ${player1.name}: ${player1.total_hours}h → ${calculatedHours1}h (added 5min penalty)`);
    console.log(`   ${player2.name}: ${player2.total_hours}h → ${calculatedHours2_2}h (added 10min bonus, then 3min penalty)`);
    
  } catch (error) {
    console.error('❌ Simulation error:', error);
  }
}

runSimulation();