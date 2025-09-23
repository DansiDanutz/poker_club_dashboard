import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if environment variables are set
  const envStatus = {
    SUPABASE_URL_SET: !!supabaseUrl,
    SUPABASE_KEY_SET: !!supabaseKey,
    SUPABASE_URL_VALUE: supabaseUrl?.substring(0, 30) + '...',
    SUPABASE_KEY_LENGTH: supabaseKey?.length || 0,
  };

  // Try to connect to database
  let dbStatus = {
    connected: false,
    playerCount: 0,
    error: null as string | null,
  };

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { count, error } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true });

      if (error) {
        dbStatus.error = error.message;
      } else {
        dbStatus.connected = true;
        dbStatus.playerCount = count || 0;
      }
    } catch (err) {
      dbStatus.error = err instanceof Error ? err.message : 'Unknown error';
    }
  } else {
    dbStatus.error = 'Missing environment variables';
  }

  return NextResponse.json({
    status: dbStatus.connected ? 'healthy' : 'unhealthy',
    environment: envStatus,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}