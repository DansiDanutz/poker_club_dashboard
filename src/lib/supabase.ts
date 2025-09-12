import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database Types
export interface PlayerDB {
  id: number
  name: string
  email: string | null
  phone: string | null
  join_date: string
  total_hours: number
  total_sessions: number
  last_played: string | null
  last_session_duration: number
  created_at: string
  updated_at: string
}

export interface SessionDB {
  id: number
  player_id: number
  player_name: string
  date: string
  date_string: string
  seat_in_time: string
  seat_out_time: string
  duration: number
  day_of_week: number
  week_number: number
  month: number
  year: number
  created_at: string
  updated_at: string
}

export interface PromotionDB {
  id: number
  name: string
  start_date: string
  end_date: string
  active: boolean
  deleted: boolean
  created_at: string
  updated_at: string
}

export interface PenaltyDB {
  id: number
  player_id: number
  player_name: string
  penalty_minutes: number
  reason: string
  reason_type: string
  applied_by: string | null
  date_applied: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AddonDB {
  id: number
  player_id: number
  player_name: string
  bonus_minutes: number
  reason: string
  reason_type: string
  applied_by: string | null
  date_applied: string
  notes: string | null
  created_at: string
  updated_at: string
}

// Database Operations
export class DatabaseService {
  // Players operations
  static async getPlayers(): Promise<PlayerDB[]> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('total_hours', { ascending: false })

    if (error) {
      console.error('Error fetching players:', error)
      return []
    }

    return data || []
  }

  static async createPlayer(player: Omit<PlayerDB, 'id' | 'created_at' | 'updated_at'>): Promise<PlayerDB | null> {
    const { data, error } = await supabase
      .from('players')
      .insert([player])
      .select()
      .single()

    if (error) {
      console.error('Error creating player:', error)
      return null
    }

    return data
  }

  static async updatePlayer(id: number, updates: Partial<PlayerDB>): Promise<PlayerDB | null> {
    const { data, error } = await supabase
      .from('players')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating player:', error)
      return null
    }

