"use client"

import { useState, useEffect, useCallback } from 'react'
import { DatabaseService, PlayerDB, SessionDB, PromotionDB } from '../lib/supabase'
import { Player, Session, Promotion } from '../types'

// Types for offline queue
interface OfflineAction {
  id: string
  type: 'create_player' | 'delete_player' | 'create_session' | 'create_promotion'
  data: Record<string, unknown>
  timestamp: number
  retries: number
}

// Helper functions to convert between DB and App types
function dbPlayerToAppPlayer(dbPlayer: PlayerDB): Player {
  return {
    id: dbPlayer.id,
    name: dbPlayer.name,
    email: dbPlayer.email || '',
    phone: dbPlayer.phone || '',
    joinDate: dbPlayer.join_date,
    totalHours: dbPlayer.total_hours,
    sessions: [],
    dailyStats: {},
    promotionHistory: {},
    achievements: [],
    lastPlayed: dbPlayer.last_played,
    lastSessionDuration: dbPlayer.last_session_duration,
    totalSessions: dbPlayer.total_sessions
  }
}


function dbSessionToAppSession(dbSession: SessionDB): Session {
  return {
    id: dbSession.id,
    player_id: dbSession.player_id,
    player_name: dbSession.player_name,
    date: dbSession.date,
    date_string: dbSession.date_string,
    seat_in_time: dbSession.seat_in_time,
    seat_out_time: dbSession.seat_out_time,
    duration: dbSession.duration,
    day_of_week: dbSession.day_of_week,
    week_number: dbSession.week_number,
    month: dbSession.month,
    year: dbSession.year
  }
}

function appSessionToDbSession(appSession: Omit<Session, 'id'>): Omit<SessionDB, 'id' | 'created_at' | 'updated_at'> {
  return {
    player_id: appSession.player_id,
    player_name: appSession.player_name,
    date: appSession.date,
    date_string: appSession.date_string,
    seat_in_time: appSession.seat_in_time,
    seat_out_time: appSession.seat_out_time,
    duration: appSession.duration,
    day_of_week: appSession.day_of_week,
    week_number: appSession.week_number,
    month: appSession.month,
    year: appSession.year
  }
}

function dbPromotionToAppPromotion(dbPromotion: PromotionDB): Promotion {
  return {
    id: dbPromotion.id,
    name: dbPromotion.name,
    start_date: dbPromotion.start_date,
    end_date: dbPromotion.end_date,
    active: dbPromotion.active,
    deleted: dbPromotion.deleted,
    created_at: dbPromotion.created_at,
    leaderboardHistory: [],
    finalLeaderboard: null,
    totalHoursPlayed: 0,
    totalSessions: 0,
    uniquePlayers: 0
  }
}

