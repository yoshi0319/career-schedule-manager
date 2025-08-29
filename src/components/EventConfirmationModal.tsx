import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Event, TimeSlot } from '@/types';
import { formatTimeSlotWithDate } from '@/lib/conflictDetection';

interface EventConfirmationModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSlot: TimeSlot) => void;
}

export const EventConfirmationModal = ({ 
  event, 
  isOpen, 
  onClose, 
  onConfirm 
}: EventConfirmationModalProps) => {
  const [selectedSlot, setSelectedSlot] = useState<string>(
    event.candidateSlots[0] ? JSON.stringify(event.candidateSlots[0]) : ''
  );

  const handleConfirm = () => {
    if (selectedSlot) {
      const slot: TimeSlot = JSON.parse(selectedSlot);
      // Convert string dates back to Date objects
      const timeSlot: TimeSlot = {
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime)
      };
      onConfirm(timeSlot);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event.title}の日程確定</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {event.companyName}
          </div>
          
          <div>
            <Label className="text-base font-medium">希望日程を選択してください</Label>
            <RadioGroup 
              value={selectedSlot} 
              onValueChange={setSelectedSlot}
              className="mt-3"
            >
              {event.candidateSlots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={JSON.stringify(slot)} 
                    id={`slot-${index}`}
                  />
                  <Label 
                    htmlFor={`slot-${index}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {formatTimeSlotWithDate(slot)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedSlot}
          >
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};