const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://pewwxyyxcepvluowvaxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPromotionSessions() {
  console.log('========================================');
  console.log('🎮 ADDING SESSION DATA FOR PROMOTIONS');
  console.log('========================================\n');

  try {
    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .order('total_hours', { ascending: false })
      .limit(20); // Top 20 players

    if (playersError) throw playersError;

    // Get the active promotion
    const { data: promotions, error: promosError } = await supabase
      .from('promotions')
      .select('*')
      .eq('name', 'PLAY&WIN 40.000 RURO')
      .single();

    if (promosError) {
      console.error('Could not find promotion:', promosError);
      return;
    }

    console.log(`📅 Promotion: ${promotions.name}`);
    console.log(`   Period: ${promotions.start_date} to ${promotions.end_date}\n`);

    // Generate sessions for the promotion period
    const sessionsToAdd = [];
    const startDate = new Date(promotions.start_date);
    const endDate = new Date(promotions.end_date);
    const today = new Date();

    // Only generate sessions up to today if promotion is ongoing
    const maxDate = endDate > today ? today : endDate;

    // For each top player, create some sessions within the promotion period
    for (const player of players) {
      // Random number of sessions (3-15) per player
      const numSessions = Math.floor(Math.random() * 13) + 3;

      for (let i = 0; i < numSessions; i++) {
        // Random date within promotion period (up to today)
        const sessionDate = new Date(
          startDate.getTime() +
          Math.random() * (Math.min(maxDate.getTime(), today.getTime()) - startDate.getTime())
        );

        // Random session duration (2-8 hours)
        const durationHours = 2 + Math.random() * 6;
        const durationMinutes = Math.floor(durationHours * 60);

        // Random start time (10am to 10pm)
        const startHour = 10 + Math.floor(Math.random() * 12);
        const startMinute = Math.floor(Math.random() * 60);

        const seatInTime = new Date(sessionDate);
        seatInTime.setHours(startHour, startMinute, 0, 0);

        const seatOutTime = new Date(seatInTime);
        seatOutTime.setMinutes(seatOutTime.getMinutes() + durationMinutes);

        const session = {
          player_id: player.id,
          player_name: player.name,
          date: sessionDate.toISOString(),
          date_string: sessionDate.toISOString().split('T')[0],
          seat_in_time: seatInTime.toISOString(),
          seat_out_time: seatOutTime.toISOString(),
          duration: parseFloat(durationHours.toFixed(2)),
          day_of_week: sessionDate.getDay(),
          week_number: getWeekNumber(sessionDate),
          month: sessionDate.getMonth() + 1,
          year: sessionDate.getFullYear()
        };

        sessionsToAdd.push(session);
      }
    }

    // Sort sessions by date
    sessionsToAdd.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(`📝 Generated ${sessionsToAdd.length} sessions for ${players.length} players\n`);

    // Add sessions in batches
    const batchSize = 50;
    let successCount = 0;

    for (let i = 0; i < sessionsToAdd.length; i += batchSize) {
      const batch = sessionsToAdd.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('sessions')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error adding batch:`, error);
      } else {
        successCount += data.length;
        console.log(`✅ Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sessionsToAdd.length / batchSize)}: ${data.length} sessions`);
      }
    }

    // Update player statistics
    console.log('\n🔄 Updating player statistics...');

    for (const player of players) {
      // Get all sessions for this player
      const { data: playerSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('duration')
        .eq('player_id', player.id);

      if (!sessionsError && playerSessions) {
        const totalHours = playerSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalSessions = playerSessions.length;

        // Update player stats
        await supabase
          .from('players')
          .update({
            total_hours: totalHours,
            total_sessions: totalSessions,
            last_played: sessionsToAdd
              .filter(s => s.player_id === player.id)
              .pop()?.date_string || player.last_played
          })
          .eq('id', player.id);

        console.log(`✅ Updated ${player.name}: ${totalHours.toFixed(1)}h, ${totalSessions} sessions`);
      }
    }

    console.log('\n========================================');
    console.log(`🎉 SUCCESS: Added ${successCount} sessions`);
    console.log('👉 Check the promotion page now to see participants!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Run the script
addPromotionSessions();