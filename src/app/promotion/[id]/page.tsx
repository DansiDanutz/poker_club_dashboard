"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy, Calendar, Users, Clock, CalendarDays, Timer, Settings, FileText, CheckCircle, Edit3, Save, X, Filter, ArrowUpDown, ArrowUp, ArrowDown, Search, History } from "lucide-react";
import { Player, Session, Promotion } from "@/types";

const supabase = createClient(
  "https://pewwxyyxcepvluowvaxh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs"
);

interface PlayerStats {
  player: Player;
  hours: number;
  sessions: number;
  position: number;
}

export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const promotionId = parseInt(params.id as string);
  
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [sessionFilters, setSessionFilters] = useState({
    playerName: "",
    sortBy: "date",
    sortOrder: "desc" as "asc" | "desc",
    showFilters: false
  });
  const [managementData, setManagementData] = useState({
    eligibilityRules: [
      "Players must be registered before promotion start date",
      "Minimum session duration: 30 minutes", 
      "Maximum 12 hours per day counting towards promotion",
      "All sessions must be properly logged in/out",
      "Players must follow club rules and etiquette"
    ],
    scoringRules: [
      "Hours are calculated to the nearest minute",
      "Penalties are deducted from total hours",
      "Bonus time may be added for special circumstances", 
      "Final leaderboard is calculated at promotion end",
      "Ties are broken by total number of sessions"
    ],
    prizeStructure: {
      first: { title: "1st Place", subtitle: "Champion", prize: "" },
      second: { title: "2nd Place", subtitle: "Runner-up", prize: "" },
      third: { title: "3rd Place", subtitle: "Third Place", prize: "" }
    },
    additionalRecognition: [
      "Top 10 players receive certificates",
      "All participants receive loyalty points", 
      "Special recognition for most improved player",
      "Participation badges for profile"
    ],
    managementNotes: {
      dataCollection: "All session data is automatically tracked and verified through the poker club management system.",
      disputeResolution: "Any disputes regarding hours or rankings should be reported to club management within 24 hours of the issue.",
      fairPlay: "The club reserves the right to disqualify players for unsportsmanlike conduct or rule violations.",
      finalResults: "Official results will be announced within 48 hours of promotion end date."
    }
  });

  const fetchPromotionData = async () => {
    try {
      setLoading(true);

      // Fetch promotion details
      const { data: promotionData, error: promotionError } = await supabase
        .from("promotions")
        .select("*")
        .eq("id", promotionId)
        .single();

      if (promotionError) {
        throw new Error(`Failed to fetch promotion: ${promotionError.message}`);
      }
      
      setPromotion(promotionData);

      // Fetch all players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .order("total_hours", { ascending: false });

      if (playersError) {
        throw new Error(`Failed to fetch players: ${playersError.message}`);
      }

      // Fetch all sessions within promotion date range
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .gte("date", promotionData.start_date)
        .lte("date", promotionData.end_date);

      if (sessionsError) {
        throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
      }

      // Store all sessions for history display
      setAllSessions(sessionsData || []);

      // Calculate player statistics for this promotion
      const playerStatsMap = new Map<number, { hours: number; sessions: number }>();
      
      sessionsData?.forEach((session: any) => {
        const existing = playerStatsMap.get(session.player_id) || { hours: 0, sessions: 0 };
        playerStatsMap.set(session.player_id, {
          hours: existing.hours + session.duration,
          sessions: existing.sessions + 1
        });
      });

      // Create final stats array with only players who participated
      const participatingPlayerStats = playersData
        ?.filter((player: Player) => playerStatsMap.has(player.id))
        .map((player: Player) => {
          const stats = playerStatsMap.get(player.id)!;
          return {
            player,
            hours: stats.hours,
            sessions: stats.sessions,
            position: 0 // Will be set after sorting
          };
        })
        .sort((a, b) => b.hours - a.hours)
        .map((stat, index) => ({
          ...stat,
          position: index + 1
        })) || [];

      setPlayerStats(participatingPlayerStats);

    } catch (error) {
      console.error("Error fetching promotion data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (promotionId && !isNaN(promotionId)) {
      fetchPromotionData();
    } else {
      setLoading(false);
    }
  }, [promotionId]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round((minutes % 60) * 100) / 100;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Session filtering and sorting
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = allSessions;

    // Filter by player name
    if (sessionFilters.playerName.trim()) {
      filtered = filtered.filter(session =>
        session.player_name.toLowerCase().includes(sessionFilters.playerName.toLowerCase())
      );
    }

    // Sort sessions
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sessionFilters.sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "player":
          comparison = a.player_name.localeCompare(b.player_name);
          break;
        case "duration":
          comparison = a.duration - b.duration;
          break;
        default:
          comparison = 0;
      }

      return sessionFilters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [allSessions, sessionFilters]);

  const calculateRemainingDays = () => {
    const today = new Date();
    const endDate = new Date(promotion!.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleSaveManagement = async () => {
    try {
      // Here you would save to database or localStorage
      console.log("Saving management data:", managementData);
      
      // For now, we'll just save to localStorage
      localStorage.setItem(`promotion_${promotionId}_management`, JSON.stringify(managementData));
      
      setIsEditing(false);
      
      // Show success message (you can add a toast here)
      alert("Management details saved successfully!");
    } catch (error) {
      console.error("Error saving management data:", error);
      alert("Error saving management details. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Optionally reload data from localStorage or database
  };

  const updateEligibilityRule = (index: number, value: string) => {
    const newRules = [...managementData.eligibilityRules];
    newRules[index] = value;
    setManagementData(prev => ({ ...prev, eligibilityRules: newRules }));
  };

  const updateScoringRule = (index: number, value: string) => {
    const newRules = [...managementData.scoringRules];
    newRules[index] = value;
    setManagementData(prev => ({ ...prev, scoringRules: newRules }));
  };

  const updateAdditionalRecognition = (index: number, value: string) => {
    const newRecognition = [...managementData.additionalRecognition];
    newRecognition[index] = value;
    setManagementData(prev => ({ ...prev, additionalRecognition: newRecognition }));
  };

  const updateManagementNote = (field: keyof typeof managementData.managementNotes, value: string) => {
    setManagementData(prev => ({
      ...prev,
      managementNotes: { ...prev.managementNotes, [field]: value }
    }));
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return <Badge className="bg-yellow-500 text-black">🥇 1st</Badge>;
    if (position === 2) return <Badge className="bg-gray-400 text-black">🥈 2nd</Badge>;
    if (position === 3) return <Badge className="bg-amber-600 text-white">🥉 3rd</Badge>;
    if (position <= 10) return <Badge variant="secondary">Top 10</Badge>;
    return <Badge variant="outline">#{position}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading promotion data...</div>
        </div>
      </div>
    );
  }

  if (!loading && !promotion) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64 flex-col space-y-4">
          <div className="text-lg text-red-500">Promotion not found</div>
          <div className="text-sm text-muted-foreground">Promotion ID: {promotionId}</div>
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

  const isExpired = new Date(promotion!.end_date) < new Date();
  const remainingDays = calculateRemainingDays();
  const topTen = playerStats.slice(0, 10);
  const remaining = playerStats.slice(10);

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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8" />
            {promotion!.name}
          </h1>
          <p className="text-muted-foreground">Promotion Details & Leaderboard</p>
        </div>
      </div>

      {/* Promotion Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {isExpired ? (
                <Badge variant="destructive">ENDED</Badge>
              ) : promotion!.active ? (
                <Badge className="bg-green-600">ACTIVE</Badge>
              ) : (
                <Badge variant="secondary">INACTIVE</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Start Date</CardTitle>
            <CalendarDays className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatDate(promotion!.start_date)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatFullDate(promotion!.start_date).split(',')[0]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">End Date</CardTitle>
            <CalendarDays className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatDate(promotion!.end_date)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatFullDate(promotion!.end_date).split(',')[0]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {isExpired ? (
                <span className="text-red-500">Ended</span>
              ) : remainingDays === 0 ? (
                <span className="text-orange-500">Last Day</span>
              ) : (
                <span className="text-blue-600">{remainingDays} days</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isExpired ? "Promotion completed" : "Until end date"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{playerStats.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {playerStats.reduce((sum, stat) => sum + stat.sessions, 0)} total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatDuration(playerStats.reduce((sum, stat) => sum + stat.hours, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All participants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Promotion Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Management
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="default" size="sm" onClick={handleSaveManagement}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Promotion Details
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {promotion!.name} - Management Details
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button variant="default" size="sm" onClick={handleSaveManagement}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {isEditing ? "Edit rules, requirements, and management information for this promotion." : "Complete rules, requirements, and management information for this promotion."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Promotion Overview */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Promotion Overview
                  </h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p><strong>Name:</strong> {promotion!.name}</p>
                    <p><strong>Duration:</strong> {formatFullDate(promotion!.start_date)} - {formatFullDate(promotion!.end_date)}</p>
                    <p><strong>Status:</strong> {isExpired ? 'Completed' : promotion!.active ? 'Active' : 'Inactive'}</p>
                    <p><strong>Total Participants:</strong> {playerStats.length} players</p>
                    <p><strong>Total Sessions:</strong> {playerStats.reduce((sum, stat) => sum + stat.sessions, 0)} sessions</p>
                    <p><strong>Total Hours Played:</strong> {formatDuration(playerStats.reduce((sum, stat) => sum + stat.hours, 0))}</p>
                  </div>
                </div>

                {/* Rules and Requirements */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Rules & Requirements
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Eligibility Requirements:</h4>
                        {isEditing ? (
                          <div className="space-y-2">
                            {managementData.eligibilityRules.map((rule, index) => (
                              <Input
                                key={index}
                                value={rule}
                                onChange={(e) => updateEligibilityRule(index, e.target.value)}
                                className="text-sm"
                                placeholder={`Eligibility rule ${index + 1}`}
                              />
                            ))}
                          </div>
                        ) : (
                          <ul className="text-sm space-y-1 list-disc list-inside">
                            {managementData.eligibilityRules.map((rule, index) => (
                              <li key={index}>{rule}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Scoring System:</h4>
                        {isEditing ? (
                          <div className="space-y-2">
                            {managementData.scoringRules.map((rule, index) => (
                              <Input
                                key={index}
                                value={rule}
                                onChange={(e) => updateScoringRule(index, e.target.value)}
                                className="text-sm"
                                placeholder={`Scoring rule ${index + 1}`}
                              />
                            ))}
                          </div>
                        ) : (
                          <ul className="text-sm space-y-1 list-disc list-inside">
                            {managementData.scoringRules.map((rule, index) => (
                              <li key={index}>{rule}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prize Structure */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Prize Structure
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-yellow-100 rounded-lg">
                        <div className="text-2xl mb-1">🥇</div>
                        <div className="font-semibold">1st Place</div>
                        <div className="text-sm text-muted-foreground">Champion</div>
                      </div>
                      <div className="text-center p-3 bg-gray-100 rounded-lg">
                        <div className="text-2xl mb-1">🥈</div>
                        <div className="font-semibold">2nd Place</div>
                        <div className="text-sm text-muted-foreground">Runner-up</div>
                      </div>
                      <div className="text-center p-3 bg-amber-100 rounded-lg">
                        <div className="text-2xl mb-1">🥉</div>
                        <div className="font-semibold">3rd Place</div>
                        <div className="text-sm text-muted-foreground">Third Place</div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm">
                      <p><strong>Additional Recognition:</strong></p>
                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          {managementData.additionalRecognition.map((item, index) => (
                            <Input
                              key={index}
                              value={item}
                              onChange={(e) => updateAdditionalRecognition(index, e.target.value)}
                              className="text-sm"
                              placeholder={`Recognition item ${index + 1}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {managementData.additionalRecognition.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Management Notes */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    Management Notes
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm space-y-4">
                      <div>
                        <p className="font-medium mb-2">Data Collection:</p>
                        {isEditing ? (
                          <Input
                            value={managementData.managementNotes.dataCollection}
                            onChange={(e) => updateManagementNote('dataCollection', e.target.value)}
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm">{managementData.managementNotes.dataCollection}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-medium mb-2">Dispute Resolution:</p>
                        {isEditing ? (
                          <Input
                            value={managementData.managementNotes.disputeResolution}
                            onChange={(e) => updateManagementNote('disputeResolution', e.target.value)}
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm">{managementData.managementNotes.disputeResolution}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-medium mb-2">Fair Play:</p>
                        {isEditing ? (
                          <Input
                            value={managementData.managementNotes.fairPlay}
                            onChange={(e) => updateManagementNote('fairPlay', e.target.value)}
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm">{managementData.managementNotes.fairPlay}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-medium mb-2">Final Results:</p>
                        {isEditing ? (
                          <Input
                            value={managementData.managementNotes.finalResults}
                            onChange={(e) => updateManagementNote('finalResults', e.target.value)}
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm">{managementData.managementNotes.finalResults}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {isEditing ? "View Mode" : "Edit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Players */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 10 Players
          </CardTitle>
          <CardDescription>Leading players in this promotion</CardDescription>
        </CardHeader>
        <CardContent>
          {topTen.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Sessions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTen.map((stat) => (
                  <TableRow key={stat.player.id}>
                    <TableCell>{getPositionBadge(stat.position)}</TableCell>
                    <TableCell className="font-medium">{stat.player.name}</TableCell>
                    <TableCell>{formatDuration(stat.hours)}</TableCell>
                    <TableCell>{stat.sessions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No participants found for this promotion
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remaining Players */}
      {remaining.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Other Participants</CardTitle>
            <CardDescription>
              Positions {topTen.length + 1} and below ({remaining.length} players)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Sessions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remaining.map((stat) => (
                  <TableRow key={stat.player.id}>
                    <TableCell>{getPositionBadge(stat.position)}</TableCell>
                    <TableCell className="font-medium">{stat.player.name}</TableCell>
                    <TableCell>{formatDuration(stat.hours)}</TableCell>
                    <TableCell>{stat.sessions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Session History
              </CardTitle>
              <CardDescription>
                All sessions during this promotion ({filteredAndSortedSessions.length} sessions)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSessionFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {sessionFilters.showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          {sessionFilters.showFilters && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Player Name Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Player</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter player name..."
                      value={sessionFilters.playerName}
                      onChange={(e) => setSessionFilters(prev => ({ ...prev, playerName: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort by</label>
                  <Select
                    value={sessionFilters.sortBy}
                    onValueChange={(value) => setSessionFilters(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sort field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="player">Player Name</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort Order</label>
                  <Button
                    variant="outline"
                    onClick={() => setSessionFilters(prev => ({ 
                      ...prev, 
                      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" 
                    }))}
                    className="w-full justify-start"
                  >
                    {sessionFilters.sortOrder === "asc" ? (
                      <ArrowUp className="h-4 w-4 mr-2" />
                    ) : (
                      <ArrowDown className="h-4 w-4 mr-2" />
                    )}
                    {sessionFilters.sortOrder === "asc" ? "Ascending" : "Descending"}
                  </Button>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSessionFilters(prev => ({ 
                    ...prev, 
                    playerName: "", 
                    sortBy: "date", 
                    sortOrder: "desc" 
                  }))}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Sessions Table */}
          {filteredAndSortedSessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSessionFilters(prev => ({ 
                      ...prev, 
                      sortBy: "date",
                      sortOrder: prev.sortBy === "date" && prev.sortOrder === "desc" ? "asc" : "desc"
                    }))}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      {sessionFilters.sortBy === "date" && (
                        sessionFilters.sortOrder === "desc" ? 
                        <ArrowDown className="h-4 w-4" /> : 
                        <ArrowUp className="h-4 w-4" />
                      )}
                      {sessionFilters.sortBy !== "date" && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSessionFilters(prev => ({ 
                      ...prev, 
                      sortBy: "player",
                      sortOrder: prev.sortBy === "player" && prev.sortOrder === "desc" ? "asc" : "desc"
                    }))}
                  >
                    <div className="flex items-center gap-2">
                      Player
                      {sessionFilters.sortBy === "player" && (
                        sessionFilters.sortOrder === "desc" ? 
                        <ArrowDown className="h-4 w-4" /> : 
                        <ArrowUp className="h-4 w-4" />
                      )}
                      {sessionFilters.sortBy !== "player" && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>Seat In</TableHead>
                  <TableHead>Seat Out</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSessionFilters(prev => ({ 
                      ...prev, 
                      sortBy: "duration",
                      sortOrder: prev.sortBy === "duration" && prev.sortOrder === "desc" ? "asc" : "desc"
                    }))}
                  >
                    <div className="flex items-center gap-2">
                      Duration
                      {sessionFilters.sortBy === "duration" && (
                        sessionFilters.sortOrder === "desc" ? 
                        <ArrowDown className="h-4 w-4" /> : 
                        <ArrowUp className="h-4 w-4" />
                      )}
                      {sessionFilters.sortBy !== "duration" && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>Day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{formatDate(session.date)}</TableCell>
                    <TableCell className="font-medium">{session.player_name}</TableCell>
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {sessionFilters.playerName.trim() ? 
                `No sessions found for "${sessionFilters.playerName}"` : 
                "No sessions found for this promotion"
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
