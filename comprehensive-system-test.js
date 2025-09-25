const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runComprehensiveTest() {
  console.log('=== COMPREHENSIVE SYSTEM TEST ===\n');
  console.log('Testing Date:', new Date().toISOString());
  console.log('=' .repeat(50) + '\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Database Connectivity
  console.log('📡 Test 1: Database Connectivity');
  try {
    const { error } = await supabase.from('players').select('count').single();
    if (!error || error.code === 'PGRST116') { // PGRST116 is "no rows" which is fine
      console.log('   ✅ Database connection successful\n');
      testsPassed++;
    } else {
      console.log('   ❌ Database connection failed:', error.message, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ Database connection failed:', err.message, '\n');
    testsFailed++;
  }

  // Test 2: Check for Duplicate Names
  console.log('🔍 Test 2: Checking for Duplicate Player Names');
  try {
    const { data: players } = await supabase
      .from('players')
      .select('name')
      .order('name');

    const nameCount = {};
    let duplicatesFound = false;

    players?.forEach(player => {
      const normalizedName = player.name.toUpperCase().trim();
      nameCount[normalizedName] = (nameCount[normalizedName] || 0) + 1;
      if (nameCount[normalizedName] > 1) {
        duplicatesFound = true;
        console.log(`   ⚠️  Duplicate found: "${player.name}"`);
      }
    });

    if (!duplicatesFound) {
      console.log(`   ✅ No duplicates found among ${players?.length || 0} players\n`);
      testsPassed++;
    } else {
      console.log('   ❌ Duplicates exist in database\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ Error checking duplicates:', err.message, '\n');
    testsFailed++;
  }

  // Test 3: Test Duplicate Prevention (Case Variations)
  console.log('🚫 Test 3: Duplicate Prevention (Case Variations)');
  const testCases = [
    { name: 'CALIN LAZAR', expected: 'fail', description: 'Exact match' },
    { name: 'calin lazar', expected: 'fail', description: 'Lowercase variant' },
    { name: 'Calin Lazar', expected: 'fail', description: 'Mixed case variant' },
    { name: '  CALIN LAZAR  ', expected: 'fail', description: 'With spaces' }
  ];

  let preventionWorking = true;
  for (const testCase of testCases) {
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{
          name: testCase.name,
          join_date: new Date().toISOString().split('T')[0],
          total_hours: 0,
          total_sessions: 0
        }])
        .select()
        .single();

      if (error) {
        console.log(`   ✅ ${testCase.description}: Correctly prevented`);
      } else {
        console.log(`   ❌ ${testCase.description}: Should have been prevented!`);
        preventionWorking = false;
        // Clean up
        if (data?.id) {
          await supabase.from('players').delete().eq('id', data.id);
        }
      }
    } catch (err) {
      console.log(`   ✅ ${testCase.description}: Correctly prevented`);
    }
  }

  if (preventionWorking) {
    console.log('   ✅ All duplicate prevention tests passed\n');
    testsPassed++;
  } else {
    console.log('   ⚠️  Some duplicate prevention tests failed\n');
    testsFailed++;
  }

  // Test 4: Add New Unique Player
  console.log('➕ Test 4: Adding New Unique Player');
  const uniqueName = `TEST_USER_${Math.random().toString(36).substring(7).toUpperCase()}`;
  let testPlayerId = null;

  try {
    const { data, error } = await supabase
      .from('players')
      .insert([{
        name: uniqueName,
        email: 'test@example.com',
        phone: '555-TEST',
        join_date: new Date().toISOString().split('T')[0],
        total_hours: 0,
        total_sessions: 0
      }])
      .select()
      .single();

    if (!error && data) {
      console.log(`   ✅ Successfully added unique player: "${uniqueName}"`);
      testPlayerId = data.id;
      testsPassed++;
    } else {
      console.log(`   ❌ Failed to add unique player:`, error?.message);
      testsFailed++;
    }
  } catch (err) {
    console.log(`   ❌ Error adding unique player:`, err.message);
    testsFailed++;
  }

  // Test 5: Update Player (Should Work)
  if (testPlayerId) {
    console.log('\n📝 Test 5: Updating Player Data');
    try {
      const { error } = await supabase
        .from('players')
        .update({ total_hours: 5.5 })
        .eq('id', testPlayerId);

      if (!error) {
        console.log('   ✅ Player update successful');
        testsPassed++;
      } else {
        console.log('   ❌ Player update failed:', error.message);
        testsFailed++;
      }
    } catch (err) {
      console.log('   ❌ Error updating player:', err.message);
      testsFailed++;
    }
  }

  // Test 6: Delete Test Player
  if (testPlayerId) {
    console.log('\n🗑️  Test 6: Deleting Test Player');
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', testPlayerId);

      if (!error) {
        console.log('   ✅ Test player deleted successfully\n');
        testsPassed++;
      } else {
        console.log('   ❌ Failed to delete test player:', error.message, '\n');
        testsFailed++;
      }
    } catch (err) {
      console.log('   ❌ Error deleting test player:', err.message, '\n');
      testsFailed++;
    }
  }

  // Test 7: Verify Data Integrity
  console.log('✔️  Test 7: Data Integrity Check');
  try {
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .order('name');

    let integrityIssues = 0;

    players?.forEach(player => {
      // Check for required fields
      if (!player.name || player.name.trim() === '') {
        console.log(`   ⚠️  Player ID ${player.id} has empty name`);
        integrityIssues++;
      }
      if (player.total_hours < 0) {
        console.log(`   ⚠️  Player ID ${player.id} has negative hours`);
        integrityIssues++;
      }
      if (player.total_sessions < 0) {
        console.log(`   ⚠️  Player ID ${player.id} has negative sessions`);
        integrityIssues++;
      }
    });

    if (integrityIssues === 0) {
      console.log(`   ✅ All ${players?.length || 0} players have valid data\n`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Found ${integrityIssues} data integrity issues\n`);
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ Error checking data integrity:', err.message, '\n');
    testsFailed++;
  }

  // Final Summary
  console.log('=' .repeat(50));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`   Total Tests: ${testsPassed + testsFailed}`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  console.log('\n📋 SYSTEM STATUS:');
  if (testsFailed === 0) {
    console.log('   ✅ System is READY for production use');
    console.log('   ✅ Duplicate prevention is working correctly');
    console.log('   ✅ Database operations are functioning properly');
    console.log('   ✅ Data integrity is maintained');
  } else if (testsFailed <= 2) {
    console.log('   ⚠️  System is MOSTLY READY with minor issues');
    console.log('   - Review failed tests and apply fixes if needed');
    console.log('   - Consider applying database constraints manually');
  } else {
    console.log('   ❌ System needs attention before production use');
    console.log('   - Multiple tests failed');
    console.log('   - Review and fix issues before proceeding');
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('   1. Apply the unique constraint SQL in Supabase dashboard');
  console.log('   2. Test the application UI manually');
  console.log('   3. Monitor for any duplicate attempts in production');
  console.log('   4. Keep regular backups of player data');

  console.log('\n=== TEST COMPLETE ===\n');

  return testsFailed === 0;
}

// Run the test
runComprehensiveTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});