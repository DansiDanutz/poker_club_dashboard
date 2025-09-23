const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://pewwxyyxcepvluowvaxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs';

const supabase = createClient(supabaseUrl, supabaseKey);

// Realistic Romanian and international poker player names
const playerNames = [
  // Romanian names
  'Alexandru Popescu', 'Mihai Ionescu', 'Andrei Radu', 'Cristian Dumitru', 'Stefan Gheorghe',
  'Bogdan Marin', 'Florin Stoica', 'Adrian Constantin', 'Marius Popa', 'Daniel Stanciu',
  'Ionut Dumitrescu', 'Catalin Neagu', 'Razvan Matei', 'Vlad Serban', 'Gabriel Nistor',
  'Lucian Barbu', 'Cosmin Tudor', 'Dragos Moldovan', 'Sorin Badea', 'Valentin Ciobanu',

  // Female players
  'Elena Vasile', 'Ana Maria Pop', 'Diana Rus', 'Andreea Lazar', 'Monica Ungureanu',
  'Alexandra Dobre', 'Cristina Pavel', 'Ioana Munteanu', 'Simona Oprea', 'Raluca Dragomir',

  // International players
  'Michael Johnson', 'David Williams', 'James Chen', 'Robert Miller', 'Thomas Anderson',
  'Jennifer Smith', 'Maria Garcia', 'Luis Rodriguez', 'Antonio Silva', 'Marco Rossi',
  'Pierre Dubois', 'Hans Mueller', 'Viktor Petrov', 'Dimitri Volkov', 'Nikola Jovanovic',

  // More Romanian players
  'Radu Albu', 'Octavian Tanase', 'Silviu Marinescu', 'Costel Radulescu', 'Traian Enache',
  'Liviu Preda', 'Cornel Stan', 'Emil Bucur', 'Ovidiu Lungu', 'Petru Miron'
];

// Phone number prefixes for Romania
const phonePrefix = ['0721', '0722', '0723', '0724', '0725', '0726', '0731', '0732', '0733', '0740', '0741', '0742'];

// Email domains
const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'hotmail.com'];

function generatePhoneNumber() {
  const prefix = phonePrefix[Math.floor(Math.random() * phonePrefix.length)];
  const number = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}${number}`;
}

function generateEmail(name) {
  const nameParts = name.toLowerCase().split(' ');
  const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  const random = Math.floor(Math.random() * 100);

  // Different email formats
  const formats = [
    `${nameParts[0]}.${nameParts[1]}${random}@${domain}`,
    `${nameParts[0]}${nameParts[1].charAt(0)}${random}@${domain}`,
    `${nameParts[0]}_${nameParts[1]}@${domain}`,
    `${nameParts.join('')}${random}@${domain}`,
    `${nameParts[0]}${random}@${domain}`
  ];

  return formats[Math.floor(Math.random() * formats.length)];
}

function generateJoinDate() {
  // Random date between 2020 and today
  const start = new Date('2020-01-01');
  const end = new Date();
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString().split('T')[0];
}

function generatePlayerStats() {
  // Generate realistic play hours (0 to 500 hours)
  const totalHours = Math.floor(Math.random() * 500 * 100) / 100;

  // Sessions based on hours (roughly 3-5 hours per session)
  const avgSessionHours = 3 + Math.random() * 2;
  const totalSessions = Math.max(1, Math.floor(totalHours / avgSessionHours));

  // Last played date (recent players have more hours)
  const daysAgo = totalHours > 100 ? Math.floor(Math.random() * 7) : Math.floor(Math.random() * 30);
  const lastPlayed = new Date();
  lastPlayed.setDate(lastPlayed.getDate() - daysAgo);

  // Last session duration
  const lastSessionDuration = Math.floor((2 + Math.random() * 6) * 100) / 100;

  return {
    totalHours,
    totalSessions,
    lastPlayed: lastPlayed.toISOString().split('T')[0],
    lastSessionDuration
  };
}

async function populatePlayers() {
  console.log('========================================');
  console.log('🎰 POPULATING POKER PLAYERS DATABASE');
  console.log('========================================\n');

  const playersToAdd = [];

  // Generate player data
  for (const name of playerNames) {
    const stats = generatePlayerStats();
    const player = {
      name: name,
      email: Math.random() > 0.3 ? generateEmail(name) : null, // 70% have emails
      phone: Math.random() > 0.2 ? generatePhoneNumber() : null, // 80% have phones
      join_date: generateJoinDate(),
      total_hours: stats.totalHours,
      total_sessions: stats.totalSessions,
      last_played: stats.totalHours > 0 ? stats.lastPlayed : null,
      last_session_duration: stats.lastSessionDuration
    };
    playersToAdd.push(player);
  }

  // Sort by total hours for display
  playersToAdd.sort((a, b) => b.total_hours - a.total_hours);

  console.log(`📋 Prepared ${playersToAdd.length} players to add\n`);

  // Add players to database in batches
  const batchSize = 10;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < playersToAdd.length; i += batchSize) {
    const batch = playersToAdd.slice(i, i + batchSize);

    console.log(`Adding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(playersToAdd.length / batchSize)}...`);

    const { data, error } = await supabase
      .from('players')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Error adding batch:`, error);
      errorCount += batch.length;
    } else {
      successCount += data.length;
      console.log(`✅ Successfully added ${data.length} players`);
    }
  }

  console.log('\n========================================');
  console.log('📊 POPULATION RESULTS:');
  console.log('========================================');
  console.log(`✅ Successfully added: ${successCount} players`);
  if (errorCount > 0) {
    console.log(`❌ Failed to add: ${errorCount} players`);
  }

  // Show top players
  console.log('\n🏆 TOP 10 PLAYERS BY HOURS:');
  console.log('----------------------------');
  const topPlayers = playersToAdd.slice(0, 10);
  topPlayers.forEach((player, index) => {
    console.log(`${index + 1}. ${player.name}: ${player.total_hours}h (${player.total_sessions} sessions)`);
  });

  // Get final count
  const { count } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true });

  console.log('\n========================================');
  console.log(`🎉 TOTAL PLAYERS IN DATABASE: ${count}`);
  console.log('========================================\n');
}

// Run the population script
populatePlayers().catch(console.error);