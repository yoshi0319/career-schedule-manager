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
import { Plus, CalendarPlus, X, AlertTriangle } from 'lucide-react';
import { Company, Event, EventType, TimeSlot } from '@/types';
import { checkTimeSlotConflict, formatTimeSlotWithDate } from '@/lib/conflictDetection';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [startTimeInput, setStartTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [conflicts, setConflicts] = useState<{ hasConflict: boolean; conflictingEvents: Event[] }>({ hasConflict: false, conflictingEvents: [] });

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

  const addCandidateSlot = () => {
    if (startTimeInput && endTimeInput) {
      const startTime = new Date(startTimeInput);
      const endTime = new Date(endTimeInput);
      
      if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime()) && startTime < endTime) {
        const newSlot: TimeSlot = { startTime, endTime };
        
        // Check for conflicts with existing events
        const conflictResult = checkTimeSlotConflict(newSlot, events);
        setConflicts(conflictResult);
        
        if (!conflictResult.hasConflict) {
          setCandidateSlots(prev => [...prev, newSlot]);
          setStartTimeInput('');
          setEndTimeInput('');
        }
      }
    }
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
    setStartTimeInput('');
    setEndTimeInput('');
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

            <div className="space-y-3">
              <FormLabel>候補日程</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="datetime-local"
                    placeholder="開始時間"
                    value={startTimeInput}
                    onChange={(e) => setStartTimeInput(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    type="datetime-local"
                    placeholder="終了時間"
                    value={endTimeInput}
                    onChange={(e) => setEndTimeInput(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addCandidateSlot}
                disabled={!startTimeInput || !endTimeInput}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                時間枠を追加
              </Button>
              
              {conflicts.hasConflict && (
                <Alert className="border-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    この時間は以下の予定と重複しています（前後30分を含む）:
                    <ul className="mt-1 ml-4">
                      {conflicts.conflictingEvents.map((event, idx) => (
                        <li key={idx} className="list-disc">
                          {event.companyName} - {event.title}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {candidateSlots.length > 0 && (
                <Card>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">追加された候補日程</div>
                      {candidateSlots.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{formatTimeSlotWithDate(slot)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCandidateSlot(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {candidateSlots.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  候補日程を最低1つ追加してください
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