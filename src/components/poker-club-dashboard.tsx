"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '../hooks/use-mobile';
import { 
  Search, 
  User, 
  Clock, 
  Trophy, 
  Calendar, 
  Settings, 
  Users, 
  DollarSign, 
  X, 
  Plus, 
  Edit2, 
  Trash2, 
  Menu, 
  Home, 
  History, 
  Award, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Sparkles,
  Minus,
  ChevronUp,
  ChevronDown,
  Loader2,
  Tv,
  ExternalLink,
  Copy
} from 'lucide-react';

// Import shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Separator } from "./ui/separator";
import { AddPlayerDialog } from "./add-player-dialog";
import { AddPromotionDialog } from "./add-promotion-dialog";
import { ThemeToggle } from "./theme-toggle";
import { 
  PlayerTableErrorBoundary, 
  ActiveTablesErrorBoundary, 
  PromotionsErrorBoundary, 
  HistoryErrorBoundary, 
  SettingsErrorBoundary, 
  TVDisplayErrorBoundary 
} from "./section-error-boundary";
import { 
  PlayersDataErrorBoundary, 
  SessionsDataErrorBoundary, 
  PromotionsDataErrorBoundary 
} from "./data-error-boundary";
import { 
  AddPlayerFormErrorBoundary, 
  AddPromotionFormErrorBoundary, 
  PenaltyFormErrorBoundary, 
  AddonFormErrorBoundary 
} from "./form-error-boundary";
import { useSyncDatabase } from "../hooks/use-sync-database";
import { Player, Session, Promotion, ActiveTable, ClubSettings } from "../types";
import { DatabaseService } from "../lib/supabase";
import { sanitizeObject, sanitizeTVContent } from "../lib/utils";
import { BackupService, BackupData } from "../lib/backup-service";

