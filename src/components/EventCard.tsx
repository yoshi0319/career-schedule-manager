import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Video } from 'lucide-react';
import { Event, EventType, EventStatus } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { EventConfirmationModal } from './EventConfirmationModal';

interface EventCardProps {
  event: Event;
  onUpdateStatus: (eventId: string, status: EventStatus, confirmedDate?: Date) => void;
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
  pending: '返信待ち',
  rejected: 'キャンセル'
};

const statusColors: Record<EventStatus, string> = {
  candidate: 'bg-candidate text-candidate-foreground',
  confirmed: 'bg-confirmed text-confirmed-foreground',
  pending: 'bg-pending text-pending-foreground',
  rejected: 'bg-rejected text-rejected-foreground'
};

export const EventCard = ({ event, onUpdateStatus }: EventCardProps) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const displayDate = event.confirmedDate || event.candidateDates[0];
  
  const handleConfirmDate = (selectedDate: Date) => {
    onUpdateStatus(event.id, 'confirmed', selectedDate);
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <div className="text-sm text-muted-foreground">{event.companyName}</div>
          </div>
          <Badge className={cn(statusColors[event.status])}>
            {statusLabels[event.status]}
          </Badge>
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
            {event.status === 'confirmed' && event.confirmedDate ? (
              <span className="font-medium text-confirmed">
                {format(event.confirmedDate, 'M月d日(E) HH:mm', { locale: ja })} 確定
              </span>
            ) : (
              <span>候補日 {event.candidateDates.length}件</span>
            )}
          </div>
          
          {event.status === 'candidate' && (
            <div className="space-y-1">
              {event.candidateDates.slice(0, 3).map((date, index) => (
                <div key={index} className="text-sm text-muted-foreground ml-6">
                  • {format(date, 'M月d日(E) HH:mm', { locale: ja })}
                </div>
              ))}
              {event.candidateDates.length > 3 && (
                <div className="text-sm text-muted-foreground ml-6">
                  他 {event.candidateDates.length - 3}件
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
            <>
              <Button
                size="sm"
                onClick={() => setShowConfirmModal(true)}
              >
                確定
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(event.id, 'pending')}
              >
                返信待ち
              </Button>
            </>
          )}
          {event.status === 'confirmed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus(event.id, 'candidate')}
            >
              候補に戻す
            </Button>
          )}
        </div>
      </CardContent>
      
      <EventConfirmationModal
        event={event}
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDate}
      />
    </Card>
  );
};