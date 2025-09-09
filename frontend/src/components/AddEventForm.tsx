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
import { Company, Event, EventType, TimeSlot } from '@/types';
import { checkTimeSlotConflict, checkConfirmedEventConflict, formatTimeSlotWithDate, addBufferToTimeSlot } from '@/lib/conflictDetection';
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

export const AddEventForm = ({ companies, events, editEvent, onAddEvent, onUpdateEvent, onClose }: AddEventFormProps) => {
  const [isOpen, setIsOpen] = useState(!!editEvent);
  const [candidateSlots, setCandidateSlots] = useState<TimeSlot[]>(editEvent?.candidate_slots || []);
  const [startTimeInput, setStartTimeInput] = useState<Date | undefined>(undefined);
  const [endTimeInput, setEndTimeInput] = useState<Date | undefined>(undefined);
  const [conflicts, setConflicts] = useState<{ hasConflict: boolean; conflictingEvents: Event[] }>({ hasConflict: false, conflictingEvents: [] });
  const [candidateAddError, setCandidateAddError] = useState<string>("");
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [modalStartTime, setModalStartTime] = useState<Date | undefined>(undefined);
  const [modalEndTime, setModalEndTime] = useState<Date | undefined>(undefined);

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

  // 予定一覧に表示されている企業の候補時間を全て取得（確定済みイベントは除外）
  const getAllExistingCandidateSlots = (): Array<{ slot: TimeSlot; event: Event }> => {
    const allSlots: Array<{ slot: TimeSlot; event: Event }> = [];
    events.forEach(event => {
      if (event.status === 'candidate') {
        event.candidate_slots.forEach(slot => {
          allSlots.push({ slot, event });
        });
      }
    });
    return allSlots;
  };

  const addCandidateSlot = () => {
    setCandidateAddError("");
    if (!startTimeInput || !endTimeInput) return;
    if (!(startTimeInput < endTimeInput)) return;

    const newSlot: TimeSlot = { start_time: startTimeInput, end_time: endTimeInput };

    const confirmedConflictResult = checkConfirmedEventConflict(newSlot, events);
    setConflicts(confirmedConflictResult);
    if (confirmedConflictResult.hasConflict) {
      return;
    }

    const existingCandidateSlots = getAllExistingCandidateSlots();
    for (const { slot, event } of existingCandidateSlots) {
      const buffered = addBufferToTimeSlot(slot);
      if (timeSlotsOverlap(newSlot, buffered)) {
        setCandidateAddError(`予定一覧に表示されている企業「${event.company_name}」の候補時間と重複しています（前後30分を含む）。`);
        return;
      }
    }

    for (const slot of candidateSlots) {
      const buffered = addBufferToTimeSlot(slot);
      if (timeSlotsOverlap(newSlot, buffered)) {
        setCandidateAddError("既に追加済みの候補日の前後30分内と重複しています。");
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
    const slot = candidateSlots[index];
    setStartTimeInput(slot.start_time);
    setEndTimeInput(slot.end_time);
    setEditingSlotIndex(index);
    setCandidateAddError("");
  };

  const cancelEditSlot = () => {
    setStartTimeInput(undefined);
    setEndTimeInput(undefined);
    setEditingSlotIndex(null);
    setCandidateAddError("");
  };

  const updateCandidateSlot = () => {
    setCandidateAddError("");
    if (!startTimeInput || !endTimeInput || editingSlotIndex === null) return;
    if (!(startTimeInput < endTimeInput)) return;

    const newSlot: TimeSlot = { start_time: startTimeInput, end_time: endTimeInput };

    const otherSlots = candidateSlots.filter((_, i) => i !== editingSlotIndex);

    const confirmedConflictResult = checkConfirmedEventConflict(newSlot, events);
    setConflicts(confirmedConflictResult);
    if (confirmedConflictResult.hasConflict) {
      return;
    }

    const existingCandidateSlots = getAllExistingCandidateSlots();
    for (const { slot, event } of existingCandidateSlots) {
      const buffered = addBufferToTimeSlot(slot);
      if (timeSlotsOverlap(newSlot, buffered)) {
        setCandidateAddError(`予定一覧に表示されている企業「${event.company_name}」の候補時間と重複しています（前後30分を含む）。`);
        return;
      }
    }

    for (const slot of otherSlots) {
      const buffered = addBufferToTimeSlot(slot);
      if (timeSlotsOverlap(newSlot, buffered)) {
        setCandidateAddError("他の候補日の前後30分内と重複しています。");
        return;
      }
    }

    setCandidateSlots(prev => {
      const updated = [...prev];
      updated[editingSlotIndex] = newSlot;
      return updated.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
    });

    setStartTimeInput(undefined);
    setEndTimeInput(undefined);
    setEditingSlotIndex(null);
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

              {editingSlotIndex !== null ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">開始時間</label>
                    <DateTimePicker date={startTimeInput} onDateChange={setStartTimeInput} placeholder="開始時間を選択" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">終了時間</label>
                    <DateTimePicker date={endTimeInput} onDateChange={setEndTimeInput} placeholder="終了時間を選択" />
                  </div>
                </div>
              ) : null}

              {editingSlotIndex !== null ? (
                <div className="flex gap-2">
                  <Button type="button" onClick={updateCandidateSlot} disabled={!startTimeInput || !endTimeInput || startTimeInput >= endTimeInput} className="flex-1">
                    <Check className="h-4 w-4 mr-2" />
                    更新
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEditSlot} className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    キャンセル
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => setShowAddSlotModal(true)} disabled={isConfirmed} className="w-full">
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
                          <div key={index} className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            editingSlotIndex === index ? "bg-blue-50 border-blue-200" : "bg-white border-green-200"
                          )}>
                            <div className="flex items-center gap-2">
                              <Calendar className={cn("h-4 w-4", editingSlotIndex === index ? "text-blue-600" : "text-green-600")} />
                              <span className="text-sm font-medium">{formatTimeSlotWithDate(slot)}</span>
                              {editingSlotIndex === index && <Badge variant="secondary" className="text-xs">編集中</Badge>}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button type="button" variant="ghost" size="sm" onClick={() => startEditSlot(index)} disabled={isConfirmed || (editingSlotIndex !== null && editingSlotIndex !== index)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => { if (editingSlotIndex !== null) { cancelEditSlot() } else { removeCandidateSlot(index) } }} disabled={isConfirmed || (editingSlotIndex !== null && editingSlotIndex !== index)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
                    <label className="text-sm font-medium text-muted-foreground">開始時間</label>
                    <DateTimePicker 
                      date={modalStartTime} 
                      onDateChange={(date) => {
                        setModalStartTime(date);
                        if (date && !modalEndTime) {
                          // 開始時間が設定され、終了時間が未設定の場合は同じ日時に設定
                          setModalEndTime(date);
                        }
                      }} 
                      placeholder="開始時間を選択" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">終了時間</label>
                    <DateTimePicker 
                      date={modalEndTime} 
                      onDateChange={(date) => {
                        setModalEndTime(date);
                        if (date && !modalStartTime) {
                          // 終了時間が設定され、開始時間が未設定の場合は同じ日時に設定
                          setModalStartTime(date);
                        }
                      }} 
                      placeholder="終了時間を選択" 
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowAddSlotModal(false)} className="flex-1">キャンセル</Button>
                  <Button onClick={() => {
                    setCandidateAddError("");
                    if (!modalStartTime || !modalEndTime) return;
                    if (!(modalStartTime < modalEndTime)) return;
                    const newSlot: TimeSlot = { start_time: modalStartTime, end_time: modalEndTime };
                    const confirmedConflictResult = checkConfirmedEventConflict(newSlot, events);
                    setConflicts(confirmedConflictResult);
                    if (confirmedConflictResult.hasConflict) {
                      return;
                    }
                    const existingCandidateSlots = getAllExistingCandidateSlots();
                    for (const { slot, event } of existingCandidateSlots) {
                      const buffered = addBufferToTimeSlot(slot);
                      if (timeSlotsOverlap(newSlot, buffered)) {
                        setCandidateAddError(`予定一覧に表示されている企業「${event.company_name}」の候補時間と重複しています（前後30分を含む）。`);
                        return;
                      }
                    }
                    for (const slot of candidateSlots) {
                      const buffered = addBufferToTimeSlot(slot);
                      if (timeSlotsOverlap(newSlot, buffered)) {
                        setCandidateAddError("既に追加済みの候補日の前後30分内と重複しています。");
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
  );
};
