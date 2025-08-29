import { useState } from 'react';
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
import { Plus, CalendarPlus, X, AlertTriangle, Calendar } from 'lucide-react';
import { Company, Event, EventType, TimeSlot } from '@/types';
import { checkTimeSlotConflict, formatTimeSlotWithDate, addBufferToTimeSlot } from '@/lib/conflictDetection';
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
  onAddEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const eventTypeOptions = [
  { value: 'interview', label: '面接' },
  { value: 'info_session', label: '説明会' },
  { value: 'group_discussion', label: 'グループディスカッション' },
  { value: 'final_interview', label: '最終面接' },
];

export const AddEventForm = ({ companies, events, onAddEvent }: AddEventFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [candidateSlots, setCandidateSlots] = useState<TimeSlot[]>([]);
  const [startTimeInput, setStartTimeInput] = useState<Date | undefined>(undefined);
  const [endTimeInput, setEndTimeInput] = useState<Date | undefined>(undefined);
  const [conflicts, setConflicts] = useState<{ hasConflict: boolean; conflictingEvents: Event[] }>({ hasConflict: false, conflictingEvents: [] });
  const [candidateAddError, setCandidateAddError] = useState<string>("");

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      companyId: '',
      type: 'interview',
      isOnline: false,
      location: '',
      notes: '',
    },
  });

  function timeSlotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
    return a.startTime < b.endTime && a.endTime > b.startTime;
  }

  const addCandidateSlot = () => {
    setCandidateAddError("");
    if (!startTimeInput || !endTimeInput) return;
    if (!(startTimeInput < endTimeInput)) return;

    const newSlot: TimeSlot = { startTime: startTimeInput, endTime: endTimeInput };

    // 1) 既存イベントとの競合（前後30分含む）
    const conflictResult = checkTimeSlotConflict(newSlot, events);
    setConflicts(conflictResult);
    if (conflictResult.hasConflict) {
      return;
    }

    // 2) 既に追加済みの候補日との競合（前後30分含む）
    for (const slot of candidateSlots) {
      const buffered = addBufferToTimeSlot(slot);
      if (timeSlotsOverlap(newSlot, buffered)) {
        setCandidateAddError("既に追加済みの候補日の前後30分内と重複しています。");
        return;
      }
    }

    // 追加し、日時昇順に並べ替える
    setCandidateSlots(prev =>
      [...prev, newSlot].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    );
    setStartTimeInput(undefined);
    setEndTimeInput(undefined);
  };

  const removeCandidateSlot = (index: number) => {
    setCandidateSlots(prev => prev.filter((_, i) => i !== index));
    setConflicts({ hasConflict: false, conflictingEvents: [] });
  };

  const onSubmit = (data: EventFormData) => {
    if (candidateSlots.length === 0) {
      return;
    }

    const selectedCompany = companies.find(c => c.id === data.companyId);
    if (!selectedCompany) return;

    const newEvent: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
      companyId: data.companyId,
      companyName: selectedCompany.name,
      title: data.title,
      type: data.type as EventType,
      status: 'candidate',
      candidateSlots: candidateSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
      isOnline: data.isOnline,
      location: data.isOnline ? undefined : data.location,
      notes: data.notes,
    };

    onAddEvent(newEvent);
    
    // Reset form
    form.reset();
    setCandidateSlots([]);
    setStartTimeInput(undefined);
    setEndTimeInput(undefined);
    setConflicts({ hasConflict: false, conflictingEvents: [] });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="h-4 w-4" />
          面接日程追加
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新しい面接日程を追加</DialogTitle>
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
                    <FormLabel className="text-base">
                      オンライン開催
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
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
                <p className="text-sm text-muted-foreground mt-1">
                  面接可能な日時を複数設定してください（5分刻みで選択可能）
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">開始時間</label>
                  <DateTimePicker
                    date={startTimeInput}
                    onDateChange={setStartTimeInput}
                    placeholder="開始時間を選択"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">終了時間</label>
                  <DateTimePicker
                    date={endTimeInput}
                    onDateChange={setEndTimeInput}
                    placeholder="終了時間を選択"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addCandidateSlot}
                disabled={!startTimeInput || !endTimeInput || startTimeInput >= endTimeInput}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                時間枠を追加
              </Button>
              
              {(conflicts.hasConflict || candidateAddError) && (
                <Alert className="border-destructive bg-destructive/5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {candidateAddError ? (
                      <span className="font-medium">{candidateAddError}</span>
                    ) : (
                      <>
                        <span className="font-medium">この時間は以下の予定と重複しています（前後30分を含む）:</span>
                        <ul className="mt-2 ml-4 space-y-1">
                          {conflicts.conflictingEvents.map((event, idx) => (
                            <li key={idx} className="list-disc text-sm">
                              <span className="font-medium">{event.companyName}</span> - {event.title}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              {candidateSlots.length > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">追加された候補日程 ({candidateSlots.length}件)</span>
                      </div>
                      <div className="space-y-2">
                        {candidateSlots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">{formatTimeSlotWithDate(slot)}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCandidateSlot(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
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
                  <p className="text-xs mt-1">開始時間と終了時間を選択して「時間枠を追加」をクリック</p>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メモ</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="持参物、注意事項など"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={candidateSlots.length === 0}
                className="flex-1"
              >
                追加
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};