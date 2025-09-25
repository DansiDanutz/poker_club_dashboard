"use client"

import { useState, useEffect } from 'react'
import { DatabaseService, PlayerDB, SessionDB, PromotionDB } from '../lib/supabase'
import { Player, Session, Promotion } from '../types'

// Helper functions to convert between DB and App types
function dbPlayerToAppPlayer(dbPlayer: PlayerDB): Player {
  return {
    id: dbPlayer.id,
    name: dbPlayer.name,
    email: dbPlayer.email || '',
    phone: dbPlayer.phone || '',
    joinDate: dbPlayer.join_date,
    totalHours: dbPlayer.total_hours,
    sessions: [], // Will be loaded separately
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


export function useDatabase() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const playersSubscription = DatabaseService.subscribeToPlayers((dbPlayers) => {
      const appPlayers = dbPlayers.map(dbPlayerToAppPlayer)
      setPlayers(appPlayers)
    })

    const sessionsSubscription = DatabaseService.subscribeToSessions((dbSessions) => {
      const appSessions = dbSessions.map(dbSessionToAppSession)
      setSessions(appSessions)
    })

    return () => {
      playersSubscription.unsubscribe()
      sessionsSubscription.unsubscribe()
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

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

      setPlayers(appPlayers)
      setSessions(appSessions)
      setPromotions(appPromotions)
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Failed to load data from database')
    } finally {
      setLoading(false)
    }
  }

  const addPlayer = async (playerData: { name: string; email: string; phone: string }) => {
    try {
      const trimmedName = playerData.name.trim()

      // Check if name is empty
      if (!trimmedName) {
        throw new Error('Player name cannot be empty')
      }

      // Check for duplicate in current state (case-insensitive)
      const existingPlayer = players.find(
        p => p.name.toLowerCase() === trimmedName.toLowerCase()
      )

      if (existingPlayer) {
        throw new Error(`Player "${trimmedName}" already exists. Each player must have a unique name.`)
      }

      const newPlayerData = {
        name: trimmedName,
        email: playerData.email.trim() || null,
        phone: playerData.phone.trim() || null,
        join_date: new Date().toISOString().split('T')[0],
        total_hours: 0,
        total_sessions: 0,
        last_played: null,
        last_session_duration: 0
      }

      const dbPlayer = await DatabaseService.createPlayer(newPlayerData)

      if (dbPlayer) {
        const appPlayer = dbPlayerToAppPlayer(dbPlayer)
        setPlayers(prev => [...prev, appPlayer])
        return appPlayer
      }

      throw new Error('Failed to create player')
    } catch (err: any) {
      console.error('Error adding player:', err)

      // Set user-friendly error message
      if (err.message?.includes('already exists')) {
        setError(err.message)
      } else if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        setError(`Player "${playerData.name.trim()}" already exists. Each player must have a unique name.`)
      } else {
        setError(err.message || 'Failed to add player')
      }

      // Throw the error so the calling component can handle it
      throw err
    }
  }

  const deletePlayer = async (playerId: number) => {
    try {
      const success = await DatabaseService.deletePlayer(playerId)
      
      if (success) {
        setPlayers(prev => prev.filter(p => p.id !== playerId))
        setSessions(prev => prev.filter(s => s.player_id !== playerId))
        return true
      }
      
      throw new Error('Failed to delete player')
    } catch (err) {
      console.error('Error deleting player:', err)
      setError('Failed to delete player')
      return false
    }
  }

  const addSession = async (sessionData: Omit<Session, 'id'>) => {
    try {
      const dbSessionData = appSessionToDbSession(sessionData)
      const dbSession = await DatabaseService.createSession(dbSessionData)
      
      if (dbSession) {
        const appSession = dbSessionToAppSession(dbSession)
        
        // Update player stats
        await DatabaseService.updatePlayer(sessionData.player_id, {
          total_hours: 0, // This will be recalculated
          total_sessions: 0, // This will be recalculated
          last_played: sessionData.date_string,
          last_session_duration: sessionData.duration
        })
        
        // Refresh data to get updated stats
        await loadInitialData()
        
        return appSession
      }
      
      throw new Error('Failed to create session')
    } catch (err) {
      console.error('Error adding session:', err)
      setError('Failed to add session')
      return null
    }
  }

  const addPromotion = async (promotionData: { name: string; startDate: string; endDate: string }) => {
    try {
      const dbPromotionData = {
        name: promotionData.name,
        start_date: promotionData.startDate,
        end_date: promotionData.endDate,
        active: true,
        deleted: false
      }

      const dbPromotion = await DatabaseService.createPromotion(dbPromotionData)
      
      if (dbPromotion) {
        const appPromotion = dbPromotionToAppPromotion(dbPromotion)
        setPromotions(prev => [...prev, appPromotion])
        return appPromotion
      }
      
      throw new Error('Failed to create promotion')
    } catch (err) {
      console.error('Error adding promotion:', err)
      setError('Failed to add promotion')
      return null
    }
  }

  return {
    players,
    sessions,
    promotions,
    loading,
    error,
    addPlayer,
    deletePlayer,
    addSession,
    addPromotion,
    refreshData: loadInitialData
  }
}