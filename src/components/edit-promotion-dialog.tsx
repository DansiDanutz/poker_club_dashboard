"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Edit2 } from "lucide-react";
import { DatabaseService } from "../lib/supabase";

interface EditPromotionDialogProps {
  promotion: any;
  onUpdate: () => void;
}

export function EditPromotionDialog({ promotion, onUpdate }: EditPromotionDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: promotion.name,
    startDate: promotion.start_date,
    endDate: promotion.end_date,
    active: promotion.active
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Reset form when promotion changes
    setFormData({
      name: promotion.name,
      startDate: promotion.start_date,
      endDate: promotion.end_date,
      active: promotion.active
    });
  }, [promotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert("Please fill in all fields");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert("Start date must be before end date");
      return;
    }

    setIsProcessing(true);

    try {
      const { supabase } = await import("../lib/supabase");

      const { data, error } = await supabase
        .from('promotions')
        .update({
          name: formData.name,
          start_date: formData.startDate,
          end_date: formData.endDate,
          active: formData.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotion.id)
        .select();

      if (error) {
        console.error('Error updating promotion:', error);
        alert('Failed to update promotion: ' + error.message);
      } else {
        console.log('Promotion updated:', data);
        alert('Promotion updated successfully!');
        setOpen(false);
        onUpdate(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating promotion:', error);
      alert('Error updating promotion');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Edit2 size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Promotion</DialogTitle>
            <DialogDescription>
              Update promotion details. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="e.g. Summer Tournament"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <select
                  id="active"
                  value={formData.active ? "active" : "inactive"}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === "active" }))}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? "Updating..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}