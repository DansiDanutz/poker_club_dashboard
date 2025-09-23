import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Get data from Supabase instead of relying on localStorage
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all required data
    const [playersResult, sessionsResult, promotionsResult, penaltiesResult, addonsResult] = await Promise.all([
      supabase.from('players').select('*').order('total_hours', { ascending: false }),
      supabase.from('sessions').select('*').order('date', { ascending: false }),
      supabase.from('promotions').select('*').eq('active', true),
      supabase.from('penalties').select('*'),
      supabase.from('addons').select('*')
    ]);

    // Return data in the format the TV display expects
    return NextResponse.json({
      players: playersResult.data || [],
      sessions: sessionsResult.data || [],
      promotions: promotionsResult.data || [],
      penalties: penaltiesResult.data || [],
      addons: addonsResult.data || [],
      clubSettings: {
        clubName: 'POKER CLUB'
      },
      prizes: 'Grand Prize Awaits!'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching TV data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}