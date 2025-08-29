import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Event } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface EventConfirmationModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedDate: Date) => void;
}

export const EventConfirmationModal = ({ 
  event, 
  isOpen, 
  onClose, 
  onConfirm 
}: EventConfirmationModalProps) => {
  const [selectedDate, setSelectedDate] = useState<string>(event.candidateDates[0]?.toISOString() || '');

  const handleConfirm = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      onConfirm(date);
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
              value={selectedDate} 
              onValueChange={setSelectedDate}
              className="mt-3"
            >
              {event.candidateDates.map((date, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={date.toISOString()} 
                    id={`date-${index}`}
                  />
                  <Label 
                    htmlFor={`date-${index}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {format(date, 'M月d日(E) HH:mm', { locale: ja })}
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
            disabled={!selectedDate}
          >
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};