"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock, Calendar, Trophy, AlertTriangle, Plus } from "lucide-react";
import { Player, Session, Achievement, Penalty, Addon, Promotion } from "@/types";

const supabase = createClient(
  "https://pewwxyyxcepvluowvaxh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs"
);

export default function PlayerHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = parseInt(params.id as string);
  
  console.log("PlayerHistoryPage - params:", params);
  console.log("PlayerHistoryPage - playerId:", playerId);

  const [player, setPlayer] = useState<Player | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [endedPromotions, setEndedPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      console.log("Starting data fetch for player ID:", playerId);

      // Fetch player details
      console.log("Fetching player details...");
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId)
        .single();

      if (playerError) {
        console.error("Player error details:", playerError);
        throw new Error(`Failed to fetch player: ${playerError.message || playerError.details || JSON.stringify(playerError)}`);
      }
      
      console.log("Player data received:", playerData);
      setPlayer(playerData);

      // Fetch sessions
      console.log("Fetching sessions...");
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("player_id", playerId)
        .order("date", { ascending: false });

      if (sessionsError) {
        console.error("Sessions error details:", sessionsError);
        throw new Error(`Failed to fetch sessions: ${sessionsError.message || sessionsError.details || JSON.stringify(sessionsError)}`);
      }
      
      console.log("Sessions data received:", sessionsData?.length || 0, "sessions");
      setSessions(sessionsData || []);

      // Fetch achievements
      console.log("Fetching achievements...");
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("player_id", playerId)
        .order("date", { ascending: false });

      if (achievementsError && achievementsError.code !== 'PGRST116') {
        console.warn("Achievements table not found (this is expected if not using achievements feature)");
        // Don't throw for achievements - table might not exist yet
      }
      
      console.log("Achievements data received:", achievementsData?.length || 0, "achievements");
      setAchievements(achievementsData || []);

      // Fetch penalties
      console.log("Fetching penalties...");
      const { data: penaltiesData, error: penaltiesError } = await supabase
        .from("penalties")
        .select("*")
        .eq("player_id", playerId)
        .order("date_applied", { ascending: false });

      if (penaltiesError && penaltiesError.code !== 'PGRST116') {
        console.error("Penalties error details:", penaltiesError);
        // Don't throw for penalties - table might not exist yet
      }
      
      console.log("Penalties data received:", penaltiesData?.length || 0, "penalties");
      setPenalties(penaltiesData || []);

      // Fetch addons
      console.log("Fetching addons...");
      const { data: addonsData, error: addonsError } = await supabase
        .from("addons")
        .select("*")
        .eq("player_id", playerId)
        .order("date_applied", { ascending: false });

      if (addonsError && addonsError.code !== 'PGRST116') {
        console.error("Addons error details:", addonsError);
        // Don't throw for addons - table might not exist yet
      }
      
      console.log("Addons data received:", addonsData?.length || 0, "addons");
      setAddons(addonsData || []);

      // Fetch active promotions
      console.log("Fetching active promotions...");
      const today = new Date().toISOString().split('T')[0];
      const { data: promotionsData, error: promotionsError } = await supabase
        .from("promotions")
        .select("*")
        .eq("active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("start_date", { ascending: false });

      if (promotionsError && promotionsError.code !== 'PGRST116') {
        console.error("Promotions error details:", promotionsError);
        // Don't throw for promotions - just log the error
      }
      
      console.log("Active promotions data received:", promotionsData?.length || 0, "promotions");
      setActivePromotions(promotionsData || []);

      // Fetch ended promotions (for player history)
      console.log("Fetching ended promotions...");
      const { data: endedPromotionsData, error: endedPromotionsError } = await supabase
        .from("promotions")
        .select("*")
        .lt("end_date", today)
        .order("end_date", { ascending: false })
        .limit(10); // Show last 10 ended promotions

      if (endedPromotionsError && endedPromotionsError.code !== 'PGRST116') {
        console.error("Ended promotions error details:", endedPromotionsError);
        // Don't throw for ended promotions - just log the error
      }
      
      console.log("Ended promotions data received:", endedPromotionsData?.length || 0, "ended promotions");
      setEndedPromotions(endedPromotionsData || []);

      console.log("✅ All data fetched successfully");

    } catch (error) {
      console.error("❌ Error fetching player data:", error);
      console.error("Player ID:", playerId);
      console.error("Supabase connection error");
      console.error("Error details:", error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered - playerId:", playerId, "isNaN:", isNaN(playerId));
    if (playerId && !isNaN(playerId)) {
      console.log("About to call fetchPlayerData...");
      fetchPlayerData();
    } else {
      console.error("Invalid player ID:", params.id);
      setLoading(false);
    }
  }, [playerId]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round((minutes % 60) * 100) / 100; // Round to 2 decimal places
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate total hours across all sessions
  const getTotalStats = () => {
    const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0);
    return { sessions: sessions.length, hours: totalHours };
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date.startsWith(today));
    const todayHours = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    return { sessions: todaySessions.length, hours: todayHours };
  };

  // Calculate hours for active promotions
  const getActivePromotionStats = () => {
    if (activePromotions.length === 0) return [];
    
    return activePromotions.map(promotion => {
      const promotionSessions = sessions.filter(s => {
        const sessionDate = s.date;
        return sessionDate >= promotion.start_date && sessionDate <= promotion.end_date;
      });
      const promotionHours = promotionSessions.reduce((sum, s) => sum + s.duration, 0);
      
      return {
        promotion,
        sessions: promotionSessions.length,
        hours: promotionHours
      };
    });
  };

  // Calculate hours for ended promotions (player history)
  const getEndedPromotionStats = () => {
    if (endedPromotions.length === 0) return [];
    
    return endedPromotions.map(promotion => {
      const promotionSessions = sessions.filter(s => {
        const sessionDate = s.date;
        return sessionDate >= promotion.start_date && sessionDate <= promotion.end_date;
      });
      const promotionHours = promotionSessions.reduce((sum, s) => sum + s.duration, 0);
      
      return {
        promotion,
        sessions: promotionSessions.length,
        hours: promotionHours
      };
    }).filter(stat => stat.hours > 0); // Only show promotions where player participated
  };

  // Calculate sessions outside of any promotion
  const getNonPromotionStats = () => {
    const allPromotions = [...activePromotions, ...endedPromotions];
    const nonPromoSessions = sessions.filter(session => {
      return !allPromotions.some(promo => 
        session.date >= promo.start_date && session.date <= promo.end_date
      );
    });
    const nonPromoHours = nonPromoSessions.reduce((sum, s) => sum + s.duration, 0);
    
    return {
      sessions: nonPromoSessions.length,
      hours: nonPromoHours
    };
  };

  const getTotalPenalties = () => {
    return penalties.reduce((sum, p) => sum + p.penalty_minutes, 0);
  };

  const getTotalAddons = () => {
    return addons.reduce((sum, a) => sum + a.bonus_minutes, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading player data...</div>
        </div>
      </div>
    );
  }

  if (!loading && !player) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64 flex-col space-y-4">
          <div className="text-lg text-red-500">Player not found</div>
          <div className="text-sm text-muted-foreground">Player ID: {playerId}</div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const totalStats = getTotalStats();
  const todayStats = getTodayStats();
  const activePromotionStats = getActivePromotionStats();
  const endedPromotionStats = getEndedPromotionStats();
  const nonPromotionStats = getNonPromotionStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{player?.name}</h1>
          <p className="text-muted-foreground">Player Details & History</p>
        </div>
      </div>

      {/* Player Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalStats.hours * 60)}</div>
            <p className="text-xs text-muted-foreground">{totalStats.sessions} total sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Hours</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(todayStats.hours * 60)}</div>
            <p className="text-xs text-muted-foreground">{todayStats.sessions} sessions today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penalties</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTotalPenalties() > 0 ? (
                <span className="text-red-500">-{getTotalPenalties()}m</span>
              ) : (
                <span className="text-muted-foreground">0m</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{penalties.length} penalties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonus Time</CardTitle>
            <Plus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTotalAddons() > 0 ? (
                <span className="text-green-500">+{getTotalAddons()}m</span>
              ) : (
                <span className="text-muted-foreground">0m</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{addons.length} bonuses</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Playing Activity */}
      {(activePromotionStats.length > 0 || nonPromotionStats.sessions > 0) && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Current Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Active Promotions */}
            {activePromotionStats.map(({ promotion, sessions: promSessions, hours }) => (
              <Card key={promotion.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{promotion.name}</CardTitle>
                  <Trophy className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(hours * 60)}</div>
                  <p className="text-xs text-muted-foreground">{promSessions} sessions</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
                  </div>
                  <div className="mt-1">
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Regular Play */}
            {nonPromotionStats.sessions > 0 && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Regular Sessions</CardTitle>
                  <Clock className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(nonPromotionStats.hours * 60)}</div>
                  <p className="text-xs text-muted-foreground">{nonPromotionStats.sessions} sessions</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Sessions outside promotional periods
                  </div>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-green-700 border-green-700">
                      Regular Play
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Promotion History */}
      {endedPromotionStats.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Promotion History</h2>
          <p className="text-muted-foreground">Previous promotions this player participated in</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {endedPromotionStats.map(({ promotion, sessions: promSessions, hours }) => (
              <Card key={promotion.id} className="border-l-4 border-l-gray-400 bg-muted/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium truncate">{promotion.name}</CardTitle>
                  <Trophy className="h-4 w-4 text-gray-500 flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatDuration(hours * 60)}</div>
                  <p className="text-xs text-muted-foreground">{promSessions} sessions</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
                  </div>
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Completed
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Hours Breakdown Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Hours Breakdown</CardTitle>
          <CardDescription>How your total playing time is distributed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Hours:</span>
              <span className="font-bold">{formatDuration(totalStats.hours * 60)}</span>
            </div>
            <hr />
            {activePromotionStats.map(({ promotion, hours, sessions: promSessions }) => (
              <div key={`active-${promotion.id}`} className="flex justify-between items-center text-sm">
                <span className="text-blue-600">• {promotion.name} (Active):</span>
                <span>{formatDuration(hours * 60)} ({promSessions} sessions)</span>
              </div>
            ))}
            {endedPromotionStats.map(({ promotion, hours, sessions: promSessions }) => (
              <div key={`ended-${promotion.id}`} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">• {promotion.name} (Completed):</span>
                <span>{formatDuration(hours * 60)} ({promSessions} sessions)</span>
              </div>
            ))}
            {nonPromotionStats.sessions > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600">• Regular Play:</span>
                <span>{formatDuration(nonPromotionStats.hours * 60)} ({nonPromotionStats.sessions} sessions)</span>
              </div>
            )}
            <hr />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Total Sessions:</span>
              <span>{totalStats.sessions}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Most recent playing sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Seat In</TableHead>
                  <TableHead>Seat Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 10).map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{formatDate(session.date)}</TableCell>
                    <TableCell>{formatTime(session.seat_in_time)}</TableCell>
                    <TableCell>{formatTime(session.seat_out_time)}</TableCell>
                    <TableCell>{formatDuration(session.duration * 60)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][session.day_of_week]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No sessions found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Promotion wins and rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promotion</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Medal</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievements.map((achievement) => (
                  <TableRow key={achievement.id}>
                    <TableCell>{achievement.promotionName}</TableCell>
                    <TableCell>#{achievement.position}</TableCell>
                    <TableCell>
                      <Badge variant={achievement.medal === 'Gold' ? 'default' : 'secondary'}>
                        {achievement.medal}
                      </Badge>
                    </TableCell>
                    <TableCell>{achievement.hours}h</TableCell>
                    <TableCell>{formatDate(achievement.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Penalties and Addons */}
      {(penalties.length > 0 || addons.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Time Adjustments</CardTitle>
            <CardDescription>Penalties and bonus time applied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Applied By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penalties.map((penalty) => (
                  <TableRow key={`penalty-${penalty.id}`}>
                    <TableCell>
                      <Badge variant="destructive">Penalty</Badge>
                    </TableCell>
                    <TableCell className="text-red-500">-{penalty.penalty_minutes}</TableCell>
                    <TableCell>{penalty.reason}</TableCell>
                    <TableCell>{penalty.applied_by || 'System'}</TableCell>
                    <TableCell>{formatDateTime(penalty.date_applied)}</TableCell>
                  </TableRow>
                ))}
                {addons.map((addon) => (
                  <TableRow key={`addon-${addon.id}`}>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Bonus
                      </Badge>
                    </TableCell>
                    <TableCell className="text-green-500">+{addon.bonus_minutes}</TableCell>
                    <TableCell>{addon.reason}</TableCell>
                    <TableCell>{addon.applied_by || 'System'}</TableCell>
                    <TableCell>{formatDateTime(addon.date_applied)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}