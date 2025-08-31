import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Building2, Users, Video, MessageSquare, ExternalLink } from 'lucide-react';
import { Event, Company, TimeSlot } from '@/types';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { exportMultipleToGoogleCalendar } from '@/lib/googleCalendar';

interface JobCalendarProps {
  events: Event[];
  companies: Company[];
}

interface DayEvent {
  event: Event;
  company: Company;
  type: 'confirmed' | 'candidate';
  timeSlot: TimeSlot;
}

export const JobCalendar = ({ events, companies }: JobCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 今後の予定を取得（確定済みのみ、日付順）
  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => event.confirmed_slot && event.confirmed_slot.start_time > now)
      .sort((a, b) => {
        const timeA = a.confirmed_slot?.start_time;
        const timeB = b.confirmed_slot?.start_time;
        return (timeA?.getTime() || 0) - (timeB?.getTime() || 0);
      })
      .slice(0, 5); // 最大5件
  };

  const upcomingEvents = getUpcomingEvents();

  // 一括Googleカレンダーエクスポート
  const handleBulkExport = () => {
    const confirmedEvents = events.filter(event => event.confirmed_slot);
    if (confirmedEvents.length === 0) {
      alert('確定した予定がありません');
      return;
    }
    
    const count = exportMultipleToGoogleCalendar(events, companies);
    if (count > 0) {
      alert(`${count}件の予定をGoogleカレンダーに登録します。\n複数のタブが開かれるので、各タブで登録を完了してください。`);
    }
  };

  // 月の開始日から終了日までの日付を取得
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 日曜日開始
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  // 企業情報を取得するヘルパー関数
  const getCompany = (companyId: string) => companies.find(c => c.id === companyId);

  // 企業名を短縮表示用に調整
  const getShortCompanyName = (companyName: string) => {
    // 「株式会社」「(株)」「有限会社」等を除去
    let shortName = companyName
      .replace(/株式会社|（株）|\(株\)|有限会社|合同会社|合資会社|合名会社/g, '')
      .trim();
    
    // 長すぎる場合は最初の部分のみ
    if (shortName.length > 8) {
      shortName = shortName.substring(0, 6) + '..';
    }
    
    return shortName || companyName.substring(0, 6) + '..';
  };

  // イベントタイプのアイコンを取得
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'interview':
      case 'final_interview':
        return '💼';
      case 'info_session':
        return '📢';
      case 'group_discussion':
        return '👥';
      default:
        return '📅';
    }
  };

  // 各日付のイベントを取得
  const getEventsForDate = (date: Date): DayEvent[] => {
    const dayEvents: DayEvent[] = [];

    events.forEach(event => {
      const company = getCompany(event.company_id);
      if (!company) return;

      // 確定済みイベント
      if (event.confirmed_slot && isSameDay(event.confirmed_slot.start_time, date)) {
        dayEvents.push({
          event,
          company,
          type: 'confirmed',
          timeSlot: event.confirmed_slot
        });
      }

      // 候補日イベント（確定していない場合のみ）
      if (!event.confirmed_slot) {
        event.candidate_slots.forEach(slot => {
          if (isSameDay(slot.start_time, date)) {
            dayEvents.push({
              event,
              company,
              type: 'candidate',
              timeSlot: slot
            });
          }
        });
      }
    });

    return dayEvents.sort((a, b) => a.timeSlot.start_time.getTime() - b.timeSlot.start_time.getTime());
  };

  // 選択された日付のイベント詳細を取得
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    setSelectedDate(null);
  };

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: ja });
  };

  const formatTimeRange = (startTime: Date, endTime: Date) => {
    return `${formatTime(startTime)}〜${formatTime(endTime)}`;
  };

  return (
    <div className="space-y-6">
      {/* 今後の予定サマリー */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                今後の確定予定
              </CardTitle>
              <Button
                size="sm"
                onClick={handleBulkExport}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                すべてGoogleカレンダーに追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingEvents.map((event) => {
                const company = getCompany(event.company_id);
                if (!company || !event.confirmed_slot) return null;
                
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-confirmed/10 border-confirmed/20"
                  >
                    <div className="text-confirmed">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{company.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{event.title}</div>
                      <div className="text-xs font-medium text-confirmed">
                        {format(event.confirmed_slot.start_time, 'M/d(E) HH:mm', { locale: ja })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* カレンダーヘッダー */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              就活カレンダー
            </CardTitle>
            <div className="flex items-center gap-4">
              {/* 凡例 */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-confirmed rounded-full"></div>
                  <span>確定</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-candidate rounded-full"></div>
                  <span>候補</span>
                </div>
              </div>
              {/* 月ナビゲーション */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[120px] text-center font-medium">
                  {format(currentMonth, 'yyyy年M月', { locale: ja })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div
                key={day}
                className={cn(
                  "h-8 flex items-center justify-center text-sm font-medium",
                  index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const hasEvents = dayEvents.length > 0;

              return (
                <Button
                  key={day.toISOString()}
                  variant="ghost"
                  className={cn(
                    "h-20 md:h-24 p-1 flex flex-col items-start justify-start hover:bg-accent relative text-left",
                    !isCurrentMonth && "text-muted-foreground opacity-50",
                    isSelected && "bg-accent border-2 border-primary",
                    isToday && "bg-primary/10 font-bold"
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  {/* 日付 */}
                  <div className={cn(
                    "text-sm",
                    index % 7 === 0 ? "text-red-600" : index % 7 === 6 ? "text-blue-600" : "",
                    isToday && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>

                  {/* イベント表示 */}
                  {hasEvents && (
                    <div className="flex flex-col gap-1 w-full mt-1">
                      {dayEvents.slice(0, 2).map((dayEvent, eventIndex) => (
                        <div
                          key={`${dayEvent.event.id}-${eventIndex}`}
                          className={cn(
                            "w-full px-1 py-0.5 rounded text-[9px] md:text-[10px] leading-tight",
                            dayEvent.type === 'confirmed' 
                              ? "bg-confirmed text-white" 
                              : "bg-candidate text-white"
                          )}
                          title={`${dayEvent.company.name} - ${dayEvent.event.title} (${formatTime(dayEvent.timeSlot.start_time)})`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-[8px]">{getEventTypeIcon(dayEvent.event.type)}</span>
                            <div className="truncate font-medium flex-1">
                              {getShortCompanyName(dayEvent.company.name)}
                            </div>
                          </div>
                          <div className="truncate text-[8px] md:text-[9px] opacity-90">
                            {dayEvent.type === 'confirmed' 
                              ? formatTime(dayEvent.timeSlot.start_time)
                              : `${formatTime(dayEvent.timeSlot.start_time)}〜`
                            }
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] md:text-[10px] text-muted-foreground text-center bg-muted rounded px-1 py-0.5">
                          他{dayEvents.length - 2}件
                        </div>
                      )}
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 選択された日付の詳細 */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {format(selectedDate, 'M月d日(E)', { locale: ja })} の予定
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>この日に予定はありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((dayEvent, index) => (
                  <div
                    key={`${dayEvent.event.id}-${index}`}
                    className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    {/* 時間とステータス */}
                    <div className="flex flex-col items-center gap-2 min-w-[80px]">
                      <Badge
                        className={cn(
                          "text-xs",
                          dayEvent.type === 'confirmed' 
                            ? "bg-confirmed text-confirmed-foreground" 
                            : "bg-candidate text-candidate-foreground"
                        )}
                      >
                        {dayEvent.type === 'confirmed' ? '確定' : '候補'}
                      </Badge>
                      <div className="text-sm font-medium text-center">
                        {dayEvent.type === 'confirmed' 
                          ? formatTime(dayEvent.timeSlot.start_time)
                          : formatTimeRange(dayEvent.timeSlot.start_time, dayEvent.timeSlot.end_time)
                        }
                      </div>
                    </div>

                    {/* イベント詳細 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{dayEvent.company.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {dayEvent.company.industry}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {dayEvent.event.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {dayEvent.event.is_online ? (
                          <span>🌐 オンライン</span>
                        ) : (
                          <span>📍 {dayEvent.event.location || 'オフライン'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
