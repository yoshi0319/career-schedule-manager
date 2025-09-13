import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Event, TimeSlot, CandidateTimeSlot, InterviewTimeSlot } from '@/types';
import { formatTimeSlotWithDate, checkInterviewTimeConflict } from '@/lib/conflictDetection';
import { Clock, Calendar, AlertTriangle, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface EventConfirmationModalProps {
  event: Event;
  allEvents: Event[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSlot: InterviewTimeSlot) => void;
  initialSelectedSlotIndex?: number;
  interviewDuration?: number;
}

export const EventConfirmationModal = ({ 
  event, 
  allEvents,
  isOpen, 
  onClose, 
  onConfirm,
  initialSelectedSlotIndex = 0,
  interviewDuration = 30
}: EventConfirmationModalProps) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(initialSelectedSlotIndex);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [conflictError, setConflictError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const selectedSlot = event.candidate_slots[selectedSlotIndex];
  
  // メール用フォーマットを生成する関数
  const generateEmailFormat = (): string => {
    // 日付ごとに候補時間をグループ化
    const slotsByDate = new Map<string, CandidateTimeSlot[]>();
    
    event.candidate_slots.forEach(slot => {
      const dateKey = format(slot.start_time, 'M/d(E)', { locale: ja });
      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, []);
      }
      slotsByDate.get(dateKey)!.push(slot);
    });
    
    // 日付順でソート
    const sortedDates = Array.from(slotsByDate.keys()).sort((a, b) => {
      const dateA = event.candidate_slots.find(slot => format(slot.start_time, 'M/d(E)', { locale: ja }) === a)?.start_time;
      const dateB = event.candidate_slots.find(slot => format(slot.start_time, 'M/d(E)', { locale: ja }) === b)?.start_time;
      return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    });
    
    // フォーマット生成
    const lines = sortedDates.map(dateKey => {
      const slots = slotsByDate.get(dateKey)!;
      const timeRanges = slots
        .sort((a, b) => a.start_time.getTime() - b.start_time.getTime())
        .map(slot => {
          const startTime = format(slot.start_time, 'HH:mm', { locale: ja });
          
          // 候補時間の長さを計算（分）
          const slotDuration = Math.round((slot.end_time.getTime() - slot.start_time.getTime()) / 60000);
          
          // 候補時間が予定時間と同じ場合、開始時間のみ表示
          if (slotDuration === interviewDuration) {
            return startTime;
          }
          
          // 候補時間が予定時間より長い場合、終了時間から予定時間分を引いた時間を表示
          if (slotDuration > interviewDuration) {
            const adjustedEndTime = new Date(slot.end_time.getTime() - interviewDuration * 60000);
            const endTime = format(adjustedEndTime, 'HH:mm', { locale: ja });
            return `${startTime}〜${endTime}`;
          }
          
          // 候補時間が予定時間より短い場合（通常は発生しないが、念のため）
          return `${startTime}〜${format(slot.end_time, 'HH:mm', { locale: ja })}`;
        })
        .join('、');
      
      return `・${dateKey} ${timeRanges}`;
    });
    
    return lines.join('\n');
  };

  // クリップボードにコピーする関数
  const handleCopyToClipboard = async () => {
    try {
      const emailFormat = generateEmailFormat();
      await navigator.clipboard.writeText(emailFormat);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };
  
  // 選択された候補時間帯から予定時間の開始時刻オプションを生成（5分刻み）
  const generateStartTimeOptions = (slot: CandidateTimeSlot): string[] => {
    const options: string[] = [];
    const startTime = new Date(slot.start_time);
    const endTime = new Date(slot.end_time);
    
    // 予定時間を考慮して終了時刻を調整
    const adjustedEndTime = new Date(endTime.getTime() - interviewDuration * 60 * 1000);
    
    let currentTime = new Date(startTime);
    while (currentTime <= adjustedEndTime) {
      options.push(currentTime.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      }));
      currentTime.setMinutes(currentTime.getMinutes() + 5);
    }
    
    return options;
  };

  const handleConfirm = () => {
    if (selectedSlot && selectedTime) {
      // 選択された時間から予定時間を作成
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const confirmedStartTime = new Date(selectedSlot.start_time);
      confirmedStartTime.setHours(hours, minutes, 0, 0);
      
      const confirmedEndTime = new Date(confirmedStartTime);
      confirmedEndTime.setMinutes(confirmedEndTime.getMinutes() + interviewDuration);
      
      const confirmedSlot: InterviewTimeSlot = {
        start_time: confirmedStartTime,
        end_time: confirmedEndTime
      };

      // 確定時の重複チェック（確定済み予定時間とのみ）
      const otherEvents = allEvents.filter(e => e.id !== event.id);
      const conflictResult = checkInterviewTimeConflict(confirmedSlot, otherEvents);
      
      if (conflictResult.hasConflict) {
        const conflictingEvent = conflictResult.conflictingEvents[0];
        setConflictError(`この時間は「${conflictingEvent.company_name}」の予定と重複しています（前後30分を含む）。`);
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
            {event.company_name}
          </div>
          
          {/* メール用フォーマット */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">メール用フォーマット</h3>
              <Button
                onClick={handleCopyToClipboard}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    コピー
                  </>
                )}
              </Button>
            </div>
            
            <div className="bg-muted/30 p-3 rounded border text-sm font-mono whitespace-pre-wrap">
              以下は開始時間です。{'\n'}{generateEmailFormat()}
            </div>
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
              {event.candidate_slots.map((slot, index) => (
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

          {/* 予定時間表示 */}
          {selectedSlot && (
            <div>
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                予定時間
              </Label>
              <div className="mt-2 text-sm text-muted-foreground">
                {interviewDuration}分
              </div>
            </div>
          )}

          {/* 開始時間選択 */}
          {selectedSlot && (
            <div>
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                予定開始時間を選択してください（5分刻み）
              </Label>
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto p-3 border rounded-md">
                {generateStartTimeOptions(selectedSlot).map((time, index) => (
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
                  選択した時間: {selectedSlot.start_time.toLocaleDateString('ja-JP', {
                    month: 'numeric',
                    day: 'numeric',
                    weekday: 'short'
                  })} {selectedTime}〜{(() => {
                    const [hours, minutes] = selectedTime.split(':').map(Number);
                    const startTime = new Date(selectedSlot.start_time);
                    startTime.setHours(hours, minutes, 0, 0);
                    const endTime = new Date(startTime.getTime() + interviewDuration * 60 * 1000);
                    return endTime.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  })()}
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
