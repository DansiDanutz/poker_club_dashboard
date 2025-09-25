const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyUniqueConstraint() {
  try {
    console.log('=== APPLYING UNIQUE CONSTRAINT TO PREVENT DUPLICATES ===\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-unique-constraint.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { query: sqlContent });

    if (error) {
      // Try executing via direct SQL if RPC doesn't work
      console.log('Note: Direct SQL execution might require admin access.');
      console.log('Please run the following SQL in your Supabase SQL Editor:\n');
      console.log('--- SQL START ---');
      console.log(sqlContent);
      console.log('--- SQL END ---\n');

      console.log('Alternatively, you can go to:');
      console.log('1. Your Supabase Dashboard');
      console.log('2. SQL Editor');
      console.log('3. Paste and run the SQL from add-unique-constraint.sql\n');
    } else {
      console.log('✅ Successfully applied unique constraint!');
      console.log('Players table now prevents duplicate names (case-insensitive).\n');
    }

  } catch (err) {
    console.error('Error:', err);
    console.log('\nPlease manually apply the constraint using the Supabase SQL Editor.');
  }
}

applyUniqueConstraint();