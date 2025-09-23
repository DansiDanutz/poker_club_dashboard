const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://pewwxyyxcepvluowvaxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePromotionName() {
  console.log('🔄 Updating promotion name...\n');

  try {
    // Update RURO to EURO
    const { data, error } = await supabase
      .from('promotions')
      .update({ name: 'PLAY&WIN 40.000 EURO' })
      .eq('name', 'PLAY&WIN 40.000 RURO')
      .select();

    if (error) {
      console.error('❌ Error updating promotion:', error);
    } else if (data && data.length > 0) {
      console.log('✅ Successfully updated promotion name to EURO');
      console.log('Updated promotion:', data[0]);
    } else {
      console.log('⚠️ No promotion found with name "PLAY&WIN 40.000 RURO"');
    }

    // Show all promotions
    const { data: allPromotions } = await supabase
      .from('promotions')
      .select('id, name, start_date, end_date, active')
      .order('created_at', { ascending: false });

    console.log('\n📋 All promotions:');
    allPromotions?.forEach(p => {
      console.log(`  - ${p.name} (${p.start_date} to ${p.end_date})`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updatePromotionName();