export function useSyncDatabase() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<number>(0)

  // Process offline queue when connection is restored
  const processOfflineQueue = useCallback(async () => {
    if (!isOnline || offlineQueue.length === 0) return

    console.log(`🔄 Processing ${offlineQueue.length} offline actions`)
    
    const successfulActions: string[] = []
    
    for (const action of offlineQueue) {
      try {
        let success = false
        
        switch (action.type) {
          case 'create_player':
            const dbPlayer = await DatabaseService.createPlayer(action.data as Omit<PlayerDB, 'id' | 'created_at' | 'updated_at'>)
            success = !!dbPlayer
            break
          case 'delete_player':
            success = await DatabaseService.deletePlayer(action.data.id as number)
            break
          case 'create_session':
            const dbSession = await DatabaseService.createSession(action.data as Omit<SessionDB, 'id' | 'created_at' | 'updated_at'>)
            success = !!dbSession
            break
          case 'create_promotion':
            const dbPromotion = await DatabaseService.createPromotion(action.data as Omit<PromotionDB, 'id' | 'created_at' | 'updated_at'>)
            success = !!dbPromotion
            break
        }

        if (success) {
          successfulActions.push(action.id)
          console.log(`✅ Synced offline action: ${action.type}`)
        } else {
          throw new Error(`Failed to sync ${action.type}`)
        }
      } catch (error) {
        console.error(`❌ Failed to sync offline action ${action.type}:`, error)
        
        // Increase retry count
        action.retries += 1
        
        // Remove action if max retries reached
        if (action.retries >= 3) {
          successfulActions.push(action.id)
          console.warn(`⚠️ Removing action after ${action.retries} retries: ${action.type}`)
        }
      }
    }

    // Remove successful actions from queue
    if (successfulActions.length > 0) {
      setOfflineQueue(prev => prev.filter(action => !successfulActions.includes(action.id)))
      // Refresh data after sync
      await loadInitialData()
    }
  }, [isOnline, offlineQueue])

  // Check online status with SSR safety
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      console.log('Connection restored - processing offline queue')
      processOfflineQueue()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      console.log('Connection lost - entering offline mode')
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Safe navigator check with proper SSR guard
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      setIsOnline(navigator.onLine)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [processOfflineQueue])

  // Save to localStorage whenever data changes with improved SSR safety
  useEffect(() => {
    if (typeof window !== 'undefined' && players.length > 0) {
      try {
        localStorage.setItem('pokerClubPlayers', JSON.stringify(players))
        localStorage.setItem('lastSyncTime', Date.now().toString())
      } catch (error) {
        console.warn('Failed to save players to localStorage:', error)
      }
    }
  }, [players])

  useEffect(() => {
    if (typeof window !== 'undefined' && sessions.length > 0) {
      try {
        localStorage.setItem('pokerClubHistory', JSON.stringify(sessions))
      } catch (error) {
        console.warn('Failed to save sessions to localStorage:', error)
      }
    }
  }, [sessions])

  useEffect(() => {
    if (typeof window !== 'undefined' && promotions.length > 0) {
      try {
        localStorage.setItem('pokerClubPromotions', JSON.stringify(promotions))
      } catch (error) {
        console.warn('Failed to save promotions to localStorage:', error)
      }
    }
  }, [promotions])

  // Save offline queue to localStorage with improved error handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue))
      } catch (error) {
        console.warn('Failed to save offline queue to localStorage:', error)
      }
    }
  }, [offlineQueue])

  // Load from localStorage with enhanced error handling
  const loadFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return { players: [], sessions: [], promotions: [], queue: [] }

    try {
      const storedPlayers = localStorage.getItem('pokerClubPlayers')
      const storedSessions = localStorage.getItem('pokerClubHistory')
      const storedPromotions = localStorage.getItem('pokerClubPromotions')
      const storedQueue = localStorage.getItem('offlineQueue')

      return {
        players: storedPlayers ? JSON.parse(storedPlayers) : [],
        sessions: storedSessions ? JSON.parse(storedSessions) : [],
        promotions: storedPromotions ? JSON.parse(storedPromotions) : [],
        queue: storedQueue ? JSON.parse(storedQueue) : []
      }
    } catch (error) {
      console.warn('Failed to load data from localStorage:', error)
      return { players: [], sessions: [], promotions: [], queue: [] }
    }
  }, [])

  // Load initial data with sync strategy
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Always load from localStorage first (instant UI)
      const localData = loadFromLocalStorage()
      setPlayers(localData.players)
      setSessions(localData.sessions)
      setPromotions(localData.promotions)
      setOfflineQueue(localData.queue)

      // Try to sync with database if online
      if (isOnline) {
        try {
          const [dbPlayers, dbSessions, dbPromotions] = await Promise.all([
            DatabaseService.getPlayers(),
            DatabaseService.getSessions(),
            DatabaseService.getPromotions()
          ])

          // Convert DB types to App types
          const appPlayers = dbPlayers.map(dbPlayerToAppPlayer)
          const appSessions = dbSessions.map(dbSessionToAppSession)
          const appPromotions = dbPromotions.map(dbPromotionToAppPromotion)

          // Add sessions to players
          appPlayers.forEach(player => {
            player.sessions = appSessions.filter(session => session.player_id === player.id)
          })

          // Update state with fresh database data
          setPlayers(appPlayers)
          setSessions(appSessions)
          setPromotions(appPromotions)
          setLastSyncTime(Date.now())

          console.log('✅ Successfully synced with database')
        } catch (dbError) {
          console.warn('⚠️ Database unavailable, using localStorage data:', dbError)
          setIsOnline(false)
        }
      } else {
        console.log('📱 Offline mode - using localStorage data')
      }
    } catch (err) {
      console.error('❌ Error loading data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [isOnline, loadFromLocalStorage])


  // Add action to offline queue
  const addToOfflineQueue = useCallback((type: OfflineAction['type'], data: any) => {
    const action: OfflineAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    }
    
    setOfflineQueue(prev => [...prev, action])
    console.log(`📝 Added to offline queue: ${type}`)
  }, [])

  // Set up real-time subscriptions (only when online)
  useEffect(() => {
    if (!isOnline) return

    const playersSubscription = DatabaseService.subscribeToPlayers((dbPlayers) => {
      const appPlayers = dbPlayers.map(dbPlayerToAppPlayer)
      setPlayers(appPlayers)
      console.log('🔄 Real-time update: players')
    })

    const sessionsSubscription = DatabaseService.subscribeToSessions((dbSessions) => {
      const appSessions = dbSessions.map(dbSessionToAppSession)
      setSessions(appSessions)
      console.log('🔄 Real-time update: sessions', `Received ${dbSessions.length} sessions`)
      console.log('📋 Sessions data:', appSessions)
    })

    return () => {
      playersSubscription.unsubscribe()
      sessionsSubscription.unsubscribe()
    }
  }, [isOnline])

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Enhanced add player with offline support
  const addPlayer = async (playerData: { name: string; email: string; phone: string }) => {
    try {
      const newPlayerData = {
        name: playerData.name.trim(),
        email: playerData.email.trim() || null,
        phone: playerData.phone.trim() || null,
        join_date: new Date().toISOString().split('T')[0],
        total_hours: 0,
        total_sessions: 0,
        last_played: null,
        last_session_duration: 0
      }

      if (isOnline) {
        // Try database first
        try {
          const dbPlayer = await DatabaseService.createPlayer(newPlayerData)
          if (dbPlayer) {
            const appPlayer = dbPlayerToAppPlayer(dbPlayer)
            setPlayers(prev => [...prev, appPlayer])
            console.log('✅ Player added to database')
            return appPlayer
          }
        } catch (dbError) {
          console.warn('⚠️ Database error, falling back to offline mode:', dbError)
          setIsOnline(false)
        }
      }

      // Offline mode or database failed
      const offlinePlayer: Player = {
        id: Date.now(), // Temporary ID for offline
        name: newPlayerData.name,
        email: newPlayerData.email || '',
        phone: newPlayerData.phone || '',
        joinDate: newPlayerData.join_date,
        totalHours: newPlayerData.total_hours,
        totalSessions: newPlayerData.total_sessions,
        lastPlayed: newPlayerData.last_played,
        lastSessionDuration: newPlayerData.last_session_duration,
        sessions: [],
        dailyStats: {},
        promotionHistory: {},
        achievements: []
      }

      setPlayers(prev => [...prev, offlinePlayer])
      addToOfflineQueue('create_player', newPlayerData)
      console.log('📱 Player added offline, queued for sync')
      return offlinePlayer

    } catch (err) {
      console.error('❌ Error adding player:', err)
      setError('Failed to add player')
      return null
    }
  }

  // Enhanced delete player with offline support
  const deletePlayer = async (playerId: number) => {
    try {
      if (isOnline) {
        try {
          const success = await DatabaseService.deletePlayer(playerId)
          if (success) {
            setPlayers(prev => prev.filter(p => p.id !== playerId))
            setSessions(prev => prev.filter(s => s.player_id !== playerId))
            console.log('✅ Player deleted from database')
            return true
          }
        } catch (dbError) {
          console.warn('⚠️ Database error, falling back to offline mode:', dbError)
          setIsOnline(false)
        }
      }

      // Offline mode or database failed
      setPlayers(prev => prev.filter(p => p.id !== playerId))
      setSessions(prev => prev.filter(s => s.player_id !== playerId))
      addToOfflineQueue('delete_player', { id: playerId })
      console.log('📱 Player deleted offline, queued for sync')
      return true

    } catch (err) {
      console.error('❌ Error deleting player:', err)
      setError('Failed to delete player')
      return false
    }
  }

  // Enhanced add session with offline support
  const addSession = async (sessionData: Omit<Session, 'id'>) => {
    try {
      console.log('🔄 Starting addSession with data:', sessionData)
      const dbSessionData = appSessionToDbSession(sessionData)
      console.log('🔄 Converted to DB format:', dbSessionData)

      if (isOnline) {
        console.log('🌐 Online mode - attempting database save')
        try {
          const dbSession = await DatabaseService.createSession(dbSessionData)
          console.log('📝 Database createSession result:', dbSession)
          if (dbSession) {
            const appSession = dbSessionToAppSession(dbSession)
            console.log('✅ Session successfully saved to database:', appSession)
            
            // Update player stats with recalculated values
            const stats = await DatabaseService.calculatePlayerStats(sessionData.player_id)
            console.log(`📊 Calculated stats for player ${sessionData.player_id}:`, stats)
            
            const updatedPlayer = await DatabaseService.updatePlayer(sessionData.player_id, {
              total_hours: stats.totalHours,
              total_sessions: stats.totalSessions,
              last_played: sessionData.date_string,
              last_session_duration: sessionData.duration
            })
            console.log('👤 Updated player in database:', updatedPlayer)
            
            // Force refresh sessions to ensure UI updates immediately
            setSessions(prev => [appSession, ...prev])
            console.log('🔄 Added session to local state for immediate UI update')
            
            // Also trigger a manual refresh of all sessions as backup
            setTimeout(async () => {
              try {
                const allSessions = await DatabaseService.getSessions()
                const appSessions = allSessions.map(dbSessionToAppSession)
                setSessions(appSessions)
                console.log('🔄 Manual session refresh completed as backup')
              } catch (error) {
                console.warn('⚠️ Manual session refresh failed:', error)
              }
            }, 1000) // Wait 1 second to allow database propagation
            
            console.log('✅ Session added to database and player stats updated')
            return appSession
          } else {
            console.error('❌ DatabaseService.createSession returned null/undefined')
          }
        } catch (dbError) {
          console.error('❌ Database error details:', dbError)
          console.warn('⚠️ Database error, falling back to offline mode:', dbError)
          setIsOnline(false)
        }
      } else {
        console.log('📱 Offline mode detected')
      }

      // Offline mode or database failed
      const offlineSession: Session = {
        id: Date.now(), // Temporary ID for offline
        ...sessionData
      }

      setSessions(prev => [...prev, offlineSession])
      
      // Update player stats locally
      setPlayers(prev => prev.map(player => {
        if (player.id === sessionData.player_id) {
          return {
            ...player,
            totalHours: player.totalHours + sessionData.duration,
            totalSessions: (player.totalSessions || 0) + 1,
            lastPlayed: sessionData.date_string,
            lastSessionDuration: sessionData.duration,
            sessions: [...player.sessions, offlineSession]
          }
        }
        return player
      }))

      addToOfflineQueue('create_session', dbSessionData)
      console.log('📱 Session added offline, queued for sync')
      return offlineSession

    } catch (err) {
      console.error('❌ Error adding session:', err)
      setError('Failed to add session')
      return null
    }
  }

  // Enhanced add promotion with offline support
  const addPromotion = async (promotionData: { name: string; startDate: string; endDate: string }) => {
    try {
      const dbPromotionData = {
        name: promotionData.name,
        start_date: promotionData.startDate,
        end_date: promotionData.endDate,
        active: true,
        deleted: false
      }

      if (isOnline) {
        try {
          const dbPromotion = await DatabaseService.createPromotion(dbPromotionData)
          if (dbPromotion) {
            const appPromotion = dbPromotionToAppPromotion(dbPromotion)
            setPromotions(prev => [...prev, appPromotion])
            console.log('✅ Promotion added to database')
            return appPromotion
          }
        } catch (dbError) {
          console.warn('⚠️ Database error, falling back to offline mode:', dbError)
          setIsOnline(false)
        }
      }

      // Offline mode or database failed
      const offlinePromotion: Promotion = {
        id: Date.now(), // Temporary ID for offline
        name: promotionData.name,
        start_date: promotionData.startDate,
        end_date: promotionData.endDate,
        active: true,
        deleted: false,
        created_at: new Date().toISOString(),
        leaderboardHistory: [],
        finalLeaderboard: null,
        totalHoursPlayed: 0,
        totalSessions: 0,
        uniquePlayers: 0
      }

      setPromotions(prev => [...prev, offlinePromotion])
      addToOfflineQueue('create_promotion', dbPromotionData)
      console.log('📱 Promotion added offline, queued for sync')
      return offlinePromotion

    } catch (err) {
      console.error('❌ Error adding promotion:', err)
      setError('Failed to add promotion')
      return null
    }
  }

  // Recalculate all player stats (one-time fix for existing data)
  const recalculateAllPlayerStats = useCallback(async () => {
    if (isOnline) {
      try {
        await DatabaseService.recalculateAllPlayerStats()
        console.log('✅ Successfully recalculated all player stats')
      } catch (error) {
        console.error('❌ Failed to recalculate player stats:', error)
        setError('Failed to recalculate player stats')
      }
    }
  }, [isOnline])

  return {
    players,
    sessions,
    promotions,
    loading,
    error,
    isOnline,
    offlineQueue: offlineQueue.length,
    lastSyncTime,
    addPlayer,
    deletePlayer,
    addSession,
    addPromotion,
    refreshData: loadInitialData,
    processOfflineQueue,
    recalculateAllPlayerStats
  }
}