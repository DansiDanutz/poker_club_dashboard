"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from 'lucide-react';

interface AddPromotionDialogProps {
  onAddPromotion: (promotion: { name: string; startDate: string; endDate: string }) => void;
}

export function AddPromotionDialog({ onAddPromotion }: AddPromotionDialogProps) {
  const [open, setOpen] = useState(false);
  const [promotion, setPromotion] = useState({ name: '', startDate: '', endDate: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotion.name || !promotion.startDate || !promotion.endDate) {
      alert('Please fill all fields');
      return;
    }
    onAddPromotion(promotion);
    setPromotion({ name: '', startDate: '', endDate: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={20} className="mr-2" />
          Create Promotion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Promotion</DialogTitle>
          <DialogDescription>
            Create a new promotion period to track player hours within specific date ranges.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Promotion Name *</Label>
            <Input
              id="name"
              value={promotion.name}
              onChange={(e) => setPromotion({ ...promotion, name: e.target.value })}
              placeholder="Enter promotion name"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={promotion.startDate}
                onChange={(e) => setPromotion({ ...promotion, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={promotion.endDate}
                onChange={(e) => setPromotion({ ...promotion, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Promotion</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