const PokerClubDashboard = () => {
  const router = useRouter();
  const isMobile = useIsMobile();
  
  // Database integration with proper error handling
  const {
    players: dbPlayers,
    sessions: dbSessions,
    promotions: dbPromotions,
    loading: dbLoading,
    error: dbError,
    isOnline,
    offlineQueue,
    lastSyncTime,
    addPlayer: dbAddPlayer,
    deletePlayer: dbDeletePlayer,
    addSession: dbAddSession,
    addPromotion: dbAddPromotion,
    processOfflineQueue,
    recalculateAllPlayerStats,
    refreshData,
  } = useSyncDatabase();

  // Fetch penalty and addon history
  useEffect(() => {
    const fetchPenaltyAddonHistory = async () => {
      if (!isOnline) return;
      
      try {
        const [penaltyData, addonData] = await Promise.all([
          DatabaseService.getPenalties(),
          DatabaseService.getAddons()
        ]);
        
        // Sanitize data to prevent JSON encoding issues
        const sanitizedPenalties = penaltyData.map(p => 
          sanitizeObject(p, ['reason', 'notes', 'applied_by'])
        );
        
        const sanitizedAddons = addonData.map(a => 
          sanitizeObject(a, ['reason', 'notes', 'applied_by'])
        );
        
        setPenalties(sanitizedPenalties);
        setAddons(sanitizedAddons);
      } catch (error) {
        console.error('Error fetching penalty/addon history:', error);
        // Set empty arrays as fallback to prevent undefined errors
        setPenalties([]);
        setAddons([]);
      }
    };

    fetchPenaltyAddonHistory();
  }, [isOnline, dbPlayers]); // Refresh when players change (after penalties/addons are applied)

  // Load data from localStorage or use defaults (fallback)
  const loadFromStorage = (key: string, defaultValue: unknown): unknown => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from storage:`, error);
      return defaultValue;
    }
  };

  // Core state management
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('tables');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activeTables, setActiveTables] = useState<ActiveTable[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmEndSession, setConfirmEndSession] = useState<{tableId: number, playerName: string} | null>(null);
  const [isProcessingEndSession, setIsProcessingEndSession] = useState(false);
  const [isProcessingPenalty, setIsProcessingPenalty] = useState(false);
  const [isProcessingAddon, setIsProcessingAddon] = useState(false);
  
  // Session history filters
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyPlayerFilter, setHistoryPlayerFilter] = useState('');
  const [historyActivityFilter, setHistoryActivityFilter] = useState('all');
  
  // Sorting state
  const [sortField, setSortField] = useState<'date' | 'player' | 'type' | 'value'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Club settings - Initialize with default, load from storage in useEffect
  const [clubSettings, setClubSettings] = useState<ClubSettings>({
    clubName: 'Poker Club',
    location: '',
    stakes: '',
    tableLimit: '',
    currency: 'USD',
    timezone: 'America/New_York'
  });

  // Penalty form state
  const [penaltyForm, setPenaltyForm] = useState({
    playerId: '',
    playerName: '',
    penaltyMinutes: '',
    reasonType: '',
    reason: '',
    notes: '',
    appliedBy: ''
  });

  // Add-on form state
  const [addonForm, setAddonForm] = useState({
    playerId: '',
    playerName: '',
    bonusMinutes: '',
    reasonType: '',
    reason: '',
    notes: '',
    appliedBy: ''
  });

  // Penalty and addon history state
  const [penalties, setPenalties] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);

  // Backup state
  const [availableBackups, setAvailableBackups] = useState<BackupData[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStats, setBackupStats] = useState<any>(null);

  // TV Display state
  const [selectedTvPromotion, setSelectedTvPromotion] = useState<string>('');
  const [tvRules, setTvRules] = useState<string>('');
  const [tvPrices, setTvPrices] = useState<string>('');
  const [editingTvCard, setEditingTvCard] = useState<'rules' | 'prices' | null>(null);

  // Helper function to determine promotion status
  const getPromotionStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'complete';
    return 'active';
  };


  // Set mounted state and load club settings and active tables from localStorage on mount (client-side only)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = loadFromStorage('pokerClubSettings', null);
      if (stored && typeof stored === 'object') {
        setClubSettings(stored as ClubSettings);
      }
      
      // Load TV display settings - handle as direct strings, not JSON
      const storedTvRules = typeof window !== 'undefined' ? 
        (localStorage.getItem('pokerClubTvRules') || 'Enter your competition rules here...') : 
        'Enter your competition rules here...';
      const storedTvPrices = typeof window !== 'undefined' ? 
        (localStorage.getItem('pokerClubTvPrices') || 'Enter your prizes information here...') : 
        'Enter your prizes information here...';
      setTvRules(sanitizeTVContent(storedTvRules));
      setTvPrices(sanitizeTVContent(storedTvPrices));
      
      // Load active tables from localStorage
      const storedActiveTables = loadFromStorage('pokerClubActiveTables', []);
      if (storedActiveTables && Array.isArray(storedActiveTables)) {
        // Convert seatTime strings back to Date objects
        const tablesWithDates = storedActiveTables.map((table: any) => ({
          ...table,
          seatTime: new Date(table.seatTime)
        }));
        setActiveTables(tablesWithDates);
      }
    }
  }, []); // Run only once on mount

  // Update current time every second (client-side only)
  useEffect(() => {
    if (!mounted) return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [mounted]);

  // Use database state or fallback to localStorage (only after mounted to prevent hydration issues)
  const players: Player[] = (!mounted || dbLoading) ? (mounted ? loadFromStorage('pokerClubPlayers', []) as Player[] : []) : dbPlayers;
  const promotions: Promotion[] = (!mounted || dbLoading) ? (mounted ? loadFromStorage('pokerClubPromotions', []) as Promotion[] : []) : dbPromotions;
  const cashGameHistory: Session[] = (!mounted || dbLoading) ? (mounted ? loadFromStorage('pokerClubHistory', []) as Session[] : []) : dbSessions;

  // Create comprehensive activity feed with sessions, penalties, and addons
  const getFilteredActivities = () => {
    const activities = [];
    
    // Add sessions
    if (historyActivityFilter === 'all' || historyActivityFilter === 'sessions') {
      cashGameHistory.forEach(session => {
        activities.push({
          type: 'session',
          date: new Date(session.date),
          player_name: session.player_name,
          data: session
        });
      });
    }
    
    // Add penalties
    if (historyActivityFilter === 'all' || historyActivityFilter === 'penalties') {
      penalties.forEach(penalty => {
        activities.push({
          type: 'penalty',
          date: new Date(penalty.date_applied),
          player_name: penalty.player_name,
          data: penalty
        });
      });
    }
    
    // Add addons
    if (historyActivityFilter === 'all' || historyActivityFilter === 'addons') {
      addons.forEach(addon => {
        activities.push({
          type: 'addon',
          date: new Date(addon.date_applied),
          player_name: addon.player_name,
          data: addon
        });
      });
    }
    
    // Apply date filters
    const filteredActivities = activities.filter(activity => {
      // Date filter
      if (historyDateFrom) {
        const fromDate = new Date(historyDateFrom);
        if (activity.date < fromDate) return false;
      }
      
      if (historyDateTo) {
        const toDate = new Date(historyDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (activity.date > toDate) return false;
      }
      
      // Player filter
      if (historyPlayerFilter && historyPlayerFilter !== 'all') {
        return activity.player_name.toLowerCase().includes(historyPlayerFilter.toLowerCase());
      }
      
      return true;
    });
    
    // Apply sorting
    return filteredActivities.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'player':
          comparison = a.player_name.localeCompare(b.player_name);
          break;
        case 'type':
          const typeOrder = { session: 1, penalty: 2, addon: 3 };
          comparison = typeOrder[a.type] - typeOrder[b.type];
          break;
        case 'value':
          const aDurationMinutes = a.type === 'session' 
            ? (a.data.seat_in_time && a.data.seat_out_time 
                ? (new Date(a.data.seat_out_time).getTime() - new Date(a.data.seat_in_time).getTime()) / (1000 * 60)
                : (a.data.duration || 0))
            : 0;
          const bDurationMinutes = b.type === 'session' 
            ? (b.data.seat_in_time && b.data.seat_out_time 
                ? (new Date(b.data.seat_out_time).getTime() - new Date(b.data.seat_in_time).getTime()) / (1000 * 60)
                : (b.data.duration || 0))
            : 0;
          const aValue = a.type === 'session' ? aDurationMinutes / 60 : 
                        a.type === 'penalty' ? -(a.data.penalty_minutes / 60) :
                        a.data.bonus_minutes / 60;
          const bValue = b.type === 'session' ? bDurationMinutes / 60 : 
                        b.type === 'penalty' ? -(b.data.penalty_minutes / 60) :
                        b.data.bonus_minutes / 60;
          comparison = aValue - bValue;
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  };
  
  const filteredActivities = getFilteredActivities();

  // Save to localStorage whenever data changes (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pokerClubPlayers', JSON.stringify(players));
    }
  }, [players]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pokerClubPromotions', JSON.stringify(promotions));
    }
  }, [promotions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pokerClubHistory', JSON.stringify(cashGameHistory));
    }
  }, [cashGameHistory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pokerClubSettings', JSON.stringify(clubSettings));
    }
  }, [clubSettings]);

  // Save TV settings to localStorage as strings
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      localStorage.setItem('pokerClubTvRules', sanitizeTVContent(tvRules));
      localStorage.setItem('pokerClubTvPrices', sanitizeTVContent(tvPrices));
    }
  }, [tvRules, tvPrices, mounted]);

  // Save active tables to localStorage whenever they change (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      localStorage.setItem('pokerClubActiveTables', JSON.stringify(activeTables));
    }
  }, [activeTables, mounted]);

  // Load backup data on mount and setup automatic backups
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadBackupData();
      // Setup automatic daily backups
      BackupService.setupAutomaticBackups();
    }
  }, []);

  // Enhanced menu items configuration
  const menuItems = [
    { id: 'tables', label: 'Active Players', icon: Home, color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'players', label: 'Player Database', icon: Users, color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, color: 'text-yellow-400', gradient: 'from-yellow-500 to-amber-500' },
    { id: 'promotions', label: 'Promotions', icon: Award, color: 'text-purple-400', gradient: 'from-purple-500 to-pink-500' },
    { id: 'tv', label: 'TV Display', icon: Tv, color: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-500' },
    { id: 'penalties', label: 'Penalties', icon: Minus, color: 'text-red-400', gradient: 'from-red-500 to-rose-500' },
    { id: 'addons', label: 'Add-ons', icon: Plus, color: 'text-green-400', gradient: 'from-green-500 to-emerald-500' },
    { id: 'history', label: 'History', icon: History, color: 'text-orange-400', gradient: 'from-orange-500 to-red-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-400', gradient: 'from-slate-500 to-gray-500' }
  ];

  // Filter players based on search
  const filteredPlayers = players.filter((player: Player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sit in player (add to table)
  const sitInPlayer = (player: Player) => {
    console.log('Sitting in player:', player.name);
    
    if (activeTables.find(t => t.player.id === player.id)) {
      alert('Player is already active');
      return;
    }
    
    const newTable = {
      id: Date.now(),
      player: player,
      seatTime: new Date()
    };
    
    console.log('Creating new table:', newTable);
    
    setActiveTables(prevTables => {
      const updated = [...prevTables, newTable];
      console.log('Active players after sit in:', updated);
      return updated;
    });
    
    console.log(`Player ${player.name} sat in successfully`);
  };

  // Handle confirmation before ending session
  const handleEndSessionClick = (tableId: number) => {
    const table = activeTables.find(t => t.id === tableId);
    if (table) {
      setConfirmEndSession({ tableId, playerName: table.player.name });
    }
  };

  // Confirm and actually end the session
  const confirmEndSessionAction = async () => {
    if (confirmEndSession && !isProcessingEndSession) {
      // Check if the table still exists in active tables to prevent duplicates
      const tableExists = activeTables.find(t => t.id === confirmEndSession.tableId);
      if (!tableExists) {
        console.log('Table no longer exists, session already processed');
        setConfirmEndSession(null);
        return;
      }

      // Set processing state to prevent multiple clicks
      setIsProcessingEndSession(true);
      
      // Clear the confirmation dialog immediately to prevent double-processing
      const sessionInfo = confirmEndSession;
      setConfirmEndSession(null);
      
      try {
        // Process the session
        await sitOutPlayer(sessionInfo.tableId);
      } catch (error) {
        console.error('Error ending session:', error);
      } finally {
        // Reset processing state
        setIsProcessingEndSession(false);
      }
    }
  };


  // Sit out player (remove from table and record hours)
  const sitOutPlayer = async (tableId: number) => {
    const table = activeTables.find(t => t.id === tableId);
    if (!table) {
      console.error('Table not found:', tableId);
      return;
    }

    const sessionDuration = (new Date().getTime() - table.seatTime.getTime()) / 1000 / 60 / 60; // hours
    
    if (sessionDuration < 0.0167) {
      if (!confirm(`Session is less than 1 minute (${Math.round(sessionDuration * 60)} seconds). Do you still want to record it?`)) {
        return;
      }
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const session = {
      player_id: table.player.id,
      player_name: table.player.name,
      date: now.toISOString(),
      date_string: today,
      seat_in_time: table.seatTime.toISOString(),
      seat_out_time: now.toISOString(),
      duration: sessionDuration,
      day_of_week: now.getDay(),
      week_number: Math.ceil((now.getDate() - now.getDay() + 7) / 7),
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };

    console.log('Recording session:', session);

    try {
      // Save session to database
      await dbAddSession(session);
      
      // Recalculate player statistics
      await recalculateAllPlayerStats();
      await refreshData();
      
      // Remove from active tables
      setActiveTables(prevTables => prevTables.filter(t => t.id !== tableId));

      alert(`Session recorded for ${table.player.name}\nDuration: ${formatDuration(sessionDuration)}`);
      console.log('Sit out completed successfully');
    } catch (error) {
      console.error('Error recording session to database:', error);
      
      // Fallback to localStorage for offline mode
      try {
        const sessionWithId = {
          id: Date.now(),
          ...session
        };
        
        // Add to local history  
        const currentHistory = cashGameHistory || [];
        const updatedHistory = [...currentHistory, sessionWithId];
        
        // Save to localStorage immediately
        if (typeof window !== 'undefined') {
          localStorage.setItem('pokerClubHistory', JSON.stringify(updatedHistory));
        }
        
        // Remove from active tables
        setActiveTables(prevTables => prevTables.filter(t => t.id !== tableId));

        // Force a data refresh to update the history display
        if (refreshData) {
          refreshData();
        }

        alert(`Session recorded locally for ${table.player.name}\nDuration: ${formatDuration(sessionDuration)}\n(Will sync to database when online)`);
        console.log('Session saved to localStorage as fallback');
      } catch (localError) {
        console.error('Error saving session locally:', localError);
        alert('Failed to record session. Please try again.');
      }
    }
  };

  // Add new player
  const addNewPlayer = async (playerData: { name: string; email: string; phone: string }) => {
    if (dbLoading) return;
    
    try {
      await dbAddPlayer(playerData);
    } catch (error) {
      console.error('Error adding player:', error);
      // Fallback to localStorage for offline mode
      const player = {
        id: Date.now(),
        name: playerData.name.trim(),
        email: playerData.email.trim(),
        phone: playerData.phone.trim(),
        joinDate: new Date().toISOString().split('T')[0],
        totalHours: 0,
        sessions: [],
        dailyStats: {},
        promotionHistory: {},
        achievements: [],
        lastPlayed: null,
        lastSessionDuration: 0,
        totalSessions: 0
      };
      // For local fallback, we'd need to manage state differently
      console.log('Added player locally:', player);
    }
  };

  // Delete player
  const deletePlayer = async (playerId: number) => {
    if (confirm('Are you sure you want to delete this player? This will also remove all their session history.')) {
      if (dbLoading) return;
      
      try {
        await dbDeletePlayer(playerId);
      } catch (error) {
        console.error('Error deleting player:', error);
      }
    }
  };

  // Add new promotion
  const addNewPromotion = async (promotionData: { name: string; startDate: string; endDate: string }) => {
    if (dbLoading) return;
    
    try {
      await dbAddPromotion(promotionData);
    } catch (error) {
      console.error('Error adding promotion:', error);
    }
  };

  // Format duration
  const formatDuration = (hours: number) => {
    // Handle null, undefined, or truly zero values
    if (hours === null || hours === undefined || hours === 0) return '0h 0m';
    
    // Ensure hours is a positive number and handle very small values
    const safeHours = Math.max(0, Number(hours) || 0);
    if (safeHours < 0.0167) { // Less than 1 minute
      return '0h 1m'; // Show at least 1 minute for very small values
    }
    
    const h = Math.floor(safeHours);
    const m = Math.round((safeHours - h) * 60);
    
    // Handle edge case where rounding minutes equals 60
    if (m === 60) {
      return `${h + 1}h 0m`;
    }
    
    return `${h}h ${m}m`;
  };

  // Get dashboard stats
  const getDashboardStats = () => {
    const totalHours = players.reduce((sum: number, p: Player) => sum + p.totalHours, 0);
    return {
      activePlayers: activeTables.length,
      totalPlayers: players.length,
      totalHours,
      sessionsToday: cashGameHistory.filter((s: Session) => {
        const sessionDate = new Date(s.date).toDateString();
        const today = new Date().toDateString();
        return sessionDate === today;
      }).length
    };
  };

  const stats = getDashboardStats();


  // Backup management functions
  const loadBackupData = () => {
    try {
      const backups = BackupService.getAvailableBackups();
      const stats = BackupService.getBackupStats();
      setAvailableBackups(backups);
      setBackupStats(stats);
    } catch (error) {
      console.error('Error loading backup data:', error);
    }
  };

  const createBackup = async () => {
    try {
      setBackupLoading(true);
      await BackupService.createBackup();
      loadBackupData();
      alert('Backup created successfully!');
    } catch (error) {
      console.error('Backup creation failed:', error);
      alert(`Backup failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      setBackupLoading(false);
    }
  };

  const restoreBackup = async (backup: BackupData) => {
    try {
      setBackupLoading(true);
      await BackupService.restoreFromBackup(backup);
      loadBackupData();
    } catch (error) {
      console.error('Restore failed:', error);
      alert(`Restore failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      setBackupLoading(false);
    }
  };

  const deleteBackup = (timestamp: string) => {
    if (BackupService.deleteBackup(timestamp)) {
      loadBackupData();
      alert('Backup deleted successfully');
    } else {
      alert('Failed to delete backup');
    }
  };

  const exportBackup = (backup: BackupData) => {
    try {
      BackupService.exportBackup(backup);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : error}`);
    }
  };

  const importBackupFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await BackupService.importBackup(file);
        loadBackupData();
        alert('Backup imported successfully!');
      } catch (error) {
        console.error('Import failed:', error);
        alert(`Import failed: ${error instanceof Error ? error.message : error}`);
      }
    }
  };


  // Show loading state (only after component is mounted to prevent hydration mismatch)
  if (!mounted || (dbLoading && (!players || players.length === 0))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-2">
            Connecting to Database
          </h2>
          <p className="text-slate-400">Loading your poker club data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (dbError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 mb-6">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Database Connection Error</h2>
            <p className="text-slate-300 mb-4">{dbError}</p>
            <p className="text-slate-400 text-sm">
              Please check your Supabase configuration in your environment variables.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground flex">
        {/* Enhanced Sidebar - Mobile Responsive */}
        <div className={`${
          isMobile 
            ? (sidebarCollapsed ? '-translate-x-full' : 'fixed inset-y-0 left-0 z-50 w-64') 
            : (sidebarCollapsed ? 'w-20' : 'w-64')
        } bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-all duration-300 flex flex-col border-r border-slate-700 dark:border-slate-800 shadow-2xl`}>
          {/* Logo Section with Gradient */}
          <div className="p-4 border-b border-slate-700 dark:border-slate-800 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
                  <Trophy className="text-slate-900" size={24} />
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                      {clubSettings.clubName}
                    </h1>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-400" />
                      {clubSettings.location || 'Premium Cash Game Manager'}
                    </p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              >
                {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </Button>
            </div>
          </div>

          {/* Enhanced Quick Stats */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-slate-700 dark:border-slate-800 bg-gradient-to-br from-slate-800/30 to-slate-900/30">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="text-slate-300 text-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    Active Players
                  </span>
                  <span className="font-bold text-emerald-400">{stats.activePlayers}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="text-slate-300 text-sm flex items-center gap-2">
                    <Users size={14} className="text-blue-400" />
                    Total Players
                  </span>
                  <span className="font-bold text-blue-400">{stats.totalPlayers}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="text-slate-300 text-sm flex items-center gap-2">
                    <Clock size={14} className="text-purple-400" />
                    Sessions Today
                  </span>
                  <span className="font-bold text-purple-400">{stats.sessionsToday}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start group transition-all duration-200 ${
                        activeTab === item.id 
                          ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg border border-white/20` 
                          : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                      }`}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSelectedPlayer(null);
                      }}
                    >
                      <Icon className={`mr-3 transition-all duration-200 ${
                        activeTab === item.id 
                          ? 'text-white drop-shadow-lg' 
                          : `${item.color} group-hover:${item.color} group-hover:drop-shadow-sm`
                      }`} size={20} />
                      {!sidebarCollapsed && (
                        <span className={`font-medium transition-all duration-200 ${
                          activeTab === item.id ? 'text-white font-semibold' : 'group-hover:text-white'
                        }`}>
                          {item.label}
                        </span>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className={`text-center text-sm text-muted-foreground ${sidebarCollapsed ? 'hidden' : ''}`}>
              {mounted && (
                <>
                  <div>{currentTime.toLocaleDateString()}</div>
                  <div>{currentTime.toLocaleTimeString()}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Backdrop */}
        {isMobile && !sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col ${isMobile && !sidebarCollapsed ? 'ml-0' : ''}`}>
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-700 dark:border-slate-800 px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200"
                  >
                    <Menu size={20} />
                  </Button>
                )}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  {selectedPlayer ? selectedPlayer.name : menuItems.find(item => item.id === activeTab)?.label}
                </h2>
                <div className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs text-slate-300 font-medium">Live Dashboard</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-sm text-slate-300">Active:</span>
                    <span className="font-bold text-emerald-400">{stats.activePlayers}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <Clock size={14} className="text-blue-400" />
                    <span className="text-sm text-slate-300">Total:</span>
                    <span className="font-bold text-blue-400">{formatDuration(stats.totalHours)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Sync Status Indicator */}
                  <div 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      isOnline 
                        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                        : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    }`}
                    title={`${isOnline ? '🟢 Connected to Database - Real-time sync active' : '🔴 Offline Mode - ' + offlineQueue + ' actions queued for sync'}${lastSyncTime > 0 ? ' | Last sync: ' + new Date(lastSyncTime).toLocaleTimeString() : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-green-400' : 'bg-orange-400'
                    } ${isOnline ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-medium">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                    {offlineQueue > 0 && (
                      <button
                        onClick={processOfflineQueue}
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-1.5 py-0.5 rounded text-xs font-bold transition-colors"
                        title="Click to sync queued actions"
                      >
                        {offlineQueue}
                      </button>
                    )}
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Enhanced Active Players Tab */}
              <TabsContent value="tables" className="space-y-6">
                <Card className="bg-gradient-to-br from-slate-800/60 via-slate-700/40 to-slate-800/60 border-slate-600 shadow-2xl backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                        <Users className="text-white" size={24} />
                      </div>
                      <div>
                        <div className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                          Active Players
                        </div>
                        <div className="text-sm font-normal text-emerald-400 mt-1">
                          {activeTables.length} players active
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Player Search */}
                    <div className="mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
                        <Input
                          type="text"
                          placeholder="Search players to start session..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {searchTerm && (
                        <div className="mt-2 bg-muted rounded-lg max-h-60 overflow-y-auto">
                          {filteredPlayers.map((player: any) => {
                            const isSeated = activeTables.find(t => t.player.id === player.id);
                            return (
                              <div
                                key={player.id}
                                className={`flex items-center justify-between p-3 ${isSeated ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'}`}
                                onClick={() => {
                                  if (!isSeated) {
                                    sitInPlayer(player);
                                    setSearchTerm('');
                                  }
                                }}
                              >
                                <div>
                                  <span className={isSeated ? 'line-through' : ''}>{player.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    (Total: {formatDuration(player.totalHours)})
                                  </span>
                                </div>
                                {isSeated ? (
                                  <Badge variant="secondary">Already Seated</Badge>
                                ) : (
                                  <Button variant="outline" size="sm">
                                    Start Session
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Active Players Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeTables.map(table => {
                        const currentDuration = (new Date().getTime() - table.seatTime.getTime()) / 1000 / 60 / 60;
                        return (
                          <Card key={table.id} className="bg-gradient-to-br from-emerald-900/40 via-teal-800/30 to-emerald-900/40 border-emerald-500/30 shadow-lg hover:shadow-2xl transition-all duration-300">
                            <CardContent className="p-5">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                                    {table.player.name}
                                  </h3>
                                  <div className="text-sm text-emerald-300 mt-1 flex items-center gap-1">
                                    <Clock size={12} />
                                    Started: {table.seatTime.toLocaleTimeString()}
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                                  <span className="text-xs text-emerald-300 font-medium">ACTIVE</span>
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-xl p-4 mb-4 border border-slate-600/50">
                                <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Current Session</div>
                                <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                                  <div className="p-1 rounded-lg bg-emerald-500/20">
                                    <Clock size={20} className="text-emerald-400" />
                                  </div>
                                  {formatDuration(currentDuration)}
                                </div>
                              </div>

                              <Button
                                variant="destructive"
                                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg transition-all duration-200"
                                onClick={() => handleEndSessionClick(table.id)}
                              >
                                <X size={18} className="mr-2" />
                                End Session
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {activeTables.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No players active</p>
                        <p className="text-sm mt-2">Search for players above to start their session</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Players Database Tab */}
              <TabsContent value="players" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <User />
                        Player Database ({players.length})
                      </CardTitle>
                      <AddPlayerFormErrorBoundary onRetry={() => window.location.reload()}>
                        <AddPlayerDialog onAddPlayer={addNewPlayer} />
                      </AddPlayerFormErrorBoundary>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PlayersDataErrorBoundary isOnline={isOnline} onRetry={refreshData}>
                      <PlayerTableErrorBoundary>
                        <div className="overflow-x-auto">
                          <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Rank</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Total Hours</TableHead>
                              <TableHead>Sessions</TableHead>
                              <TableHead>Avg Session</TableHead>
                              <TableHead>Last Played</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                      <TableBody>
                        {players
                          .map((player: any) => ({
                            ...player,
                            isSeated: !!activeTables.find(t => t.player.id === player.id)
                          }))
                          .sort((a: any, b: any) => {
                            if (a.isSeated && !b.isSeated) return -1;
                            if (!a.isSeated && b.isSeated) return 1;
                            return b.totalHours - a.totalHours;
                          })
                          .map((player: any, index: number) => {
                            const avgSession = player.sessions?.length > 0 
                              ? player.totalHours / player.sessions.length 
                              : 0;
                            const lastSession = player.sessions?.length > 0 
                              ? new Date(player.sessions[player.sessions.length - 1].date).toLocaleDateString()
                              : 'Never';
                            
                            return (
                              <TableRow key={player.id} className={player.isSeated ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                                <TableCell>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                    index === 0 ? 'bg-yellow-500 text-black' : 
                                    index === 1 ? 'bg-gray-400 text-black' : 
                                    index === 2 ? 'bg-orange-600 text-white' : 
                                    'bg-muted text-foreground'
                                  }`}>
                                    {index + 1}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{player.name}</div>
                                    {player.email && (
                                      <div className="text-xs text-muted-foreground">{player.email}</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-blue-600 font-semibold text-lg">
                                    {formatDuration(player.totalHours)}
                                  </span>
                                </TableCell>
                                <TableCell>{player.sessions?.length || 0}</TableCell>
                                <TableCell>{formatDuration(avgSession)}</TableCell>
                                <TableCell>{lastSession}</TableCell>
                                <TableCell>
                                  {player.isSeated ? (
                                    <Badge variant="default" className="bg-green-600">
                                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                                      Playing
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        router.push(`/player/${player.id}`);
                                      }}
                                      title="View Player History"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      View Details
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        deletePlayer(player.id);
                                      }}
                                      title="Delete Player"
                                    >
                                      <Trash2 size={18} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                      </Table>
                        </div>
                      </PlayerTableErrorBoundary>
                    </PlayersDataErrorBoundary>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="text-yellow-500" />
                      All Time Leaderboard
                    </CardTitle>
                    <CardDescription>
                      Ranking based on total hours played
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {players
                        .sort((a: any, b: any) => b.totalHours - a.totalHours)
                        .map((player: any, index: number) => (
                          <div key={player.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-muted'
                              }`}>
                                {index + 1}
                              </div>
                              <span className="font-medium">{player.name}</span>
                            </div>
                            <div className="flex gap-4 items-center">
                              <span className="text-blue-600 font-semibold text-lg">{formatDuration(player.totalHours)}</span>
                              <span className="text-muted-foreground text-sm">({player.sessions?.length || 0} sessions)</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Promotions Tab */}
              <TabsContent value="promotions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Award />
                        Promotion Periods
                      </CardTitle>
                      <AddPromotionFormErrorBoundary onRetry={() => window.location.reload()}>
                        <AddPromotionDialog onAddPromotion={addNewPromotion} />
                      </AddPromotionFormErrorBoundary>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {promotions.filter((p: any) => !p.deleted).map((promotion: any) => {
                        const isExpired = new Date(promotion.end_date) < new Date();
                        
                        return (
                          <Card 
                            key={promotion.id} 
                            className={`${isExpired ? 'opacity-75' : ''} cursor-pointer hover:shadow-md transition-shadow`}
                            onClick={() => router.push(`/promotion/${promotion.id}`)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-lg flex items-center gap-2">
                                    {promotion.name}
                                    {isExpired && <Badge variant="destructive">ENDED</Badge>}
                                    {!isExpired && promotion.active && <Badge variant="default" className="bg-green-600">ACTIVE</Badge>}
                                  </h4>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Edit functionality can be added here
                                    }}
                                  >
                                    <Edit2 size={18} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/promotion/${promotion.id}`);
                                    }}
                                    title="View Promotion Details"
                                  >
                                    <Eye size={18} />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      
                      {promotions.filter((p: any) => !p.deleted).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No active promotions. Create your first promotion to track player hours within specific date ranges.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Penalties Tab */}
              <TabsContent value="penalties" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Minus className="text-red-500" />
                      Player Penalties
                    </CardTitle>
                    <CardDescription>
                      Manage player time penalties for floor mistakes, breaks, and other deductions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Add Penalty Section */}
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Plus className="h-5 w-5 text-red-500" />
                          Add New Penalty
                        </h3>
                        
                        {/* Player Search */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Select Player</label>
                          <Select value={penaltyForm.playerId} onValueChange={(value) => {
                            const selectedPlayer = players.find((p: Player) => p.id.toString() === value);
                            setPenaltyForm(prev => ({
                              ...prev,
                              playerId: value,
                              playerName: selectedPlayer?.name || ''
                            }));
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Search and select a player..." />
                            </SelectTrigger>
                            <SelectContent>
                              {players.map((player: Player) => (
                                <SelectItem key={player.id} value={player.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span>{player.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({Math.floor(player.totalHours)}h {Math.round((player.totalHours % 1) * 60)}m)
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Penalty Minutes */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Penalty Minutes</label>
                          <Input
                            type="number"
                            placeholder="Enter minutes to deduct..."
                            min="1"
                            max="9999"
                            value={penaltyForm.penaltyMinutes}
                            onChange={(e) => setPenaltyForm(prev => ({ ...prev, penaltyMinutes: e.target.value }))}
                          />
                        </div>

                        {/* Reason Type */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Reason Type</label>
                          <Select value={penaltyForm.reasonType} onValueChange={(value) => setPenaltyForm(prev => ({ ...prev, reasonType: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason type..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="floor_mistake">Floor Mistake</SelectItem>
                              <SelectItem value="dinner_break">Dinner Break</SelectItem>
                              <SelectItem value="short_pause">Short Pause</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Reason Description */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Reason Description</label>
                          <Input
                            type="text"
                            placeholder="Describe the reason for penalty..."
                            value={penaltyForm.reason}
                            onChange={(e) => setPenaltyForm(prev => ({ ...prev, reason: e.target.value }))}
                          />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Additional Notes (Optional)</label>
                          <Input
                            type="text"
                            placeholder="Any additional notes..."
                            value={penaltyForm.notes}
                            onChange={(e) => setPenaltyForm(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        </div>

                        {/* Applied By */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Applied By (Optional)</label>
                          <Input
                            type="text"
                            placeholder="Your name or floor manager name..."
                            value={penaltyForm.appliedBy}
                            onChange={(e) => setPenaltyForm(prev => ({ ...prev, appliedBy: e.target.value }))}
                          />
                        </div>

                        <Button 
                          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          disabled={isProcessingPenalty}
                          onClick={async () => {
                            if (isProcessingPenalty) return; // Prevent double clicks
                            
                            if (!penaltyForm.playerId || !penaltyForm.penaltyMinutes || !penaltyForm.reasonType || !penaltyForm.reason) {
                              alert('Please fill in all required fields');
                              return;
                            }
                            
                            setIsProcessingPenalty(true);
                            
                            try {
                              const penalty = await DatabaseService.createPenalty({
                                player_id: parseInt(penaltyForm.playerId),
                                player_name: penaltyForm.playerName,
                                penalty_minutes: parseFloat(penaltyForm.penaltyMinutes),
                                reason: penaltyForm.reason,
                                reason_type: penaltyForm.reasonType,
                                applied_by: penaltyForm.appliedBy || null,
                                date_applied: new Date().toISOString(),
                                notes: penaltyForm.notes || null
                              });
                              
                              if (penalty) {
                                alert(`Penalty of ${penaltyForm.penaltyMinutes} minutes applied successfully to ${penaltyForm.playerName}!`);
                                setPenaltyForm({
                                  playerId: '',
                                  playerName: '',
                                  penaltyMinutes: '',
                                  reasonType: '',
                                  reason: '',
                                  notes: '',
                                  appliedBy: ''
                                });
                                // Recalculate stats and refresh UI
                                await recalculateAllPlayerStats();
                                await refreshData();
                                // Refresh penalty/addon history
                                const [penaltyData, addonData] = await Promise.all([
                                  DatabaseService.getPenalties(),
                                  DatabaseService.getAddons()
                                ]);
                                setPenalties(penaltyData);
                                setAddons(addonData);
                                // Redirect to home tab
                                setActiveTab('tables');
                              } else {
                                alert('Failed to apply penalty. Please check the console for details.');
                              }
                            } catch (error) {
                              console.error('Error applying penalty:', error);
                              alert('Error applying penalty: ' + (error instanceof Error ? error.message : String(error)));
                            } finally {
                              setIsProcessingPenalty(false);
                            }
                          }}
                        >
                          <Minus className="h-4 w-4 mr-2" />
                          {isProcessingPenalty ? 'Processing...' : 'Apply Penalty'}
                        </Button>
                      </div>

                      {/* Recent Penalties List */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Recent Penalties</h3>
                        {penalties.length > 0 ? (
                          <div className="space-y-3">
                            {penalties.slice(0, 5).map((penalty: any) => (
                              <div key={penalty.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{penalty.player_name}</span>
                                    <span className="text-red-600 font-semibold">-{penalty.penalty_minutes} min</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {penalty.reason} ({penalty.reason_type.replace('_', ' ')})
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(penalty.date_applied).toLocaleDateString()} by {penalty.applied_by || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {penalties.length > 5 && (
                              <p className="text-sm text-muted-foreground text-center">
                                And {penalties.length - 5} more penalties...
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Minus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No penalties recorded yet</p>
                            <p className="text-sm">Penalties will appear here once applied</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Add-ons Tab */}
              <TabsContent value="addons" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="text-green-500" />
                      Player Add-ons & Bonuses
                    </CardTitle>
                    <CardDescription>
                      Add bonus minutes for late registrations, high stakes play, compensation, and promotional rewards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Add Bonus Section */}
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Plus className="h-5 w-5 text-green-500" />
                          Add New Bonus
                        </h3>
                        
                        {/* Player Search */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Select Player</label>
                          <Select value={addonForm.playerId} onValueChange={(value) => {
                            const selectedPlayer = players.find((p: Player) => p.id.toString() === value);
                            setAddonForm(prev => ({
                              ...prev,
                              playerId: value,
                              playerName: selectedPlayer?.name || ''
                            }));
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Search and select a player..." />
                            </SelectTrigger>
                            <SelectContent>
                              {players.map((player: Player) => (
                                <SelectItem key={player.id} value={player.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span>{player.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({Math.floor(player.totalHours)}h {Math.round((player.totalHours % 1) * 60)}m)
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Bonus Minutes */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Bonus Minutes</label>
                          <Input
                            type="number"
                            placeholder="Enter minutes to add..."
                            min="1"
                            max="9999"
                            value={addonForm.bonusMinutes}
                            onChange={(e) => setAddonForm(prev => ({ ...prev, bonusMinutes: e.target.value }))}
                          />
                        </div>

                        {/* Reason Type */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Reason Type</label>
                          <Select value={addonForm.reasonType} onValueChange={(value) => setAddonForm(prev => ({ ...prev, reasonType: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason type..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="late_registration">Late Registration</SelectItem>
                              <SelectItem value="high_stakes_bonus">High Stakes Bonus</SelectItem>
                              <SelectItem value="compensation">Compensation</SelectItem>
                              <SelectItem value="promotional">Promotional</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Reason Description */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Reason Description</label>
                          <Input
                            type="text"
                            placeholder="Describe the reason for bonus..."
                            value={addonForm.reason}
                            onChange={(e) => setAddonForm(prev => ({ ...prev, reason: e.target.value }))}
                          />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Additional Notes (Optional)</label>
                          <Input
                            type="text"
                            placeholder="Any additional notes..."
                            value={addonForm.notes}
                            onChange={(e) => setAddonForm(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        </div>

                        {/* Applied By */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Applied By (Optional)</label>
                          <Input
                            type="text"
                            placeholder="Your name or floor manager name..."
                            value={addonForm.appliedBy}
                            onChange={(e) => setAddonForm(prev => ({ ...prev, appliedBy: e.target.value }))}
                          />
                        </div>

                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          disabled={isProcessingAddon}
                          onClick={async () => {
                            if (isProcessingAddon) return; // Prevent double clicks
                            
                            if (!addonForm.playerId || !addonForm.bonusMinutes || !addonForm.reasonType || !addonForm.reason) {
                              alert('Please fill in all required fields');
                              return;
                            }
                            
                            setIsProcessingAddon(true);
                            
                            try {
                              const addon = await DatabaseService.createAddon({
                                player_id: parseInt(addonForm.playerId),
                                player_name: addonForm.playerName,
                                bonus_minutes: parseFloat(addonForm.bonusMinutes),
                                reason: addonForm.reason,
                                reason_type: addonForm.reasonType,
                                applied_by: addonForm.appliedBy || null,
                                date_applied: new Date().toISOString(),
                                notes: addonForm.notes || null
                              });
                              
                              if (addon) {
                                alert(`Bonus of ${addonForm.bonusMinutes} minutes applied successfully to ${addonForm.playerName}!`);
                                setAddonForm({
                                  playerId: '',
                                  playerName: '',
                                  bonusMinutes: '',
                                  reasonType: '',
                                  reason: '',
                                  notes: '',
                                  appliedBy: ''
                                });
                                // Recalculate stats and refresh UI
                                await recalculateAllPlayerStats();
                                await refreshData();
                                // Refresh penalty/addon history
                                const [penaltyData, addonData] = await Promise.all([
                                  DatabaseService.getPenalties(),
                                  DatabaseService.getAddons()
                                ]);
                                setPenalties(penaltyData);
                                setAddons(addonData);
                                // Redirect to home tab
                                setActiveTab('tables');
                              } else {
                                alert('Failed to apply bonus. Please check the console for details.');
                              }
                            } catch (error) {
                              console.error('Error applying bonus:', error);
                              alert('Error applying bonus: ' + (error instanceof Error ? error.message : String(error)));
                            } finally {
                              setIsProcessingAddon(false);
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {isProcessingAddon ? 'Processing...' : 'Apply Bonus'}
                        </Button>
                      </div>

                      {/* Recent Add-ons List */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Recent Add-ons</h3>
                        {addons.length > 0 ? (
                          <div className="space-y-3">
                            {addons.slice(0, 5).map((addon: any) => (
                              <div key={addon.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{addon.player_name}</span>
                                    <span className="text-green-600 font-semibold">+{addon.bonus_minutes} min</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {addon.reason} ({addon.reason_type.replace('_', ' ')})
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(addon.date_applied).toLocaleDateString()} by {addon.applied_by || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {addons.length > 5 && (
                              <p className="text-sm text-muted-foreground text-center">
                                And {addons.length - 5} more add-ons...
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No add-ons recorded yet</p>
                            <p className="text-sm">Bonus minutes will appear here once applied</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar />
                      Activity History
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Sessions, penalties, and bonuses for all players
                    </p>
                  </CardHeader>
                  <CardContent>
                    {/* Filter Controls */}
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1 block">From Date</label>
                          <Input
                            type="date"
                            value={historyDateFrom}
                            onChange={(e) => setHistoryDateFrom(e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1 block">To Date</label>
                          <Input
                            type="date"
                            value={historyDateTo}
                            onChange={(e) => setHistoryDateTo(e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1 block">Player</label>
                          <Select value={historyPlayerFilter} onValueChange={setHistoryPlayerFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="All players" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Players</SelectItem>
                              {players.map((player: Player) => (
                                <SelectItem key={player.id} value={player.name}>
                                  {player.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1 block">Activity Type</label>
                          <Select value={historyActivityFilter} onValueChange={setHistoryActivityFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="All activities" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Activities</SelectItem>
                              <SelectItem value="sessions">Sessions Only</SelectItem>
                              <SelectItem value="penalties">Penalties Only</SelectItem>
                              <SelectItem value="addons">Bonuses Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setHistoryDateFrom('');
                              setHistoryDateTo('');
                              setHistoryPlayerFilter('');
                              setHistoryActivityFilter('all');
                            }}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Showing {filteredActivities.length} activities ({cashGameHistory.length} sessions, {penalties.length} penalties, {addons.length} bonuses)
                      </div>
                    </div>
                    
                    {/* Sorting Controls */}
                    <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
                        
                        {/* Sort Field Buttons */}
                        <div className="flex gap-1">
                          {[
                            { key: 'date', label: 'Date' },
                            { key: 'player', label: 'Player' },
                            { key: 'type', label: 'Type' },
                            { key: 'value', label: 'Value' }
                          ].map(({ key, label }) => (
                            <Button
                              key={key}
                              variant={sortField === key ? "default" : "ghost"}
                              size="sm"
                              onClick={() => {
                                if (sortField === key) {
                                  setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                                } else {
                                  setSortField(key as typeof sortField);
                                  setSortDirection('desc');
                                }
                              }}
                              className="flex items-center gap-1"
                            >
                              {label}
                              {sortField === key && (
                                sortDirection === 'desc' ? 
                                <ChevronDown className="h-3 w-3" /> : 
                                <ChevronUp className="h-3 w-3" />
                              )}
                            </Button>
                          ))}
                        </div>
                        
                        {/* Reset Sort */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSortField('date');
                            setSortDirection('desc');
                          }}
                          className="text-xs"
                        >
                          Reset Sort
                        </Button>
                      </div>
                    </div>
                    {/* Activity Feed */}
                    {filteredActivities.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No activities match the current filters</p>
                        <p className="text-sm mt-2">Try adjusting your filters or check back later</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredActivities.slice(0, 30).map((activity) => {
                          if (activity.type === 'session') {
                            const session = activity.data;
                            // Calculate duration from seat_in_time and seat_out_time in minutes, then convert to hours
                            const durationMinutes = session.seat_in_time && session.seat_out_time 
                              ? (new Date(session.seat_out_time).getTime() - new Date(session.seat_in_time).getTime()) / (1000 * 60)
                              : (session.duration || 0);
                            const hours = durationMinutes / 60;
                            return (
                              <div key={`session-${session.id}`} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium">{session.player_name}</span>
                                      <Badge variant="secondary">Session</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(session.date).toLocaleDateString()} • {new Date(session.seat_in_time).toLocaleTimeString()} - {new Date(session.seat_out_time).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-blue-600">+{hours.toFixed(1)}h</p>
                                  <p className="text-xs text-muted-foreground">Playing time</p>
                                </div>
                              </div>
                            );
                          } else if (activity.type === 'penalty') {
                            const penalty = activity.data;
                            const hours = penalty.penalty_minutes / 60;
                            return (
                              <div key={`penalty-${penalty.id}`} className="flex items-center justify-between p-4 border rounded-lg bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Minus className="h-5 w-5 text-red-500 flex-shrink-0" />
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium">{penalty.player_name}</span>
                                      <Badge variant="destructive">Penalty</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(penalty.date_applied).toLocaleDateString()} • {penalty.reason}
                                    </p>
                                    {penalty.reason_type && (
                                      <p className="text-xs text-muted-foreground">
                                        Category: {penalty.reason_type.replace('_', ' ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-red-600">-{hours.toFixed(1)}h</p>
                                  <p className="text-xs text-muted-foreground">Time penalty</p>
                                </div>
                              </div>
                            );
                          } else if (activity.type === 'addon') {
                            const addon = activity.data;
                            const hours = addon.bonus_minutes / 60;
                            return (
                              <div key={`addon-${addon.id}`} className="flex items-center justify-between p-4 border rounded-lg bg-green-50/30 dark:bg-green-950/20 hover:bg-green-50/50 dark:hover:bg-green-950/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Plus className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium">{addon.player_name}</span>
                                      <Badge className="bg-green-600 hover:bg-green-700">Bonus</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(addon.date_applied).toLocaleDateString()} • {addon.reason}
                                    </p>
                                    {addon.reason_type && (
                                      <p className="text-xs text-muted-foreground">
                                        Category: {addon.reason_type.replace('_', ' ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-green-600">+{hours.toFixed(1)}h</p>
                                  <p className="text-xs text-muted-foreground">Bonus time</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                        {filteredActivities.length > 30 && (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">
                              Showing latest 30 activities of {filteredActivities.length} total
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Use filters to narrow down results
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Penalty History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Minus className="text-red-500" />
                      Penalty History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead>Minutes</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Applied By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {penalties.slice().reverse().map((penalty: any) => (
                          <TableRow key={penalty.id}>
                            <TableCell>{new Date(penalty.date_applied).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{penalty.player_name}</TableCell>
                            <TableCell>
                              <span className="text-red-600 font-semibold">
                                -{penalty.penalty_minutes} min
                              </span>
                            </TableCell>
                            <TableCell>{penalty.reason} ({penalty.reason_type.replace('_', ' ')})</TableCell>
                            <TableCell>{penalty.applied_by || 'Unknown'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                    {penalties.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        No penalties recorded yet
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Addon History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="text-green-500" />
                      Bonus History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead>Minutes</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Applied By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {addons.slice().reverse().map((addon: any) => (
                          <TableRow key={addon.id}>
                            <TableCell>{new Date(addon.date_applied).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{addon.player_name}</TableCell>
                            <TableCell>
                              <span className="text-green-600 font-semibold">
                                +{addon.bonus_minutes} min
                              </span>
                            </TableCell>
                            <TableCell>{addon.reason} ({addon.reason_type.replace('_', ' ')})</TableCell>
                            <TableCell>{addon.applied_by || 'Unknown'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                    {addons.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        No bonuses recorded yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TV Display Tab - Professional Space Theme */}
              <TabsContent value="tv" className="space-y-6">
                <div className="min-h-screen space-theme-bg relative overflow-hidden">
                  
                  {/* Professional Space Theme Header */}
                  <div className="relative space-theme-card border-0 p-8 m-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="p-4 space-neon-border rounded-xl">
                          <Tv className="h-10 w-10 text-blue-400" />
                        </div>
                        <div className="space-y-1">
                          <h1 className="text-4xl font-bold text-white">
                            🎰 POKER TV DISPLAY
                          </h1>
                          <p className="text-xl text-blue-400 font-medium">
                            Professional Poker Club Interface
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <Button
                          onClick={() => {
                            const tvUrl = `${window.location.origin}/tv-display.html`;
                            window.open(tvUrl, '_blank');
                          }}
                          className="space-theme-card space-neon-border bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-white border-green-400/50 hover:border-green-400 transition-all duration-300 px-6 py-3 text-lg font-semibold"
                        >
                          <ExternalLink className="h-5 w-5 mr-2" />
                          📺 View TV Display
                        </Button>
                        <div className="text-right space-y-1">
                          <div className="text-3xl font-bold text-green-400">
                            {currentTime.toLocaleTimeString()}
                          </div>
                          <div className="text-lg text-slate-300">
                            {currentTime.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Space Theme Promotion Selector */}
                  <div className="p-4">
                    <div className="space-theme-card p-6 rounded-xl">
                      <div className="flex items-center gap-6">
                        <div className="p-3 space-neon-border rounded-lg">
                          <Award className="h-8 w-8 text-green-400" />
                        </div>
                        <label className="text-xl font-semibold text-white">
                          🎯 Select Promotion to Display
                        </label>
                        <Select value={selectedTvPromotion} onValueChange={setSelectedTvPromotion}>
                          <SelectTrigger className="w-80 h-12 space-theme-card text-white hover:space-neon-border transition-all">
                            <SelectValue placeholder="Choose a promotion..." />
                          </SelectTrigger>
                          <SelectContent className="space-theme-card border-blue-500/30">
                            {promotions.filter((p: any) => !p.deleted).map((promotion: any) => (
                              <SelectItem key={promotion.id} value={promotion.id.toString()} className="text-white hover:bg-blue-600/20">
                                🚀 {promotion.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* TV Display URL Section */}
                  <div className="p-4">
                    <div className="space-theme-card p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                            🌐 TV Display URL
                          </h3>
                          <div className="p-3 space-neon-border rounded-lg bg-slate-800/50">
                            <code className="text-green-400 text-sm break-all">
                              {typeof window !== 'undefined' ? `${window.location.origin}/tv-display.html` : 'https://your-domain.com/tv-display.html'}
                            </code>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button
                            onClick={async () => {
                              const tvUrl = `${window.location.origin}/tv-display.html`;
                              try {
                                await navigator.clipboard.writeText(tvUrl);
                                // Could add toast notification here
                              } catch (err) {
                                console.error('Failed to copy URL:', err);
                              }
                            }}
                            className="space-theme-card space-neon-border bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-white"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-blue-300">
                        💡 <strong>For TV Setup:</strong> Open this URL in your TV browser and press F11 for full-screen mode
                      </div>
                    </div>
                  </div>

                  {selectedTvPromotion && (() => {
                    const promotion = promotions.find((p: any) => p.id.toString() === selectedTvPromotion);
                    if (!promotion) return null;

                    const startDate = new Date(promotion.start_date);
                    const endDate = new Date(promotion.end_date);
                    const now = new Date();
                    const isActive = now >= startDate && now <= endDate;
                    const isUpcoming = now < startDate;
                    
                    // Calculate days remaining or days until start
                    const daysRemaining = isUpcoming 
                      ? Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                      : Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Calculate leaderboard
                    const promotionSessions = cashGameHistory.filter(session => {
                      const sessionDate = new Date(session.date);
                      return sessionDate >= startDate && sessionDate <= endDate;
                    });

                    const playerStats: Record<number, any> = {};
                    promotionSessions.forEach(session => {
                      const playerId = session.player_id;
                      if (!playerStats[playerId]) {
                        playerStats[playerId] = {
                          playerId,
                          name: players.find(p => p.id === playerId)?.name || 'Unknown',
                          totalHours: 0,
                          sessions: 0
                        };
                      }
                      // Calculate duration from seat_in_time and seat_out_time, fallback to duration field
                      const durationMinutes = session.seat_in_time && session.seat_out_time 
                        ? (new Date(session.seat_out_time).getTime() - new Date(session.seat_in_time).getTime()) / (1000 * 60)
                        : (session.duration || 0) * 60;
                      playerStats[playerId].totalHours += durationMinutes / 60;
                      playerStats[playerId].sessions += 1;
                    });

                    const leaderboard = Object.values(playerStats)
                      .sort((a: any, b: any) => b.totalHours - a.totalHours)
                      .slice(0, 10); // Top 10

                    const totalPlayers = Object.keys(playerStats).length;

                    return (
                      <div className="px-4 space-y-6">
                        {/* POKER PROMOTION HEADER */}
                        <div className="space-theme-card p-8 rounded-2xl">
                          <div className="text-center space-y-6">
                            <h2 className="text-5xl font-bold text-white mb-6">
                              🌌 {promotion.name}
                            </h2>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="text-center p-4 space-neon-border rounded-xl">
                                <div className="text-blue-400 font-semibold mb-2">🛸 Launch Date</div>
                                <div className="text-white text-xl font-bold">{startDate.toLocaleDateString()}</div>
                              </div>
                              
                              <div className="text-center p-4 space-neon-border rounded-xl">
                                <div className="text-red-400 font-semibold mb-2">🔚 Promotion End</div>
                                <div className="text-white text-xl font-bold">{endDate.toLocaleDateString()}</div>
                              </div>
                              
                              <div className="text-center p-4 space-neon-border rounded-xl">
                                <div className="text-green-400 font-semibold mb-2">
                                  ⏳ {isUpcoming ? 'T-Minus Days' : 'Days Left'}
                                </div>
                                <div className={`text-2xl font-bold ${
                                  isUpcoming ? 'text-cyan-400' :
                                  daysRemaining > 7 ? 'text-green-400' : 
                                  daysRemaining > 3 ? 'text-yellow-400' : 
                                  'text-red-400'
                                }`}>
                                  {isUpcoming ? 
                                    (daysRemaining > 0 ? `${daysRemaining}` : 'LAUNCH!') :
                                    isActive ? 
                                      (daysRemaining > 0 ? `${daysRemaining}` : 'FINAL ORBIT!') :
                                      'PROMOTION COMPLETE'
                                  }
                                </div>
                              </div>
                              
                              <div className="text-center p-4 space-neon-border rounded-xl">
                                <div className="text-amber-400 font-semibold mb-2">🎰 Players</div>
                                <div className="text-white text-2xl font-bold">{totalPlayers}</div>
                              </div>
                            </div>
                            
                            <div className="flex justify-center">
                              <Badge className={`text-lg px-6 py-2 space-neon-border ${
                                isUpcoming ? 'text-cyan-400' :
                                isActive ? 'text-green-400' : 
                                'text-red-400'
                              }`}>
                                {isUpcoming ? '🎯 PROMOTION PREPARING' : 
                                 isActive ? '🎰 PROMOTION ACTIVE' : 
                                 '✅ PROMOTION COMPLETE'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* SPACE THEME LEADERBOARD */}
                          <div className="lg:col-span-2">
                            <div className="space-theme-card rounded-2xl overflow-hidden">
                              <div className="p-6 space-neon-border border-b">
                                <h3 className="text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
                                  🏆 PLAYER RANKINGS 🏆
                                </h3>
                              </div>
                              
                              <div className="p-6">
                                {leaderboard.length > 0 ? (
                                  <div className="space-y-4">
                                    {leaderboard.map((player: any, index: number) => (
                                      <div 
                                        key={player.playerId}
                                        className="flex items-center justify-between p-4 space-neon-border rounded-xl hover:bg-blue-500/10 transition-all"
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                                            index === 0 ? 'bg-yellow-500/20 text-yellow-400 space-neon-border' :
                                            index === 1 ? 'bg-gray-400/20 text-gray-300 space-neon-border' :
                                            index === 2 ? 'bg-amber-600/20 text-amber-400 space-neon-border' :
                                            'bg-blue-500/20 text-blue-400'
                                          }`}>
                                            {index === 0 ? '🥇' :
                                             index === 1 ? '🥈' :
                                             index === 2 ? '🥉' :
                                             (index + 1)
                                            }
                                          </div>
                                          
                                          <div>
                                            <div className="text-xl font-bold text-white">
                                              👨‍🚀 {player.name}
                                            </div>
                                            <div className="text-slate-400">{player.sessions} sessions</div>
                                          </div>
                                        </div>
                                        
                                        <div className="text-right">
                                          <div className="text-2xl font-bold text-green-400">
                                            {player.totalHours.toFixed(1)}h
                                          </div>
                                          <div className="text-slate-400 text-sm">play time</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-12 space-neon-border rounded-xl">
                                    <Trophy className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                                    <p className="text-2xl font-bold text-white mb-2">🎰 Awaiting Players</p>
                                    <p className="text-slate-400">Player rankings will appear here</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* POKER PROMOTION INFO */}
                          <div className="space-y-6">
                            {/* POKER RULES CARD */}
                            <div className="space-theme-card rounded-xl overflow-hidden">
                              <div className="p-4 space-neon-border border-b flex items-center justify-between">
                                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                  📋 Promotion Rules
                                </h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingTvCard(editingTvCard === 'rules' ? null : 'rules')}
                                  className="text-blue-400 hover:text-white hover:bg-blue-500/20"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="p-4">
                                {editingTvCard === 'rules' ? (
                                  <div className="space-y-4">
                                    <textarea
                                      value={tvRules}
                                      onChange={(e) => setTvRules(sanitizeTVContent(e.target.value))}
                                      className="w-full h-32 p-3 space-theme-card space-neon-border rounded-lg text-white resize-none"
                                      placeholder="🎰 Enter promotion rules here..."
                                    />
                                    <Button
                                      onClick={() => setEditingTvCard(null)}
                                      className="w-full space-neon-border bg-blue-600/20 hover:bg-blue-600/30 text-white"
                                    >
                                      💾 Save Protocol
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-white whitespace-pre-wrap leading-relaxed">
                                    {tvRules || '🎰 Click edit to add promotion rules...'}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* POKER REWARDS CARD */}
                            <div className="space-theme-card rounded-xl overflow-hidden">
                              <div className="p-4 space-neon-border border-b flex items-center justify-between">
                                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                  🏆 Promotion Prizes
                                </h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingTvCard(editingTvCard === 'prices' ? null : 'prices')}
                                  className="text-green-400 hover:text-white hover:bg-green-500/20"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="p-4">
                                {editingTvCard === 'prices' ? (
                                  <div className="space-y-4">
                                    <textarea
                                      value={tvPrices}
                                      onChange={(e) => setTvPrices(sanitizeTVContent(e.target.value))}
                                      className="w-full h-32 p-3 space-theme-card space-neon-border rounded-lg text-white resize-none"
                                      placeholder="🏆 Enter reward details here..."
                                    />
                                    <Button
                                      onClick={() => setEditingTvCard(null)}
                                      className="w-full space-neon-border bg-green-600/20 hover:bg-green-600/30 text-white"
                                    >
                                      💰 Save Rewards
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-white whitespace-pre-wrap leading-relaxed">
                                    {tvPrices || '🏆 Click edit to add reward information...'}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* TV ROTATION SETTINGS CARD */}
                            <div className="space-theme-card rounded-xl overflow-hidden">
                              <div className="p-4 space-neon-border border-b">
                                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                  ⏰ Promotion Rotation Settings
                                </h4>
                              </div>
                              
                              <div className="p-4 space-y-4">
                                <div className="text-sm text-blue-300 mb-4">
                                  Configure how long each promotion displays on TV (in seconds). Set to 0 to exclude from rotation.
                                </div>
                                
                                {promotions.filter((p: any) => !p.deleted && (
                                  getPromotionStatus(p.start_date, p.end_date) === 'active' ||
                                  getPromotionStatus(p.start_date, p.end_date) === 'upcoming'
                                )).map((promotion: any) => {
                                  const rotationSettings = JSON.parse(localStorage.getItem('pokerClubTvRotationSettings') || '{}');
                                  const currentTimeMs = rotationSettings[promotion.id] || 10000; // Default 10 seconds in ms
                                  const currentTime = Math.floor(currentTimeMs / 1000); // Convert to seconds for display
                                  
                                  return (
                                    <div key={promotion.id} className="flex items-center justify-between p-3 space-theme-card rounded-lg space-neon-border">
                                      <div className="flex-1">
                                        <div className="text-white font-medium">{promotion.name}</div>
                                        <div className="text-sm text-slate-400">
                                          {getPromotionStatus(promotion.start_date, promotion.end_date) === 'active' ? '🎰 Active' : '🎯 Upcoming'}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-3">
                                        <Input
                                          type="number"
                                          min="0"
                                          max="300"
                                          value={currentTime}
                                          onChange={(e) => {
                                            const newTime = parseInt(e.target.value) || 0;
                                            const settings = JSON.parse(localStorage.getItem('pokerClubTvRotationSettings') || '{}');
                                            settings[promotion.id] = newTime * 1000; // Convert to milliseconds
                                            localStorage.setItem('pokerClubTvRotationSettings', JSON.stringify(settings));
                                          }}
                                          className="w-20 h-8 space-theme-card space-neon-border text-center text-white"
                                          placeholder="10"
                                        />
                                        <span className="text-blue-300 text-sm min-w-[60px]">
                                          {currentTime === 0 ? 'Disabled' : `${currentTime}s`}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {promotions.filter((p: any) => !p.deleted && (
                                  getPromotionStatus(p.start_date, p.end_date) === 'active' ||
                                  getPromotionStatus(p.start_date, p.end_date) === 'upcoming'
                                )).length === 0 && (
                                  <div className="text-center text-slate-400 py-8">
                                    No active or upcoming promotions to configure
                                  </div>
                                )}
                                
                                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg space-neon-border">
                                  <div className="text-sm text-blue-300">
                                    💡 <strong>Tips:</strong>
                                    <ul className="mt-2 space-y-1 text-xs">
                                      <li>• Set time to 0 to exclude a promotion from TV rotation</li>
                                      <li>• Recommended: 10-30 seconds per promotion</li>
                                      <li>• Changes apply immediately to the TV display</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings />
                      Club Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-w-2xl">
                      <div>
                        <h4 className="font-semibold mb-3">Club Information</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-muted-foreground mb-1">Club Name</label>
                            <Input
                              type="text"
                              placeholder="Enter club name"
                              value={clubSettings.clubName}
                              onChange={(e) => setClubSettings({ ...clubSettings, clubName: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-muted-foreground mb-1">Location</label>
                            <Input
                              type="text"
                              placeholder="Enter location"
                              value={clubSettings.location}
                              onChange={(e) => setClubSettings({ ...clubSettings, location: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Game Settings</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-muted-foreground mb-1">Stakes</label>
                            <Input
                              type="text"
                              placeholder="e.g., 1/2, 2/5, 5/10"
                              value={clubSettings.stakes}
                              onChange={(e) => setClubSettings({ ...clubSettings, stakes: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-muted-foreground mb-1">Currency</label>
                              <Select
                                value={clubSettings.currency}
                                onValueChange={(value) => setClubSettings({ ...clubSettings, currency: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="EUR">EUR (€)</SelectItem>
                                  <SelectItem value="GBP">GBP (£)</SelectItem>
                                  <SelectItem value="CAD">CAD ($)</SelectItem>
                                  <SelectItem value="AUD">AUD ($)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm text-muted-foreground mb-1">Timezone</label>
                              <Select
                                value={clubSettings.timezone}
                                onValueChange={(value) => setClubSettings({ ...clubSettings, timezone: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                  <SelectItem value="Europe/London">London</SelectItem>
                                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Settings are automatically saved
                        </div>
                        <Button
                          onClick={() => {
                            alert(`Club settings saved!\n\nClub: ${clubSettings.clubName}\nLocation: ${clubSettings.location || 'Not set'}\nStakes: ${clubSettings.stakes || 'Not set'}`);
                          }}
                        >
                          View Settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Management Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign />
                      Data Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Export Data</h4>
                        <p className="text-sm text-muted-foreground mb-3">Download all your data as a JSON file for backup</p>
                        <Button
                          onClick={() => {
                            const data = {
                              players,
                              promotions,
                              cashGameHistory,
                              clubSettings,
                              exportDate: new Date().toISOString()
                            };
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `poker-club-backup-${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                          }}
                        >
                          Export All Data
                        </Button>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Import Data</h4>
                        <p className="text-sm text-muted-foreground mb-3">Restore data from a previously exported JSON file</p>
                        <Input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                try {
                                  const data = JSON.parse(event.target?.result as string);
                                  if (confirm('This will replace all current data. Are you sure?')) {
                                    // Note: Database import functionality would need to be implemented
                                    // For now, we only update local settings
                                    if (data.clubSettings) setClubSettings(data.clubSettings);
                                    alert('Local settings imported successfully! Database import not yet implemented.');
                                  }
                                } catch (error) {
                                  alert('Error importing data. Please check the file format.');
                                  console.error(error);
                                }
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Clear Data</h4>
                        <p className="text-sm text-muted-foreground mb-3">Remove all stored data and start fresh</p>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                              if (confirm('Final confirmation: This will delete ALL data including players, promotions, and history. Continue?')) {
                                if (typeof window !== 'undefined') {
                                  localStorage.removeItem('pokerClubPlayers');
                                  localStorage.removeItem('pokerClubPromotions');
                                  localStorage.removeItem('pokerClubHistory');
                                  localStorage.removeItem('pokerClubSettings');
                                  localStorage.removeItem('pokerClubActiveTables');
                                }
                                // Clear active tables
                                setActiveTables([]);
                                setClubSettings({
                                  clubName: 'Poker Club',
                                  location: '',
                                  stakes: '',
                                  tableLimit: '',
                                  currency: 'USD',
                                  timezone: 'America/New_York'
                                });
                                // Database data will be cleared via Supabase dashboard
                                alert('Local data has been cleared. To clear database data, use the Supabase dashboard.');
                              }
                            }
                          }}
                        >
                          Clear All Data
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Backup & Restore Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign />
                      Backup & Restore
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Backup Statistics */}
                      {backupStats && (
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">Backup Statistics</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total Backups:</span>
                              <div className="font-medium">{backupStats.totalBackups}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Latest Backup:</span>
                              <div className="font-medium">
                                {backupStats.latestBackup 
                                  ? new Date(backupStats.latestBackup).toLocaleDateString()
                                  : 'None'
                                }
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Auto Backups:</span>
                              <div className="font-medium">
                                {backupStats.automaticBackupsEnabled ? 'Enabled' : 'Disabled'}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Storage Used:</span>
                              <div className="font-medium">
                                {Math.round(backupStats.totalSize / 1024)} KB
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Create Backup */}
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Create Backup</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Create a complete backup of your app and database data
                        </p>
                        <Button
                          onClick={createBackup}
                          disabled={backupLoading}
                          className="w-full"
                        >
                          {backupLoading ? 'Creating Backup...' : 'Create Backup Now'}
                        </Button>
                      </div>

                      {/* Available Backups */}
                      {availableBackups.length > 0 && (
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">Available Backups</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Manage your existing backups
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {availableBackups.slice(0, 5).map((backup, index) => (
                              <div key={backup.timestamp} className="flex items-center justify-between p-2 bg-background rounded border">
                                <div>
                                  <div className="font-medium text-sm">
                                    Backup #{availableBackups.length - index}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(backup.timestamp).toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => exportBackup(backup)}
                                    disabled={backupLoading}
                                  >
                                    Export
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => restoreBackup(backup)}
                                    disabled={backupLoading}
                                  >
                                    Restore
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteBackup(backup.timestamp)}
                                    disabled={backupLoading}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {availableBackups.length > 5 && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Showing latest 5 of {availableBackups.length} backups
                            </div>
                          )}
                        </div>
                      )}

                      {/* Import Backup */}
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Import Backup</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Import a previously exported backup file
                        </p>
                        <Input
                          type="file"
                          accept=".json"
                          onChange={importBackupFile}
                          disabled={backupLoading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* End Session Confirmation Dialog */}
      <Dialog open={confirmEndSession !== null} onOpenChange={(open) => !open && setConfirmEndSession(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              End Session Confirmation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to end the session for {confirmEndSession?.playerName}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <div className="text-sm text-muted-foreground">
              This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Record the session duration</li>
                <li>Update player statistics</li>
                <li>End the active session</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isProcessingEndSession}
                onClick={confirmEndSessionAction}
              >
                {isProcessingEndSession ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                {isProcessingEndSession ? 'Processing...' : 'Yes, End Session'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmEndSession(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PokerClubDashboard;
