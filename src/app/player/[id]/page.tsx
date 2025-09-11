"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { ArrowLeft, Clock, TrendingUp, Trophy, Calendar, Minus, Plus } from "lucide-react";
import { useSyncDatabase } from "../../../hooks/use-sync-database";
import { DatabaseService } from "../../../lib/supabase";

export default function PlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const playerId = parseInt(params.id as string);
  
  const { 
    players, 
    sessions: allSessions, 
    promotions
  } = useSyncDatabase();
  
  const [player, setPlayer] = useState<any>(null);
  const [playerSessions, setPlayerSessions] = useState<any[]>([]);
  const [playerPenalties, setPlayerPenalties] = useState<any[]>([]);
  const [playerAddons, setPlayerAddons] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState<{
    totalSessions: number;
    totalHours: string;
    averageHours: string;
    rawSessionHours: number;
    penaltyHours: number;
    addonHours: number;
  }>({
    totalSessions: 0,
    totalHours: '0',
    averageHours: '0',
    rawSessionHours: 0,
    penaltyHours: 0,
    addonHours: 0
  });

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (players.length > 0) {
        const foundPlayer = players.find(p => p.id === playerId);
        setPlayer(foundPlayer);
        
        if (foundPlayer) {
          // Filter sessions for this specific player
          const sessions = allSessions.filter(s => s.player_id === foundPlayer.id);
          setPlayerSessions(sessions);
          
          // Fetch penalties and addons for this player
          try {
            const [penalties, addons] = await Promise.all([
              DatabaseService.getPenalties().then(all => all.filter(p => p.player_id === foundPlayer.id)),
              DatabaseService.getAddons().then(all => all.filter(a => a.player_id === foundPlayer.id))
            ]);
            setPlayerPenalties(penalties);
            setPlayerAddons(addons);
            
            // Calculate detailed stats
            const totalSessions = sessions.length;
            const rawSessionHours = sessions.reduce((sum, session) => {
              return sum + (session.duration || 0) / 60;
            }, 0);
            
            const penaltyHours = penalties.reduce((sum, p) => sum + (p.penalty_minutes / 60), 0);
            const addonHours = addons.reduce((sum, a) => sum + (a.bonus_minutes / 60), 0);
            
            // Use the player's database totalHours (which includes penalties/addons)
            const finalTotalHours = foundPlayer.totalHours || 0;
            
            setPlayerStats({
              totalSessions,
              totalHours: finalTotalHours.toFixed(1),
              averageHours: totalSessions > 0 ? (rawSessionHours / totalSessions).toFixed(1) : '0',
              rawSessionHours: rawSessionHours,
              penaltyHours: penaltyHours,
              addonHours: addonHours
            });
          } catch (error) {
            console.error('Error fetching player penalties/addons:', error);
          }
        }
      }
    };
    
    fetchPlayerData();
  }, [players, allSessions, playerId]);

  if (!player) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>Player not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{player.name}</h1>
      </div>

      {/* Player Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.totalSessions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Final Total Hours</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{playerStats.totalHours || 0}</div>
            <p className="text-xs text-muted-foreground">After penalties & bonuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.rawSessionHours?.toFixed(1) || 0}</div>
            <p className="text-xs text-muted-foreground">From active sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penalties</CardTitle>
            <Minus className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{playerStats.penaltyHours?.toFixed(1) || 0}</div>
            <p className="text-xs text-muted-foreground">{playerPenalties.length} penalties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonuses</CardTitle>
            <Plus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{playerStats.addonHours?.toFixed(1) || 0}</div>
            <p className="text-xs text-muted-foreground">{playerAddons.length} bonuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Session</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.averageHours || 0}h</div>
            <p className="text-xs text-muted-foreground">Per session</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sessions, penalties, and bonuses in chronological order
          </p>
        </CardHeader>
        <CardContent>
          {(() => {
            // Combine all activities with timestamps
            const activities = [];
            
            // Add sessions
            playerSessions.forEach(session => {
              activities.push({
                type: 'session',
                date: new Date(session.date),
                data: session
              });
            });
            
            // Add penalties
            playerPenalties.forEach(penalty => {
              activities.push({
                type: 'penalty',
                date: new Date(penalty.date_applied),
                data: penalty
              });
            });
            
            // Add addons
            playerAddons.forEach(addon => {
              activities.push({
                type: 'addon',
                date: new Date(addon.date_applied),
                data: addon
              });
            });
            
            // Sort by date (most recent first)
            activities.sort((a, b) => b.date.getTime() - a.date.getTime());
            
            if (activities.length === 0) {
              return <p className="text-muted-foreground">No activity found for this player.</p>;
            }
            
            return (
              <div className="space-y-3">
                {activities.slice(0, 15).map((activity) => {
                  if (activity.type === 'session') {
                    const session = activity.data;
                    const hours = (session.duration || 0) / 60;
                    return (
                      <div key={`session-${session.id}`} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Session</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.date).toLocaleDateString()} • {new Date(session.seat_in_time).toLocaleTimeString()} - {new Date(session.seat_out_time).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-blue-600">+{hours.toFixed(1)}h</p>
                          <Badge variant="secondary">Session</Badge>
                        </div>
                      </div>
                    );
                  } else if (activity.type === 'penalty') {
                    const penalty = activity.data;
                    const hours = penalty.penalty_minutes / 60;
                    return (
                      <div key={`penalty-${penalty.id}`} className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50 dark:bg-red-950/20">
                        <div className="flex items-center gap-3">
                          <Minus className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="font-medium">Penalty</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(penalty.date_applied).toLocaleDateString()} • {penalty.reason}
                            </p>
                            {penalty.reason_type && (
                              <p className="text-xs text-muted-foreground">
                                {penalty.reason_type.replace('_', ' ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">-{hours.toFixed(1)}h</p>
                          <Badge variant="destructive">Penalty</Badge>
                        </div>
                      </div>
                    );
                  } else if (activity.type === 'addon') {
                    const addon = activity.data;
                    const hours = addon.bonus_minutes / 60;
                    return (
                      <div key={`addon-${addon.id}`} className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
                        <div className="flex items-center gap-3">
                          <Plus className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">Bonus</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(addon.date_applied).toLocaleDateString()} • {addon.reason}
                            </p>
                            {addon.reason_type && (
                              <p className="text-xs text-muted-foreground">
                                {addon.reason_type.replace('_', ' ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+{hours.toFixed(1)}h</p>
                          <Badge className="bg-green-600 hover:bg-green-700">Bonus</Badge>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
                {activities.length > 15 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Showing latest 15 activities of {activities.length} total
                  </p>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}