const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://pewwxyyxcepvluowvaxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to generate random date in the past
function getRandomPastDate(daysBack) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - (Math.random() * daysBack * 24 * 60 * 60 * 1000));
  return pastDate;
}

// Helper function to generate session times
function generateSessionTimes(date) {
  const sessionStart = new Date(date);
  sessionStart.setHours(Math.floor(Math.random() * 12) + 10); // Between 10 AM and 10 PM
  sessionStart.setMinutes(Math.floor(Math.random() * 60));
  sessionStart.setSeconds(0);
  
  const durationHours = Math.random() * 8 + 1; // 1-9 hours
  const sessionEnd = new Date(sessionStart.getTime() + (durationHours * 60 * 60 * 1000));
  
  return {
    seatIn: sessionStart,
    seatOut: sessionEnd,
    duration: durationHours
  };
}

async function addHistoricalSessions() {
  try {
    console.log('📅 Adding historical sessions...\n');
    
    // Get existing players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*');
    
    if (playersError) {
      console.error('❌ Error fetching players:', playersError);
      return;
    }
    
    console.log('👥 Found players:', players.map(p => p.name).join(', '));
    
    const sessionsToAdd = [];
    
    // Generate historical sessions for the last 30 days
    for (let day = 1; day <= 30; day++) {
      const sessionDate = getRandomPastDate(day);
      
      // Random number of players per day (2-5 players)
      const dailyPlayerCount = Math.floor(Math.random() * 4) + 2;
      const selectedPlayers = players
        .sort(() => 0.5 - Math.random())
        .slice(0, dailyPlayerCount);
      
      for (const player of selectedPlayers) {
        const sessionTimes = generateSessionTimes(sessionDate);
        
        const session = {
          player_id: player.id,
          player_name: player.name,
          date: sessionTimes.seatIn.toISOString().split('T')[0],
          date_string: sessionTimes.seatIn.toISOString().split('T')[0],
          seat_in_time: sessionTimes.seatIn.toISOString(),
          seat_out_time: sessionTimes.seatOut.toISOString(),
          duration: Math.round(sessionTimes.duration * 100) / 100, // Round to 2 decimals
          day_of_week: sessionTimes.seatIn.getDay(),
          week_number: Math.ceil(day / 7),
          month: sessionTimes.seatIn.getMonth() + 1,
          year: sessionTimes.seatIn.getFullYear()
        };
        
        sessionsToAdd.push(session);
      }
    }
    
    console.log(`🎯 Generated ${sessionsToAdd.length} historical sessions`);
    
    // Add sessions in batches
    const batchSize = 10;
    let addedCount = 0;
    
    for (let i = 0; i < sessionsToAdd.length; i += batchSize) {
      const batch = sessionsToAdd.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('sessions')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Error adding batch ${Math.floor(i/batchSize) + 1}:`, error);
        continue;
      }
      
      addedCount += data.length;
      console.log(`✅ Added batch ${Math.floor(i/batchSize) + 1}: ${data.length} sessions`);
    }
    
    console.log(`\n🎉 Successfully added ${addedCount} historical sessions!`);
    
    // Now recalculate all player stats to include these new sessions
    console.log('\n🔄 Recalculating player stats...');
    
    for (const player of players) {
      // Calculate sessions total
      const { data: playerSessions } = await supabase
        .from('sessions')
        .select('duration')
        .eq('player_id', player.id);
      
      const sessionHours = (playerSessions || []).reduce((sum, session) => sum + session.duration, 0);
      const totalSessions = playerSessions.length;
      
      // Calculate penalties and addons
      const { data: penalties } = await supabase
        .from('penalties')
        .select('penalty_minutes')
        .eq('player_id', player.id);
      
      const { data: addons } = await supabase
        .from('addons')
        .select('bonus_minutes')
        .eq('player_id', player.id);
      
      const penaltyHours = (penalties || []).reduce((sum, penalty) => sum + penalty.penalty_minutes, 0) / 60;
      const addonHours = (addons || []).reduce((sum, addon) => sum + addon.bonus_minutes, 0) / 60;
      
      const totalHours = Math.max(0, sessionHours - penaltyHours + addonHours);
      
      // Update player
      await supabase
        .from('players')
        .update({
          total_hours: totalHours,
          total_sessions: totalSessions,
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id);
      
      console.log(`✅ Updated ${player.name}: ${totalHours}h (${totalSessions} sessions)`);
    }
    
    // Final verification
    console.log('\n📊 FINAL SESSION COUNT:');
    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total sessions in database: ${count}`);
    
    console.log('\n🎯 Session History should now show all sessions in the UI!');
    
  } catch (error) {
    console.error('❌ Error adding historical sessions:', error);
  }
}

addHistoricalSessions();