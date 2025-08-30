import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Video, Edit, Trash2, MoreVertical, ExternalLink } from 'lucide-react';
import { Event, EventType, EventStatus, TimeSlot, Company } from '@/types';
import { cn } from '@/lib/utils';
import { formatTimeSlotWithDate } from '@/lib/conflictDetection';
import { exportToGoogleCalendar, debugDateConversion } from '@/lib/googleCalendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// 開始時間のみを表示する関数
const formatStartTimeWithDate = (slot: TimeSlot): string => {
  const date = slot.startTime.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  });
  const time = slot.startTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${date} ${time}〜`;
};
import { EventConfirmationModal } from './EventConfirmationModal';

interface EventCardProps {
  event: Event;
  allEvents: Event[];
  companies: Company[];
  onUpdateStatus: (eventId: string, status: EventStatus, confirmedSlot?: TimeSlot) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
}

const eventTypeLabels: Record<EventType, string> = {
  interview: '面接',
  info_session: '説明会',
  group_discussion: 'グループディスカッション',
  final_interview: '最終面接'
};

const statusLabels: Record<EventStatus, string> = {
  candidate: '候補日',
  confirmed: '確定',
  rejected: 'キャンセル'
};

const statusColors: Record<EventStatus, string> = {
  candidate: 'bg-candidate text-candidate-foreground hover:bg-candidate/80',
  confirmed: 'bg-confirmed text-confirmed-foreground hover:bg-confirmed/80',
  rejected: 'bg-rejected text-rejected-foreground hover:bg-rejected/80'
};

export const EventCard = ({ event, allEvents, companies, onUpdateStatus, onEditEvent, onDeleteEvent }: EventCardProps) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  
  const handleConfirmSlot = (selectedSlot: TimeSlot) => {
    onUpdateStatus(event.id, 'confirmed', selectedSlot);
  };

  const handleSlotClick = (index: number) => {
    setSelectedSlotIndex(index);
    setShowConfirmModal(true);
  };

  const handleExportToGoogleCalendar = () => {
    const company = companies.find(c => c.id === event.companyId);
    if (company && event.confirmedSlot) {
      console.log('=== Googleカレンダー登録デバッグ ===');
      console.log('確定スロット:', event.confirmedSlot);
      debugDateConversion(event.confirmedSlot.startTime);
      debugDateConversion(event.confirmedSlot.endTime);
      
      const success = exportToGoogleCalendar(event, company);
      if (success) {
        console.log('Googleカレンダーに登録しました');
      } else {
        console.error('Googleカレンダーへの登録に失敗しました');
      }
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <div className="text-sm text-muted-foreground">{event.companyName}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn(statusColors[event.status])}>
              {statusLabels[event.status]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditEvent(event)}>
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDeleteEvent(event.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline">{eventTypeLabels[event.type]}</Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            {event.isOnline ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
            <span>{event.isOnline ? 'オンライン' : event.location || '会場未定'}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {event.status === 'confirmed' && event.confirmedSlot ? (
              <span className="font-medium text-confirmed">
                {formatStartTimeWithDate(event.confirmedSlot)} 確定
              </span>
            ) : (
              <span>候補日 {event.candidateSlots.length}件</span>
            )}
          </div>
          
          {event.status === 'candidate' && (
            <div className="space-y-1">
              {event.candidateSlots.slice(0, 3).map((slot, index) => (
                <div key={index} className="text-sm text-muted-foreground ml-6">
                  <button
                    onClick={() => handleSlotClick(index)}
                    className="text-left hover:text-foreground hover:underline transition-colors cursor-pointer"
                  >
                    • {formatTimeSlotWithDate(slot)}
                  </button>
                </div>
              ))}
              {event.candidateSlots.length > 3 && (
                <div className="text-sm text-muted-foreground ml-6">
                  他 {event.candidateSlots.length - 3}件
                </div>
              )}
            </div>
          )}
        </div>

        {event.notes && (
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
            {event.notes}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {event.status === 'candidate' && (
            <Button
              size="sm"
              onClick={() => setShowConfirmModal(true)}
            >
              確認
            </Button>
          )}
          {event.status === 'confirmed' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(event.id, 'candidate')}
                className="text-gray-600 hover:text-gray-700"
              >
                候補に戻す
              </Button>
              <Button
                size="sm"
                onClick={handleExportToGoogleCalendar}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Googleカレンダーに追加
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      <EventConfirmationModal
        event={event}
        allEvents={allEvents}
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSlot}
        initialSelectedSlotIndex={selectedSlotIndex}
      />
    </Card>
  );
};