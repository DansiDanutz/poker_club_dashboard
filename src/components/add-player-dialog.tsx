"use client";

import { useState, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Button, Input, Label } from "./ui";
import { Plus } from 'lucide-react';

interface AddPlayerDialogProps {
  onAddPlayer: (player: { name: string; email: string; phone: string }) => Promise<void>;
}

export const AddPlayerDialog = memo(function AddPlayerDialog({ onAddPlayer }: AddPlayerDialogProps) {
  const [open, setOpen] = useState(false);
  const [player, setPlayer] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = player.name.trim();

    if (!trimmedName) {
      setError('Please enter a player name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddPlayer({
        ...player,
        name: trimmedName
      });
      setPlayer({ name: '', email: '', phone: '' });
      setOpen(false);
    } catch (err: any) {
      // Display the error message to the user
      if (err.message?.includes('already exists')) {
        setError(err.message);
      } else {
        setError(err.message || 'Failed to add player. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={20} className="mr-2" />
          Add Player
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Add a new player to the poker club database. Name is required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-label="Add new player form">
          <div className="space-y-2">
            <Label htmlFor="name">Player Name *</Label>
            <Input
              id="name"
              value={player.name}
              onChange={(e) => {
                setPlayer({ ...player, name: e.target.value });
                setError(null); // Clear error when user types
              }}
              placeholder="Enter player name"
              required
              disabled={isSubmitting}
              aria-describedby={error ? "name-error" : "name-help"}
              aria-required="true"
              aria-invalid={!!error}
            />
            {error && (
              <div id="name-error" className="text-sm text-red-600" role="alert">
                {error}
              </div>
            )}
            <div id="name-help" className="text-xs text-gray-500">
              Player name must be unique - one account per player only
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={player.email}
              onChange={(e) => setPlayer({ ...player, email: e.target.value })}
              placeholder="Enter email address"
              disabled={isSubmitting}
              aria-describedby="email-help"
            />
            <div id="email-help" className="sr-only">Optional email address for player contact</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={player.phone}
              onChange={(e) => setPlayer({ ...player, phone: e.target.value })}
              placeholder="Enter phone number"
              disabled={isSubmitting}
              aria-describedby="phone-help"
            />
            <div id="phone-help" className="sr-only">Optional phone number for player contact</div>
          </div>
          <div className="flex justify-end space-x-2" role="group" aria-label="Form actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={isSubmitting}
              aria-label="Cancel adding new player"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              aria-label="Add new player to database"
            >
              {isSubmitting ? 'Adding...' : 'Add Player'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});
