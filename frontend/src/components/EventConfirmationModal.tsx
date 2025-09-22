import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Event, TimeSlot, CandidateTimeSlot, InterviewTimeSlot } from '@/types';
import { formatTimeSlotWithDate, checkInterviewTimeConflict } from '@/lib/conflictDetection';
import { Clock, Calendar, AlertTriangle, Copy, Check, Edit3, Save, X, RotateCcw } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { ja } from 'date-fns/locale';
import { apiClient } from '@/lib/api';

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
  const [includeEndAsStart, setIncludeEndAsStart] = useState<boolean>(false);
  
  // カスタムフォーマット編集用の状態
  const [isEditingFormat, setIsEditingFormat] = useState<boolean>(false);
  const [customFormat, setCustomFormat] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const selectedSlot = event.candidate_slots[selectedSlotIndex];
  
  // デフォルトフォーマットを生成する関数（トグルに応じてレンジ終端を切替）
  const generateDefaultFormat = (): string => {
    // 日付ごとに候補時間をグループ化
    const slotsByDate = new Map<string, CandidateTimeSlot[]>();
    event.candidate_slots.forEach(slot => {
      const dateKey = formatDate(slot.start_time, 'M/d(E)', { locale: ja });
      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, []);
      }
      slotsByDate.get(dateKey)!.push(slot);
    });

    // 日付ごとの時間レンジを生成
    const dateTimeList = Array.from(slotsByDate.entries()).map(([date, slots]) => {
      const timeList = slots.map(slot => {
        const startTime = formatDate(slot.start_time, 'HH:mm', { locale: ja });
        const rangeEnd = includeEndAsStart
          ? new Date(slot.end_time)
          : new Date(slot.end_time.getTime() - interviewDuration * 60000);
        const rangeEndText = formatDate(rangeEnd, 'HH:mm', { locale: ja });
        return `${startTime}〜${rangeEndText}`;
      }).join('、');

      return `・${date} ${timeList}`;
    }).join('\n');

    const note = includeEndAsStart
      ? '以下は開始時間です（終了も開始として含みます）。'
      : '以下は開始時間です（各候補の終了は開始受付の上限、最遅開始まで有効）。';
    return `${note}\n${dateTimeList}`;
  };
  
  // メール用フォーマットを生成する関数
  const generateEmailFormat = (): string => {
    // カスタムフォーマットが設定されている場合はそれを使用
    if (event.custom_email_format) {
      return event.custom_email_format;
    }
    
    // デフォルトフォーマット
    return generateDefaultFormat();
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

  // 編集モードを開始する関数
  const handleStartEdit = () => {
    setCustomFormat(event.custom_email_format || generateDefaultFormat());
    setIsEditingFormat(true);
  };

  // 編集をキャンセルする関数
  const handleCancelEdit = () => {
    setIsEditingFormat(false);
    setCustomFormat('');
  };

  // リセット機能（デフォルトに戻す）
  const handleResetFormat = () => {
    setShowResetConfirm(true);
  };

  // リセット確認
  const handleConfirmReset = () => {
    setCustomFormat(generateDefaultFormat());
    setShowResetConfirm(false);
  };

  // リセットキャンセル
  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  // カスタムフォーマットを保存する関数
  const handleSaveFormat = async () => {
    try {
      setIsSaving(true);
      await apiClient.updateEventEmailFormat(event.id, customFormat);
      // イベントオブジェクトを更新（実際のアプリではReact Queryで再取得）
      event.custom_email_format = customFormat;
      setIsEditingFormat(false);
    } catch (error) {
      console.error('フォーマットの保存に失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : 'フォーマットの保存に失敗しました。';
      // TODO: エラーモーダルを実装
      console.error(`エラー: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 選択された候補時間帯から予定時間の開始時刻オプションを生成（5分刻み）
  const generateStartTimeOptions = (slot: CandidateTimeSlot): string[] => {
    const options: string[] = [];
    const startTime = new Date(slot.start_time);
    const endTime = new Date(slot.end_time);
    
    // 予定時間を考慮した最遅開始の扱い
    // includeEndAsStart=true の場合は candidate.end も開始として含む
    const adjustedEndTime = includeEndAsStart
      ? endTime
      : new Date(endTime.getTime() - interviewDuration * 60 * 1000);
    
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
      // 候補内チェック
      // includeEndAsStart=true: 開始が候補内であればOK（終了は候補を超えても可）
      // false: 開始>=候補開始 かつ 終了<=候補終了
      const startInRange = confirmedStartTime >= selectedSlot.start_time && confirmedStartTime <= selectedSlot.end_time;
      const endInRange = confirmedEndTime <= selectedSlot.end_time;
      if (includeEndAsStart) {
        if (!startInRange) {
          setConflictError('選択した時間は候補時間の範囲外です。');
          return;
        }
      } else {
        if (!(startInRange && endInRange)) {
          setConflictError('選択した時間は候補時間の範囲外です。');
          return;
        }
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event.title}の日程確定</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 終了を開始として含むスイッチ */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2">
              開始時刻の扱い
            </Label>
            <div className="mt-2 flex items-center justify-between p-3 border rounded-md bg-muted/30">
              <div className="text-sm text-muted-foreground">
                終了時刻を開始として含む（例: 12:00〜18:00 でも 18:00 開始を許可）
              </div>
              <Switch checked={includeEndAsStart} onCheckedChange={setIncludeEndAsStart} />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {event.company_name}
          </div>
          
          {/* メール用フォーマット */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">メール用フォーマット</h3>
              <div className="flex gap-2">
                {!isEditingFormat ? (
                  <>
                    <Button
                      onClick={handleStartEdit}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      編集
                    </Button>
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
                  </>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      onClick={handleSaveFormat}
                      variant="default"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      disabled={isSaving}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {isSaving ? '保存中...' : '保存'}
                    </Button>
                    <Button
                      onClick={handleResetFormat}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      リセット
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      キャンセル
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {!isEditingFormat ? (
              <div className="bg-muted/30 p-3 rounded border text-sm font-mono whitespace-pre-wrap">
                {generateEmailFormat()}
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={customFormat}
                  onChange={(e) => setCustomFormat(e.target.value)}
                  placeholder="カスタムフォーマットを入力してください..."
                  className="min-h-[100px] font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  💡 ヒント: 自由にメールフォーマットを編集できます。保存するとこの予定専用のフォーマットとして使用されます。
                </div>
              </div>
            )}
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

    {/* リセット確認モーダル */}
    <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>リセット確認</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            デフォルトフォーマットに戻しますか？<br />
            現在の編集内容は失われます。
          </p>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancelReset}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={handleConfirmReset}>
            リセット
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
