"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { ArrowLeft, Clock, TrendingUp, Trophy, Calendar } from "lucide-react";
import { useSyncDatabase } from "../../../hooks/use-sync-database";

export default function PlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;
  
  const { 
    players, 
    sessions: allSessions, 
    promotions,
    achievements 
  } = useSyncDatabase();
  
  const [player, setPlayer] = useState(null);
  const [playerSessions, setPlayerSessions] = useState([]);
  const [playerStats, setPlayerStats] = useState({});

  useEffect(() => {
    if (players.length > 0) {
      const foundPlayer = players.find(p => p.id === parseInt(playerId));
      setPlayer(foundPlayer);
      
      if (foundPlayer && allSessions.length > 0) {
        const sessions = allSessions.filter(s => 
          s.players?.some(sp => sp.id === foundPlayer.id)
        );
        setPlayerSessions(sessions);
        
        // Calculate stats
        const totalSessions = sessions.length;
        const totalHours = sessions.reduce((sum, session) => {
          const playerInSession = session.players?.find(sp => sp.id === foundPlayer.id);
          return sum + (playerInSession?.hoursPlayed || 0);
        }, 0);
        
        setPlayerStats({
          totalSessions,
          totalHours: totalHours.toFixed(1),
          averageHours: totalSessions > 0 ? (totalHours / totalSessions).toFixed(1) : 0
        });
      }
    }
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.totalHours || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.averageHours || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {playerSessions.length === 0 ? (
            <p className="text-muted-foreground">No sessions found for this player.</p>
          ) : (
            <div className="space-y-4">
              {playerSessions.slice(0, 10).map((session) => {
                const playerInSession = session.players?.find(sp => sp.id === player.id);
                return (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{session.date}</p>
                      <p className="text-sm text-muted-foreground">Table {session.table}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{playerInSession?.hoursPlayed || 0}h</p>
                      <Badge variant={session.isActive ? "default" : "secondary"}>
                        {session.isActive ? "Active" : "Completed"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}