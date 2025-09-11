"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ArrowLeft, Users, Clock, Trophy, Calendar } from "lucide-react";
import { useSyncDatabase } from "../../../hooks/use-sync-database";

export default function PromotionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const promotionId = params.id as string;
  
  const { 
    players, 
    sessions: allSessions, 
    promotions 
  } = useSyncDatabase();
  
  const [promotion, setPromotion] = useState(null);
  const [promotionStats, setPromotionStats] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (promotions.length > 0) {
      const foundPromotion = promotions.find(p => p.id === parseInt(promotionId));
      setPromotion(foundPromotion);
      
      if (foundPromotion && allSessions.length > 0 && players.length > 0) {
        // Filter sessions within promotion period
        const promotionSessions = allSessions.filter(session => {
          const sessionDate = new Date(session.date);
          const startDate = new Date(foundPromotion.startDate);
          const endDate = new Date(foundPromotion.endDate);
          return sessionDate >= startDate && sessionDate <= endDate;
        });

        // Calculate leaderboard
        const playerStats = {};
        promotionSessions.forEach(session => {
          session.players?.forEach(sessionPlayer => {
            const playerId = sessionPlayer.id;
            if (!playerStats[playerId]) {
              playerStats[playerId] = {
                playerId,
                name: players.find(p => p.id === playerId)?.name || 'Unknown',
                totalHours: 0,
                sessions: 0
              };
            }
            playerStats[playerId].totalHours += sessionPlayer.hoursPlayed || 0;
            playerStats[playerId].sessions += 1;
          });
        });

        const sortedLeaderboard = Object.values(playerStats)
          .sort((a, b) => b.totalHours - a.totalHours);

        setLeaderboard(sortedLeaderboard);
        setPromotionStats({
          totalSessions: promotionSessions.length,
          totalPlayers: Object.keys(playerStats).length,
          totalHours: Object.values(playerStats).reduce((sum, player) => sum + player.totalHours, 0)
        });
      }
    }
  }, [promotions, allSessions, players, promotionId]);

  if (!promotion) {
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
            <p>Promotion not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = new Date() >= new Date(promotion.startDate) && new Date() <= new Date(promotion.endDate);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{promotion.name}</h1>
          <p className="text-muted-foreground">{promotion.description}</p>
        </div>
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Completed"}
        </Badge>
      </div>

      {/* Promotion Info */}
      <Card>
        <CardHeader>
          <CardTitle>Promotion Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Start Date</p>
              <p className="text-lg">{new Date(promotion.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">End Date</p>
              <p className="text-lg">{new Date(promotion.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prize</p>
              <p className="text-lg">{promotion.prize || 'TBD'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Requirements</p>
              <p className="text-lg">{promotion.requirements || 'Play hours'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotionStats.totalPlayers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotionStats.totalSessions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(promotionStats.totalHours || 0).toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-muted-foreground">No participants yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((player, index) => (
                <div key={player.playerId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-muted-foreground">{player.sessions} sessions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{player.totalHours.toFixed(1)}h</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}