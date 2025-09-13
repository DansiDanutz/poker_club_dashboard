"use client";

import React, { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Eye, Trash2 } from 'lucide-react';
import { Player } from '../types';

interface MemoizedPlayerTableProps {
  players: Player[];
  activeTables: any[];
  onViewPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: number) => void;
}

export const MemoizedPlayerTable = memo(function MemoizedPlayerTable({
  players,
  activeTables,
  onViewPlayer,
  onDeletePlayer
}: MemoizedPlayerTableProps) {
  return (
    <Table role="table" aria-label="Player rankings and statistics">
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Rank</TableHead>
          <TableHead scope="col">Name</TableHead>
          <TableHead scope="col">Total Hours</TableHead>
          <TableHead scope="col">Sessions</TableHead>
          <TableHead scope="col">Avg Session</TableHead>
          <TableHead scope="col">Last Played</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Actions</TableHead>
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
              ? player.sessions[player.sessions.length - 1]
              : null;

            return (
              <TableRow key={player.id} className={player.isSeated ? 'bg-green-50 dark:bg-green-950/20' : ''} role="row">
                <TableCell className="font-medium" scope="row">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary" aria-label={`Player rank ${index + 1}`}>#{index + 1}</span>
                    {player.isSeated && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" aria-label="Player is currently seated">
                        Seated
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium" aria-label={`Player name: ${player.name}`}>{player.name}</div>
                  {player.email && (
                    <div className="text-sm text-muted-foreground" aria-label={`Email: ${player.email}`}>{player.email}</div>
                  )}
                </TableCell>
                <TableCell className="font-mono" aria-label={`Total hours played: ${player.totalHours.toFixed(1)} hours`}>
                  {player.totalHours.toFixed(1)}h
                </TableCell>
                <TableCell aria-label={`Total sessions: ${player.sessions?.length || 0}`}>
                  {player.sessions?.length || 0}
                </TableCell>
                <TableCell className="font-mono" aria-label={`Average session duration: ${avgSession.toFixed(1)} hours`}>
                  {avgSession.toFixed(1)}h
                </TableCell>
                <TableCell aria-label={`Last played: ${lastSession ? new Date(lastSession.date).toLocaleDateString() : 'Never'}`}>
                  {lastSession ? (
                    <div className="text-sm">
                      <div>{new Date(lastSession.date).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        {lastSession.duration ? `${(lastSession.duration / 60).toFixed(1)}h` : 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={player.isSeated ? "default" : "secondary"} aria-label={`Player status: ${player.isSeated ? "Active" : "Available"}`}>
                    {player.isSeated ? "Active" : "Available"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewPlayer(player)}
                      aria-label={`View details for ${player.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeletePlayer(player.id)}
                      aria-label={`Delete player ${player.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
});