    return data
  }

  static async deletePlayer(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting player:', error)
      return false
    }

    return true
  }

  // Sessions operations
  static async getSessions(): Promise<SessionDB[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return []
    }

    return data || []
  }

  static async getPlayerSessions(playerId: number): Promise<SessionDB[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching player sessions:', error)
      return []
    }

    return data || []
  }

  static async createSession(session: Omit<SessionDB, 'id' | 'created_at' | 'updated_at'>): Promise<SessionDB | null> {
    console.log('📡 Supabase createSession - Input data:', session)
    
    const { data, error } = await supabase
      .from('sessions')
      .insert([session])
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase createSession error:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    console.log('✅ Supabase createSession success:', data)
    return data
  }

  // Calculate player statistics
  static async calculatePlayerStats(playerId: number): Promise<{ totalHours: number; totalSessions: number }> {
    const { data, error } = await supabase
      .from('sessions')
      .select('duration')
      .eq('player_id', playerId)

    if (error) {
      console.error('Error calculating player stats:', error)
      return { totalHours: 0, totalSessions: 0 }
    }

    const sessions = data || []
    console.log(`🔍 DEBUG Player ${playerId}: Found ${sessions.length} sessions`)
    console.log(`🔍 DEBUG Sessions data:`, sessions)
    
    const sessionHours = sessions.reduce((sum, session) => {
      const duration = session.duration || 0
      console.log(`🔍 DEBUG Session duration: ${duration} (type: ${typeof duration})`)
      return sum + duration
    }, 0)
    const totalSessions = sessions.length

    console.log(`🔍 DEBUG Player ${playerId}: Session hours = ${sessionHours}`)

    // Subtract penalties and add bonuses
    const penaltyHours = await this.calculatePlayerPenalties(playerId)
    const addonHours = await this.calculatePlayerAddons(playerId)

    console.log(`🔍 DEBUG Player ${playerId}: Penalties = ${penaltyHours}h, Addons = ${addonHours}h`)

    const totalHours = Math.max(0, sessionHours - penaltyHours + addonHours) // Don't allow negative hours

    console.log(`🔍 DEBUG Player ${playerId}: Final total = ${totalHours}h`)

    return { totalHours, totalSessions }
  }

  // Recalculate stats for all players
  static async recalculateAllPlayerStats(): Promise<void> {
    try {
      console.log('🔄 Recalculating stats for all players...')
      const players = await this.getPlayers()
      console.log(`🔍 DEBUG: Found ${players.length} players to recalculate`)
      
      for (const player of players) {
        console.log(`🔍 DEBUG: Processing player ${player.id} (${player.name})`)
        const stats = await this.calculatePlayerStats(player.id)
        
        console.log(`🔍 DEBUG: Calculated stats for ${player.name}:`, stats)
        console.log(`🔍 DEBUG: Current DB values - Hours: ${player.total_hours}, Sessions: ${player.total_sessions}`)
        
        const updateResult = await this.updatePlayer(player.id, {
          total_hours: stats.totalHours,
          total_sessions: stats.totalSessions
        })
        
        console.log(`🔍 DEBUG: Update result:`, updateResult)
        console.log(`✅ Updated stats for ${player.name}: ${stats.totalHours}h, ${stats.totalSessions} sessions`)
      }
      
      console.log('🎉 All player stats recalculated successfully')
    } catch (error) {
      console.error('❌ Error recalculating player stats:', error)
      console.error('❌ Full error details:', error)
    }
  }

  // Promotions operations
  static async getPromotions(): Promise<PromotionDB[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching promotions:', error)
      return []
    }

    return data || []
  }

  static async createPromotion(promotion: Omit<PromotionDB, 'id' | 'created_at' | 'updated_at'>): Promise<PromotionDB | null> {
    const { data, error } = await supabase
      .from('promotions')
      .insert([promotion])
      .select()
      .single()

    if (error) {
      console.error('Error creating promotion:', error)
      return null
    }

    return data
  }

  // Penalties operations
  static async getPenalties(): Promise<PenaltyDB[]> {
    const { data, error } = await supabase
      .from('penalties')
      .select('*')
      .order('date_applied', { ascending: false })

    if (error) {
      console.error('Error fetching penalties:', error)
      return []
    }

    return data || []
  }

  static async getPlayerPenalties(playerId: number): Promise<PenaltyDB[]> {
    const { data, error } = await supabase
      .from('penalties')
      .select('*')
      .eq('player_id', playerId)
      .order('date_applied', { ascending: false })

    if (error) {
      console.error('Error fetching player penalties:', error)
      return []
    }

    return data || []
  }

  static async createPenalty(penalty: Omit<PenaltyDB, 'id' | 'created_at' | 'updated_at'>): Promise<PenaltyDB | null> {
    const { data, error } = await supabase
      .from('penalties')
      .insert([penalty])
      .select()
      .single()

    if (error) {
      console.error('Error creating penalty:', error)
      return null
    }

    return data
  }

  // Calculate total penalties for a player (in hours)
  static async calculatePlayerPenalties(playerId: number): Promise<number> {
    const { data, error } = await supabase
      .from('penalties')
      .select('penalty_minutes')
      .eq('player_id', playerId)

    if (error) {
      console.error('Error calculating player penalties:', error)
      return 0
    }

    const penalties = data || []
    const totalMinutes = penalties.reduce((sum, penalty) => sum + penalty.penalty_minutes, 0)
    return totalMinutes / 60 // Convert to hours
  }

  // Add-ons operations
  static async getAddons(): Promise<AddonDB[]> {
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .order('date_applied', { ascending: false })

    if (error) {
      console.error('Error fetching addons:', error)
      return []
    }

    return data || []
  }

  static async getPlayerAddons(playerId: number): Promise<AddonDB[]> {
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .eq('player_id', playerId)
      .order('date_applied', { ascending: false })

    if (error) {
      console.error('Error fetching player addons:', error)
      return []
    }

    return data || []
  }

  static async createAddon(addon: Omit<AddonDB, 'id' | 'created_at' | 'updated_at'>): Promise<AddonDB | null> {
    const { data, error } = await supabase
      .from('addons')
      .insert([addon])
      .select()
      .single()

    if (error) {
      console.error('Error creating addon:', error)
      return null
    }

    return data
  }

  // Calculate total addons for a player (in hours)
  static async calculatePlayerAddons(playerId: number): Promise<number> {
    const { data, error } = await supabase
      .from('addons')
      .select('bonus_minutes')
      .eq('player_id', playerId)

    if (error) {
      console.error('Error calculating player addons:', error)
      return 0
    }

    const addons = data || []
    const totalMinutes = addons.reduce((sum, addon) => sum + addon.bonus_minutes, 0)
    return totalMinutes / 60 // Convert to hours
  }

  // Real-time subscriptions
  static subscribeToPlayers(callback: (players: PlayerDB[]) => void) {
    return supabase
      .channel('players-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'players' },
        async () => {
          const players = await this.getPlayers()
          callback(players)
        }
      )
      .subscribe()
  }

  static subscribeToSessions(callback: (sessions: SessionDB[]) => void) {
    return supabase
      .channel('sessions-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sessions' },
        async () => {
          const sessions = await this.getSessions()
          callback(sessions)
        }
      )
      .subscribe()
  }
}