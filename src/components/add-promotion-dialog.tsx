"use client";

import { useState, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Button, Input, Label } from "./ui";
import { Plus } from 'lucide-react';

interface AddPromotionDialogProps {
  onAddPromotion: (promotion: { name: string; startDate: string; endDate: string }) => void;
}

export const AddPromotionDialog = memo(function AddPromotionDialog({ onAddPromotion }: AddPromotionDialogProps) {
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
        <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-label="Create new promotion form">
          <div className="space-y-2">
            <Label htmlFor="name">Promotion Name *</Label>
            <Input
              id="name"
              value={promotion.name}
              onChange={(e) => setPromotion({ ...promotion, name: e.target.value })}
              placeholder="Enter promotion name"
              required
              aria-describedby="promotion-name-help"
              aria-required="true"
            />
            <div id="promotion-name-help" className="sr-only">Enter a descriptive name for the promotion period</div>
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
                aria-describedby="start-date-help"
                aria-required="true"
              />
              <div id="start-date-help" className="sr-only">Select the start date for the promotion period</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={promotion.endDate}
                onChange={(e) => setPromotion({ ...promotion, endDate: e.target.value })}
                required
                aria-describedby="end-date-help"
                aria-required="true"
              />
              <div id="end-date-help" className="sr-only">Select the end date for the promotion period</div>
            </div>
          </div>
          <div className="flex justify-end space-x-2" role="group" aria-label="Form actions">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              aria-label="Cancel creating new promotion"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              aria-label="Create new promotion period"
            >
              Create Promotion
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});
