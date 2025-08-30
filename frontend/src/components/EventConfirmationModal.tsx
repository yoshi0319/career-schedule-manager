import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Event, TimeSlot } from '@/types';
import { formatTimeSlotWithDate, checkConfirmedEventConflict } from '@/lib/conflictDetection';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';

interface EventConfirmationModalProps {
  event: Event;
  allEvents: Event[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSlot: TimeSlot) => void;
  initialSelectedSlotIndex?: number;
}

export const EventConfirmationModal = ({ 
  event, 
  allEvents,
  isOpen, 
  onClose, 
  onConfirm,
  initialSelectedSlotIndex = 0
}: EventConfirmationModalProps) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(initialSelectedSlotIndex);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [conflictError, setConflictError] = useState<string>('');

  const selectedSlot = event.candidateSlots[selectedSlotIndex];
  
  // 選択された候補日の詳細時間オプションを生成（10分刻み）
  const generateTimeOptions = (slot: TimeSlot): string[] => {
    const options: string[] = [];
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    
    let currentTime = new Date(startTime);
    while (currentTime <= endTime) {
      options.push(currentTime.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      }));
      currentTime.setMinutes(currentTime.getMinutes() + 10);
    }
    
    return options;
  };

  const handleConfirm = () => {
    if (selectedSlot && selectedTime) {
      // 選択された時間からTimeSlotを作成
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const confirmedStartTime = new Date(selectedSlot.startTime);
      confirmedStartTime.setHours(hours, minutes, 0, 0);
      
      const confirmedEndTime = new Date(confirmedStartTime);
      confirmedEndTime.setMinutes(confirmedEndTime.getMinutes() + 30); // 30分の面接時間
      
      const confirmedSlot: TimeSlot = {
        startTime: confirmedStartTime,
        endTime: confirmedEndTime
      };

      // 確定時の重複チェック（確定済みイベントのみ）
      const otherEvents = allEvents.filter(e => e.id !== event.id);
      const conflictResult = checkConfirmedEventConflict(confirmedSlot, otherEvents);
      
      if (conflictResult.hasConflict) {
        const conflictingEvent = conflictResult.conflictingEvents[0];
        setConflictError(`この時間は「${conflictingEvent.companyName}」の予定と重複しています（前後30分を含む）。`);
        return;
      }
      
      onConfirm(confirmedSlot);
      onClose();
    }
  };

  const handleSlotChange = (index: number) => {
    setSelectedSlotIndex(index);
    setSelectedTime(''); // 時間選択をリセット
    setConflictError(''); // エラーをクリア
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setConflictError(''); // エラーをクリア
  };

  // モーダルが開かれた際に、選択された候補日を設定
  useEffect(() => {
    if (isOpen) {
      setSelectedSlotIndex(initialSelectedSlotIndex);
      setSelectedTime('');
      setConflictError('');
    }
  }, [isOpen, initialSelectedSlotIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event.title}の日程確定</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            {event.companyName}
          </div>
          
          {/* 候補日選択 */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              候補日を選択してください
            </Label>
            <RadioGroup 
              value={selectedSlotIndex.toString()} 
              onValueChange={(value) => handleSlotChange(parseInt(value))}
              className="mt-3"
            >
              {event.candidateSlots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={index.toString()} 
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

          {/* 詳細時間選択 */}
          {selectedSlot && (
            <div>
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                開始時間を選択してください（10分刻み）
              </Label>
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto p-3 border rounded-md">
                {generateTimeOptions(selectedSlot).map((time, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeSelect(time)}
                    className="w-full justify-start"
                  >
                    {time}
                  </Button>
                ))}
              </div>
              {selectedTime && (
                <div className="mt-2 text-sm text-muted-foreground">
                  選択時間: {selectedSlot.startTime.toLocaleDateString('ja-JP', {
                    month: 'numeric',
                    day: 'numeric',
                    weekday: 'short'
                  })} {selectedTime}〜
                </div>
              )}
            </div>
          )}
        </div>

        {/* エラー表示 */}
        {conflictError && (
          <Alert className="border-destructive bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <span className="font-medium">{conflictError}</span>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedSlot || !selectedTime}
          >
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};