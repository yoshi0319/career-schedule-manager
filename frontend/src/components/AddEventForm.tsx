import { useState } from 'react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, CalendarPlus, X, AlertTriangle, Calendar, Edit, Check } from 'lucide-react';
import { Company, Event, EventType, TimeSlot, CandidateTimeSlot, InterviewTimeSlot } from '@/types';
import { checkCandidateTimeSlotConflict, checkInterviewTimeConflict, checkConfirmedEventConflict, formatTimeSlotWithDate, addBufferToTimeSlot } from '@/lib/conflictDetection';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DateTimePicker } from '@/components/ui/date-time-picker';

const eventSchema = z.object({
  title: z.string().min(1, '予定名を入力してください'),
  companyId: z.string().min(1, '企業を選択してください'),
  type: z.enum(['interview', 'info_session', 'group_discussion', 'final_interview'] as const),
  isOnline: z.boolean(),
  location: z.string().optional(),
  notes: z.string().optional(),
  interviewDuration: z.number().min(15, '予定時間は15分以上にしてください').max(300, '予定時間は300分以下にしてください'),
});

type EventFormData = z.infer<typeof eventSchema>;

interface AddEventFormProps {
  companies: Company[];
  events: Event[];
  editEvent?: Event;
  onAddEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateEvent?: (eventId: string, event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose?: () => void;
}

const eventTypeOptions = [
  { value: 'interview', label: '面接' },
  { value: 'info_session', label: '説明会' },
  { value: 'group_discussion', label: 'グループディスカッション' },
  { value: 'final_interview', label: '最終面接' },
];

const interviewDurationOptions = [
  { value: 30, label: '30分' },
  { value: 45, label: '45分' },
  { value: 60, label: '60分' },
  { value: 'custom', label: 'その他' },
];

export const AddEventForm = ({ companies, events, editEvent, onAddEvent, onUpdateEvent, onClose }: AddEventFormProps) => {
  const [isOpen, setIsOpen] = useState(!!editEvent);
  const [candidateSlots, setCandidateSlots] = useState<CandidateTimeSlot[]>(editEvent?.candidate_slots || []);
  const [startTimeInput, setStartTimeInput] = useState<Date | undefined>(undefined);
  const [endTimeInput, setEndTimeInput] = useState<Date | undefined>(undefined);
  const [conflicts, setConflicts] = useState<{ hasConflict: boolean; conflictingEvents: Event[] }>({ hasConflict: false, conflictingEvents: [] });
  const [candidateAddError, setCandidateAddError] = useState<string>("");
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [modalStartTime, setModalStartTime] = useState<Date | undefined>(undefined);
  const [modalEndTime, setModalEndTime] = useState<Date | undefined>(undefined);
  const [modalInterviewDuration, setModalInterviewDuration] = useState<number>(30);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState<number>(30);

  const isEditMode = !!editEvent;
  const isConfirmed = isEditMode && editEvent?.status === 'confirmed';

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: editEvent?.title || '',
      companyId: editEvent?.company_id || '',
      type: editEvent?.type || 'interview',
      isOnline: editEvent?.is_online || false,
      location: editEvent?.location || '',
      notes: editEvent?.notes || '',
      interviewDuration: 30, // デフォルト30分
    },
  });

  // 編集モードでモーダルを開く
  React.useEffect(() => {
    if (editEvent) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [editEvent]);

  function timeSlotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
    return a.start_time < b.end_time && a.end_time > b.start_time;
  }

  // 予定時間に基づいて終了時間を自動計算
  const calculateEndTime = (startTime: Date, duration: number): Date => {
    return new Date(startTime.getTime() + duration * 60000); // 分をミリ秒に変換
  };

  // 現在の予定時間を取得（カスタムの場合はカスタム値、そうでなければ選択値）
  const getCurrentDuration = (): number => {
    const formDuration = form.watch('interviewDuration');
    return isCustomDuration ? customDuration : formDuration;
  };

  // 候補時間帯の追加時の競合チェック（確定済み予定時間とのみ）
  const checkCandidateSlotConflict = (newSlot: TimeSlot) => {
    const confirmedConflictResult = checkCandidateTimeSlotConflict(newSlot, events);
    setConflicts(confirmedConflictResult);
    return confirmedConflictResult.hasConflict;
  };

  const addCandidateSlot = () => {
    setCandidateAddError("");
    if (!startTimeInput || !endTimeInput) return;
    if (!(startTimeInput < endTimeInput)) return;

    const newSlot: CandidateTimeSlot = { start_time: startTimeInput, end_time: endTimeInput };

    // 確定済み面接時間との競合のみをチェック（候補時間帯は競合判定に使わない）
    if (checkCandidateSlotConflict(newSlot)) {
      setCandidateAddError("この時間帯は確定済みの予定時間と重複しています。");
      return;
    }

    // 同一イベント内での候補時間帯重複チェック
    for (const slot of candidateSlots) {
      if (timeSlotsOverlap(newSlot, slot)) {
        setCandidateAddError("既に追加済みの候補時間帯と重複しています。");
        return;
      }
    }

    setCandidateSlots(prev =>
      [...prev, newSlot].sort((a, b) => a.start_time.getTime() - b.start_time.getTime())
    );
    setStartTimeInput(undefined);
    setEndTimeInput(undefined);
  };

  const removeCandidateSlot = (index: number) => {
    setCandidateSlots(prev => prev.filter((_, i) => i !== index));
    setConflicts({ hasConflict: false, conflictingEvents: [] });
    setEditingSlotIndex(null);
  };

  const startEditSlot = (index: number) => {
    setEditingSlotIndex(index);
    const slot = candidateSlots[index];
    setModalStartTime(new Date(slot.start_time));
    setModalEndTime(new Date(slot.end_time));
    setModalInterviewDuration(Math.round((slot.end_time.getTime() - slot.start_time.getTime()) / 60000));
    setShowEditSlotModal(true);
  };

  const cancelEditSlot = () => {
    setStartTimeInput(undefined);
    setEndTimeInput(undefined);
    setEditingSlotIndex(null);
    setCandidateAddError("");
  };

  const updateCandidateSlot = () => {
    setCandidateAddError("");
    if (!modalStartTime || !modalEndTime || editingSlotIndex === null) return;
    if (!(modalStartTime < modalEndTime)) return;

    // 候補時間帯をそのまま保存（バッファは追加しない）
    const newSlot: TimeSlot = { start_time: modalStartTime, end_time: modalEndTime };

    const otherSlots = candidateSlots.filter((_, i) => i !== editingSlotIndex);

    const confirmedConflictResult = checkConfirmedEventConflict(newSlot, events);
    setConflicts(confirmedConflictResult);
    if (confirmedConflictResult.hasConflict) {
      return;
    }

    // 他企業の候補時間帯との重複チェック（30分バッファ付き）
    const allExistingCandidateSlots = events
      .filter(event => event.status === 'candidate' && event.id !== editEvent?.id)
      .flatMap(event => event.candidate_slots);
    
    for (const slot of allExistingCandidateSlots) {
      const bufferedSlot = addBufferToTimeSlot(slot);
      if (timeSlotsOverlap(newSlot, bufferedSlot)) {
        setCandidateAddError("他の企業の候補時間帯と重複しています（前後30分を含む）。");
        return;
      }
    }

    // 同一イベント内での候補時間帯重複チェック（バッファなし）
    for (const slot of otherSlots) {
      if (timeSlotsOverlap(newSlot, slot)) {
        setCandidateAddError("他の候補時間帯と重複しています。");
        return;
      }
    }

    setCandidateSlots(prev => {
      const updated = [...prev];
      updated[editingSlotIndex] = newSlot;
      return updated.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
    });

    setModalStartTime(undefined);
    setModalEndTime(undefined);
    setEditingSlotIndex(null);
    setShowEditSlotModal(false);
  };

  const onSubmit = (data: EventFormData) => {
    if (candidateSlots.length === 0) {
      return;
    }

    const selectedCompany = companies.find(c => c.id === data.companyId);
    if (!selectedCompany) return;

    const eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'> = {
      company_id: data.companyId,
      company_name: selectedCompany.name,
      title: data.title,
      type: data.type as EventType,
      status: editEvent?.status || 'candidate',
      candidate_slots: candidateSlots.sort((a, b) => a.start_time.getTime() - b.start_time.getTime()),
      confirmed_slot: editEvent?.confirmed_slot,
      is_online: data.isOnline,
      location: data.isOnline ? undefined : data.location,
      notes: data.notes,
    };

    if (isEditMode && editEvent && onUpdateEvent) {
      onUpdateEvent(editEvent.id, eventData);
    } else {
      onAddEvent(eventData);
    }
    handleClose();
  };

  const handleClose = () => {
    if (!isEditMode) {
      form.reset();
      setCandidateSlots([]);
    } else {
      setCandidateSlots(editEvent?.candidate_slots || []);
    }
    setStartTimeInput(undefined);
    setEndTimeInput(undefined);
    setConflicts({ hasConflict: false, conflictingEvents: [] });
    setCandidateAddError("");
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={isEditMode ? handleClose : setIsOpen}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button>
            <CalendarPlus className="h-4 w-4" />
            面接日程追加
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? '面接日程を編集' : '新しい面接日程を追加'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>企業</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="企業を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>予定名</FormLabel>
                  <FormControl>
                    <Input placeholder="一次面接、会社説明会など" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>予定タイプ</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interviewDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>予定時間</FormLabel>
                  <div className="space-y-2">
                    <Select 
                      value={isCustomDuration ? 'custom' : field.value.toString()} 
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          setIsCustomDuration(true);
                        } else {
                          setIsCustomDuration(false);
                          field.onChange(parseInt(value));
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {interviewDurationOptions.map(option => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isCustomDuration && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="15"
                          max="300"
                          value={customDuration}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 60;
                            setCustomDuration(value);
                            field.onChange(value);
                          }}
                          placeholder="分"
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">分</span>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isOnline"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">オンライン開催</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {!form.watch('isOnline') && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開催場所</FormLabel>
                    <FormControl>
                      <Input placeholder="東京オフィス、〇〇ビル など" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-4">
              <div>
                <FormLabel className="text-base font-medium">候補日程</FormLabel>
                <p className="text-sm text-muted-foreground mt-1">面接可能な日時を複数設定してください（5分刻みで選択可能）</p>
              </div>

              {editingSlotIndex === null && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setModalInterviewDuration(getCurrentDuration());
                    setShowAddSlotModal(true);
                  }} 
                  disabled={isConfirmed} 
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  時間枠を追加
                </Button>
              )}

              {(conflicts.hasConflict || candidateAddError) && (
                <Alert className="border-destructive bg-destructive/5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {candidateAddError ? (
                      <div className="space-y-2">
                        <span className="font-medium">{candidateAddError}</span>
                        <p className="text-sm opacity-90">移動時間や面接前後の準備時間を考慮して、前後30分のバッファを設けています。</p>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">この時間は以下の予定と重複しています（前後30分を含む）:</span>
                        <ul className="mt-2 ml-4 space-y-1">
                          {conflicts.conflictingEvents.map((event, idx) => (
                            <li key={idx} className="list-disc text-sm">
                              <span className="font-medium">{event.company_name}</span> - {event.title}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {isConfirmed && editEvent?.confirmed_slot && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">確定した日程（編集不可）</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white border-green-200">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">{formatTimeSlotWithDate(editEvent.confirmed_slot)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isConfirmed && candidateSlots.length > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">追加された候補日程 ({candidateSlots.length}件)</span>
                      </div>
                      <div className="space-y-2">
                        {candidateSlots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-white border-green-200">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">{formatTimeSlotWithDate(slot)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button type="button" variant="ghost" size="sm" onClick={() => startEditSlot(index)} disabled={isConfirmed} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeCandidateSlot(index)} disabled={isConfirmed} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {candidateSlots.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>候補日程を最低1つ追加してください</p>
                  <p className="text-xs mt-1">「時間枠を追加」をクリックして時間を入力してください</p>
                </div>
              )}
            </div>

            <Dialog open={showAddSlotModal} onOpenChange={setShowAddSlotModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>候補時間を追加</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">予定開始時間</label>
                    <DateTimePicker 
                      date={modalStartTime} 
                      onDateChange={(date) => {
                        setModalStartTime(date);
                        if (date && !modalEndTime) {
                          // 予定開始時間が設定され、予定終了時間が未設定の場合は予定時間に基づいて自動計算
                          setModalEndTime(calculateEndTime(date, modalInterviewDuration));
                        }
                      }} 
                      placeholder="予定開始時間を選択" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">予定終了時間</label>
                    <DateTimePicker 
                      date={modalEndTime} 
                      onDateChange={(date) => {
                        setModalEndTime(date);
                        if (date && !modalStartTime) {
                          // 予定終了時間が設定され、予定開始時間が未設定の場合は予定時間分戻して予定開始時間を設定
                          setModalStartTime(new Date(date.getTime() - modalInterviewDuration * 60000));
                        }
                      }} 
                      placeholder="予定終了時間を選択" 
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowAddSlotModal(false)} className="flex-1">キャンセル</Button>
                  <Button onClick={() => {
                    setCandidateAddError("");
                    if (!modalStartTime || !modalEndTime) return;
                    if (!(modalStartTime < modalEndTime)) return;
                    
                    // 候補時間帯をそのまま保存（バッファは追加しない）
                    const newSlot: TimeSlot = { start_time: modalStartTime, end_time: modalEndTime };
                    const confirmedConflictResult = checkConfirmedEventConflict(newSlot, events);
                    setConflicts(confirmedConflictResult);
                    if (confirmedConflictResult.hasConflict) {
                      return;
                    }
                    // 他企業の候補時間帯との重複チェック（30分バッファ付き）
                    const allExistingCandidateSlots = events
                      .filter(event => event.status === 'candidate')
                      .flatMap(event => event.candidate_slots);
                    
                    for (const slot of allExistingCandidateSlots) {
                      const bufferedSlot = addBufferToTimeSlot(slot);
                      if (timeSlotsOverlap(newSlot, bufferedSlot)) {
                        setCandidateAddError("他の企業の候補時間帯と重複しています（前後30分を含む）。");
                        return;
                      }
                    }

                    // 同一イベント内での候補時間帯重複チェック（バッファなし）
                    for (const slot of candidateSlots) {
                      if (timeSlotsOverlap(newSlot, slot)) {
                        setCandidateAddError("既に追加済みの候補時間帯と重複しています。");
                        return;
                      }
                    }
                    setCandidateSlots(prev => [...prev, newSlot].sort((a, b) => a.start_time.getTime() - b.start_time.getTime()));
                    setModalStartTime(undefined);
                    setModalEndTime(undefined);
                    setShowAddSlotModal(false);
                  }} disabled={!modalStartTime || !modalEndTime || (modalStartTime && modalEndTime && !(modalStartTime < modalEndTime))} className="flex-1">追加</Button>
                </div>
                {(candidateAddError || conflicts.hasConflict) && (
                  <Alert className="mt-2 border-destructive bg-destructive/5">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">{candidateAddError || 'この時間は既存の予定と重複しています（前後30分を含む）。'}</AlertDescription>
                  </Alert>
                )}
              </DialogContent>
            </Dialog>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メモ</FormLabel>
                  <FormControl>
                    <Textarea placeholder="持参物、注意事項など" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">キャンセル</Button>
              <Button type="submit" disabled={candidateSlots.length === 0} className="flex-1">{isEditMode ? '更新' : '追加'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* 編集モーダル */}
    <Dialog open={showEditSlotModal} onOpenChange={setShowEditSlotModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>候補時間を編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">予定開始時間</label>
            <DateTimePicker 
              date={modalStartTime} 
              onDateChange={(date) => {
                setModalStartTime(date);
                if (date && !modalEndTime) {
                  setModalEndTime(calculateEndTime(date, modalInterviewDuration));
                }
              }} 
              placeholder="予定開始時間を選択" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">予定終了時間</label>
            <DateTimePicker 
              date={modalEndTime} 
              onDateChange={(date) => {
                setModalEndTime(date);
                if (date && !modalStartTime) {
                  setModalStartTime(new Date(date.getTime() - modalInterviewDuration * 60000));
                }
              }} 
              placeholder="予定終了時間を選択" 
            />
          </div>
          {candidateAddError && (
            <Alert className="border-destructive bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {candidateAddError}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => setShowEditSlotModal(false)} className="flex-1">キャンセル</Button>
          <Button onClick={updateCandidateSlot} className="flex-1">更新</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

